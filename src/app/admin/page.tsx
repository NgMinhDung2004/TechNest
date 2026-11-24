import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="admin-page"><p>Đang tải trang quản trị...</p></main>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Fadmin");
  if (user.role !== "ADMIN") notFound();

  const [products, categories, orders, users, productCount, pendingOrders, customerCount, paidRevenue] =
    await Promise.all([
      prisma.product.findMany({
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.order.findMany({
        include: { user: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
    ]);

  return (
    <AdminPanel
      adminId={user.id}
      categories={categories}
      customers={users.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toISOString(),
      }))}
      metrics={{
        activeProducts: productCount,
        pendingOrders,
        customers: customerCount,
        paidRevenue: Number(paidRevenue._sum.total ?? 0),
      }}
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        customerEmail: order.user.email,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        shippingAddress: order.shippingAddress,
        note: order.note,
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity })),
      }))}
      products={products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        price: Number(product.price),
        stock: product.stock,
        description: product.description,
        specs: JSON.stringify(product.specs, null, 2),
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        isActive: product.isActive,
      }))}
    />
  );
}
