const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ===========================================
// WISHLIST - Sản phẩm yêu thích
// ===========================================

// Lấy danh sách yêu thích của user hiện tại
router.get('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ items: [], total: 0 });
        }

        const [items] = await pool.query(
            `SELECT w.id AS wishlist_id, w.created_at AS added_at,
                    p.id, p.name, p.slug, p.price, p.old_price,
                    p.discount_percent, p.thumbnail, p.stock,
                    b.name AS brand_name
             FROM wishlists w
             JOIN products p ON w.product_id = p.id
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [req.session.user_id]
        );

        res.json({ items, total: items.length });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Thêm sản phẩm vào wishlist
router.post('/add', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id } = req.body;
        const user_id = req.session.user_id;

        if (!product_id) {
            return res.status(400).json({ error: 'Thiếu thông tin sản phẩm!' });
        }

        // Kiểm tra sản phẩm tồn tại
        const [products] = await pool.query(
            'SELECT id, name FROM products WHERE id = ?',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
        }

        // Kiểm tra đã có trong wishlist chưa
        const [existing] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            return res.json({ success: true, message: 'Sản phẩm đã có trong danh sách yêu thích!', already_exists: true });
        }

        // Thêm vào wishlist
        await pool.query(
            'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
            [user_id, product_id]
        );

        res.json({ success: true, message: 'Đã thêm vào yêu thích!' });
    } catch (error) {
        console.error('Add wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Xóa sản phẩm khỏi wishlist (theo wishlist_id)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;

        await pool.query(
            'DELETE FROM wishlists WHERE id = ? AND user_id = ?',
            [id, req.session.user_id]
        );

        res.json({ success: true, message: 'Đã xóa khỏi yêu thích!' });
    } catch (error) {
        console.error('Remove wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Xóa sản phẩm khỏi wishlist (theo product_id) - dùng cho nút toggle
router.delete('/product/:product_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id } = req.params;

        await pool.query(
            'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
            [req.session.user_id, product_id]
        );

        res.json({ success: true, message: 'Đã xóa khỏi yêu thích!' });
    } catch (error) {
        console.error('Remove wishlist by product error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Toggle: thêm nếu chưa có, xóa nếu đã có
router.post('/toggle', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!', need_login: true });
        }

        const { product_id } = req.body;
        const user_id = req.session.user_id;

        if (!product_id) {
            return res.status(400).json({ error: 'Thiếu thông tin sản phẩm!' });
        }

        const [existing] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM wishlists WHERE id = ?', [existing[0].id]);
            return res.json({ success: true, action: 'removed', message: 'Đã xóa khỏi yêu thích!' });
        } else {
            await pool.query(
                'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
                [user_id, product_id]
            );
            return res.json({ success: true, action: 'added', message: 'Đã thêm vào yêu thích!' });
        }
    } catch (error) {
        console.error('Toggle wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Kiểm tra sản phẩm có trong wishlist không
router.get('/check/:product_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ in_wishlist: false });
        }

        const [items] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
            [req.session.user_id, req.params.product_id]
        );

        res.json({ in_wishlist: items.length > 0 });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Đếm số sản phẩm trong wishlist
router.get('/count', async (req, res) => {
    try {
        let count = 0;
        if (req.session.user_id) {
            const [result] = await pool.query(
                'SELECT COUNT(*) AS total FROM wishlists WHERE user_id = ?',
                [req.session.user_id]
            );
            count = result[0].total || 0;
        }
        res.json({ count });
    } catch (error) {
        console.error('Count wishlist error:', error);
        res.json({ count: 0 });
    }
});

// Xóa toàn bộ wishlist
router.delete('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        await pool.query('DELETE FROM wishlists WHERE user_id = ?', [req.session.user_id]);
        res.json({ success: true, message: 'Đã xóa toàn bộ yêu thích!' });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
