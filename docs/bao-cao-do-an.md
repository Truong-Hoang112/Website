# BÁO CÁO ĐỒ ÁN
## WEBSITE THƯƠNG MẠI ĐIỆN TỬ ANHTRAISTORE
### Website bán điện thoại và phụ kiện công nghệ

---

## 1. TỔNG QUAN ĐỀ TÀI

### 1.1. Đặt vấn đề

Trong giai đoạn chuyển đổi số, thương mại điện tử (TMĐT) đã trở thành kênh phân phối chính cho ngành hàng công nghệ. Người dùng ngày càng ưa chuộng mua sắm trực tuyến nhờ sự tiện lợi, đa dạng sản phẩm và khả năng so sánh nhanh. Đối với cửa hàng nhỏ và cá nhân, việc xây dựng một website bán hàng hoàn chỉnh là thách thức lớn vì:

- **Chi phí**: Sử dụng các nền tảng SaaS như Shopify phát sinh phí định kỳ; thuê đội ngũ lập trình chuyên nghiệp tốn nhiều thời gian và ngân sách.
- **Đặc thù ngành hàng**: Thiết bị công nghệ có nhiều thông số kỹ thuật (RAM, ROM, chipset, màn hình...) cần mô hình hóa chặt chẽ.
- **Yêu cầu vận hành**: Cần tích hợp thanh toán, quản lý đơn hàng, khuyến mãi và chăm sóc khách hàng thời gian thực.

### 1.2. Mục tiêu

Xây dựng **AnhTraiStore** - website TMĐT hoàn chỉnh phục vụ bán điện thoại và phụ kiện công nghệ, đáp ứng các mục tiêu:

- Cung cấp trải nghiệm mua sắm trực tuyến cho **khách hàng** với đầy đủ chức năng: duyệt, tìm kiếm, so sánh, đặt hàng, theo dõi đơn, đánh giá sản phẩm.
- Cung cấp hệ thống **quản trị** cho admin: CRUD sản phẩm, danh mục, thương hiệu, đơn hàng, mã giảm giá, banner, chat với khách hàng.
- Tích hợp các tính năng hiện đại: **chat realtime** giữa khách và admin, **AI chatbot** tư vấn sản phẩm, **quản lý kho** chặt chẽ.

### 1.3. Phạm vi

- **Phía khách hàng**: Trang chủ, danh sách sản phẩm (bộ lọc đa tiêu chí), chi tiết sản phẩm, giỏ hàng, thanh toán, đơn hàng, so sánh, yêu thích, tài khoản, đăng nhập/đăng ký/Google OAuth, đặt lại mật khẩu bằng OTP, liên hệ, khuyến mãi, AI chatbot.
- **Phía quản trị viên (Admin)**: Dashboard thống kê, CRUD sản phẩm/danh mục/thương hiệu/banner/khuyến mãi/coupon, quản lý đơn hàng, duyệt đánh giá, quản lý liên hệ, chat với khách hàng.

### 1.4. Công nghệ sử dụng

| Thành phần | Công nghệ | Mục đích |
|-----------|-----------|---------|
| Backend runtime | Node.js (>= v20) | Chạy JavaScript phía server |
| Web framework | Express.js 4.x | Định tuyến REST và phục vụ view |
| Cơ sở dữ liệu | MySQL (XAMPP) | Lưu trữ dữ liệu quan hệ |
| Kết nối DB | `mysql2/promise` | Connection pool, async/await |
| Realtime | Socket.IO 4.x | Chat thời gian thực |
| Xác thực | express-session + Passport.js | Session, Google OAuth 2.0 |
| Mã hóa mật khẩu | bcryptjs | Hash mật khẩu |
| Upload ảnh | Multer + Cloudinary | Upload ảnh sản phẩm/banner |
| Email | Nodemailer + SMTP | Gửi email xác nhận, OTP |
| AI | Gemini API | Chatbot tư vấn sản phẩm |
| Frontend | HTML5 + CSS3 + Vanilla JS | Giao diện responsive |

### 1.5. Đặc điểm triển khai

- **Modular Monolith**: Backend tổ chức theo module (`src/routes/*`, `src/services/*`, `src/middleware/*`) nhưng triển khai trong một tiến trình Node.js, phù hợp với quy mô đồ án.
- **Entry point hosting-friendly**: `server.js` tự khởi động server (không phụ thuộc `require.main`) để tương thích với hosting Passenger.
- **Bảo mật cơ bản**: Security headers, CORS, rate limit, generic 500 response, session cookie an toàn.
- **Thanh toán mô phỏng**: MoMo/VNPay là luồng demo, không kết nối cổng thanh toán thật theo yêu cầu đồ án.

---

## 2. PHÂN TÍCH CHỨC NĂNG

### 2.1. Xác định tác nhân (Actor)

Hệ thống có **3 tác nhân** chính:

| Tác nhân | Mô tả | Quyền hạn |
|---------|--------|----------|
| **Khách vãng lai (Guest)** | Người dùng chưa đăng nhập | Xem sản phẩm, tìm kiếm, đăng ký, đăng nhập, đặt lại mật khẩu, gửi liên hệ |
| **Khách hàng (Customer)** | Người dùng đã đăng ký và đăng nhập với `role = customer` | Toàn quyền của Guest + giỏ hàng, đặt hàng, đánh giá, yêu thích, so sánh, chat, chatbot |
| **Quản trị viên (Admin)** | Tài khoản có `role = admin` | Toàn quyền quản lý sản phẩm, đơn hàng, người dùng, đánh giá, banner, coupon, chat với khách |

### 2.2. Biểu đồ Use Case tổng quan

**Use Case phía Khách hàng:**

```
┌────────────────────────────────────────────────────────────────────┐
│                          KHÁCH HÀNG                                │
├────────────────────────────────────────────────────────────────────┤
│ UC01: Đăng ký tài khoản                                            │
│ UC02: Đăng nhập / Đăng nhập bằng Google                            │
│ UC03: Đặt lại mật khẩu qua OTP email                               │
│ UC04: Xem danh sách sản phẩm & lọc theo danh mục, thương hiệu,    │
│       RAM, bộ nhớ, khoảng giá                                       │
│ UC05: Tìm kiếm sản phẩm theo tên                                   │
│ UC06: Xem chi tiết sản phẩm (ảnh, mô tả, thông số, đánh giá)        │
│ UC07: Thêm/xóa sản phẩm khỏi danh sách yêu thích                   │
│ UC08: So sánh tối đa 4 sản phẩm cùng lúc                           │
│ UC09: Thêm sản phẩm vào giỏ hàng                                   │
│ UC10: Cập nhật số lượng / xóa khỏi giỏ hàng                        │
│ UC11: Đặt hàng (COD/ VNPay-Mô phỏng/ MoMo-Mô phỏng)                │
│ UC12: Áp dụng mã giảm giá (Coupon)                                 │
│ UC13: Theo dõi trạng thái đơn hàng                                 │
│ UC14: Hủy đơn hàng (khi còn ở trạng thái pending)                  │
│ UC15: Đánh giá sản phẩm (sau khi đơn delivered)                    │
│ UC16: Chat realtime với Admin                                       │
│ UC17: Chat với AI Chatbot (tìm sản phẩm, tư vấn, kiểm tra đơn)     │
│ UC18: Cập nhật thông tin cá nhân, đổi mật khẩu                     │
│ UC19: Gửi liên hệ tới cửa hàng                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Use Case phía Quản trị viên:**

```
┌────────────────────────────────────────────────────────────────────┐
│                       QUẢN TRỊ VIÊN                                │
├────────────────────────────────────────────────────────────────────┤
│ UC20: Xem Dashboard thống kê (doanh thu, đơn hàng, top sản phẩm)   │
│ UC21: Quản lý sản phẩm (thêm/sửa/xóa, upload gallery tối đa 20)    │
│ UC22: Quản lý danh mục                                              │
│ UC23: Quản lý thương hiệu                                           │
│ UC24: Quản lý banner (hero/side/quick), upload Cloudinary          │
│ UC25: Quản lý khuyến mãi (banner_type = main/side)                  │
│ UC26: Quản lý Coupon (tạo, sửa, xóa mã giảm giá)                   │
│ UC27: Cập nhật trạng thái đơn hàng                                  │
│       (pending → confirmed → shipping → delivered)                 │
│       (pending → cancelled) - hủy đơn                               │
│ UC28: Quản lý người dùng                                            │
│ UC29: Duyệt / phản hồi / xóa đánh giá                              │
│ UC30: Xem và đánh dấu đã đọc liên hệ                                │
│ UC31: Chat realtime với khách hàng                                  │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3. Đặc tả Use Case chi tiết (một số Use Case tiêu biểu)

