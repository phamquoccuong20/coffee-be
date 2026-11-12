# ☕ Coffee Shop Management Backend (NestJS + Prisma)

Hệ thống Backend REST API quản lý quán cà phê đầy đủ tính năng xây dựng bằng **NestJS**, **TypeScript**, **Prisma ORM**, **JWT Authentication + RBAC**, và **Swagger UI**.

## 🚀 Tính năng chính

1. **Auth & Phân quyền (`ADMIN`, `MANAGER`, `CASHIER`, `BARISTA`)**
   - Đăng ký, đăng nhập JWT (`POST /api/auth/login`, `POST /api/auth/register`)
   - Quản lý nhân viên (`GET/POST/PATCH/DELETE /api/users`)
2. **Thực đơn & Danh mục (`Categories`, `Products`, `Toppings`)**
   - Danh mục đồ uống, bánh ngọt (`/api/categories`)
   - Món với size `S` / `M` / `L` & chênh lệch giá (`/api/products`)
   - Topping thêm (`/api/toppings`)
3. **Quản lý bàn & Khu vực (`Tables`)**
   - Trạng thái bàn (`AVAILABLE`, `OCCUPIED`, `RESERVED`) tự động cập nhật theo đơn hàng (`/api/tables`)
4. **Đặt món & Chế biến (`Orders`)**
   - Tạo đơn tại quán (`DINE_IN`) hoặc mang đi (`TAKEAWAY`)
   - Tự động tính giá theo size, topping, áp mã giảm giá & tích điểm khách hàng
   - Quy trình Barista: `PENDING` → `PREPARING` → `READY` → `COMPLETED` / `CANCELLED`
5. **Thanh toán (`Payments`)**
   - Hỗ trợ `CASH`, `BANK_TRANSFER`, `MOMO`, `CARD`, tính tiền thừa, hoàn tiền (`/api/payments`)
6. **Khuyến mãi (`Vouchers`)**
   - Giảm theo `%` hoặc số tiền cố định, giới hạn đơn tối thiểu, lượt dùng, thời gian hiệu lực (`/api/vouchers`)
7. **Khách hàng & Tích điểm (`Customers`)**
   - Tự động cộng điểm khi mua hàng (`/api/customers`)
8. **Quản lý kho nguyên liệu (`Ingredients`)**
   - Nhập kho, xuất kho, kiểm kê, cảnh báo sắp hết hàng (`/api/ingredients/low-stock`)
9. **Giao ca thu ngân (`Shifts`)**
   - Mở ca, đóng ca, kiểm kê tiền đầu ca/cuối ca (`/api/shifts`)
10. **Báo cáo & Thống kê (`Reports`)**
    - Tổng quan doanh thu trong ngày, báo cáo theo phương thức thanh toán, top món bán chạy (`/api/reports/*`)

## 🛠️ Cài đặt & Chạy dự án

```bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo Prisma Client & đẩy schema vào SQLite
npx prisma generate
npx prisma db push

# 3. Nạp dữ liệu mẫu (Admin, Cashier, Barista, Menu, Bàn, Kho)
npm run prisma:seed

# 4. Chạy server development
npm run start:dev
```

- **API Base URL**: `http://localhost:3000/api`
- **Swagger UI Docs**: `http://localhost:3000/docs`

### Tài khoản mẫu sau khi seed:
- **Admin**: `admin@coffee.vn` / `Admin@123`
- **Thu ngân (Cashier)**: `cashier@coffee.vn` / `Staff@123`
- **Pha chế (Barista)**: `barista@coffee.vn` / `Staff@123`

