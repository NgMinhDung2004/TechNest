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

   Tạo `AUTH_SECRET` bằng `npx auth secret` và lưu vào `.env` trước khi đăng nhập.

3. Khởi động PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Áp dụng các migration đã có và sinh Prisma Client:

   ```bash
   npx prisma migrate dev
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
| `npm run db:admin` | Tạo tài khoản admin hoặc nâng role cho email đã có |
| `npm run db:studio` | Mở Prisma Studio |
| `npm test` | Kiểm tra chữ ký MoMo |

Để tạo admin, đặt `ADMIN_EMAIL`, `ADMIN_NAME` và `ADMIN_PASSWORD` trong `.env`, sau đó chạy `npm run db:admin`. Mật khẩu phải có ít nhất 8 ký tự. Nếu email đã tồn tại, lệnh chỉ nâng role lên `ADMIN` và giữ nguyên mật khẩu hiện có; không có thông tin đăng nhập mặc định trong source code.

Khách hàng đăng ký có role `CUSTOMER`, có thể xem sản phẩm, thêm giỏ, đặt hàng và xem lịch sử đơn của chính mình. Admin truy cập `/admin` để quản lý sản phẩm, tồn kho, danh mục, đơn hàng và quyền tài khoản. Các API admin kiểm tra role trong database ở mỗi request.

Thanh toán MoMo dùng API captureWallet và xác nhận qua chữ ký IPN. Điền `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` và `APP_BASE_URL` trong `.env`; dùng credentials sandbox và endpoint sandbox để thử. `APP_BASE_URL` phải là URL HTTPS công khai mà MoMo truy cập được để gửi `/api/payments/momo/ipn` (localhost cần tunnel HTTPS). Không dùng thanh toán thật cho đến khi đã cấu hình credentials production và endpoint được MoMo cấp.

Hoàn tiền hiện được thực hiện trong MoMo Merchant Portal hoặc ngoài hệ thống; sau khi hoàn tiền thành công, admin xác nhận trạng thái trong trang quản trị. Ứng dụng không tự gửi yêu cầu hoàn tiền đến MoMo.

`docker compose down` dừng PostgreSQL nhưng giữ lại volume dữ liệu. Chỉ dùng `docker compose down -v` khi muốn xóa database local.

Seed cũng tạo 50 ảnh SVG minh họa gốc trong `public/products/`. Đường dẫn public tương ứng với từng SKU được quản lý riêng trong `src/data/product-image-paths.json`; chạy lại `npm run db:seed` sẽ tái tạo ảnh và cập nhật đường dẫn ảnh trong database.

## Mô hình dữ liệu

Prisma schema gồm user/role, danh mục và sản phẩm (thông số JSON), embedding sản phẩm, giỏ hàng, đơn hàng và snapshot sản phẩm trong đơn, đánh giá, tài liệu FAQ, phiên chat và tin nhắn. Embedding hiện lưu dạng JSON; có thể chuyển sang vector extension khi triển khai chức năng truy xuất.

Dùng Prisma Client dùng chung tại `src/lib/prisma.ts` trong code phía server. Danh sách sản phẩm ở `/products` hỗ trợ tìm kiếm, lọc danh mục và phân trang; trang `/products/[slug]` hiển thị chi tiết. API `GET /api/products` nhận các query `q`, `category`, `page` và `limit`. Đăng nhập/đăng xuất, phân quyền admin/khách hàng, quản trị cửa hàng, checkout COD và luồng MoMo đã được kết nối; NestBot chưa được triển khai.