#### UC01 - Đăng ký tài khoản

| Mục | Nội dung |
|-----|---------|
| **Tác nhân** | Khách vãng lai |
| **Mô tả** | Khách tạo tài khoản mới để sử dụng các chức năng cá nhân hóa |
| **Tiền điều kiện** | Email chưa tồn tại trong hệ thống |
| **Luồng chính** | 1. Khách truy cập trang `/register` <br> 2. Nhập họ tên, email, mật khẩu, số điện thoại <br> 3. Hệ thống validate: <br> &nbsp;&nbsp;&nbsp;- Email đúng định dạng, không trùng <br> &nbsp;&nbsp;&nbsp;- Mật khẩu 6-128 ký tự <br> 4. Hash mật khẩu bằng bcrypt và lưu vào bảng `users` với `role = customer` <br> 5. Tự động tạo session và đăng nhập <br> 6. Trả về thông báo đăng ký thành công |
| **Luồng thay thế** | Email đã tồn tại → trả lỗi "Email này đã được đăng ký!" |
| **Hậu điều kiện** | Tài khoản mới được tạo, khách đã đăng nhập |

#### UC09 - Thêm sản phẩm vào giỏ hàng

| Mục | Nội dung |
|-----|---------|
| **Tác nhân** | Khách hàng |
| **Mô tả** | Khách thêm một sản phẩm vào giỏ hàng tạm |
| **Tiền điều kiện** | Khách đã đăng nhập |
| **Luồng chính** | 1. Từ trang chi tiết sản phẩm, khách nhấn "Thêm vào giỏ" <br> 2. Gọi `POST /api/cart` với `product_id`, `quantity` <br> 3. Hệ thống kiểm tra sản phẩm tồn tại, số lượng hợp lệ (nguyên dương) <br> 4. Upsert vào bảng `cart` với `user_id` <br> 5. Trả về số lượng sản phẩm trong giỏ |
| **Luồng thay thế** | Số lượng không hợp lệ / quá tồn kho → trả lỗi 400 |

#### UC11 - Đặt hàng

| Mục | Nội dung |
|-----|---------|
| **Tác nhân** | Khách hàng |
| **Mô tả** | Khách đặt mua sản phẩm từ giỏ hàng với một phương thức thanh toán |
| **Tiền điều kiện** | Giỏ hàng có ít nhất 1 sản phẩm, khách đã đăng nhập |
| **Luồng chính (COD)** | 1. Khách truy cập `/checkout`, điền thông tin giao hàng <br> 2. Chọn phương thức thanh toán (COD/VNPay/MoMo) <br> 3. Có thể nhập mã giảm giá → `POST /api/coupons/validate` <br> 4. Gọi `POST /api/orders` <br> 5. Backend validate: <br> &nbsp;&nbsp;&nbsp;- Thông tin giao hàng không chứa ký tự `<>` <br> &nbsp;&nbsp;&nbsp;- Số lượng từng sản phẩm còn trong tồn kho <br> &nbsp;&nbsp;&nbsp;- Coupon còn hiệu lực, đúng điều kiện (WELCOME10, VIP20...) <br> 6. Tính toán trên server: `subtotal + shipping_fee - discount` <br> 7. Mở transaction, INSERT `orders`, INSERT `order_items`, giảm `products.stock` <br> 8. Nếu dùng coupon: tăng `coupons.used_count`, INSERT `user_coupons` <br> 9. DELETE cart items đã đặt <br> 10. Gửi email xác nhận (không chặn response) <br> 11. Trả về `order_id`, `payment_code`, các con số đã tính |
| **Luồng thay thế (Online Payment)** | MoMo/VNPay: đơn tạo ở trạng thái `pending`, KHÔNG trừ kho, KHÔNG dùng coupon. <br> Khi khách nhấn "Xác nhận thanh toán" → gọi `POST /api/orders/:id/complete` <br> → trừ kho, dùng coupon, chuyển `status` → `confirmed`, set `paid_at = NOW()` |
| **Hậu điều kiện** | Đơn hàng được tạo, hàng được giữ (COD) hoặc đang chờ thanh toán (Online) |

#### UC27 - Cập nhật trạng thái đơn hàng

| Mục | Nội dung |
|-----|---------|
| **Tác nhân** | Admin |
| **Mô tả** | Admin chuyển trạng thái đơn hàng theo quy trình |
| **Quy tắc chuyển trạng thái** | `pending → confirmed` hoặc `cancelled` <br> `confirmed → shipping` hoặc `cancelled` <br> `shipping → delivered` hoặc `cancelled` <br> `delivered, cancelled`: trạng thái cuối (không chuyển tiếp) |
| **Luồng chính** | 1. Admin mở `/admin/orders`, chọn đơn cần xử lý <br> 2. Nhấn nút chuyển trạng thái → `PUT /admin/orders/:id/status` <br> 3. Hệ thống mở transaction, khóa dòng đơn (`SELECT ... FOR UPDATE`) <br> 4. Validate transition hợp lệ <br> 5. Logic phụ thuộc: <br> &nbsp;&nbsp;&nbsp;- **Online `pending → confirmed`**: trừ kho + dùng coupon + xóa cart items <br> &nbsp;&nbsp;&nbsp;- **`→ cancelled`** (mọi trường hợp đã giữ hàng): hoàn kho + hoàn coupon <br> 6. UPDATE `orders` với trạng thái mới, `paid_at`, `cancelled_at` <br> 7. COMMIT, trả về thành công |

#### UC16 - Chat realtime với Admin

| Mục | Nội dung |
|-----|---------|
| **Tác nhân** | Khách hàng, Admin |
| **Mô tả** | Hai bên trao đổi tin nhắn thời gian thực qua Socket.IO |
| **Luồng chính** | 1. Khách mở widget chat → client kết nối Socket.IO <br> 2. Client emit `join_conversation` kèm `conversation_id` <br> 3. Server thêm socket vào room theo `conversation_id` <br> 4. Khách gõ phím → emit `typing` <br> 5. Khách gửi tin nhắn → emit `new_message` <br> 6. Server INSERT vào bảng `messages` <br> 7. Server broadcast cho cả admin và khách trong cùng room <br> 8. Cập nhật `conversations.last_message_at` |
| **Sự kiện Socket.IO** | `join_conversation`, `typing`, `new_message`, `admin_status` |
| **Phân quyền** | Kiểm tra `conversation.user_id === session.user_id` (khách) hoặc `session.role === 'admin'` (admin) khi join room và gửi tin nhắn |

