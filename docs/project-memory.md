# Ghi nhớ dự án

Cập nhật lần cuối: 13/09/2026.

AnhTraiStore là đồ án sinh viên mô phỏng website thương mại điện tử. Thanh toán MoMo/VNPay tiếp tục là luồng mô phỏng; SMTP đã được cấu hình. Không thay đổi `database/dt.sql` nếu chưa có yêu cầu rõ ràng từ người dùng.

Kiến trúc hiện tại là Express modular monolith trong `src`, MySQL gồm 18 bảng, giao diện HTML/CSS/JavaScript và Socket.IO cho chat. Bộ kiểm tra hiện có 20 test và đang đạt toàn bộ; `npm audit` gần nhất không phát hiện lỗ hổng.

Thứ tự nâng cấp đã thống nhất:

1. Migration database, constraint/index và giải quyết schema drift.
2. Redis cho session, OTP và rate limit.
3. Validation tập trung, API versioning, OpenAPI và response thống nhất.
4. Integration test, E2E, lint/type-check và CI.
5. Tách service/repository và module giao diện dùng chung.
6. Queue email, object storage, structured logging, metrics và triển khai nhiều instance.
7. Chỉ bổ sung payment gateway, inventory ledger và nghiệp vụ tài chính khi chuyển sang thương mại thật.

Chi tiết xem thêm trong `docs/architecture.md`, `docs/security.md` và Canvas `enterprise-upgrade-roadmap.canvas.tsx` của workspace.
