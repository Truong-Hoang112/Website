-- ===============================================
-- 1. CREATE DATABASE
-- ===============================================
CREATE DATABASE IF NOT EXISTS dt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dt;

-- ===============================================
-- 2. USERS TABLE (khách hàng + admin)
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(15),
    address TEXT,
    birthdate DATE,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    google_id VARCHAR(255) NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- 3. RESET_TOKENS TABLE (quên mật khẩu)
-- ===============================================
CREATE TABLE IF NOT EXISTS reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===============================================
-- 4. CATEGORIES TABLE (danh mục: điện thoại, tai nghe, sạc, ốp lưng)
-- ===============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1
);

-- ===============================================
-- 5. BRANDS TABLE (hãng: Apple, Samsung, Xiaomi...)
-- ===============================================
CREATE TABLE IF NOT EXISTS brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    logo VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1
);

-- ===============================================
-- 6. PRODUCTS TABLE (sản phẩm)
-- ===============================================
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category_id INT,
    brand_id INT,
    price DECIMAL(15,0) NOT NULL,
    old_price DECIMAL(15,0),
    discount_percent INT DEFAULT 0,
    stock INT DEFAULT 0,
    description TEXT,
    ram VARCHAR(20),
    storage VARCHAR(20),
    thumbnail VARCHAR(255),
    is_featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- ===============================================
-- 7. PRODUCT_IMAGES TABLE (nhiều ảnh cho 1 sản phẩm)
-- ===============================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ===============================================
-- 8. ORDERS TABLE (đơn hàng)
-- ===============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    payment_code VARCHAR(50),
    total_price DECIMAL(15,0) NOT NULL,
    shipping_fee DECIMAL(15,0) DEFAULT 0,
    shipping_name VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    notes TEXT,
    payment_method ENUM('cod', 'vnpay', 'momo') DEFAULT 'cod',
    status ENUM('pending','confirmed','shipping','delivered','cancelled') DEFAULT 'pending',
    cancel_reason VARCHAR(255) NULL,
    cancelled_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================================
-- 9. ORDER_ITEMS TABLE (chi tiết từng sản phẩm trong đơn)
-- ===============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15,0) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ===============================================
-- 10. CART TABLE (giỏ hàng tạm)
-- ===============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ===============================================
-- 11. REVIEWS TABLE (đánh giá + bình luận)
-- ===============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================================
-- 12. CONTACTS TABLE (form liên hệ / feedback)
-- ===============================================
CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- 13. PROMOTIONS TABLE (khuyến mãi / banner)
-- ===============================================
CREATE TABLE IF NOT EXISTS promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_active TINYINT(1) DEFAULT 1,
    link_url VARCHAR(255) DEFAULT NULL,
    banner_type ENUM('main','side') DEFAULT 'main'
);

-- ===============================================
-- 14. BANNERS TABLE (banner mới - quản lý riêng)
-- ===============================================
CREATE TABLE IF NOT EXISTS banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    position VARCHAR(20) DEFAULT 'hero' COMMENT 'hero, side, quick',
    title VARCHAR(200) DEFAULT NULL,
    subtitle VARCHAR(300) DEFAULT NULL,
    link VARCHAR(500) DEFAULT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT(11) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===============================================
-- DỮ LIỆU MẪU - BRANDS
-- ===============================================
INSERT INTO brands (id, name, slug, logo) VALUES
(1, 'Apple', 'apple', NULL),
(2, 'Samsung', 'samsung', NULL),
(3, 'Xiaomi', 'xiaomi', NULL);
(4, 'Oppo', 'oppo', NULL),
(5, 'Vivo', 'vivo', NULL),
(6, 'Realme', 'realme', NULL),
(7, 'Nokia', 'nokia', NULL),
(8, 'Huawei', 'huawei', NULL),
(9, 'Lenovo', 'lenovo', NULL),
(10, 'Asus', 'asus', NULL);

-- ===============================================
-- DỮ LIỆU MẪU - CATEGORIES
-- ===============================================
INSERT INTO categories (id, name, slug, image) VALUES
(1, 'Điện thoại', 'dien-thoai', NULL);

-- ===============================================
-- DỮ LIỆU MẪU - USERS (bao gồm ADMIN MẶC ĐỊNH)
-- ===============================================
-- Default Admin Account:
-- Email: adminanhtrai@gmail.com
-- Password: admin123

