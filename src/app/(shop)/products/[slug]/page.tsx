import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { prisma } from "@/lib/prisma";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="product-detail-page"><p>Đang tải sản phẩm...</p></main>}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: true },
  });

  if (!product) notFound();

  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? Object.entries(product.specs)
    : [];

  return (
    <main className="product-detail-page">
      <nav className="product-breadcrumbs" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`}>
          {product.category.name}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <section className="product-detail">
        <div className="product-detail-visual">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={1200}
            height={900}
            priority
          />
        </div>
        <div className="product-detail-copy">
          <span className="section-kicker">{product.category.name.toUpperCase()} · {product.sku}</span>
          <h1>{product.name}</h1>
          <p className="product-detail-brand">Thương hiệu {product.brand}</p>
          <p className="product-detail-price">{Number(product.price).toLocaleString("vi-VN")}₫</p>
          <p className={product.stock > 0 ? "product-stock" : "product-stock out-of-stock"}>
            {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng"}
          </p>
          <p className="product-detail-description">{product.description}</p>
          <AddToCartButton
            available={product.stock > 0}
            product={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
            }}
          />
          {specs.length > 0 && (
            <div className="product-specifications">
              <h2>Thông số nổi bật</h2>
              <dl>
                {specs.map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                      ? String(value)
                      : JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <Link className="button button-secondary product-back-link" href="/products">
            ← Tiếp tục xem sản phẩm
          </Link>
        </div>
      </section>
    </main>
  );
}
