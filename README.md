# AnhTraiStore - Website bán điện thoại

Đồ án demo website thương mại điện tử bán điện thoại và phụ kiện.

## 🚀 Yêu cầu hệ thống

- **Node.js** v16 hoặc cao hơn
- **XAMPP** (có MySQL và phpMyAdmin)
- **Trình duyệt** Chrome, Firefox, Edge

---

## 🗄️ Cài đặt Database với XAMPP

### Bước 1: Mở XAMPP và khởi động MySQL

1. Mở **XAMPP Control Panel**
2. Nhấn **Start** ở mục **MySQL**
3. Đợi đến khi MySQL chuyển sang trạng thái **Running** (màu xanh)

### Bước 2: Truy cập phpMyAdmin

1. Mở trình duyệt
2. Truy cập: `http://localhost/phpmyadmin/`
3. Hoặc nhấn nút **Admin** trong XAMPP Control Panel

### Bước 3: Tạo Database

1. Trong phpMyAdmin, click **New** (mới) ở panel bên trái
2. Tên database: `anhtraisstore`
3. Collation: `utf8mb4_unicode_ci`
4. Nhấn **Create**

### Bước 4: Import Database

1. Chọn database `anhtraisstore` vừa tạo
2. Click tab **Import**
3. Click **Choose File** và chọn file: `database/dt.sql`
4. Cuộn xuống và nhấn **Go** (Execute)
5. Đợi import thành công

### Thông tin kết nối Database (XAMPP mặc định)

| Thông số | Giá trị |
|----------|---------|
| Host | `localhost` |
| User | `root` |
| Password | `""` (trống) |
| Port | `3306` |
| Database | `anhtraisstore` |

---

## 📦 Cài đặt Project

### Bước 1: Cài đặt Node.js dependencies

```bash
# Mở terminal trong thư mục project
cd e:\Website

# Cài đặt các package cần thiết
npm install
```

### Bước 2: Cấu hình file `.env`

Tạo file `.env` trong thư mục gốc với nội dung:

```env
# Database (XAMPP)
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=anhtraisstore

# Server
PORT=3000
SESSION_SECRET=anhtraisstore_secret_key_2024

# Email (tùy chọn - để gửi email thật)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SITE_NAME=AnhTraiStore
SITE_URL=http://localhost:3000

# Google OAuth (tùy chọn)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Bước 3: Chạy Server

```bash
npm start
```

### Bước 4: Truy cập Website

Mở trình duyệt: **`http://localhost:3000`**

---

## 📋 Tài khoản demo

### Admin (Quản trị viên)

| Thông tin | Giá trị |
|-----------|---------|
| Email | `adminanhtrai@gmail.com` |
| Password | `admin123` |
| URL Admin | `http://localhost:3000/admin` |

### Khách hàng

- Đăng ký tài khoản mới tại: `http://localhost:3000/register`
- Hoặc đăng nhập bằng Google (nếu đã cấu hình OAuth)

---

## ✨ Tính năng chính

### 👤 Khách hàng

| Tính năng | Mô tả |
|------------|--------|
| 🏠 Trang chủ | Banner, sản phẩm nổi bật, danh mục |
| 🔍 Tìm kiếm & lọc | Theo danh mục, nhiều thương hiệu, RAM, bộ nhớ, khoảng giá và sắp xếp |
| 📱 Chi tiết sản phẩm | Hình ảnh gallery, mô tả, thông số kỹ thuật, đánh giá |
| ❤️ Wishlist | Lưu sản phẩm yêu thích |
| ⚖️ So sánh | So sánh tối đa 3 sản phẩm |
| 🛒 Giỏ hàng | Thêm, bớt, xóa, cập nhật số lượng |
| 💳 Thanh toán | COD, VNPay, MoMo (demo) |
| 🎫 Mã giảm giá | Áp dụng coupon khi thanh toán |
| 📦 Quản lý đơn hàng | Xem, theo dõi, hủy đơn |
| ⭐ Đánh giá | Đánh giá và bình luận sản phẩm |
| 💬 Chatbot AI | Tự động tư vấn sản phẩm |
| 👤 Tài khoản | Quản lý thông tin cá nhân |
| 🔐 Đăng nhập Google | OAuth 2.0 qua Google |
| 📧 Email xác nhận | Nhận email khi đặt hàng, đăng ký |
| 🔑 Quên mật khẩu | Đặt lại bằng OTP qua email |

### 🔧 Admin (Quản trị)

| Tính năng | Mô tả |
|------------|--------|
| 📊 Dashboard | Thống kê tổng quan |
| 📦 CRUD Sản phẩm | Thêm, sửa, xóa, upload ảnh gallery |
| 📁 CRUD Danh mục | Quản lý danh mục sản phẩm |
| 🏷️ CRUD Thương hiệu | Quản lý thương hiệu |
| 🛒 Quản lý đơn hàng | Xác nhận, cập nhật trạng thái |
| 👥 Quản lý người dùng | Xem danh sách khách hàng |
| ⭐ Duyệt đánh giá | Duyệt/xóa đánh giá sản phẩm |
| 💬 Chat realtime | Nhắn tin với khách (Socket.IO) |
| 📬 Quản lý liên hệ | Xem và trả lời tin nhắn liên hệ |
| 🖼️ Quản lý Banner | Thêm, sửa, xóa banner trang chủ |
| 🎫 Quản lý Coupon | Tạo và quản lý mã giảm giá |

