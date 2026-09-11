# AnhTraiStore - Website bán điện thoại

Đồ án demo website thương mại điện tử bán điện thoại và phụ kiện.

## 🚀 Cài đặt

```bash
npm install
npm start
```

Server chạy tại: `http://localhost:3000`

## 📋 Tài khoản demo

**Admin:**
- Email: `admin@anhtrai.com`
- Password: `admin123`

**Khách hàng:**
- Đăng ký tài khoản mới

## ✨ Tính năng chính

### Khách hàng
- 🏠 Trang chủ với banner, sản phẩm nổi bật
- 🔍 Tìm kiếm & lọc sản phẩm (theo danh mục, thương hiệu, giá)
- 📱 Xem chi tiết sản phẩm với hình ảnh, mô tả, đánh giá
- ❤️ Wishlist (yêu thích)
- ⚖️ So sánh sản phẩm
- 🛒 Giỏ hàng
- 💳 Thanh toán (COD, VNPay, MoMo)
- 🎫 Áp dụng mã giảm giá
- 📦 Quản lý đơn hàng
- ⭐ Đánh giá sản phẩm
- 💬 Chatbot AI tư vấn
- 👤 Quản lý tài khoản
- 🔐 **Đăng nhập bằng Google (OAuth)**
- 📧 **Gửi email xác nhận đơn hàng**
- 🔑 **Quên mật khẩu bằng OTP qua email**

### Admin
- 📊 Dashboard thống kê
- 📦 CRUD sản phẩm, danh mục, thương hiệu
- 🛒 Quản lý đơn hàng
- 👥 Quản lý người dùng
- ⭐ Duyệt đánh giá
- 📬 Xem tin nhắn liên hệ
- 💬 **Chat trực tiếp với khách hàng** (realtime qua Socket.IO, xem lịch sử, typing indicator)
- 🖼️ Quản lý banner
- 🎫 Quản lý mã giảm giá

## 🛠️ Công nghệ

- **Backend:** Node.js, Express, Socket.IO
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Session:** Express Session
- **Upload:** Multer

## 📁 Cấu trúc

```
Website/
├── server.js           # Entry point (Express + Socket.IO)
├── routes/             # API routes
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   ├── wishlist.js
│   ├── coupons.js
│   ├── chat.js         # AI chatbot tư vấn sản phẩm
│   ├── messages.js     # Chat admin ↔ khách hàng (realtime)
│   ├── api.js
│   └── admin.js
├── views/              # HTML pages
│   ├── *.html          # Customer pages
│   └── admin/          # Admin dashboard
├── public/             # Static files
│   ├── css/
│   ├── js/
│   │   ├── app.js      # Core app (user, cart, wishlist)
│   │   ├── chatbox.js  # AI chatbot widget
│   │   └── chat-widget.js  # 💬 Widget chat với admin
│   ├── images/
│   └── uploads/
├── database/
│   └── dt.sql          # Database schema + sample data
└── config/
    └── database.js     # DB connection
```

## 💬 Hệ thống Chat Admin ↔ Khách hàng

### Tính năng
- ✅ Khách hàng **đã đăng nhập** gửi liên hệ → tự động tạo cuộc hội thoại
- ✅ Admin trả lời trong trang `/admin/contacts` (giao diện 2 cột như Messenger)
- ✅ Tin nhắn **realtime** qua Socket.IO (không cần F5)
- ✅ **Typing indicator** - hiển thị khi đối phương đang nhập
- ✅ Widget chat nổi ở góc phải (riêng biệt với AI chatbot ở góc trái)
- ✅ Badge đếm tin nhắn chưa đọc
- ✅ Đóng/mở hội thoại, xem lịch sử
- ✅ Lưu trữ trong bảng `conversations` + `messages` (xem `database/dt.sql`)

### Cách hoạt động
1. Khách đăng nhập → truy cập bất kỳ trang nào có widget chat
2. Mở widget → thấy danh sách hội thoại cũ + nút "Gửi liên hệ mới"
3. Gửi liên hệ → lưu vào bảng `contacts` + tự động tạo `conversation`
4. Admin vào `/admin/contacts` → thấy danh sách hội thoại → click để mở khung chat
5. Hai bên nhắn tin qua lại realtime, tin nhắn lưu vào bảng `messages`

### API chính
- `GET /api/messages/conversations` - User lấy DS hội thoại của mình
- `GET /api/messages/:conv_id` - User lấy chi tiết hội thoại
- `POST /api/messages/:conv_id` - User gửi tin nhắn
- `GET /api/messages/admin/conversations` - Admin lấy tất cả hội thoại
- `GET /api/messages/admin/:conv_id` - Admin xem chi tiết
- `POST /api/messages/admin/:conv_id` - Admin reply
- `PUT /api/messages/admin/:conv_id/close` - Đóng hội thoại
- `PUT /api/messages/admin/:conv_id/reopen` - Mở lại

### Socket.IO events
- `join_conversation(conv_id)` - Join room conversation
- `typing({ room, user })` - Typing indicator
- `new_message` - Server push tin nhắn mới

## 🎫 Mã giảm giá demo

| Mã | Giảm | Điều kiện |
|----|------|-----------|
| `WELCOME10` | 10% | Đơn từ 1 triệu |
| `FREESHIP` | 30K | Đơn từ 500K |
| `VIP20` | 20% | Đơn từ 3 triệu |
| `SALE5TR` | 500K | Đơn từ 5 triệu |

## 📧 Cấu hình Email (Gmail SMTP)

### 1. Gmail App Password

Để gửi email thật, bạn cần tạo **App Password** từ Google:

1. Truy cập [myaccount.google.com](https://myaccount.google.com) → **Bảo mật**
2. Bật **Xác thực 2 bước** (bắt buộc)
3. Vào **App Passwords** → Tạo mới (chọn app: "Mail", device: "Other")
4. Copy mật khẩu 16 ký tự được tạo

### 2. Cập nhật file `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com        # Email Gmail của bạn
SMTP_PASS=xxxx xxxx xxxx xxxx         # App Password vừa tạo
SITE_NAME=Tên Cửa Hàng
SITE_URL=http://localhost:3000
```

### 3. Google OAuth (Đăng nhập bằng Google)

1. Truy cập [console.cloud.google.com](https://console.cloud.google.com/)
2. Tạo Project mới hoặc chọn Project hiện có
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Thêm Authorized redirect URI:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
6. Copy **Client ID** và **Client Secret** vào `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Tính năng Email

| Tính năng | Mô tả |
|-----------|--------|
| 📧 Xác nhận đơn hàng | Gửi email chi tiết khi đặt hàng thành công |
| 🔑 OTP đặt lại mật khẩu | Mã 6 số qua email, hết hạn sau 5 phút |
| 👋 Email chào mừng | Gửi tự động khi đăng ký Google |

## 📝 Ghi chú

**Đồ án demo**, một số lưu ý:
- Thanh toán VNPay/MoMo chỉ mô phỏng (không có thực)
- Rate limiting chưa đầy đủ
- Khuyến nghị bật HTTPS khi deploy thật
