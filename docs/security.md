# Rà soát bảo mật API

Tài liệu này ghi nhận lần rà soát ngày 13/09/2026. Phạm vi gồm Express API, session, phân quyền, quên mật khẩu, upload, Socket.IO, dữ liệu trả về và cấu hình triển khai. File `database/dt.sql` không bị thay đổi.

## Các vấn đề đã xử lý

- Response lỗi 500 chỉ trả thông báo chung, không trả lỗi MySQL, stack trace hay chi tiết đường dẫn hệ thống.
- Tắt header `X-Powered-By`; thêm các header chống MIME sniffing, clickjacking, rò rỉ referrer và HSTS khi chạy production.
- API và trang quản trị dùng `Cache-Control: no-store` để hạn chế lưu dữ liệu nhạy cảm trong cache trình duyệt hoặc proxy.
- CORS production chỉ chấp nhận các origin khai báo trong `CORS_ORIGINS`; thiếu cấu hình không còn tự động mở cho mọi website.
- Cookie session dùng tên riêng, `httpOnly`, `sameSite=lax`, và `secure` khi chạy production. Đăng nhập tái tạo session ID; đăng xuất chỉ dùng POST và xóa session.
- Thêm giới hạn tần suất cho toàn bộ API, đăng nhập, đăng ký và luồng OTP để giảm brute force và spam.
- OTP dùng bộ sinh số mật mã, giới hạn năm lần thử, có thời hạn và không còn được ghi vào log. Endpoint quên mật khẩu trả cùng một nội dung dù email có tồn tại hay không.
- Các API khách hàng kiểm tra `user_id` từ session khi đọc/sửa giỏ hàng, wishlist, đơn hàng và hội thoại. API quản trị yêu cầu vai trò admin.
- Socket.IO kiểm tra quyền sở hữu hội thoại trước khi cho người dùng tham gia phòng.
- Response công khai đã bỏ trường định danh nội bộ không cần thiết như `reviews.user_id`, `contacts.id` và `orders.cart_item_ids`.
- Truy vấn user chỉ chọn các trường cần dùng; password hash không được trả về API.
- Upload chỉ nhận phần mở rộng ảnh nằm trong allowlist và MIME tương ứng, có giới hạn kích thước; tên file do server tạo.
- Dữ liệu người dùng được giới hạn độ dài. Tên và nội dung đánh giá/tin nhắn được escape trước khi đưa vào HTML; dữ liệu chèn vào email HTML cũng được escape.
- Google OAuth tự tắt khi thiếu cấu hình thay vì khởi động với thông tin giả.
- `/health` chỉ trả trạng thái hoạt động; `/ready` chỉ trả trạng thái sẵn sàng của database, không trả host, phiên bản hay lỗi kết nối.

## Kiểm tra đã chạy

- `npm run check`: 20 kiểm tra hồi quy đều đạt.
- `npm audit --omit=dev --audit-level=high`: không phát hiện lỗ hổng dependency.
- Kiểm tra HTTP xác nhận không còn `X-Powered-By`, API có header bảo mật, cache policy và rate-limit metadata.
- Quét mã nguồn không thấy API 500 trả trực tiếp `error.message`, stack trace hoặc thông tin xác thực.
- `.env` nằm trong `.gitignore`; repository chỉ chứa `.env.example` với giá trị mẫu.

## Yêu cầu khi triển khai

- Đặt `NODE_ENV=production`, dùng `SESSION_SECRET` dài, ngẫu nhiên và ít nhất 32 ký tự, bật HTTPS, và khai báo đúng `CORS_ORIGINS`/`SITE_URL`.
- Không commit `.env`, SMTP App Password, mật khẩu database hoặc OAuth secret.
- Với đồ án chạy một tiến trình, rate limit và OTP lưu trong bộ nhớ là đủ. Khi chạy nhiều tiến trình hoặc cần duy trì sau restart, chuyển session, rate limit và OTP sang Redis hoặc dịch vụ tương đương.
- Thư mục upload cần persistent storage nếu hosting dùng filesystem tạm thời.
- Chính sách CSP chưa được bật vì các trang hiện còn nhiều script/style inline. Muốn bật CSP nghiêm ngặt cần tách phần inline sang file tĩnh hoặc thêm nonce trong một đợt chỉnh sửa riêng.
