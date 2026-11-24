"use client";

import Link from "next/link";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export default function CartPage() {
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const total = useCart((state) => state.total);
  const hydrated = useCartHydrated();

  if (!hydrated) {
    return <main className="cart-page"><p>Đang tải giỏ hàng...</p></main>;
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <h1>Giỏ hàng</h1>
        <p>Giỏ hàng trống.</p>
        <Link className="button button-primary" href="/products">Khám phá sản phẩm</Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Giỏ hàng</h1>
      <div className="cart-items">
        {items.map((item) => (
          <div key={item.productId} className="cart-item">
            <Link className="cart-item-name" href={`/products/${item.slug}`}>{item.name}</Link>
            <label className="cart-quantity">
              <span>Số lượng</span>
              <input
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(event) => {
                  const quantity = event.currentTarget.valueAsNumber;
                  if (Number.isInteger(quantity)) setQuantity(item.productId, quantity);
                }}
              />
            </label>
            <span className="cart-item-price">
              {(item.price * item.quantity).toLocaleString("vi-VN")}₫
            </span>
            <button className="cart-remove" type="button" onClick={() => remove(item.productId)}>
              Xóa
            </button>
          </div>
        ))}
      </div>
      <p className="cart-total">Tổng: {total().toLocaleString("vi-VN")}₫</p>
      <Link className="button button-primary" href="/checkout">Tiến hành thanh toán</Link>
      <Link className="button button-secondary" href="/products">Tiếp tục mua sắm</Link>
    </main>
  );
}