### Quy tắc nghiệp vụ demo

- Giá sản phẩm, phí vận chuyển và số tiền giảm được backend tính lại từ dữ liệu hiện có; frontend không quyết định số tiền của đơn hàng.
- Số lượng mua phải là số nguyên dương và không vượt quá tồn kho.
- Đơn COD được tạo ở trạng thái `pending` và trừ kho ngay khi đặt hàng.
- MoMo/VNPay là thanh toán mô phỏng: đơn được tạo ở trạng thái `pending`; người dùng nhấn **Xác nhận đã thanh toán** để chuyển sang `confirmed` và trừ kho.
- Trạng thái đơn đi theo luồng `pending → confirmed → shipping → delivered`; đơn chưa giao có thể chuyển sang `cancelled` và được hoàn kho nếu trước đó đã trừ kho.
- Coupon được backend kiểm tra lại khi tạo hoặc xác nhận đơn. Mỗi tài khoản chỉ dùng một coupon một lần; `WELCOME10` và `NEWUSER` chỉ áp dụng cho đơn đầu tiên.
- Chỉ khách đã nhận sản phẩm (`delivered`) mới có thể gửi đánh giá.
- Chỉ xóa sản phẩm chưa có trong đơn hàng. Sản phẩm đã được đặt mua cùng hình ảnh được giữ lại để bảo toàn lịch sử đơn hàng.
- Khôi phục mật khẩu dùng OTP qua email tại `/forgot-password`; trang này thực hiện đủ các bước nhập email, OTP và mật khẩu mới.

---

## 🎫 Mã giảm giá demo

| Mã | Loại | Giảm | Điều kiện |
|----|------|------|-----------|
| `WELCOME10` | % | 10% | Đơn từ 1 triệu |
| `FREESHIP` | Tiền | 30.000đ | Đơn từ 500K |
| `VIP20` | % | 20% | Đơn từ 3 triệu |
| `SALE5TR` | Tiền | 500.000đ | Đơn từ 30 triệu |

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Mô tả |
|-----------|--------|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| Socket.IO | Realtime communication |
| Passport.js | Authentication (OAuth) |
| Nodemailer | Gửi email SMTP |

### Database
| Công nghệ | Mô tả |
|-----------|--------|
| MySQL (XAMPP) | Hệ quản trị CSDL |
| phpMyAdmin | Quản lý database |

### Frontend
| Công nghệ | Mô tả |
|-----------|--------|
| HTML5 | Cấu trúc trang |
| CSS3 | Styling + Responsive |
| Vanilla JS | Tương tác |
| Bootstrap Icons | Icon |

---

## 📁 Cấu trúc thư mục

```
Website/
├── server.js              # Entry point (Express + Socket.IO)
├── package.json
├── .env                   # Environment variables
│
├── routes/                # API Routes
│   ├── auth.js           # Đăng ký, đăng nhập, Google OAuth
│   ├── products.js       # CRUD sản phẩm
│   ├── cart.js          # Giỏ hàng
│   ├── orders.js        # Đơn hàng
│   ├── wishlist.js     # Yêu thích
│   ├── coupons.js      # Mã giảm giá
│   ├── chat.js         # AI Chatbot
│   ├── messages.js     # Chat admin ↔ khách (Socket.IO)
│   ├── api.js          # Upload ảnh
│   └── admin.js        # Admin API
│
├── views/                # HTML Pages (Customer)
│   ├── index.html       # Trang chủ
│   ├── products.html    # Danh sách sản phẩm
│   ├── product-detail.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── order-detail.html
│   ├── compare.html
│   ├── wishlist.html
│   ├── profile.html
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── contact.html
│   ├── promotions.html
│   ├── policy.html
│   ├── components/
│   │   └── ai-chatbox.html
│   └── admin/           # Admin Dashboard
│       ├── index.html   # Dashboard
│       ├── products.html
│       ├── categories.html
│       ├── brands.html
│       ├── orders.html
│       ├── users.html
│       ├── reviews.html
│       ├── banners.html
│       ├── promotions.html
│       └── contacts.html
│
├── public/              # Static Files
│   ├── css/
│   │   ├── style.css
│   │   ├── admin.css
│   │   ├── filter.css
│   │   └── chatbox.css
│   ├── js/
│   │   ├── app.js       # Core app (cart, wishlist)
│   │   ├── chatbox.js   # AI chatbot
│   │   └── chat-widget.js # Chat với admin
│   ├── images/
│   │   └── no-image.svg
│   └── assets/
│       └── images/
│           └── products/ # Ảnh sản phẩm
│
├── database/
│   └── dt.sql           # Schema + Sample data (~60 sản phẩm)
│
└── config/
    ├── database.js      # MySQL connection
    ├── passport.js      # Google OAuth config
    └── mail.js          # Email SMTP config
```

