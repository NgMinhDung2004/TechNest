import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

type ProductSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  page?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function pageHref(page: number, q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: ProductSearchParams;
}) {
  return (
    <Suspense fallback={<main className="catalog-page"><p>Đang tải sản phẩm...</p></main>}>
      <ProductCatalog searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductCatalog({ searchParams }: { searchParams: ProductSearchParams }) {
  const params = await searchParams;
  const q = firstValue(params.q)?.trim().slice(0, 100) || undefined;
  const categorySlug = firstValue(params.category)?.trim().slice(0, 100) || undefined;
  const requestedPage = parsePage(firstValue(params.page));

  await connection();

  const where = {
    isActive: true,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };
  const [total, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const limit = 12;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));
  const products = await prisma.product.findMany({
    where,
    skip: (currentPage - 1) * limit,
    take: limit,
    orderBy: { id: "asc" },
  });

  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <div>
          <Link className="catalog-back-link" href="/">← Trang chủ</Link>
          <span className="section-kicker">CỬA HÀNG TECHNEST</span>
          <h1>Tất cả sản phẩm</h1>
          <p>Khám phá thiết bị phù hợp cho học tập, làm việc và giải trí.</p>
        </div>
      </div>

      <form className="catalog-filters" action="/products" method="get">
        <label className="catalog-search">
          <span>Tìm sản phẩm</span>
          <input name="q" defaultValue={q} placeholder="Tên sản phẩm..." maxLength={100} />
        </label>
        <label className="catalog-category">
          <span>Danh mục</span>
          <select name="category" defaultValue={categorySlug ?? ""}>
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option value={category.slug} key={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <button className="button button-primary catalog-submit" type="submit">Lọc sản phẩm</button>
      </form>

      <div className="catalog-results">
        <p>{total} sản phẩm{q ? ` phù hợp với “${q}”` : ""}</p>
        {total > 0 && <span>Trang {currentPage} / {totalPages}</span>}
      </div>

      {products.length > 0 ? (
        <div className="product-grid catalog-grid">
          {products.map((product) => (
            <Link
              className="product-card"
              href={`/products/${product.slug}`}
              key={product.id}
              aria-label={`Xem ${product.name}`}
            >
              <div className="product-visual mint">
                <Image
                  className="product-image"
                  src={product.imageUrl}
                  alt={product.name}
                  width={1200}
                  height={900}
                />
              </div>
              <div className="product-info">
                <div className="catalog-product-heading">
                  <span className="product-category">{product.brand} · {product.sku}</span>
                  {product.isFeatured && <span className="catalog-featured-label">TECHNEST PICK</span>}
                </div>
                <h3>{product.name}</h3>
                <p>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng"}</p>
                <div className="product-bottom">
                  <strong>{Number(product.price).toLocaleString("vi-VN")}₫</strong>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>Chưa tìm thấy sản phẩm phù hợp</h2>
          <p>Thử đổi từ khóa hoặc chọn một danh mục khác nhé.</p>
          <Link className="text-link" href="/products">Xem tất cả sản phẩm <span>↗</span></Link>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Phân trang sản phẩm">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1, q, categorySlug)}>← Trang trước</Link>
          ) : <span aria-disabled="true">← Trang trước</span>}
          <span>{currentPage} / {totalPages}</span>
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1, q, categorySlug)}>Trang sau →</Link>
          ) : <span aria-disabled="true">Trang sau →</span>}
        </nav>
      )}
    </main>
  );
}
