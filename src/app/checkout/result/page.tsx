import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

type CheckoutResultPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default function CheckoutResultPage(props: CheckoutResultPageProps) {
  return (
    <Suspense fallback={<main className="orders-page"><p>Đang kiểm tra thanh toán...</p></main>}>
      <CheckoutResultContent {...props} />
    </Suspense>
  );
}

async function CheckoutResultContent({
  searchParams,
}: CheckoutResultPageProps) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Forders");

  const { order: orderNumber } = await searchParams;
  if (!orderNumber) notFound();

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    select: { orderNumber: true, paymentMethod: true, paymentStatus: true, status: true },
  });
  if (!order) notFound();

  const message = order.paymentStatus === "PAID"
    ? "Thanh toán thành công. Đơn hàng đang được xử lý."
    : order.paymentStatus === "FAILED"
      ? "Thanh toán chưa thành công. Đơn hàng đã được hủy."
      : order.paymentMethod === "COD"
        ? "Đặt hàng thành công. Bạn sẽ thanh toán khi nhận hàng."
        : "Đang xác nhận giao dịch MoMo. Hãy kiểm tra lại lịch sử đơn hàng sau ít phút.";

  return (
    <main className="orders-page">
      <section className="order-result-card">
        <p className="section-kicker">MÃ ĐƠN {order.orderNumber}</p>
        <h1>{message}</h1>
        <Link className="button button-primary" href="/orders">Xem đơn hàng</Link>
      </section>
    </main>
  );
}
