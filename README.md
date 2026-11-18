# TechNest

Khung cửa hàng laptop và linh kiện xây dựng bằng Next.js, TypeScript, Prisma và PostgreSQL.

## Yêu cầu

- Node.js 20.9 trở lên
- Docker Desktop có Docker Compose

## Khởi chạy dự án

1. Cài dependencies:

   ```bash
   npm install
   ```

2. Tạo file cấu hình môi trường (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   ```

3. Khởi động PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Tạo bảng trong database và sinh Prisma Client:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Nạp dữ liệu mẫu:

   ```bash
   npm run db:seed
   ```

6. Chạy ứng dụng:

   ```bash
   npm run dev
   ```

Mở [http://localhost:3000](http://localhost:3000).

## Lệnh database

| Lệnh | Mô tả |
| --- | --- |
| `npm run db:generate` | Sinh Prisma Client từ schema |
| `npm run db:migrate -- --name <name>` | Tạo và áp dụng migration trong môi trường phát triển |
| `npm run db:deploy` | Áp dụng migration đã commit khi deploy |
| `npm run db:seed` | Upsert 5 danh mục và 50 sản phẩm mẫu |
| `npm run db:studio` | Mở Prisma Studio |

`docker compose down` dừng PostgreSQL nhưng giữ lại volume dữ liệu. Chỉ dùng `docker compose down -v` khi muốn xóa database local.

Seed cũng tạo 50 ảnh SVG minh họa gốc trong `public/products/`. Đường dẫn public tương ứng với từng SKU được quản lý riêng trong `src/data/product-image-paths.json`; chạy lại `npm run db:seed` sẽ tái tạo ảnh và cập nhật đường dẫn ảnh trong database.

## Mô hình dữ liệu

Prisma schema gồm user/role, danh mục và sản phẩm (thông số JSON), embedding sản phẩm, giỏ hàng, đơn hàng và snapshot sản phẩm trong đơn, đánh giá, tài liệu FAQ, phiên chat và tin nhắn. Embedding hiện lưu dạng JSON; có thể chuyển sang vector extension khi triển khai chức năng truy xuất.

Dùng Prisma Client dùng chung tại `src/lib/prisma.ts` trong code phía server. Danh sách sản phẩm ở `/products` hỗ trợ tìm kiếm, lọc danh mục và phân trang; trang `/products/[slug]` hiển thị chi tiết. API `GET /api/products` nhận các query `q`, `category`, `page` và `limit`. Đăng nhập, thanh toán, admin và NestBot chưa được kết nối.
