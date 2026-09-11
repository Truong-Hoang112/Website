const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'public', 'uploads', 'products');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Upload image API
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file ảnh!' });
    }
    const url = '/uploads/products/' + req.file.filename;
    res.json({ url });
});

// Search suggestions
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const [products] = await pool.query(
            `SELECT id, name, price, thumbnail
             FROM products
             WHERE name LIKE ? OR description LIKE ?
             ORDER BY is_featured DESC, created_at DESC
             LIMIT 6`,
            [`%${q}%`, `%${q}%`]
        );

        res.json(products);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Add to cart (for direct links like /api/add-to-cart?product_id=1)
router.post('/add-to-cart', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id, qty = 1 } = req.body;
        const user_id = req.session.user_id;

        const [products] = await pool.query(
            'SELECT id, stock FROM products WHERE id = ?',
            [product_id]
        );

        if (products.length === 0 || products[0].stock < 1) {
            return res.status(400).json({ error: 'Sản phẩm không hợp lệ!' });
        }

        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            const newQty = Math.min(existing[0].quantity + qty, products[0].stock);
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQty, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [user_id, product_id, qty]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Get cart count for navbar
router.get('/cart-count', async (req, res) => {
    try {
        let count = 0;

        if (req.session.user_id) {
            const [result] = await pool.query(
                'SELECT SUM(quantity) AS total FROM cart WHERE user_id = ?',
                [req.session.user_id]
            );
            count = result[0].total || 0;
        }

        res.json({ count });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.json({ count: 0 });
    }
});