---

## 💬 Hệ thống Chat Admin ↔ Khách hàng

### Tính năng
- ✅ Tin nhắn **realtime** qua Socket.IO
- ✅ **Typing indicator** - hiển thị "đang nhập..."
- ✅ Widget chat nổi ở góc phải màn hình
- ✅ Badge đếm tin nhắn chưa đọc
- ✅ Xem lịch sử hội thoại
- ✅ Đóng/mở hội thoại

### Cách hoạt động
1. Khách đăng nhập → Mở widget chat
2. Gửi tin nhắn → Lưu vào database
3. Admin vào `/admin/contacts` → Nhắn tin phản hồi
4. Cả hai nhận tin realtime (không cần F5)

### Socket.IO Events
| Event | Mô tả |
|-------|--------|
| `join_conversation` | Tham gia phòng chat |
| `typing` | Typing indicator |
| `new_message` | Tin nhắn mới |
| `admin_status` | Trạng thái online của admin |

---

## 📧 Cấu hình Email (Gmail SMTP)

### 1. Tạo Gmail App Password

1. Truy cập [myaccount.google.com](https://myaccount.google.com) → **Bảo mật**
2. Bật **Xác thực 2 bước**
3. Vào **App Passwords** → Tạo mới
4. Chọn App: "Mail", Device: "Other"
5. Copy mật khẩu 16 ký tự

### 2. Cập nhật file `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App Password
```

### Tính năng Email

| Tính năng | Mô tả |
|-----------|--------|
| 📧 Xác nhận đơn hàng | Gửi email khi đặt hàng thành công |
| 🔑 OTP đặt lại mật khẩu | Mã 6 số, hết hạn sau 5 phút |
| 👋 Email chào mừng | Gửi khi đăng ký qua Google |

---

## 🔐 Google OAuth (Đăng nhập bằng Google)

### 1. Tạo OAuth Client

1. Truy cập [console.cloud.google.com](https://console.cloud.google.com/)
2. Tạo Project mới
3. **APIs & Services** → **Credentials** → **Create Credentials**
4. Chọn **OAuth client ID**
5. Application type: **Web application**
6. Thêm Authorized redirect URI:
   - `http://localhost:3000/auth/google/callback`

### 2. Cập nhật file `.env`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 🗃️ Database Schema (18 bảng)

| Bảng | Mô tả |
|------|--------|
| `users` | Người dùng (khách + admin) |
| `reset_tokens` | Token đặt lại mật khẩu |
| `categories` | Danh mục sản phẩm |
| `brands` | Thương hiệu |
| `products` | Sản phẩm |
| `product_images` | Gallery ảnh sản phẩm |
| `orders` | Đơn hàng |
| `order_items` | Chi tiết đơn hàng |
| `cart` | Giỏ hàng tạm |
| `reviews` | Đánh giá sản phẩm |
| `wishlists` | Sản phẩm yêu thích |
| `coupons` | Mã giảm giá |
| `user_coupons` | Lịch sử dùng coupon |
| `contacts` | Form liên hệ |
| `conversations` | Hội thoại chat |
| `messages` | Tin nhắn chat |
| `promotions` | Khuyến mãi |
| `banners` | Banner trang chủ |

---

## ❓ Giải quyết sự cố

### Lỗi "Can't connect to MySQL server"

1. Kiểm tra XAMPP đã Start MySQL chưa
2. Kiểm tra port 3306 có bị chiếm dụng không
3. Thử restart MySQL trong XAMPP

### Lỗi "Database 'anhtraisstore' doesn't exist"

1. Truy cập phpMyAdmin: `http://localhost/phpmyadmin/`
2. Tạo database `anhtraisstore`
3. Import lại file `database/dt.sql`

### Lỗi "Port 3000 already in use"

```bash
# Tìm và kill process sử dụng port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Lỗi khi import SQL

1. Kiểm tra file `dt.sql` có tồn tại không
2. Tăng `max_execution_time` trong php.ini nếu file lớn
3. Thử import từng phần nhỏ

---

## 📝 Ghi chú

- **Đồ án demo** - Phù hợp cho mục đích học tập
- Thanh toán VNPay/MoMo là luồng mô phỏng phục vụ đồ án, không kết nối cổng thanh toán thật. Nút xác nhận thanh toán trên giao diện đóng vai trò kết quả giao dịch demo.
- File `database/dt.sql` là schema và dữ liệu mẫu gốc; các chỉnh sửa nghiệp vụ trong mã nguồn không yêu cầu thay đổi file này.
- Khuyến nghị bật HTTPS khi deploy thật
- Nên sử dụng XAMPP phiên bản mới nhất

---

## 👨‍💻 Tác giả

Đồ án được phát triển bởi [Tên Sinh viên]

**Liên hệ hỗ trợ:** [Email]