INSERT INTO users (id, full_name, email, password, phone, address, birthdate, gender, role, created_at) VALUES
(1, 'Quản Trị Viên', 'adminanhtrai@gmail.com', '$2a$10$YldNdMvi5yhdOCukOn/lW.e2LgEuP29tLkbefv53y0G7gC1bZhDYW', '0909123456', '123 Nguyễn Huệ, Q.1, TP.HCM', '1990-01-15', 'male', 'admin', '2026-03-30 13:39:13');

-- ===============================================
-- DỮ LIỆU MẪU - PRODUCTS
-- ===============================================
INSERT INTO products (id, name, slug, category_id, brand_id, price, old_price, discount_percent, stock, description, ram, storage, thumbnail, is_featured, created_at) VALUES
(1, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 1, 1, 28990000, 32990000, 12, 48, 'iPhone 15 Pro Max chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR.', '8GB', '256GB', 'iphone-15-pro-max-256gb-1775315484.jpg', 1, '2026-03-30 13:45:41'),
(2, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 1, 2, 26990000, 29990000, 10, 30, 'Samsung Galaxy S24 Ultra bút S Pen tích hợp, camera 200MP, màn hình 6.8 inch.', '12GB', '256GB', 'samsung-galaxy-s24-ultra-1775315494.jpg', 1, '2026-03-30 13:45:41'),
(3, 'iPhone 16', 'iphone-16', 1, 1, 18900000, 22235294, 15, 10, 'Hiệu năng mạnh với chip A18 mới, xử lý nhanh và tiết kiệm pin hơn thế hệ trước', '8GB', '256GB', 'iphone-16-1775484985.jpg', 1, '2026-04-06 14:16:25'),
(4, 'Samsung Galaxy S26 Ultra 12GB 256GB', 'samsung-galaxy-s26-ultra-12gb-256gb', 1, 2, 32990000, 36990000, 11, 20, 'Samsung Galaxy S26 Ultra – Siêu phẩm đỉnh nhất 2025', '12GB', '256GB', 'samsung-galaxy-s26-ultra-12gb-256gb-1775912441.webp', 1, '2026-04-11 13:00:41'),
(7, 'Samsung Galaxy S25 Ultra 12GB 256GB', 'samsung-galaxy-s25-ultra-12gb-256gb', 1, 2, 27490000, 33380000, 18, 10, 'Samsung Galaxy S25 Ultra – Flagship toàn diện, đỉnh cao công nghệ', '12GB', '256GB', 'samsung-galaxy-s25-ultra-12gb-256gb-1775914362.webp', 1, '2026-04-11 13:32:42'),
(8, 'Samsung Galaxy S26 12GB 256GB', 'samsung-galaxy-s26-12gb-256gb', 1, 2, 22990000, 25990000, 12, 20, 'Samsung Galaxy S26 – Flagship nhỏ gọn, chip thế hệ mới', '12GB', '256GB', 'samsung-galaxy-s26-12gb-256gb-1775917176.webp', 0, '2026-04-11 14:19:36'),
(9, 'Samsung Galaxy A17 5G 8GB 128GB', 'samsung-galaxy-a17-5g-8gb-128gb', 1, 2, 6090000, 6390000, 5, 30, 'Samsung Galaxy A17 5G – 5G giá rẻ, pin trâu, màn AMOLED lớn', '8GB', '128GB', 'samsung-galaxy-a17-5g-8gb-128gb-1775917237.webp', 0, '2026-04-11 14:20:37'),
(10, 'Samsung Galaxy Z Fold7 12GB 256GB', 'samsung-galaxy-z-fold7-12gb-256gb', 1, 2, 41990000, 46990000, 11, 24, 'Samsung Galaxy Z Fold7 – Màn hình gập 8 inch, tablet bỏ túi đỉnh cao', '12GB', '256GB', 'samsung-galaxy-z-fold7-12gb-256gb-1775917309.webp', 1, '2026-04-11 14:21:49'),
(11, 'Samsung Galaxy A56 5G 8GB 128GB', 'samsung-galaxy-a56-5g-8gb-128gb', 1, 2, 9190000, 9810000, 6, 12, 'Samsung Galaxy A56 5G – Tầm trung vượt trội, thiết kế đẹp', '8GB', '128GB', 'samsung-galaxy-a56-5g-8gb-128gb-1775917465.webp', 0, '2026-04-11 14:24:25'),
(12, 'Samsung Galaxy Z Flip7 12GB 256GB', 'samsung-galaxy-z-flip7-12gb-256gb', 1, 2, 23990000, 28990000, 17, 19, 'Samsung Galaxy Z Flip7 – Gập cá tính, thời trang, bỏ túi siêu gọn', '12GB', '256GB', 'samsung-galaxy-z-flip7-12gb-256gb-1775917584.webp', 1, '2026-04-11 14:26:24'),
(53, 'iPhone 17 Pro Max 256GB', 'iphone-17-pro-max-256gb', 1, 1, 37790000, 40000000, 6, 4, 'iPhone 17 Pro Max 256GB – Zoom 8x xa nhất lịch sử iPhone, màn 6.9 inch', '12GB', '256GB', 'iphone-17-pro-max-256gb-1776600984.webp', 1, '2026-04-19 12:16:24');

