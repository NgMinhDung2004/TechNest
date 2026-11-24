"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export default function CheckoutForm({ name }: { name: string }) {
  const items = useCart((state) => state.items);
  const total = useCart((state) => state.total);
  const clear = useCart((state) => state.clear);
  const hydrated = useCartHydrated();
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO">("COD");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated || items.length === 0) return;
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          recipientName: formData.get("recipientName"),
          recipientPhone: formData.get("recipientPhone"),
          shippingAddress: formData.get("shippingAddress"),
          note: formData.get("note"),
          paymentMethod,
        }),
      });
      const result = await response.json() as { error?: string; redirectUrl?: string };
      if (!response.ok || !result.redirectUrl) {
        setError(result.error ?? "Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }

      clear();
      window.location.assign(result.redirectUrl);
    } catch {
      setError("Không thể kết nối để tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <main className="checkout-page"><p>Đang tải giỏ hàng...</p></main>;
  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <h1>Thanh toán</h1>
        <p>Giỏ hàng trống.</p>
        <Link className="button button-primary" href="/products">Khám phá sản phẩm</Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <h1>Thanh toán</h1>
      <div className="checkout-layout">
        <form className="checkout-card account-form" onSubmit={handleSubmit}>
          <h2>Thông tin nhận hàng</h2>
          <label>
            Người nhận
            <input autoComplete="name" defaultValue={name} maxLength={100} name="recipientName" required />
          </label>
          <label>
            Số điện thoại
            <input autoComplete="tel" name="recipientPhone" pattern="(?:\+?84|0)\d{9,10}" required />
          </label>
          <label>
            Địa chỉ
            <textarea autoComplete="street-address" maxLength={500} minLength={10} name="shippingAddress" required />
          </label>
          <label>
            Ghi chú (không bắt buộc)
            <textarea maxLength={500} name="note" />
          </label>
          <fieldset className="payment-options">
            <legend>Phương thức thanh toán</legend>
            <label>
              <input
                checked={paymentMethod === "COD"}
                name="paymentMethod"
                onChange={() => setPaymentMethod("COD")}
                type="radio"
              />
              Thanh toán khi nhận hàng (COD)
            </label>
            <label>
              <input
                checked={paymentMethod === "MOMO"}
                name="paymentMethod"
                onChange={() => setPaymentMethod("MOMO")}
                type="radio"
              />
              Thanh toán trực tuyến qua MoMo
            </label>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? "Đang tạo đơn..." : "Đặt hàng"}
          </button>
        </form>

        <section className="checkout-card checkout-summary">
          <h2>Đơn hàng</h2>
          {items.map((item) => (
            <div className="checkout-summary-item" key={item.productId}>
              <span>{item.name} × {item.quantity}</span>
              <strong>{(item.price * item.quantity).toLocaleString("vi-VN")}₫</strong>
            </div>
          ))}
          <p className="cart-total">Tổng: {total().toLocaleString("vi-VN")}₫</p>
          <Link className="text-link" href="/cart">Sửa giỏ hàng</Link>
        </section>
      </div>
    </main>
  );
}
