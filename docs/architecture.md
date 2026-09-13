# Kiến trúc dự án

Ứng dụng dùng kiến trúc module theo miền nghiệp vụ trên Express. File `server.js` ở thư mục gốc chỉ nạp biến môi trường và gọi trình khởi động để tương thích với hosting Node.js phổ biến.

## Luồng khởi động

1. `server.js` nạp `.env`.
2. `src/server.js` tạo HTTP server và Socket.IO.
3. `src/app.js` cấu hình Express, session, Passport, static files và routes.
4. `src/routes/index.js` đăng ký các API theo miền nghiệp vụ.
5. `src/realtime/chat-socket.js` quản lý kết nối chat thời gian thực.

Ứng dụng không tự thay đổi schema khi khởi động. Database được quản lý bằng `database/dt.sql`, giúp việc triển khai có thể kiểm soát và sao lưu trước khi thay đổi schema.

## Quy ước thư mục

- `src/config`: kết nối dịch vụ và cấu hình runtime.
- `src/core`: hằng số và đường dẫn dùng chung.
- `src/middleware`: middleware xác thực và xử lý lỗi.
- `src/routes`: route HTTP chia theo miền nghiệp vụ.
- `src/realtime`: xử lý Socket.IO.
- `views`: trang HTML phía khách hàng và quản trị.
- `public`: CSS, JavaScript trình duyệt, ảnh và file upload.
- `database`: schema và dữ liệu mẫu.
- `tests`: kiểm tra hồi quy nghiệp vụ.

## Nguyên tắc triển khai

- Thiết lập `NODE_ENV=production` và `SESSION_SECRET` đủ mạnh.
- Khai báo `SITE_URL` hoặc `CORS_ORIGINS` đúng domain triển khai.
- Import `database/dt.sql` bằng tài khoản database có quyền phù hợp trước khi chạy ứng dụng.
- File upload cần được sao lưu hoặc đặt trên persistent volume nếu hosting dùng filesystem tạm thời.
- Chạy `npm test` trước khi triển khai.
- Dùng `GET /health` cho liveness check và `GET /ready` cho readiness check kết nối MySQL.
