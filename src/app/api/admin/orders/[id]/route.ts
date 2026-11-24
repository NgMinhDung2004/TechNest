import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const schema = z.union([
  z.object({ status: z.enum(["PENDING", "SHIPPING", "DONE", "CANCELLED"]) }),
  z.object({ paymentStatus: z.literal("REFUNDED") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Trạng thái đơn hàng không hợp lệ." }, { status: 400 });

  if ("paymentStatus" in parsed.data) {
    const refunded = await prisma.order.updateMany({
      where: {
        id,
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.PAID,
      },
      data: { paymentStatus: PaymentStatus.REFUNDED },
    });
    if (refunded.count !== 1) {
      return NextResponse.json(
        { error: "Chỉ có thể xác nhận hoàn tiền cho đơn đã hủy và đã thanh toán." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const nextStatus = parsed.data.status;
  const outcome = await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return "not-found";
    if (order.status === OrderStatus.CANCELLED) return "already-cancelled";
    if (order.status === OrderStatus.DONE && nextStatus !== OrderStatus.DONE) return "already-done";
    if (
      (order.status === OrderStatus.PENDING && nextStatus === OrderStatus.PENDING)
      || (order.status === OrderStatus.SHIPPING
        && nextStatus !== OrderStatus.DONE
        && nextStatus !== OrderStatus.CANCELLED)
    ) return "invalid-transition";
    if (
      order.paymentMethod === PaymentMethod.MOMO
      && order.paymentStatus !== PaymentStatus.PAID
      && nextStatus !== OrderStatus.CANCELLED
    ) {
      return "payment-required";
    }

    const updated = await transaction.order.updateMany({
      where: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      data: {
        status: nextStatus,
        ...(nextStatus === OrderStatus.CANCELLED && order.paymentStatus !== PaymentStatus.PAID
          ? { paymentStatus: PaymentStatus.FAILED }
          : {}),
        ...(nextStatus === OrderStatus.DONE && order.paymentMethod === PaymentMethod.COD
          ? { paymentStatus: PaymentStatus.PAID }
          : {}),
      },
    });
    if (updated.count !== 1) return "conflict";

    if (nextStatus === OrderStatus.CANCELLED && order.paymentStatus !== PaymentStatus.PAID) {
      for (const item of order.items) {
        await transaction.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    return "updated";
  });

  if (outcome === "not-found") return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  if (outcome === "already-cancelled" || outcome === "already-done") {
    return NextResponse.json({ error: "Không thể thay đổi trạng thái cuối của đơn hàng." }, { status: 409 });
  }
  if (outcome === "invalid-transition") {
    return NextResponse.json({ error: "Không thể chuyển đơn hàng về trạng thái trước đó." }, { status: 409 });
  }
  if (outcome === "payment-required") {
    return NextResponse.json({ error: "Chỉ có thể giao đơn MoMo sau khi đã xác nhận thanh toán." }, { status: 409 });
  }
  if (outcome === "conflict") return NextResponse.json({ error: "Đơn hàng vừa được cập nhật. Tải lại trang." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