-- ===============================================
-- DỮ LIỆU MẪU - ORDERS
-- ===============================================
INSERT INTO orders (id, user_id, payment_code, total_price, shipping_fee, shipping_name, shipping_phone, shipping_address, notes, status, created_at) VALUES
(15, 1, 'PS1713523200000', 37790000, 0, 'Admin', '0123456789', 'Ho Chi Minh', '', 'pending', '2026-04-19 12:47:50');

-- ===============================================
-- DỮ LIỆU MẪU - ORDER_ITEMS
-- ===============================================
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
(17, 15, 53, 1, 37790000);

-- ===============================================
-- DỮ LIỆU MẪU - REVIEWS
-- ===============================================
INSERT INTO reviews (id, product_id, user_id, rating, comment, created_at) VALUES
(1, 4, 1, 5, 'Shop uy tín nhiều ưu đãi', '2026-04-11 13:56:05');

-- ===============================================
-- DỮ LIỆU MẪU - PROMOTIONS
-- ===============================================
INSERT INTO promotions (id, title, description, image, start_date, end_date, is_active, link_url, banner_type) VALUES
(1, 'iPhone 15', 'vip pro', 'banner-1774878536.jpg', '2026-03-30', '2026-04-30', 1, '/products?category=dien-thoai', 'main'),
(2, 'SS24ultra', 'ngon bổ rẻ', 'banner-1775317551-e8211a4e.jpg', '2026-04-04', '2026-04-30', 1, '/products?brand=Samsung', 'side');

-- ===============================================
-- DỮ LIỆU MẪU - BANNERS
-- ===============================================
INSERT INTO banners (position, title, subtitle, link, image_url, sort_order) VALUES
('hero', 'iPhone 17 Pro Max', 'Siêu phẩm công nghệ 2026', '/products?brand=apple', '/images/banner-hero-default.jpg', 1),
('side', 'Samsung Galaxy S26 Ultra', 'Flagship đỉnh nhất', '/products?brand=samsung', '/images/banner-side-default.jpg', 1),
('quick', 'Khuyến mãi 20%', 'Giảm giá cực sốc', '/products?sort=discount', '/images/banner-quick-default.jpg', 1);

-- ===============================================
-- CẬP NHẬT AUTO_INCREMENT
-- ===============================================
ALTER TABLE brands MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE categories MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE users MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
ALTER TABLE products MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;
ALTER TABLE orders MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
ALTER TABLE order_items MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
ALTER TABLE reviews MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE promotions MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE banners MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

-- ===============================================
-- HOÀN TẤT
-- ===============================================
SELECT '========================================' AS '';
SELECT 'Database dt da duoc tao thanh cong!' AS status;
SELECT 'Tai khoan Admin: admin@phonestore.vn / admin123' AS admin_account;
SELECT '========================================' AS '';

-- ===============================================
-- THÊM CỘT PAYMENT_METHOD NẾU CHƯA CÓ
-- ===============================================
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'payment_method'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN payment_method ENUM("cod", "vnpay", "momo") DEFAULT "cod" AFTER notes',
    'SELECT "Column payment_method already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