### 2.4. Sơ đồ hoạt động (Activity)

#### Hoạt động đặt hàng (COD)

```
[Khách hàng]              [Hệ thống]                  [DB]
    │                         │                         │
    │  Truy cập /checkout     │                         │
    ├────────────────────────►│                         │
    │                         │  Đọc cart, products     │
    │                         ├────────────────────────►│
    │                         │◄────────────────────────┤
    │  Hiển thị giỏ + form    │                         │
    │◄────────────────────────┤                         │
    │  Nhập thông tin +       │                         │
    │  chọn COD               │                         │
    ├────────────────────────►│                         │
    │                         │  Validate input         │
    │                         │  (SKU, tồn kho, coupon) │
    │                         ├────────────────────────►│
    │                         │  BEGIN TRANSACTION      │
    │                         ├────────────────────────►│
    │                         │  INSERT orders          │
    │                         ├────────────────────────►│
    │                         │  INSERT order_items     │
    │                         ├────────────────────────►│
    │                         │  UPDATE products (trừ kho)
    │                         ├────────────────────────►│
    │                         │  UPDATE coupons/INSERT  │
    │                         │  user_coupons           │
    │                         ├────────────────────────►│
    │                         │  DELETE cart items      │
    │                         ├────────────────────────►│
    │                         │  COMMIT                 │
    │                         ├────────────────────────►│
    │  Trả về order_id        │                         │
    │◄────────────────────────┤                         │
    │                         │  Gửi email xác nhận     │
    │                         ├────────────────────────►│
    │  Hiển thị đặt thành công │                         │
    │◄────────────────────────┤                         │
```

#### Hoạt động cập nhật trạng thái đơn hàng (Admin)

```
[Admin]                   [Hệ thống]                 [DB]
    │                         │                        │
    │  PUT /admin/orders/:id/status                     │
    ├────────────────────────►│                        │
    │                         │  SELECT ... FOR UPDATE │
    │                         ├───────────────────────►│
    │                         │◄───────────────────────┤
    │                         │  Validate transition   │
    │                         │  (pending→confirmed)   │
    │                         │                        │
    │                         │  Nếu online + pending→confirmed:
    │                         │  - Trừ kho sản phẩm    │
    │                         │  - Dùng coupon          │
    │                         │  - Xóa cart items       │
    │                         ├───────────────────────►│
    │                         │                        │
    │                         │  Nếu →cancelled:
    │                         │  - Hoàn kho (nếu đã giữ)│
    │                         │  - Hoàn coupon          │
    │                         ├───────────────────────►│
    │                         │                        │
    │                         │  UPDATE orders         │
    │                         │  SET status, paid_at,  │
    │                         │  cancelled_at          │
    │                         ├───────────────────────►│
    │                         │  COMMIT                │
    │                         ├───────────────────────►│
    │  Trả về success         │                        │
    │◄────────────────────────┤                        │
```

### 2.5. Sơ đồ luồng dữ liệu (DFD)

**DFD mức ngữ cảnh (Level 0):**

```
                              ┌─────────────────┐
       Đăng ký, đăng nhập     │                 │   Truy vấn/cập nhật
       Tìm sản phẩm, đặt    │                 │   users, products,
       hàng, đánh giá  ──────►│                 │   orders, carts, ...
                              │  ANHTRAISTORE   ├─────────────────────►
       Dashboard, CRUD, chat  │  Hệ thống       │
       đơn hàng, banner  ─────►│  TMĐT           │   Gửi email xác nhận,
                              │                 │   OTP, chatbot
                              │                 ├─────────────────────►
                              │                 │
                              └─────────────────┘
```

**DFD mức 1 (Level 1):**

```
                    ┌──────┐
        ┐ Duyệt SP  │      │
       ┌─────────────┤Khách │ Đặt hàng, chat
       │    Đăng nhập│      ├──────┐
       │             └──┬───┘      │
       │                │          ▼
       │              ┌─▼───────────────────┐
       │   CRUD       │   1.0 QUẢN LÝ      │
       └─────────────►│   TÀI KHOẢN         │
                      │   & PHÂN QUYỀN     │
       ┌──┐            └─┬───────────────────┘
       │  │              │ 2.0         ▼
       │Ad│ CRUD, thống kê│         ┌──────────────┐
       │mi├──────────────►│         │  3.0 QUẢN   │
       │n │              │         │  LÝ SẢN     │
       └──┘              │         │  PHẨM       │
                         │         └──────┬───────┘
                         │                │
                         │            ┌───▼────────┐
                         │            │  4.0 QUẢN │
                         │            │  LÝ GIỎ   │
                         │            │  HÀNG &   │
                         │            │  ĐẶT HÀNG │
                         │            └────┬──────┘
                         │                 │
                         │            ┌────▼────────┐
                         │            │  5.0 QUẢN  │
                         │            │  LÝ ĐƠN    │
                         │            │  HÀNG &    │
                         │            │  COUPON    │
                         │            └────┬───────┘
                         │                 │
                         │            ┌────▼────────┐
                         │            │  6.0 CHAT   │
                         │            │  REALTIME   │
                         │            │  + AI BOT   │
                         │            └─────┬──────┘
                         │                  │
                         │            ┌─────▼───────┐
                         └────────────┤  D1: MySQL  │
                                      │  18 bảng    │
                                      └─────────────┘
```

---

## 3. THIẾT KẾ HỆ THỐNG

### 3.1. Kiến trúc tổng thể

Hệ thống áp dụng **kiến trúc Client-Server 3 lớp** kết hợp **MVC** trong lớp server:

```
┌────────────────────────────────────────────────────────────────┐
│              TẦNG TRÌNH BÀY (PRESENTATION)                   │
│  HTML + CSS + Vanilla JS trong thư mục views/ + public/     │
│  - 17 trang khách hàng                                       │
│  - 10 trang quản trị                                         │
│  - Widget AI Chatbox, Product Card, Filter Sidebar           │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌────────────────────────────────────────────────────────────────┐
│              TẦNG NGHIỆP VỤ (BUSINESS LOGIC)                 │
│  Express Router → Middleware → Service → DB Pool            │
│  - src/routes/*: 10 router files theo nghiệp vụ              │
│  - src/middleware/*: auth, rate-limit, security, error      │
│  - src/services/*: cloud-storage, store-ai                   │
│  - src/realtime/chat-socket.js: Socket.IO handler             │
└────────────────────────┬───────────────────────────────────────┘
                         │ mysql2/promise
                         ▼
┌────────────────────────────────────────────────────────────────┐
│              TẦNG DỮ LIỆU (DATA)                            │
│  MySQL 5.7+ qua XAMPP                                        │
│  18 bảng theo schema database/dt.sql                         │
└────────────────────────────────────────────────────────────────┘

Tích hợp ngoài:
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Cloudinary  │  │  Gmail SMTP  │  │  Gemini API  │
  │  (Upload ảnh)│  │  (Email/OTP) │  │  (AI Chatbot)│
  └──────────────┘  └──────────────┘  └──────────────┘
```

**Đặc điểm kiến trúc:**

