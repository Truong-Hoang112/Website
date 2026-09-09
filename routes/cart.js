const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get cart
router.get('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ items: [], total: 0 });
        }

        const [items] = await pool.query(
            `SELECT c.id AS cart_id, c.quantity,
                    p.id AS product_id, p.name, p.price, p.old_price,
                    p.discount_percent, p.thumbnail, p.stock,
                    b.name AS brand_name
             FROM cart c
             JOIN products p ON c.product_id = p.id
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE c.user_id = ?
             ORDER BY c.id DESC`,
            [req.session.user_id]
        );

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.json({ items, total });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Add to cart
router.post('/add', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id, qty = 1 } = req.body;
        const user_id = req.session.user_id;

        // Check product exists and has stock
        const [products] = await pool.query(
            'SELECT id, stock FROM products WHERE id = ?',
            [product_id]
        );

        if (products.length === 0 || products[0].stock < 1) {
            return res.status(400).json({ error: 'Sản phẩm không hợp lệ hoặc hết hàng!' });
        }

        // Check if already in cart
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            // Update quantity
            const newQty = Math.min(existing[0].quantity + qty, products[0].stock);
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQty, existing[0].id]
            );
        } else {
            // Insert new
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [user_id, product_id, qty]
            );
        }

        res.json({ success: true, message: 'Đã thêm vào giỏ hàng!' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Update quantity
router.put('/:id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;
        const { quantity } = req.body;

        await pool.query(
            'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, id, req.session.user_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Remove item
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;

        await pool.query(
            'DELETE FROM cart WHERE id = ? AND user_id = ?',
            [id, req.session.user_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Clear cart
router.delete('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        await pool.query('DELETE FROM cart WHERE user_id = ?', [req.session.user_id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
