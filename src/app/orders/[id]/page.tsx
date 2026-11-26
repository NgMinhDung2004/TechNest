import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  SHIPPING: "Đang giao",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng",
  MOCK: "Thanh toán thử nghiệm",
  MOMO: "MoMo",
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <Suspense fallback={<main className="orders-page"><p>Đang tải chi tiết đơn hàng...</p></main>}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: OrderDetailPageProps) {
  await connection();
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/orders/${id}`)}`);

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const paymentStatus = order.status === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.PAID
    ? "Đã hủy · chờ hoàn tiền"
    : paymentStatusLabels[order.paymentStatus];

  return (
    <main className="orders-page">
      <div className="orders-actions">
        <Link className="catalog-back-link" href="/orders">← Đơn hàng của tôi</Link>
        <LogoutButton />
      </div>
      <h1>Chi tiết đơn hàng</h1>
      <section className="order-card">
        <div className="order-card-heading">
          <div>
            <strong>{order.orderNumber}</strong>
            <span>{order.createdAt.toLocaleString("vi-VN")}</span>
          </div>
          <div>
            <span>{orderStatusLabels[order.status]}</span>
            <span>{paymentStatus}</span>
          </div>
        </div>
        <div className="order-detail-info">
          <p><strong>Người nhận:</strong> {order.recipientName} · {order.recipientPhone}</p>
          <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
          <p><strong>Thanh toán:</strong> {paymentMethodLabels[order.paymentMethod]}</p>
          {order.note && <p><strong>Ghi chú:</strong> {order.note}</p>}
        </div>
        <ul>
          {order.items.map((item) => (
            <li key={item.id}>
              <span>{item.name} × {item.quantity}</span>
              <span>{(Number(item.unitPrice) * item.quantity).toLocaleString("vi-VN")}₫</span>
            </li>
          ))}
        </ul>
        <p className="cart-total">Tổng: {Number(order.total).toLocaleString("vi-VN")}₫</p>
      </section>
    </main>
  );
}