- **Modular Monolith**: Toàn bộ backend trong một Node.js process, tổ chức thành các module nghiệp vụ (`routes/admin.js`, `routes/products.js`...). Phù hợp đồ án, dễ triển khai.
- **Session-based Auth**: `express-session` lưu `user_id` và `role`; `requireAdmin` middleware kiểm tra vai trò admin cho mọi API quản trị.
- **DB Connection Pool**: Dùng `mysql2/promise` pool, lấy `connection` riêng cho mỗi transaction.
- **Folder routing linh hoạt**: `src/middleware`, `src/services`, `src/realtime`, `src/config`, `src/core`.
- **Tách Service & Routes**: Tích hợp ngoài (Cloudinary, AI) đặt trong `src/services/`, không để lẫn ở routes.

### 3.2. Cấu trúc thư mục dự án

```
Website/
├── server.js                     # Entry point (hosting-friendly)
├── package.json
├── .env.example
│
├── src/                          # Backend
│   ├── app.js                    # Express app factory
│   ├── config/
│   │   ├── database.js           # MySQL pool
│   │   ├── mail.js               # Nodemailer SMTP
│   │   ├── passport.js           # Google OAuth
│   │   └── runtime.js            # env, session options, CORS
│   ├── core/
│   │   ├── image-upload.js       # isAllowedImage helper
│   │   ├── paths.js              # projectRoot, publicDir, viewsDir
│   │   └── review-comment.js     # parse/serialize review comment
│   ├── middleware/
│   │   ├── auth.js               # requireAdmin
│   │   ├── error-handler.js      # notFound + errorHandler
│   │   ├── rate-limit.js         # apiRateLimit
│   │   └── security.js           # securityHeaders (helmet-like)
│   ├── realtime/
│   │   └── chat-socket.js        # Socket.IO handlers
│   ├── routes/
│   │   ├── admin.js              # /admin/* dashboard API
│   │   ├── ai-chat.js            # /api/chat/* AI chatbot
│   │   ├── api.js                # other public APIs
│   │   ├── auth.js               # /api/auth/*
│   │   ├── cart.js               # /api/cart/*
│   │   ├── coupons.js            # /api/coupons/*
│   │   ├── health.js             # /health
│   │   ├── index.js              # route aggregator
│   │   ├── messages.js           # /api/messages/*
│   │   ├── orders.js             # /api/orders/*
│   │   ├── pages.js              # /, /products, /cart, ...
│   │   ├── products.js           # /api/products/*
│   │   └── wishlist.js           # /api/wishlist/*
│   └── services/
│       ├── cloud-storage.js      # Multer-Cloudinary storage
│       └── store-ai.js           # Store AI client / tool calling
│
├── views/                        # HTML pages (Customer + Admin)
│   ├── index.html                # Trang chủ
│   ├── products.html, product-detail.html
│   ├── cart.html, checkout.html
│   ├── orders.html, order-detail.html
│   ├── compare.html, wishlist.html
│   ├── profile.html, login.html, register.html
│   ├── forgot-password.html, contact.html
│   ├── promotions.html, policy.html
│   ├── components/ai-chatbox.html
│   └── admin/                    # 10 trang dashboard
│
├── public/                       # Static assets
│   ├── css/   (style, admin, filter, chatbox)
│   ├── js/    (app, admin-ui, vietnam-address)
│   ├── images/ (no-image.svg, banners/)
│   └── assets/images/products/
│
├── database/
│   └── dt.sql                    # Schema + dữ liệu mẫu
│
├── docs/                         # Tài liệu
│   ├── architecture.md, security.md, project-memory.md
│   └── bao-cao-do-an.md          # Báo cáo này
│
├── tests/
│   └── product-regressions.test.js   # 20 test hồi quy
│
└── server.js                     # Entry point
```

### 3.3. Sơ đồ luồng request (Request Lifecycle)

```
HTTP Request
   │
   ▼
server.js (HTTP + Socket.IO server)
   │
   ▼
src/app.js → apply middlewares:
   - securityHeaders (CSP, X-Frame-Options, ...)
   - express-session + sessionMiddleware
   - passport.initialize() / passport.session()
   - CORS
   - express.json / urlencoded
   - static files (/images/products, /uploads/products, /images/banners)
   - apiRateLimit (for /api)
   │
   ▼
src/routes/index.js → match route
   │
   ├── /api/*           → src/routes/*.js (api routes)
   ├── /admin/*         → src/routes/admin.js (admin pages + APIs)
   ├── /, /products...  → src/routes/pages.js (render HTML)
   │
   ▼
[Optional] requireAdmin middleware
   - check req.session.user_id && req.session.role === 'admin'
   │
   ▼
Handler logic
   - Validate input (length, regex, types)
   - DB query via mysql2 pool (single or transaction)
   - External service (Cloudinary, Email, AI)
   │
   ▼
Response: JSON | redirect | sendFile
   │
   ▼
[If error] errorHandler middleware → 500 generic / 400 with status
```

### 3.4. Thiết kế Database (ERD)

Cơ sở dữ liệu gồm **18 bảng** được khởi tạo từ file `database/dt.sql`.

#### 3.4.1. Sơ đồ ERD

