import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<main className="orders-page"><p>Đang tải đơn hàng...</p></main>}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Forders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="orders-page">
      <div className="orders-actions">
        <Link className="catalog-back-link" href="/products">← Tiếp tục mua sắm</Link>
        <LogoutButton />
      </div>
      <h1>Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <section className="order-card" key={order.id}>
              <div className="order-card-heading">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.createdAt.toLocaleString("vi-VN")}</span>
                  <Link className="text-link" href={`/orders/${encodeURIComponent(order.id)}`}>
                    Xem chi tiết
                  </Link>
                </div>
                <div>
                  <span>{orderStatusLabels[order.status]}</span>
                  <span>
                    {order.status === "CANCELLED" && order.paymentStatus === "PAID"
                      ? "Đã hủy · chờ hoàn tiền"
                      : paymentStatusLabels[order.paymentStatus]}
                  </span>
                </div>
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
          ))}
        </div>
      )}
    </main>
  );
}
