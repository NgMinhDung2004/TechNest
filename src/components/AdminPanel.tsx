"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import LogoutButton from "@/components/LogoutButton";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  specs: string;
  imageUrl: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
};
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note: string | null;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number }>;
};
type Customer = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const orderStatuses = [
  ["PENDING", "Chờ xử lý"],
  ["SHIPPING", "Đang giao"],
  ["DONE", "Hoàn tất"],
  ["CANCELLED", "Đã hủy"],
];

export default function AdminPanel({
  adminId,
  categories,
  customers,
  metrics,
  orders,
  products,
}: {
  adminId: string;
  categories: Category[];
  customers: Customer[];
  metrics: { activeProducts: number; pendingOrders: number; customers: number; paidRevenue: number };
  orders: Order[];
  products: Product[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<"overview" | "products" | "categories" | "orders" | "customers">("overview");
  const [error, setError] = useState("");

  async function mutate(url: string, method: string, body?: unknown) {
    setError("");
    try {
      const response = await fetch(url, {
        method,
        ...(body === undefined
          ? {}
          : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Không thể hoàn tất thao tác.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      return false;
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>, productId?: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    let specs: unknown;
    try {
      specs = JSON.parse(String(fields.get("specs")));
    } catch {
      setError("Thông số phải là JSON hợp lệ.");
      return;
    }
    if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
      setError("Thông số phải là một đối tượng JSON.");
      return;
    }

    const saved = await mutate(
      productId ? `/api/admin/products/${productId}` : "/api/admin/products",
      productId ? "PATCH" : "POST",
      {
        sku: fields.get("sku"),
        name: fields.get("name"),
        brand: fields.get("brand"),
        price: Number(fields.get("price")),
        stock: Number(fields.get("stock")),
        description: fields.get("description"),
        specs,
        imageUrl: fields.get("imageUrl"),
        categoryId: fields.get("categoryId"),
        isActive: fields.get("isActive") === "on",
      },
    );
    if (saved && !productId) form.reset();
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>, categoryId?: string) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    await mutate(
      categoryId ? `/api/admin/categories/${categoryId}` : "/api/admin/categories",
      categoryId ? "PATCH" : "POST",
      { name: fields.get("name"), slug: fields.get("slug") },
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="section-kicker">TECHNEST CONTROL ROOM</p>
          <h1>Quản trị cửa hàng</h1>
        </div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/">Về cửa hàng</Link>
          <LogoutButton />
        </div>
      </header>

      <nav className="admin-nav" aria-label="Khu vực quản trị">
        {([
          ["overview", "Tổng quan"],
          ["products", "Sản phẩm & tồn kho"],
          ["categories", "Danh mục"],
          ["orders", "Đơn hàng"],
          ["customers", "Khách hàng"],
        ] as const).map(([id, label]) => (
          <button
            aria-current={section === id ? "page" : undefined}
            className={section === id ? "admin-nav-active" : ""}
            key={id}
            onClick={() => setSection(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
      {error && <p className="admin-error" role="alert">{error}</p>}

      {section === "overview" && (
        <section className="admin-metrics">
          <article><span>Sản phẩm đang bán</span><strong>{metrics.activeProducts}</strong></article>
          <article><span>Đơn chờ xử lý</span><strong>{metrics.pendingOrders}</strong></article>
          <article><span>Khách hàng</span><strong>{metrics.customers}</strong></article>
          <article><span>Doanh thu đã thanh toán</span><strong>{metrics.paidRevenue.toLocaleString("vi-VN")}₫</strong></article>
          <p>Doanh thu chỉ tính các đơn đã xác nhận thanh toán.</p>
        </section>
      )}

      {section === "products" && (
        <section className="admin-section">
          <h2>Thêm sản phẩm</h2>
          <ProductForm categories={categories} onSubmit={(event) => saveProduct(event)} />
          <h2>Danh sách sản phẩm</h2>
          <div className="admin-record-list">
            {products.map((product) => (
              <details className="admin-record" key={product.id}>
                <summary>
                  <span><strong>{product.name}</strong><small>{product.sku} · {product.categoryName}</small></span>
                  <span>{product.stock} tồn · {product.isActive ? "Đang bán" : "Đã ẩn"}</span>
                </summary>
                <ProductForm
                  categories={categories}
                  initial={product}
                  onSubmit={(event) => saveProduct(event, product.id)}
                />
              </details>
            ))}
          </div>
        </section>
      )}

      {section === "categories" && (
        <section className="admin-section">
          <h2>Thêm danh mục</h2>
          <CategoryForm onSubmit={(event) => saveCategory(event)} />
          <h2>Danh mục hiện có</h2>
          <div className="admin-record-list">
            {categories.map((category) => (
              <details className="admin-record" key={category.id}>
                <summary><strong>{category.name}</strong><small>/{category.slug}</small></summary>
                <CategoryForm category={category} onSubmit={(event) => saveCategory(event, category.id)} />
                <button
                  className="admin-danger-button"
                  onClick={() => {
                    if (window.confirm(`Xóa danh mục “${category.name}”?`)) {
                      void mutate(`/api/admin/categories/${category.id}`, "DELETE");
                    }
                  }}
                  type="button"
                >
                  Xóa danh mục
                </button>
              </details>
            ))}
          </div>
        </section>
      )}

      {section === "orders" && (
        <section className="admin-section">
          <h2>Đơn hàng gần đây</h2>
          {orders.length === 0 ? <p>Chưa có đơn hàng.</p> : (
            <div className="admin-record-list">
              {orders.map((order) => (
                <article className="admin-record admin-order-record" key={order.id}>
                  <div className="admin-record-heading">
                    <span><strong>{order.orderNumber}</strong><small>{order.customerName} · {order.customerEmail}</small></span>
                    <strong>{order.total.toLocaleString("vi-VN")}₫</strong>
                  </div>
                  <p>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(" · ")}</p>
                  <p>Người nhận: {order.recipientName} · {order.recipientPhone}</p>
                  <p>Địa chỉ: {order.shippingAddress}{order.note ? ` · Ghi chú: ${order.note}` : ""}</p>
                  <p>{order.paymentMethod === "MOMO" ? "MoMo" : "COD"} · {paymentLabel(order.paymentStatus)} · {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                  {order.status === "CANCELLED" || order.status === "DONE" ? (
                    <span>{orderLabel(order.status)}</span>
                  ) : (
                    <label className="admin-inline-field">
                      Trạng thái đơn
                      <select
                        defaultValue={order.status}
                        onChange={(event) => {
                          const select = event.currentTarget;
                          const status = event.currentTarget.value;
                          if (
                            status === "CANCELLED"
                            && !window.confirm(
                              `Hủy đơn ${order.orderNumber}? Nếu MoMo báo thanh toán muộn, đơn sẽ được đánh dấu cần hoàn tiền.`,
                            )
                          ) {
                            select.value = order.status;
                            return;
                          }
                          void mutate(`/api/admin/orders/${order.id}`, "PATCH", { status })
                            .then((saved) => {
                              if (!saved) select.value = order.status;
                            });
                        }}
                      >
                        {orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  )}
                  {order.status === "CANCELLED" && order.paymentStatus === "PAID" && (
                    <div className="admin-refund">
                      <strong className="admin-warning">Cần hoàn tiền qua MoMo hoặc phương thức ngoài hệ thống.</strong>
                      <button
                        className="admin-secondary-button"
                        onClick={() => {
                          if (window.confirm("Chỉ xác nhận sau khi đã hoàn tiền bên ngoài ứng dụng. Tiếp tục?")) {
                            void mutate(`/api/admin/orders/${order.id}`, "PATCH", { paymentStatus: "REFUNDED" });
                          }
                        }}
                        type="button"
                      >
                        Xác nhận đã hoàn tiền
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {section === "customers" && (
        <section className="admin-section">
          <h2>Tài khoản và phân quyền</h2>
          <p>Không thể tự hạ quyền hoặc hạ quyền admin cuối cùng.</p>
          <div className="admin-record-list">
            {customers.map((customer) => (
              <article className="admin-record admin-customer-record" key={customer.id}>
                <span><strong>{customer.name}</strong><small>{customer.email} · {new Date(customer.createdAt).toLocaleDateString("vi-VN")}</small></span>
                <select
                  aria-label={`Vai trò của ${customer.email}`}
                  disabled={customer.id === adminId}
                  value={customer.role}
                  onChange={(event) => {
                    const select = event.currentTarget;
                    const role = select.value;
                    void mutate(`/api/admin/users/${customer.id}`, "PATCH", { role })
                      .then((saved) => {
                        if (!saved) select.value = customer.role;
                      });
                  }}
                >
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  className={customer.isActive ? "admin-danger-button" : "admin-secondary-button"}
                  disabled={customer.id === adminId}
                  onClick={() => {
                    void mutate(`/api/admin/users/${customer.id}`, "PATCH", { isActive: !customer.isActive });
                  }}
                  type="button"
                >
                  {customer.isActive ? "Khóa tài khoản" : "Mở khóa"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductForm({
  categories,
  initial,
  onSubmit,
}: {
  categories: Category[];
  initial?: Product;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label>SKU<input defaultValue={initial?.sku} maxLength={50} name="sku" required /></label>
      <label>Tên sản phẩm<input defaultValue={initial?.name} maxLength={200} name="name" required /></label>
      <label>Thương hiệu<input defaultValue={initial?.brand} maxLength={100} name="brand" required /></label>
      <label>Giá (VND)<input defaultValue={initial?.price} min={1} name="price" required type="number" /></label>
      <label>Tồn kho<input defaultValue={initial?.stock ?? 0} min={0} name="stock" required type="number" /></label>
      <label>Danh mục
        <select defaultValue={initial?.categoryId ?? categories[0]?.id ?? ""} name="categoryId" required>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>Ảnh (đường dẫn trong public)<input defaultValue={initial?.imageUrl} maxLength={500} name="imageUrl" placeholder="/products/..." required /></label>
      <label className="admin-form-wide">Mô tả<textarea defaultValue={initial?.description} maxLength={10000} name="description" required /></label>
      <label className="admin-form-wide">Thông số JSON<textarea defaultValue={initial?.specs ?? "{}"} name="specs" required /></label>
      <label className="admin-checkbox">
        <input defaultChecked={initial?.isActive ?? true} name="isActive" type="checkbox" />
        Đang hiển thị trong cửa hàng
      </label>
      <button className="button button-primary" type="submit">{initial ? "Lưu sản phẩm" : "Tạo sản phẩm"}</button>
    </form>
  );
}

function CategoryForm({
  category,
  onSubmit,
}: {
  category?: Category;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="admin-category-form" onSubmit={onSubmit}>
      <label>Tên<input defaultValue={category?.name} maxLength={100} name="name" required /></label>
      <label>Slug<input defaultValue={category?.slug} maxLength={100} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
      <button className="button button-primary" type="submit">{category ? "Lưu danh mục" : "Tạo danh mục"}</button>
    </form>
  );
}

function orderLabel(status: string) {
  return orderStatuses.find(([value]) => value === status)?.[1] ?? status;
}

function paymentLabel(status: string) {
  return ({
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    FAILED: "Thất bại",
    REFUNDED: "Đã hoàn tiền",
  } as Record<string, string>)[status] ?? status;
}