```
┌────────────────────┐         ┌──────────────────────┐
│  users             │         │  reset_tokens        │
├────────────────────┤         ├──────────────────────┤
│ id (PK)            │<────────│ user_id (FK)         │
│ full_name          │         │ token                │
│ email UNIQUE       │         │ expires_at           │
│ password           │         └──────────────────────┘
│ phone              │
│ address            │         ┌──────────────────────┐
│ role (enum)        │         │  reviews             │
│ avatar             │         ├──────────────────────┤
│ google_id UNIQUE   │         │ id (PK)              │
└─────┬──────────────┘         │ product_id (FK)      │
      │                        │ user_id (FK)         │
      │                        │ rating (1-5)         │
      │                        │ comment (TEXT)       │
      │                        └──────────┬───────────┘
      │                                   │
      │    ┌──────────────────┐            │
      ├───►│   orders         │            │
      │    ├──────────────────┤   ┌────────▼─────────┐
      │    │ id (PK)          │   │   products       │
      │    │ user_id (FK)     │   ├──────────────────┤
      │    │ payment_code     │   │ id (PK)          │
      │    │ total_price      │   │ name             │
      │    │ shipping_*       │<──│ category_id (FK) │
      │    │ payment_method   │   │ brand_id (FK)    │
      │    │ status (enum)    │   │ price, old_price │
      │    │ discount_amount  │   │ discount_percent │
      │    │ coupon_code      │   │ stock, thumbnail │
      │    └────┬─────────────┘   │ is_featured      │
      │         │                  │ ram, storage     │
      │         │                  └────┬─────────────┘
      │    ┌────▼──────────┐          │
      │    │ order_items   │          │
      │    ├───────────────┤          │
      │    │ id (PK)       │          │
      │    │ order_id (FK) │          │
      │    │ product_id(FK)│──────────┘
      │    │ quantity,price│
      │    └───────────────┘
      │
      │   ┌────────────────────┐         ┌────────────────────┐
      ├──►│   cart             │         │  wishlists         │
      │   ├────────────────────┤         ├────────────────────┤
      │   │ id (PK)            │         │ id (PK)            │
      │   │ user_id (FK)       │         │ user_id (FK)       │
      │   │ product_id (FK)────┼────────►│ product_id (FK)────┼──► products
      │   │ quantity           │         │ UNIQUE(user,prod)  │
      │   └────────────────────┘         └────────────────────┘
      │
      │   ┌────────────────────┐
      ├──►│   user_coupons     │
      │   ├────────────────────┤        ┌────────────────────┐
      │   │ id (PK)            │        │   coupons          │
      │   │ user_id (FK)       │        ├────────────────────┤
      │   │ coupon_id (FK)─────┼───────►│ id (PK)            │
      │   │ order_id (FK)──────┼──┐     │ code UNIQUE        │
      │   │ discount_amount    │  │     │ discount_type      │
      │   └────────────────────┘  │     │ discount_value     │
      │                            │     │ min_order_value    │
      │                            │     │ usage_limit        │
      │                            │     │ expires_at         │
      │                            │     └────────────────────┘
      │                            │
      │                            │
      │                            ▼
      │                       ┌─────────────────┐
      │                       │   orders        │
      │                       └─────────────────┘
      │
      │   ┌────────────────────┐         ┌──────────────────┐
      ├──►│ conversations      │         │  contacts        │
      │   ├────────────────────┤         ├──────────────────┤
      │   │ id (PK)            │◄────────│ id (PK)          │
      │   │ user_id (FK)       │         │ full_name        │
      │   │ contact_id (FK)    │         │ email, phone     │
      │   │ status (open/clsd) │         │ subject          │
      │   └────────┬───────────┘         │ message TEXT     │
      │            │                     │ is_read          │
      │            │                     └──────────────────┘
      │   ┌────────▼───────────┐
      └──►│   messages         │
          ├────────────────────┤         ┌────────────────────┐
          │ id (PK)            │         │  product_images    │
          │ conversation_id(FK)│         ├────────────────────┤
          │ sender_type        │         │ id (PK)            │
          │ (user/admin/system)│         │ product_id (FK)───►│ products
          │ sender_id          │         │ image_url          │
          │ content TEXT       │         │ is_primary         │
          │ is_read            │         │ sort_order         │
          └────────────────────┘         └────────────────────┘

  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │   banners          │  │   promotions       │  │   categories       │
  ├────────────────────┤  ├────────────────────┤  ├────────────────────┤
  │ id (PK)            │  │ id (PK)            │  │ id (PK)            │
  │ position (hero/    │  │ title, description │  │ name UNIQUE        │
  │   side/quick)      │  │ image              │  │ slug UNIQUE        │
  │ title, subtitle    │  │ start/end_date     │  │ is_active          │
  │ link, image_url    │  │ is_active          │  └────────┬───────────┘
  │ is_active, sort    │  │ link_url           │           │
  └────────────────────┘  │ banner_type        │  ┌────────▼───────────┐
                          └────────────────────┘  │   brands          │
                                                 ├────────────────────┤
                                                 │ id (PK)            │
                                                 │ name, slug UNIQUE  │
                                                 │ logo, is_active    │
                                                 └────────────────────┘
```

#### 3.4.2. Mô tả chi tiết các bảng

| STT | Bảng | Mục đích | Khóa chính | Khóa ngoại quan trọng |
|-----|-------|----------|-----------|---------------------|
| 1 | `users` | Lưu cả khách hàng và admin, phân biệt qua `role` | `id` | - |
| 2 | `reset_tokens` | Token đặt lại mật khẩu (lưu dù hiện tại OTP đang ở memory) | `id` | `user_id → users.id` (ON DELETE CASCADE) |
| 3 | `categories` | Danh mục sản phẩm (điện thoại, tai nghe, sạc...) | `id` | - |
| 4 | `brands` | Thương hiệu (Apple, Samsung, Xiaomi, Casio...) | `id` | - |
| 5 | `products` | Sản phẩm, có thông số kỹ thuật (RAM, storage, chipset...) | `id` | `category_id`, `brand_id` |
| 6 | `product_images` | Gallery nhiều ảnh/sản phẩm, có `is_primary`, `sort_order` | `id` | `product_id → products.id` (CASCADE) |
| 7 | `orders` | Đơn hàng với 5 trạng thái: pending/confirmed/shipping/delivered/cancelled | `id` | `user_id → users.id` |
| 8 | `order_items` | Chi tiết từng sản phẩm trong đơn (snapshot giá lúc đặt) | `id` | `order_id` (CASCADE), `product_id` |
| 9 | `cart` | Giỏ hàng tạm của khách | `id` | `user_id` (CASCADE), `product_id` (CASCADE) |
| 10 | `reviews` | Đánh giá 1-5 sao + bình luận | `id` | `product_id` (CASCADE), `user_id` |
| 11 | `wishlists` | Sản phẩm yêu thích, có UNIQUE `(user_id, product_id)` | `id` | `user_id` (CASCADE), `product_id` (CASCADE) |
| 12 | `coupons` | Mã giảm giá với `discount_type` (% hoặc fixed), điều kiện min_order | `id` | - |
| 13 | `user_coupons` | Lịch sử mỗi khách dùng 1 coupon 1 lần | `id` | `user_id` (CASCADE), `coupon_id` (CASCADE), `order_id` |
| 14 | `contacts` | Form liên hệ từ khách (chưa đăng ký) | `id` | - |
| 15 | `conversations` | Hội thoại chat - liên kết `contact_id` hoặc `user_id` | `id` | `contact_id` (SET NULL), `user_id` (SET NULL) |
| 16 | `messages` | Tin nhắn chat, `sender_type ∈ {user, admin, system}` | `id` | `conversation_id` (CASCADE) |
| 17 | `promotions` | Khuyến mãi có `start_date`, `end_date`, `banner_type` | `id` | - |
| 18 | `banners` | Banner trang chủ, phân biệt `position ∈ {hero, side, quick}` | `id` | - |

#### 3.4.3. Quy ước & ràng buộc đặc biệt

- **Tiền tệ**: `DECIMAL(15,0)` cho giá/tổng tiền (đơn vị VND, không lẻ).
- **Trạng thái đơn hàng**: `ENUM('pending','confirmed','shipping','delivered','cancelled')`.
- **Coupon**: `discount_type` ∈ {percent, fixed}; `used_count` tự tăng/giảm theo `user_coupons`.
- **Quy tắc khóa ngoại**: hầu hết dùng `ON DELETE CASCADE` cho dữ liệu phụ thuộc (cart, wishlist, order_items) và `ON DELETE SET NULL` cho dữ liệu có thể tồn tại độc lập (conversations liên kết contact).
- **Slug**: Sản phẩm dùng `slug` UNIQUE thân thiện với URL, được sinh tự động từ tên có dấu.
- **Lưu trữ ảnh**: Hỗ trợ cả URL Cloudinary (`https://res.cloudinary.com/...`) lẫn file local (`/uploads/...`). Upload tối đa 5MB/ảnh, 20 ảnh gallery.

### 3.5. Thiết kế API (RESTful + Action endpoints)

API tuân theo phong cách RESTful cho resource chính và thêm các action endpoint cho nghiệp vụ phức tạp.

**Quy ước:**
- Tất cả API đặt dưới prefix `/api/` (trừ admin page routes).
- Định danh resource dạng số: `/api/products/:id`.
- Action phức tạp dùng URL con: `/api/orders/:id/cancel`, `/api/orders/:id/complete`.
- Lỗi trả về `{ "error": "Thông báo..." }` với mã 4xx/5xx.
- Thành công trả về `{ "success": true, ... }` hoặc payload dữ liệu.

