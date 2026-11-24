import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getMomoConfig, verifyMomoCallback } from "@/lib/momo";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const config = (() => {
    try {
      return getMomoConfig();
    } catch (error) {
      console.error("MoMo IPN configuration error:", error);
      return NextResponse.json({ message: "Payment service unavailable", resultCode: 1 }, { status: 503 });
    }
  })();
  if (config instanceof NextResponse) return config;

  const body: unknown = await request.json().catch(() => null);
  const callback = verifyMomoCallback(body, config.secretKey);
  if (
    !callback
    || callback.partnerCode !== config.partnerCode
    || callback.accessKey !== config.accessKey
  ) {
    return NextResponse.json({ message: "Invalid payment callback", resultCode: 1 }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: callback.orderId },
    include: { items: true },
  });
  if (
    !order
    || order.paymentMethod !== "MOMO"
    || order.paymentReference !== callback.requestId
    || Number(order.total) !== Number(callback.amount)
    || callback.orderInfo !== `TechNest ${order.orderNumber}`
    || callback.extraData !== Buffer.from(order.userId).toString("base64")
  ) {
    return NextResponse.json({ message: "Order validation failed", resultCode: 1 }, { status: 400 });
  }

  const succeeded = callback.resultCode === 0;
  const outcome = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        paymentStatus: succeeded ? PaymentStatus.PAID : PaymentStatus.FAILED,
        status: succeeded ? OrderStatus.PENDING : OrderStatus.CANCELLED,
        paymentTransactionId: succeeded ? String(callback.transId) : null,
      },
    });

    if (updated.count === 0) {
      const current = await transaction.order.findUnique({
        where: { id: order.id },
        select: { status: true, paymentMethod: true, paymentStatus: true, paymentTransactionId: true },
      });
      if (
        succeeded
        && current?.status === OrderStatus.CANCELLED
        && current.paymentMethod === "MOMO"
        && current.paymentStatus === PaymentStatus.FAILED
        && current.paymentTransactionId === null
      ) {
        const latePayment = await transaction.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
            paymentTransactionId: null,
          },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentTransactionId: String(callback.transId),
          },
        });
        return latePayment.count === 1 ? "late-payment" : "conflict";
      }
      return current?.paymentStatus === (succeeded ? PaymentStatus.PAID : PaymentStatus.FAILED)
        && (!succeeded || current.paymentTransactionId === String(callback.transId))
        ? "already-processed"
        : "conflict";
    }

    if (!succeeded) {
      for (const item of order.items) {
        await transaction.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    return "processed";
  });

  if (outcome === "conflict") {
    return NextResponse.json({ message: "Order state conflict", resultCode: 1 }, { status: 409 });
  }
  return NextResponse.json({ message: "Success", resultCode: 0 });
}
