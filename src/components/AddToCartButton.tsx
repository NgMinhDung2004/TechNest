"use client";

import type { CartItem } from "@/lib/cart-store";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export default function AddToCartButton({
  product,
  available,
}: {
  product: Omit<CartItem, "quantity">;
  available: boolean;
}) {
  const add = useCart((state) => state.add);
  const hydrated = useCartHydrated();

  return (
    <button
      className="button button-primary add-to-cart-button"
      type="button"
      disabled={!available || !hydrated}
      onClick={() => add(product)}
    >
      {!available ? "Tạm hết hàng" : hydrated ? "Thêm vào giỏ" : "Đang tải giỏ hàng..."}
    </button>
  );
}