**Bảng API chính:**

| Method | Endpoint | Mô tả | Quyền |
|--------|---------|--------|-------|
| `POST` | `/api/auth/register` | Đăng ký | Guest |
| `POST` | `/api/auth/login` | Đăng nhập | Guest |
| `POST` | `/api/auth/logout` | Đăng xuất | Customer |
| `POST` | `/api/auth/forgot-password` | Gửi OTP đặt lại MK | Guest |
| `POST` | `/api/auth/reset-password` | Đặt lại MK bằng OTP | Guest |
| `GET` | `/api/products` | Danh sách có filter | Guest |
| `GET` | `/api/products/:id` | Chi tiết + gallery + reviews + variants + related | Guest |
| `GET` | `/api/products/home/featured` | Dữ liệu trang chủ | Guest |
| `POST` | `/api/products/compare` | So sánh tối đa 4 SP | Guest |
| `GET` | `/api/cart` | Lấy giỏ | Customer |
| `POST` | `/api/cart` | Thêm vào giỏ | Customer |
| `PUT` | `/api/cart/:id` | Cập nhật số lượng | Customer |
| `DELETE` | `/api/cart/:id` | Xóa khỏi giỏ | Customer |
| `POST` | `/api/orders` | Đặt hàng (COD) | Customer |
| `POST` | `/api/orders/initiate` | Tạo đơn online (chờ) | Customer |
| `POST` | `/api/orders/:id/complete` | Xác nhận thanh toán mô phỏng | Customer |
| `GET` | `/api/orders` | Đơn của user | Customer |
| `GET` | `/api/orders/:id` | Chi tiết đơn | Customer |
| `PUT` | `/api/orders/:id/cancel` | Hủy đơn (chỉ pending) | Customer |
| `POST` | `/api/coupons/validate` | Kiểm tra mã trước khi đặt | Customer |
| `GET` | `/api/wishlist` | Danh sách yêu thích | Customer |
| `POST` | `/api/wishlist` | Thêm/xóa (toggle) | Customer |
| `POST` | `/api/reviews` | Tạo đánh giá (chỉ delivered) | Customer |
| `GET` | `/api/messages/conversations` | Danh sách hội thoại | Customer |
| `GET` | `/api/messages/conversations/:id` | Lịch sử tin nhắn | Customer |
| `POST` | `/api/messages/conversations` | Tạo hội thoại | Customer |
| `POST` | `/api/messages/conversations/:id/messages` | Gửi tin nhắn (HTTP fallback) | Customer |
| `POST` | `/api/chat` | Gửi câu hỏi cho AI chatbot | Customer |
| `GET` | `/health` | Health check | Public |
| `POST` | `/admin/products` | Tạo SP + gallery | Admin |
| `PUT` | `/admin/products/:id` | Cập nhật SP | Admin |
| `DELETE` | `/admin/products/:id` | Xóa SP (trừ khi đã có đơn) | Admin |
| `GET` | `/admin/stats` | Thống kê dashboard | Admin |
| `GET` | `/admin/notifications` | Tổng hợp cảnh báo | Admin |
| `GET` | `/admin/chart-data` | Biểu đồ doanh thu/đơn/SP | Admin |
| `GET` | `/admin/orders/list` | Danh sách đơn (lọc theo status) | Admin |
| `PUT` | `/admin/orders/:id/status` | Chuyển trạng thái | Admin |
| `GET/POST/PUT/DELETE` | `/admin/api/coupons[/:id]` | CRUD coupon | Admin |
| `GET/POST/PUT/DELETE` | `/admin/banners[/:id]` | CRUD banner (3 vị trí) | Admin |
| `POST` | `/admin/banners/upload` | Upload 1 ảnh banner | Admin |
| `POST` | `/admin/banners/upload-many` | Upload nhiều ảnh (≤10) | Admin |
| `PUT` | `/admin/banners/hero-set` | Thay nguyên bộ hero | Admin |

### 3.6. Thiết kế bảo mật

| Cơ chế | Vị trí | Mục đích |
|--------|--------|---------|
| Security headers | `src/middleware/security.js` | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| CORS | `src/app.js` | Whitelist origin, bật `credentials` cho session cookie |
| Rate limit | `src/middleware/rate-limit.js` | Áp dụng cho mọi `/api` |
| Generic 500 | `src/middleware/error-handler.js` | Không trả stack trace, chỉ thông báo chung |
| Session cookie | `express-session` | `httpOnly`, `sameSite`, `secure` ở production |
| Phân quyền | `requireAdmin` middleware | Kiểm tra `req.session.role === 'admin'` |
| Validate ownership | các handler | `WHERE user_id = ?` cho cart, order, wishlist, messages |
| Validate input | các handler | Loại bỏ ký tự `<>`, giới hạn độ dài, kiểm tra số/SQL param |
| Bcrypt password | `bcryptjs` | Hash với cost 10 |
| CSRF | State OAuth + sameSite session | Google OAuth dùng `state`, session có sameSite |
| Upload filter | `isAllowedImage` + size limit | Chỉ chấp nhận MIME ảnh, tối đa 5MB/ảnh, 20 ảnh |

### 3.7. Thiết kế Socket.IO (Chat realtime)

- **Endpoint**: Mặc định `/socket.io` cùng HTTP server.
- **Handshake**: Đi kèm session cookie để xác thực.
- **Rooms**: Mỗi `conversation_id` là một room, chỉ user là thành viên hoặc admin mới được join.
- **Events**:
  - `join_conversation(conversationId)` - Server verify quyền → socket.join(room).
  - `typing(conversationId)` - Forward cho user còn lại.
  - `new_message({conversationId, content})` - INSERT → broadcast.
  - `admin_status(isOnline)` - Cập nhật trạng thái admin cho widget khách.
- **Ngắt kết nối**: Cleanup room mapping; session lưu trong memory của tiến trình (chấp nhận với quy mô đồ án).

### 3.8. Thiết kế AI Chatbot

- **Mô hình**: Gemini API (`gemini-3.6-flash`).
- **Tool calling**: `src/services/store-ai.js` định nghĩa các tool mà AI có thể gọi:
  - `search_products({ keyword, category, brand, price_range })` - truy vấn MySQL.
  - `get_product_detail(product_id)` - lấy thông tin chi tiết.
  - `check_stock(product_id)` - kiểm tra tồn kho.
  - `get_order_status({ order_id, email })` - tra cứu đơn hàng (yêu cầu xác minh email).
- **System prompt**: Định hướng AI chỉ tư vấn sản phẩm có trong database; không bịa thông số; giới hạn trả lời trong phạm vi AnhTraiStore.
- **Timeout**: 25s mỗi request (`GEMINI_API_TIMEOUT_MS`).
- **Hiển thị**: Widget nổi (`views/components/ai-chatbox.html`), có lịch sử 50 tin nhắn gần nhất.

### 3.9. Thiết kế giao diện (UI/UX)

**Nguyên tắc thiết kế:**

- **Responsive Mobile-first**: Breakpoints phổ biến `640px` (mobile), `900px` (tablet), `1250px` (desktop).
- **Thẩm mỹ**: Tone màu chủ đạo theo logo AnhTraiStore (xanh indigo/xanh dương công nghệ), phối neutral.
- **Thành phần dùng lại**:
  - **Header**: Logo + Menu + Search + Cart + User + Chatbot icon.
  - **Filter sidebar**: Danh mục, thương hiệu (checkbox), RAM, storage, khoảng giá (range).
  - **Product card**: Ảnh thumbnail, tên, giá (có gạch ngang old_price), % giảm, nút "thêm giỏ".
  - **Modal**: Confirm hủy đơn, áp dụng coupon, xác nhận OTP.
  - **Toast**: Thông báo thành công/thất bại 3 giây.

