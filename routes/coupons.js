const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ===========================================
// COUPONS - Mã giảm giá
// ===========================================

// Kiểm tra mã giảm giá (validate trước khi áp dụng)
router.post('/validate', async (req, res) => {
    try {
        const { code, order_total } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá!' });
        }

        const [coupons] = await pool.query(
            `SELECT * FROM coupons
             WHERE code = ? AND is_active = 1
             AND (start_date IS NULL OR start_date <= NOW())
             AND (expires_at IS NULL OR expires_at >= NOW())`,
            [code.toUpperCase()]
        );

        if (coupons.length === 0) {
            return res.status(404).json({ error: 'Mã giảm giá không tồn tại hoặc đã hết hạn!' });
        }

        const coupon = coupons[0];

        // Kiểm tra số lượng đã dùng
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng!' });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        const total = parseFloat(order_total) || 0;
        if (total < parseFloat(coupon.min_order_value)) {
            const minVal = parseFloat(coupon.min_order_value);
            return res.status(400).json({
                error: `Đơn hàng tối thiểu ${minVal.toLocaleString('vi-VN')}đ để dùng mã này!`
            });
        }

        // Tính số tiền được giảm
        let discountAmount = 0;
        if (coupon.discount_type === 'percent') {
            discountAmount = Math.round(total * parseFloat(coupon.discount_value) / 100);
            // Giới hạn số tiền giảm tối đa
            if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
                discountAmount = parseFloat(coupon.max_discount);
            }
        } else if (coupon.discount_type === 'fixed') {
            discountAmount = parseFloat(coupon.discount_value);
            if (discountAmount > total) discountAmount = total;
        }

        res.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                discount_amount: discountAmount
            },
            message: `Áp dụng thành công! Giảm ${discountAmount.toLocaleString('vi-VN')}đ`
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Lấy danh sách coupon công khai (đang hoạt động)
router.get('/active', async (req, res) => {
    try {
        const [coupons] = await pool.query(
            `SELECT id, code, description, discount_type, discount_value,
                    min_order_value, max_discount, expires_at
             FROM coupons
             WHERE is_active = 1
             AND (start_date IS NULL OR start_date <= NOW())
             AND (expires_at IS NULL OR expires_at >= NOW())
             ORDER BY created_at DESC`
        );
        res.json({ coupons });
    } catch (error) {
        console.error('Get active coupons error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Alias cho /active (frontend gọi /available)
router.get('/available', async (req, res) => {
    try {
        const [coupons] = await pool.query(
            `SELECT id, code, description, discount_type, discount_value,
                    min_order_value, max_discount, expires_at
             FROM coupons
             WHERE is_active = 1
             AND (start_date IS NULL OR start_date <= NOW())
             AND (expires_at IS NULL OR expires_at >= NOW())
             ORDER BY created_at DESC`
        );
        res.json({ coupons });
    } catch (error) {
        console.error('Get available coupons error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Đánh dấu coupon đã sử dụng (gọi từ order sau khi tạo)
router.post('/use', async (req, res) => {
    try {
        const { coupon_id, user_id, order_id, discount_amount } = req.body;

        if (!coupon_id || !user_id || !discount_amount) {
            return res.status(400).json({ error: 'Thiếu thông tin!' });
        }

        // Tăng used_count
        await pool.query(
            'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
            [coupon_id]
        );

        // Lưu vào lịch sử
        await pool.query(
            'INSERT INTO user_coupons (user_id, coupon_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
            [user_id, coupon_id, order_id || null, discount_amount]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Use coupon error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Admin: tạo coupon mới
router.post('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        // Check admin role
        const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (!users.length || users[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền!' });
        }

        const {
            code, description, discount_type, discount_value,
            min_order_value = 0, max_discount = null,
            usage_limit = null, start_date = null, expires_at = null
        } = req.body;

        if (!code || !discount_value) {
            return res.status(400).json({ error: 'Vui lòng nhập mã và giá trị giảm!' });
        }

        const [result] = await pool.query(
            `INSERT INTO coupons (code, description, discount_type, discount_value,
                min_order_value, max_discount, usage_limit, start_date, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [code.toUpperCase(), description || '', discount_type || 'percent',
             discount_value, min_order_value, max_discount, usage_limit, start_date, expires_at]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create coupon error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã coupon đã tồn tại!' });
        }
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
