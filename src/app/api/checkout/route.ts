import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/authz";
import { createMomoPayment, getMomoConfig } from "@/lib/momo";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(50),
  recipientName: z.string().trim().min(1).max(100),
  recipientPhone: z.string().trim().regex(/^(?:\+?84|0)\d{9,10}$/),
  shippingAddress: z.string().trim().min(10).max(500),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "MOMO"]),
});

async function releaseUnpaidOrder(orderId: string) {
  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.paymentStatus !== PaymentStatus.PENDING) return;

    const updated = await transaction.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED },
    });
    if (updated.count !== 1) return;
    for (const item of order.items) {
      await transaction.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Đăng nhập để thanh toán." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin thanh toán không hợp lệ." }, { status: 400 });
  }

  const { items, recipientName, recipientPhone, shippingAddress, note, paymentMethod } = parsed.data;
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  if ([...quantities.values()].some((quantity) => quantity > 100)) {
    return NextResponse.json({ error: "Số lượng mỗi sản phẩm tối đa là 100." }, { status: 400 });
  }

  if (paymentMethod === PaymentMethod.MOMO) {
    try {
      getMomoConfig();
    } catch (error) {
      console.error("MoMo is not configured:", error);
      return NextResponse.json({ error: "Thanh toán MoMo chưa được cấu hình." }, { status: 503 });
    }
  }

  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Một hoặc nhiều sản phẩm không còn bán." }, { status: 409 });
  }

  const orderNumber = `TN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const paymentReference = paymentMethod === PaymentMethod.MOMO ? randomUUID() : null;
  let order;
  try {
    order = await prisma.$transaction(async (transaction) => {
      let subtotal = new Prisma.Decimal(0);
      const orderItems = products.map((product) => {
        const quantity = quantities.get(product.id);
        if (!quantity) throw new Error("Invalid checkout quantity.");
        subtotal = subtotal.add(product.price.mul(quantity));
        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity,
        };
      });

      for (const item of orderItems) {
        const reserved = await transaction.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }

      return transaction.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: OrderStatus.PENDING,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          paymentReference,
          subtotal,
          shippingFee: new Prisma.Decimal(0),
          total: subtotal,
          recipientName,
          recipientPhone,
          shippingAddress,
          note: note || null,
          items: { create: orderItems },
        },
        select: { id: true, orderNumber: true, total: true },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Tồn kho vừa thay đổi. Hãy cập nhật giỏ hàng." }, { status: 409 });
    }
    throw error;
  }

  if (paymentMethod === PaymentMethod.COD) {
    return NextResponse.json({ redirectUrl: `/orders?placed=${encodeURIComponent(order.orderNumber)}` }, { status: 201 });
  }

  const amount = Number(order.total);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    await releaseUnpaidOrder(order.id);
    return NextResponse.json({ error: "Tổng tiền đơn hàng không hợp lệ." }, { status: 400 });
  }

  try {
    const payUrl = await createMomoPayment({
      orderNumber: order.orderNumber,
      requestId: paymentReference!,
      amount,
      userId: user.id,
    });
    return NextResponse.json({ redirectUrl: payUrl }, { status: 201 });
  } catch (error) {
    console.error("MoMo payment initialization failed:", error);
    await releaseUnpaidOrder(order.id);
    return NextResponse.json(
      { error: "Không thể khởi tạo thanh toán MoMo. Đơn hàng đã được hủy, vui lòng thử lại." },
      { status: 502 },
    );
  }
}