**Sơ đồ trang chủ (Customer):**

```
┌────────────────────────────────────────────────────────────────┐
│  Header: Logo | Menu | Search | Cart | User | Chatbot icon   │
├────────────────────────────────────────────────────────────────┤
│  Hero Banner Slider (carousel 2s)        │  Side Banner 1     │
│  - tối đa 10 ảnh position="hero"         │  (position="side") │
│                                          ├─────────────────────│
│  Banner Quick (position="quick")         │  Side Banner 2     │
├────────────────────────────────────────────────────────────────┤
│  Danh mục nổi bật (categories active)                         │
├────────────────────────────────────────────────────────────────┤
│  Sản phẩm nổi bật (is_featured = 1)                          │
├────────────────────────────────────────────────────────────────┤
│  Sản phẩm mới                                                 │
├────────────────────────────────────────────────────────────────┤
│  Sản phẩm khuyến mãi (discount_percent > 0)                  │
├────────────────────────────────────────────────────────────────┤
│  Footer: Thông tin liên hệ | Chính sách | Mạng xã hội        │
└────────────────────────────────────────────────────────────────┘

Nổi cố định góc phải: Chatbot AI widget
```

**Sơ đồ trang chi tiết sản phẩm:**

```
┌────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Trang chủ / iPhone / iPhone 15 Pro Max           │
├─────────────────────────────────────┬──────────────────────────┤
│  Gallery ảnh (4 ảnh từ product_images) │  Tên sản phẩm           │
│  - Ảnh chính (is_primary)            │  ⭐ 4.8 (125 đánh giá)   │
│  - Thumbnails bên dưới              │  Giá: 28.990.000đ         │
│                                     │  Giá cũ: 32.990.000đ      │
│                                     │  Discount tag -12%        │
│                                     │  RAM: 8GB                 │
│                                     │  Storage: 256GB           │
│                                     │  ┌──────┐  ┌──────────┐  │
│                                     │  │ Mua  │  │ Thêm giỏ │  │
│                                     │  └──────┘  └──────────┘  │
│                                     │  [+ Wishlist] [+ So sánh] │
├─────────────────────────────────────┴──────────────────────────┤
│  Tabs: Mô tả | Thông số kỹ thuật | Đánh giá (5★,4★,3★,2★,1★)  │
├────────────────────────────────────────────────────────────────┤
│  Sản phẩm liên quan (cùng category)                           │
└────────────────────────────────────────────────────────────────┘
```

**Sơ đồ Dashboard Admin:**

```
┌──────────────────────────────────────────────────────────────┐
│  Logo | Toggle sidebar                                       │
├────────────┬─────────────────────────────────────────────────┤
│ Sidebar    │  Header: Search | Notification | User           │
│ - Tổng quan├─────────────────────────────────────────────────┤
│ - Sản phẩm │  ┌───────┐┌───────┐┌───────┐┌───────┐         │
│ - Danh mục │  │ Đơn   ││ SP    ││ Khách  ││ Doanh │         │
│ - Thương   │  │ hàng  ││       ││        ││ thu   │         │
│   hiệu     │  └───────┘└───────┘└───────┘└───────┘         │
│ - Đơn hàng │  ┌──────────────────────────────────────────┐  │
│ - Khách    │  │  Biểu đồ doanh thu 12 tháng              │  │
│ - Đánh giá │  │                                          │  │
│ - Liên hệ  │  └──────────────────────────────────────────┘  │
│ - Banner   │  ┌──────────────────┐┌──────────────────┐       │
│ - Khuyến   │  │ Top 5 SP bán chạy││ Trạng thái đơn   │       │
│   mãi      │  └──────────────────┘└──────────────────┘       │
│ - Mã giảm  │  ┌──────────────────────────────────────────┐  │
│   giá      │  │  Cảnh báo: đơn pending / tồn kho thấp  │  │
│            │  └──────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────┘
```

---

## 4. KIỂM THỬ VÀ CÀI ĐẶT

### 4.1. Yêu cầu môi trường

**Phía Server:**
- Node.js >= v20 (đã nêu trong `package.json#engines`).
- MySQL >= 5.7 (khuyến nghị 8.0) chạy trên XAMPP.
- RAM tối thiểu 1GB.

**Phía Client:**
- Trình duyệt: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.
- JavaScript bật, cookie bật.

**Dịch vụ ngoài (tùy chọn nhưng khuyến nghị):**
- Tài khoản Cloudinary (lưu ảnh).
- Tài khoản Gmail + App Password (gửi email).
- API key Google OAuth (đăng nhập nhanh).
- API key Gemini (AI chatbot).

### 4.2. Cài đặt

**Bước 1: Chuẩn bị database (XAMPP)**
1. Mở XAMPP Control Panel → Start MySQL.
2. Truy cập `http://localhost/phpmyadmin`.
3. Tạo database `anhtraisstore` với collation `utf8mb4_unicode_ci`.
4. Import file `database/dt.sql` (18 bảng + dữ liệu mẫu).

**Bước 2: Cài dependencies**
```bash
cd e:\Website
npm install
```

**Bước 3: Cấu hình biến môi trường**
- Sao chép `.env.example` thành `.env`.
- Điền các giá trị thực tế (DB host, SMTP, Cloudinary, OAuth, Gemini).

**Bước 4: Khởi động**
```bash
npm start        # production
npm run dev      # có nodemon
```

**Bước 5: Truy cập**
- Cửa hàng: `http://localhost:3000`.
- Trang admin: `http://localhost:3000/admin` (đăng nhập bằng tài khoản admin demo trước khi triển khai thật).
- Health check: `http://localhost:3000/health`.

### 4.3. Kiểm thử hồi quy

Dự án có `tests/product-regressions.test.js` chứa **20 test cases** cho các luồng quan trọng:

| Nhóm | Số test | Mô tả |
|------|---------|--------|
| Product API | 5 | Filter đa tiêu chí, phân trang, sắp xếp, so sánh |
| Product CRUD (admin) | 4 | Validate input, upload ảnh, slug tự sinh |
| Cart API | 3 | Thêm/sửa/xóa, kiểm tra ownership |
| Coupon | 4 | Validate điều kiện, percent/fixed, WELCOME10/VIP20 |
| Order | 4 | Workflow trạng thái, khôi phục kho, hủy COD vs online |
| Auth & Security | 3 | OTP, rate limit, validate input |

Chạy kiểm tra:
```bash
npm test
# hoặc tổng hợp:
npm run check    # node --check + test
```

### 4.4. Các trường hợp kiểm thử chức năng chính

