import Image from "next/image";
import Link from "next/link";
import productImagePaths from "../data/product-image-paths.json";

const categories = [
  { icon: "💻", label: "Laptop", count: "20 sản phẩm", href: "/products?category=laptop" },
  { icon: "⚙️", label: "Linh kiện", count: "10 sản phẩm", href: "/products?category=linh-kien" },
  { icon: "🎧", label: "Phụ kiện", count: "10 sản phẩm", href: "/products?category=phu-kien" },
  { icon: "🖥️", label: "Màn hình", count: "5 sản phẩm", href: "/products?category=man-hinh" },
  { icon: "📡", label: "Thiết bị mạng", count: "5 sản phẩm", href: "/products?category=thiet-bi-mang" },
];

const featuredProducts = [
  {
    sku: "LAP-004",
    label: "CHO SINH VIÊN",
    name: "Lenovo IdeaPad Slim 3",
    specs: "Core i5 · 16GB RAM · 512GB SSD",
    price: "14.990.000₫",
    tone: "mint",
  },
  {
    sku: "LAP-003",
    label: "CHIẾN GAME",
    name: "Acer Nitro V 15",
    specs: "Core i5 · RTX 4050 · 16GB RAM",
    price: "22.990.000₫",
    tone: "peach",
  },
  {
    sku: "LAP-009",
    label: "MỎNG NHẸ",
    name: "ASUS Vivobook S 14 OLED",
    specs: "Ryzen 7 · OLED · 1TB SSD",
    price: "24.990.000₫",
    tone: "lavender",
  },
] as const;

export default function Home() {
  return (
    <main>
      <div className="announcement">
        <span>Giao hàng miễn phí cho đơn từ 5 triệu</span>
        <span className="announcement-separator">✦</span>
        <span>Tư vấn chọn máy cùng NestBot</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="TechNest trang chủ">
          <span className="brand-mark">T</span>
          <span>tech<span className="brand-accent">nest</span></span>
        </a>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <a href="#categories">Danh mục</a>
          <Link href="/products">Sản phẩm nổi bật</Link>
          <a href="#why-us">Về TechNest</a>
        </nav>
        <div className="header-actions">
          <Link className="icon-link search-link" href="/products" aria-label="Tìm kiếm">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          </Link>
          <a className="icon-link cart-link" href="#products" aria-label="Giỏ hàng">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="9.5" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
          </a>
          <a className="login-link" href="#why-us">Tài khoản</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> CỬA HÀNG CÔNG NGHỆ CỦA BẠN</div>
          <h1>Nâng tầm cách bạn <span>làm điều mình thích.</span></h1>
          <p>
            Tìm chiếc laptop phù hợp với bạn — từ buổi học đầu tiên, dòng code
            đầu tiên, đến trận game cuối tuần.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/products">Khám phá sản phẩm <span>↗</span></Link>
            <a className="button button-secondary" href="#categories"><span className="play-icon">▶</span> Xem danh mục</a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true"><span>👩🏻</span><span>👨🏽</span><span>👨🏻</span></div>
            <p><strong>500+</strong> bạn trẻ đã tìm được máy ưng ý</p>
          </div>
        </div>
        <div className="hero-art" aria-label="Minh họa laptop và trợ lý AI">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-sparkle sparkle-one">✳</div>
          <div className="hero-sparkle sparkle-two">✦</div>
          <div className="hero-laptop">
            <div className="laptop-screen">
              <div className="screen-top"><span /><span /><span /></div>
              <div className="screen-content">
                <span className="screen-tag">MADE FOR YOUR NEXT</span>
                <strong>big idea<span>.</span></strong>
                <div className="screen-bars"><i /><i /><i /></div>
              </div>
              <div className="screen-glow" />
            </div>
            <div className="laptop-base"><span /></div>
          </div>
          <div className="floating-card ai-card">
            <span className="ai-avatar">✦</span>
            <span><strong>Chào bạn!</strong><small>Mình là NestBot</small></span>
            <span className="online-dot" />
          </div>
          <div className="floating-card match-card">
            <span className="match-icon">⌁</span>
            <span><small>ĐỘ PHÙ HỢP</small><strong>98% dành cho bạn</strong></span>
          </div>
          <div className="hero-caption">MÁY TỐT. CHỌN ĐÚNG GU.</div>
        </div>
      </section>

      <section className="category-section" id="categories">
        <div className="section-heading">
          <div><span className="section-kicker">KHÁM PHÁ TECHNEST</span><h2>Bạn đang tìm gì?</h2></div>
          <Link className="text-link" href="/products">Xem tất cả <span>↗</span></Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-card" href={category.href} key={category.label}>
              <span className="category-icon">{category.icon}</span>
              <strong>{category.label}</strong>
              <small>{category.count}</small>
              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="products-section" id="products">
        <div className="section-heading">
          <div><span className="section-kicker">ĐƯỢC CHỌN NHIỀU</span><h2>Những chiếc máy nổi bật</h2></div>
          <Link className="text-link" href="/products">Khám phá bộ sưu tập <span>↗</span></Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <article className="product-card" key={product.name}>
              <div className={`product-visual ${product.tone}`}>
                <span className="product-label">{product.label}</span>
                <Image
                  className="product-image"
                  src={productImagePaths[product.sku]}
                  alt={product.name}
                  width={1200}
                  height={900}
                />
                <span className="product-sparkle">✳</span>
              </div>
              <div className="product-info">
                <span className="product-category">LAPTOP · TECHNEST PICK</span>
                <h3>{product.name}</h3>
                <p>{product.specs}</p>
                <div className="product-bottom"><strong>{product.price}</strong><Link href="/products" aria-label={`Xem sản phẩm ${product.name}`}>↗</Link></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="assistant-section" id="why-us">
        <div className="assistant-orbit">✦</div>
        <div>
          <span className="section-kicker">KHÔNG RÀNH CẤU HÌNH? KHÔNG SAO.</span>
          <h2>Nói nhu cầu của bạn.<br /><span>TechNest chọn giúp bạn.</span></h2>
        </div>
        <a className="button button-dark" href="mailto:hello@technest.local">Tư vấn cùng NestBot <span>↗</span></a>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark">T</span><span>tech<span className="brand-accent">nest</span></span></a>
        <p>Chọn đúng công nghệ. Bắt đầu điều lớn lao.</p>
        <span>© 2026 TechNest · Bản dựng khởi đầu</span>
      </footer>
    </main>
  );
}