// Get cart items with product details
router.get('/cart', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ items: [] });
        }

        const [items] = await pool.query(`
            SELECT c.id, c.quantity,
                   p.id AS product_id, p.name, p.price, p.old_price, p.discount_percent, p.stock,
                   p.thumbnail, p.slug
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.session.user_id]);

        res.json({ items });
    } catch (error) {
        console.error('Get cart error:', error);
        res.json({ items: [] });
    }
});

// Add item to cart
router.post('/cart/add', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id, qty = 1 } = req.body;
        if (!product_id) {
            return res.status(400).json({ error: 'Thiếu product_id!' });
        }

        // Check if already in cart
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [req.session.user_id, product_id]
        );

        if (existing.length > 0) {
            // Update quantity
            await pool.query(
                'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
                [qty, existing[0].id]
            );
        } else {
            // Insert new
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.session.user_id, product_id, qty]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Lỗi khi thêm vào giỏ hàng!' });
    }
});

// Contact form (lưu user_id nếu đã đăng nhập để admin có thể reply chat 2 chiều)
router.post('/contact', async (req, res) => {
    try {
        const { full_name, email, phone, message } = req.body;
        const user_id = req.session?.user_id || null;

        if (!full_name || !email || !message) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const [result] = await pool.query(
            'INSERT INTO contacts (user_id, full_name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
            [user_id, full_name, email, phone || '', message]
        );

        // Tự động tạo conversation cho user đã đăng nhập
        let conversation_id = null;
        if (user_id) {
            const [conv] = await pool.query(
                'INSERT INTO conversations (contact_id, user_id, status) VALUES (?, ?, ?)',
                [result.insertId, user_id, 'open']
            );
            conversation_id = conv.insertId;
        }

        res.json({
            success: true,
            message: 'Gửi liên hệ thành công!',
            contact_id: result.insertId,
            conversation_id: conversation_id
        });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Submit review
router.post('/review', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id, rating, comment } = req.body;
        const user_id = req.session.user_id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Vui lòng chọn số sao!' });
        }

        if (!comment) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung đánh giá!' });
        }

        // Check if already reviewed
        const [existing] = await pool.query(
            'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
            [product_id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi!' });
        }

        await pool.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [product_id, user_id, rating, comment]
        );

        res.json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// ============ CATEGORIES API ============

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh mục!' });
    }
});

// Get single category
router.get('/categories/:id', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (categories.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục!' });
        }
        res.json(categories[0]);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Lỗi!' });
    }
});

// Create category
router.post('/categories', async (req, res) => {
    try {
        const { name, slug, is_active = 1 } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }
        
        // Check duplicate slug
        const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Slug đã tồn tại!' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, is_active) VALUES (?, ?, ?)',
            [name, slug, is_active]
        );
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Lỗi khi tạo danh mục!' });
    }
});

// Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const { name, slug, is_active } = req.body;
        
        // Check duplicate slug (excluding current)
        const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Slug đã tồn tại!' });
        }
        
        await pool.query(
            'UPDATE categories SET name = ?, slug = ?, is_active = ? WHERE id = ?',
            [name, slug, is_active, req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật!' });
    }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        // Check if category has products
        const [products] = await pool.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [req.params.id]);
        if (products.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa! Danh mục đang có sản phẩm.' });
        }
        
        await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Lỗi khi xóa!' });
    }
});

// ============ BRANDS API ============

// Get all brands
router.get('/brands', async (req, res) => {
    try {
        const [brands] = await pool.query(`
            SELECT b.*, COUNT(p.id) as product_count
            FROM brands b
            LEFT JOIN products p ON b.id = p.brand_id
            GROUP BY b.id
            ORDER BY b.name
        `);
        res.json({ brands });
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy thương hiệu!' });
    }
});

// Get single brand
router.get('/brands/:id', async (req, res) => {
    try {
        const [brands] = await pool.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
        if (brands.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thương hiệu!' });
        }
        res.json(brands[0]);
    } catch (error) {
        console.error('Get brand error:', error);
        res.status(500).json({ error: 'Lỗi!' });
    }
});

// Create brand
router.post('/brands', async (req, res) => {
    try {
        const { name, slug, is_active = 1 } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }
        
        // Check duplicate slug
        const [existing] = await pool.query('SELECT id FROM brands WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Slug đã tồn tại!' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO brands (name, slug, is_active) VALUES (?, ?, ?)',
            [name, slug, is_active]
        );
        
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({ error: 'Lỗi khi tạo thương hiệu!' });
    }
});

// Update brand
router.put('/brands/:id', async (req, res) => {
    try {
        const { name, slug, is_active } = req.body;
        
        // Check duplicate slug (excluding current)
        const [existing] = await pool.query('SELECT id FROM brands WHERE slug = ? AND id != ?', [slug, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Slug đã tồn tại!' });
        }
        
        await pool.query(
            'UPDATE brands SET name = ?, slug = ?, is_active = ? WHERE id = ?',
            [name, slug, is_active, req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update brand error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật!' });
    }
});

// Delete brand
router.delete('/brands/:id', async (req, res) => {
    try {
        // Check if brand has products
        const [products] = await pool.query('SELECT id FROM products WHERE brand_id = ? LIMIT 1', [req.params.id]);
        if (products.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa! Thương hiệu đang có sản phẩm.' });
        }
        
        await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete brand error:', error);
        res.status(500).json({ error: 'Lỗi khi xóa!' });
    }
});

// Lấy banners đang hoạt động (public - cho trang chủ)
router.get('/banners/active', async (req, res) => {
    try {
        const [banners] = await pool.query(
            `SELECT id, position, title, subtitle, link, image_url, sort_order
             FROM banners
             WHERE is_active = 1
             ORDER BY position ASC, sort_order ASC`
        );
        res.json({ banners });
    } catch (error) {
        console.error('Get active banners error:', error);
        res.status(500).json({ error: 'Lỗi khi tải banner!' });
    }
});

// Lấy danh sách coupons khả dụng (public)
router.get('/coupons/available', async (req, res) => {
    try {
        const now = new Date();
        const [coupons] = await pool.query(
            `SELECT code, description, discount_type, discount_value, min_order_value, max_discount
             FROM coupons
             WHERE is_active = 1
             AND (usage_limit IS NULL OR used_count < usage_limit)
             AND (start_date IS NULL OR start_date <= ?)
             AND (expires_at IS NULL OR expires_at >= ?)
             ORDER BY created_at DESC`,
            [now, now]
        );
        res.json({ coupons });
    } catch (error) {
        console.error('Get available coupons error:', error);
        res.status(500).json({ error: 'Lỗi khi tải mã giảm giá!' });
    }
});

// Seed demo coupons (admin only - call once to setup)
router.post('/coupons/seed', async (req, res) => {
    try {
        const demoCoupons = [
            ['WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 1000000, 500000, 1, '2027-12-31 23:59:59'],
            ['FREESHIP', 'Miễn phí vận chuyển', 'fixed', 30000, 500000, 30000, 1, '2027-12-31 23:59:59'],
            ['VIP20', 'Giảm 20% cho khách VIP', 'percent', 20, 3000000, 1000000, 100, '2027-12-31 23:59:59'],
            ['SALE5TR', 'Giảm 500K cho đơn từ 5 triệu', 'fixed', 500000, 5000000, 500000, 50, '2027-12-31 23:59:59']
        ];

        for (const coupon of demoCoupons) {
            await pool.query(
                `INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                coupon
            );
        }

        res.json({ success: true, message: 'Đã thêm coupons demo!' });
    } catch (error) {
        console.error('Seed coupons error:', error);
        res.status(500).json({ error: 'Lỗi khi seed coupons!' });
    }
});

// ============ AI CHAT API ============