| STT | Test case | Input | Kết quả mong đợi |
|-----|----------|-------|-----------------|
| 1 | Đăng ký email trùng | email đã tồn tại | 400 "Email này đã được đăng ký!" |
| 2 | Đăng ký mật khẩu quá ngắn | password = "abc" | 400 "Mật khẩu phải có từ 6 đến 128 ký tự!" |
| 3 | Lọc sản phẩm theo brand + price | brand=apple&price_max=20000000 | Chỉ iPhone ≤ 20 triệu |
| 4 | Thêm vào giỏ vượt tồn kho | quantity > stock | 400 "Sản phẩm ... không đủ hàng!" |
| 5 | Đặt hàng COD thành công | Đủ điều kiện | 200 + order_id + status pending |
| 6 | Áp dụng WELCOME10 cho đơn thứ 2 | Đơn > 1 triệu nhưng đã có đơn trước | 400 "Mã này chỉ áp dụng cho đơn hàng đầu tiên!" |
| 7 | VIP20 cho khách mới | Tổng đơn delivered < 30 triệu | 403 "VIP20 dành cho khách đã có tổng đơn giao thành công từ 30 triệu!" |
| 8 | Đơn online: confirmed → trừ kho | Xác nhận đơn MoMo | stock giảm, used_count tăng |
| 9 | Hủy đơn COD pending | Còn pending | Hoàn kho, hoàn coupon nếu có |
| 10 | Admin chuyển delivered → cancelled | Đơn đã giao | 400 "Không thể chuyển đơn từ delivered sang cancelled!" |
| 11 | Đánh giá khi đơn chưa giao | status = confirmed | 400 "Chỉ đơn delivered mới được đánh giá" |
| 12 | Upload ảnh > 5MB | file 6MB | 400 "Mỗi ảnh sản phẩm không được vượt quá 5MB!" |
| 13 | Đăng nhập sai mật khẩu 6 lần/phút | 6 request liên tiếp | 429 rate limit |
| 14 | Trang admin không có quyền | role = customer | 403 "Chỉ quản trị viên mới truy cập được" |
| 15 | So sánh 5 sản phẩm | id[] length = 5 | 400 "Chỉ có thể so sánh tối đa 4 sản phẩm!" |

### 4.5. Triển khai

**Checklist trước khi đưa lên hosting thật:**
- [ ] Đổi mật khẩu admin demo.
- [ ] Cập nhật `SESSION_SECRET` thành chuỗi ngẫu nhiên ≥ 32 ký tự.
- [ ] Cấu hình `NODE_ENV=production` để bật `trust proxy`, secure cookie.
- [ ] Cấu hình `CORS_ORIGINS` với domain thật.
- [ ] Bật HTTPS, set HSTS.
- [ ] Chạy `npm audit` và cập nhật dependency có lỗ hổng.
- [ ] Sao lưu DB trước khi nâng cấp.
- [ ] Cân nhắc chuyển session/OTP/rate-limit sang Redis nếu chạy nhiều instance.

---

## 5. KẾT QUẢ, KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết quả đạt được

**Về sản phẩm:**
- Hoàn thành 100% chức năng cốt lõi: đăng ký/đăng nhập, duyệt sản phẩm, giỏ hàng, đặt hàng, đánh giá.
- Đầy đủ CRUD cho admin: sản phẩm, danh mục, thương hiệu, banner, khuyến mãi, coupon.
- Tính năng nâng cao: chat realtime Socket.IO, AI chatbot với tool calling, so sánh sản phẩm, wishlist, OTP đặt lại mật khẩu, Google OAuth.
- Giao diện responsive, hỗ trợ đa thiết bị.

**Về kỹ thuật:**
- 18 bảng database đã thiết kế chuẩc hóa, có quan hệ rõ ràng.
- 10 router module trong `src/routes/` theo nghiệp vụ.
- Sử dụng transaction cho các thao tác quan trọng (đặt hàng, cập nhật trạng thái, CRUD sản phẩm).
- 20 test hồi quy tự động qua `npm test`.
- Bảo mật cơ bản: security headers, rate limit, validate input, phân quyền admin, ownership check.

**Các chỉ số:**
| Chỉ số | Giá trị |
|--------|---------|
| Số bảng database | 18 |
| Số router backend | 11 file |
| Số endpoint API chính | 40+ |
| Số trang HTML | 17 trang khách + 10 trang admin |
| Số test hồi quy | 20 |

### 5.2. Kết luận

Đề tài **AnhTraiStore** đã đáp ứng được mục tiêu đề ra: xây dựng một website thương mại điện tử hoàn chỉnh với đầy đủ chức năng từ phía khách hàng và quản trị viên. Hệ thống được thiết kế theo kiến trúc modular monolith phù hợp với quy mô đồ án, có khả năng mở rộng theo lộ trình đã thống nhất.

**Bài học kinh nghiệm:**
- Thiết kế database trước giúp code ít bug và dễ bảo trì.
- Tách service (Cloudinary, AI) khỏi routes giúp test và thay thế dễ dàng.
- Sử dụng transaction cho mọi thao tác đa bảng giúp tránh lệch dữ liệu.
- Validate input kỹ ở server, không tin tưởng client.
- Test hồi quy giúp phát hiện lỗi sớm khi refactor.

**Hạn chế còn tồn tại:**
- Session, OTP, rate-limit và trạng thái Socket.IO lưu trong bộ nhớ tiến trình → không scale nhiều instance.
- Upload ảnh vẫn fallback xuống filesystem local khi Cloudinary chưa cấu hình.
- Thanh toán MoMo/VNPay là mô phỏng, chưa kết nối cổng thật.
- Một số file HTML admin còn chứa nhiều CSS/JS inline, cần tách dần.

### 5.3. Hướng phát triển

Theo lộ trình đã thống nhất trong `docs/project-memory.md`, các bước tiếp theo được sắp xếp theo thứ tự ưu tiên:

**Ngắn hạn:**
- Migration: bổ sung bảng `product_variants` (code hiện đã truy vấn), chuẩn hóa index, xử lý lệch schema.
- Chuẩn hóa validation với thư viện (zod/joi), thống nhất response API chuẩn `{success, data, error}`.

**Trung hạn:**
- Chuyển session/OTP/rate-limit sang Redis khi cần chạy nhiều instance.
- Thêm `/api/v1`, tài liệu OpenAPI/Swagger.
- Tích hợp test MySQL integration test, E2E test, lint/type-check và CI.

**Dài hạn:**
- Tách service/repository, tách module frontend theo nhu cầu.
- Queue email (Bull/Agenda), object storage cho ảnh, observability (Prometheus + Grafana).
- Tích hợp payment webhook, inventory ledger khi chuyển sang thương mại thật.

---

## PHỤ LỤC A: TÀI LIỆU THAM KHẢO

1. Express.js Documentation - https://expressjs.com/
2. MySQL 8.0 Reference Manual - https://dev.mysql.com/doc/refman/8.0/en/
3. Socket.IO Documentation - https://socket.io/docs/
4. Passport.js (Google OAuth 2.0) - https://www.passportjs.org/
5. Multer - https://github.com/expressjs/multer
6. Cloudinary Node.js SDK - https://cloudinary.com/documentation/node_integration
7. OWASP Top 10 Security Risks - https://owasp.org/Top10/
8. MDN Web Docs (HTTP, CORS, CSP) - https://developer.mozilla.org/

## PHỤ LỤC B: CÁC LỆNH NPM HỮU ÍCH

```bash
# Cài dependencies
npm install

# Chạy development (có nodemon auto-reload)
npm run dev

# Chạy production
npm start

# Chạy toàn bộ test hồi quy
npm test

# Kiểm tra cú pháp + test
npm run check

# Kiểm tra dependency có lỗ hổng
npm audit
```

---

**Tác giả**: Sinh viên thực hiện đồ án  
**Phiên bản tài liệu**: 1.0  
**Cập nhật lần cuối**: 15/09/2026