// Từ điển câu trả lời tự động theo từ khóa
const aiResponses = {
    // Câu hỏi nhanh - Cách đặt hàng
    'cách đặt|cach dat|dat hang|dặt hàng|huong dan dat|order': '🛒 **Hướng dẫn đặt hàng:**\n\n1️⃣ Chọn sản phẩm bạn muốn mua\n2️⃣ Nhấn **"Thêm vào giỏ hàng"**\n3️⃣ Vào **"Giỏ hàng"** để kiểm tra\n4️⃣ Nhấn **"Thanh toán"**\n5️⃣ Điền thông tin giao hàng\n6️⃣ Chọn phương thức thanh toán\n7️⃣ Xác nhận đặt hàng\n\n📧 Bạn sẽ nhận email xác nhận trong vài phút!\n\n💬 Cần hỗ trợ? Chat trực tiếp với Admin nhé!',

    // Câu hỏi nhanh - Mã giảm giá
    'mã giảm|ma giam|code|sale|voucher|coupon|khuyến mãi|khuyen mai|đang giảm': '🎫 **Mã giảm giá hiện có:**\n\n🔹 **WELCOME10** - Giảm **10%** cho đơn hàng đầu tiên\n🔹 **FREESHIP** - Miễn phí vận chuyển (đơn từ 500K)\n🔹 **VIP20** - Giảm **20%** cho khách VIP (đơn từ 3 triệu)\n\n📝 **Cách sử dụng:**\nNhập mã tại bước **"Thanh toán"** trong giỏ hàng\n\n⚠️ Mỗi mã chỉ sử dụng 1 lần, kiểm tra hạn sử dụng nhé!',

    // Câu hỏi nhanh - Đổi trả
    'đổi trả|doi tra|tra hang|return|refund|hoàn tiền': '🔄 **Chính sách đổi trả:**\n\n✅ **7 ngày đổi trả** - Miễn phí nếu sản phẩm lỗi\n✅ **Hoàn tiền 100%** - Nếu không hài lòng (trong 7 ngày)\n✅ **Bảo hành 12 tháng** - Cho sản phẩm chính hãng\n\n📋 **Quy trình đổi trả:**\n1. Liên hệ hotline/chat với Admin\n2. Gửi video/picture sản phẩm\n3. Đóng gói và gửi lại\n4. Hoàn tiền trong 3-5 ngày\n\n📞 Hotline: 1900-xxxx để được hỗ trợ nhanh nhất!',

    // Câu hỏi nhanh - Thanh toán
    'thanh toán|thanh toan|payment|pay|trả tiền|cách trả|phương thức': '💳 **Phương thức thanh toán:**\n\n1️⃣ **COD (Nhận hàng trả tiền)**\n   - Trả tiền khi nhận được sản phẩm\n   - Phí COD: 15.000đ\n\n2️⃣ **Chuyển khoản ngân hàng**\n   - Vietcombank: xxxx-xxxx-xxxx\n   - Sacombank: xxxx-xxxx-xxxx\n\n3️⃣ **Ví điện tử**\n   - MoMo, ZaloPay, VNPay\n\n💡 Khuyến nghị: COD để an tâm nhận hàng trước khi trả tiền!',

    // Câu hỏi nhanh - Giao hàng
    'giao hàng|giao hang|ship|shipping|vận chuyển|deliver|bao lâu|mất bao lâu|thời gian': '🚚 **Chính sách giao hàng:**\n\n⏱️ **Thời gian giao:**\n• **Hà Nội & TP.HCM**: 1-2 ngày\n• **Miền Bắc/Miền Trung**: 2-3 ngày\n• **Miền Nam**: 3-5 ngày\n\n💰 **Phí vận chuyển:**\n• Đơn dưới 500K: 25.000đ\n• Đơn từ 500K trở lên: **MIỄN PHÍ**\n\n📦 **Theo dõi đơn hàng:**\nVào mục "Đơn hàng" trong tài khoản để xem trạng thái!\n\n⏰ Đơn hàng được xử lý từ 8h-18h hàng ngày.',

    // Câu hỏi nhanh - Tư vấn sản phẩm
    'tư vấn|tu van|recommend|suggest|gợi ý|goi y|de xuat|de cu|recommend': '✨ **Tư vấn sản phẩm cho bạn:**\n\nBạn đang quan tâm đến sản phẩm loại nào?\n\n🛍️ **Danh mục phổ biến:**\n• Thời trang & Phụ kiện\n• Điện tử & Công nghệ\n• Home & Living\n• Sport & Outdoor\n• Beauty & Health\n\n🔍 **Tôi có thể giúp bạn:**\n• Tìm sản phẩm theo giá\n• So sánh các sản phẩm\n• Xem đánh giá khách hàng\n\n💬 **Chat với Admin** để được tư vấn chi tiết và chọn sản phẩm phù hợp nhất!',

    // Chào hỏi
    'chào|chao|hello|hi|hey': 'Xin chào! 👋 Cảm ơn bạn đã ghé thăm cửa hàng của chúng tôi!\n\nTôi có thể giúp bạn:\n🛒 Tìm & đặt sản phẩm\n💰 Thông tin giá & khuyến mãi\n🚚 Giao hàng & thanh toán\n🔄 Đổi trả & bảo hành\n\nNhấn vào **câu hỏi gợi ý** bên dưới để được trả lời nhanh, hoặc nhắn tin để Admin hỗ trợ! 💬',

    // Tìm kiếm sản phẩm
    'tìm|tim|sản phẩm|product|cần tìm|muốn mua': '🔍 **Tìm kiếm sản phẩm:**\n\n1️⃣ Gõ tên sản phẩm vào **thanh tìm kiếm**\n2️⃣ Sử dụng **bộ lọc**: Danh mục, Giá, Thương hiệu\n3️⃣ Sắp xếp theo: Mới nhất, Bán chạy, Giá\n\n✨ **Mẹo:** Xem sản phẩm **bán chạy** và **mới nhất** ngay tại trang chủ!\n\n💬 Cần tư vấn cụ thể? Chat với Admin nhé!',

    // Tài khoản / Đăng nhập
    'đăng nhập|dang nhap|login|đăng ký|dang ky|register|tài khoản|account': '👤 **Quản lý tài khoản:**\n\n🔹 **Đăng ký**: "Đăng ký" → Điền thông tin → Xác nhận email\n🔹 **Đăng nhập**: "Đăng nhập" → Email + Mật khẩu\n🔹 **Quên mật khẩu**: "Quên mật khẩu" → Nhập email để lấy lại\n\n💡 **Lợi ích có tài khoản:**\n• Theo dõi đơn hàng\n• Lưu sản phẩm yêu thích\n• Tích điểm thưởng\n• Mã giảm giá độc quyền',

    // Liên hệ / Hỗ trợ
    'liên hệ|lien he|contact|hotline|phone|số điện thoại|email|hỗ trợ|support': '📞 **Liên hệ hỗ trợ:**\n\n☎️ **Hotline**: 1900-xxxx (8h-22h)\n📧 **Email**: support@cua-hang.com\n💬 **Chat**: Nhắn trực tiếp cho Admin\n\n⏰ **Giờ hỗ trợ**: 8h - 22h (Thứ 2 - CN)\n\n📍 Đội ngũ hỗ trợ luôn sẵn sàng giúp bạn 24/7!',

    // Giờ làm việc
    'giờ làm|gio lam|opening|hours|thời gian làm': '🕐 **Giờ làm việc:**\n\n🏪 **Cửa hàng online**: Hoạt động 24/7\n📞 **Hỗ trợ khách**: 8h00 - 22h00 (Thứ 2 - CN)\n📦 **Xử lý đơn**: 8h00 - 18h00 (Thứ 2 - Thứ 6)\n\n📧 Đơn đặt ngoài giờ sẽ được xử lý vào ngày làm việc tiếp theo.',

    // Chính sách chung
    'chính sách|chinhsach|policy': '📋 **Chính sách cửa hàng:**\n\n🛡️ **Bảo mật**: Thông tin cá nhân được bảo vệ\n🔄 **Đổi trả**: 7 ngày miễn phí\n🚚 **Vận chuyển**: Giao toàn quốc\n💳 **Thanh toán**: COD, Chuyển khoản, Ví điện tử\n⭐ **Bảo hành**: 12 tháng (sản phẩm chính hãng)\n\nXem chi tiết tại trang **"Chính sách"** nhé!',

    // Mặc định
    'default': '🤖 Cảm ơn câu hỏi của bạn!\n\nTôi có thể hỗ trợ bạn:\n• 🛒 Tìm kiếm & đặt sản phẩm\n• 💰 Giá & mã giảm giá\n• 🚚 Giao hàng & thanh toán\n• 🔄 Đổi trả & bảo hành\n\n📌 **Gợi ý nhanh:** Nhấn vào các nút bên dưới để được trả lời ngay!\n\n💬 Cần hỗ trợ chi tiết? Chuyển sang **chat với Admin** nhé!'
};

// Hàm tìm câu trả lời phù hợp
function getAIResponse(message) {
    const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const [keywords, response] of Object.entries(aiResponses)) {
        if (keywords === 'default') continue;

        const keywordList = keywords.split('|');
        for (const keyword of keywordList) {
            const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (msg.includes(normalizedKeyword)) {
                return response;
            }
        }
    }

    return aiResponses.default;
}

// AI Chat endpoint
router.post('/chat/ai', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Vui lòng nhập câu hỏi!' 
            });
        }
        
        // Lấy câu trả lời từ từ điển
        const response = getAIResponse(message.trim());
        
        res.json({
            success: true,
            reply: response
        });
        
    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Xảy ra lỗi kết nối. Vui lòng thử lại!' 
        });
    }
});

module.exports = router;
