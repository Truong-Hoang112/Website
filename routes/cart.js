const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get cart count (for badge)
router.get('/count', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ count: 0 });
        }

        const [rows] = await pool.query(
            'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
            [req.session.user_id]
        );

        res.json({ count: rows[0].count || 0 });
    } catch (error) {
        console.error('Cart count error:', error);
        res.json({ count: 0 });
    }
});

// Get cart
router.get('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ items: [], total: 0 });
        }

        const [items] = await pool.query(
            `SELECT c.id AS cart_id, c.quantity, c.variant_id,
                    p.id AS product_id, p.name, p.price, p.old_price,
                    p.discount_percent, p.thumbnail, p.stock,
                    b.name AS brand_name,
                    pv.ram, pv.storage, pv.price AS variant_price
             FROM cart c
             JOIN products p ON c.product_id = p.id
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN product_variants pv ON c.variant_id = pv.id
             WHERE c.user_id = ?
             ORDER BY c.id DESC`,
            [req.session.user_id]
        );

        // Calculate total using variant price if available
        const total = items.reduce((sum, item) => {
            const price = item.variant_price || item.price;
            return sum + price * item.quantity;
        }, 0);

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

        const { product_id, qty = 1, variant_id = null } = req.body;
        const user_id = req.session.user_id;

        let price, stock, product_name;

        // Check variant if provided
        if (variant_id) {
            const [variants] = await pool.query(
                'SELECT id, price, old_price, stock, ram, storage FROM product_variants WHERE id = ? AND product_id = ?',
                [variant_id, product_id]
            );
            
            if (variants.length === 0) {
                return res.status(400).json({ error: 'Phiên bản sản phẩm không tồn tại!' });
            }
            
            const variant = variants[0];
            price = variant.price;
            stock = variant.stock;
            product_name = variant.ram + ' / ' + variant.storage;
        } else {
            // Check product directly
            const [products] = await pool.query(
                'SELECT id, stock, name, price FROM products WHERE id = ?',
                [product_id]
            );

            if (products.length === 0) {
                return res.status(400).json({ error: 'Sản phẩm không tồn tại!' });
            }

            price = products[0].price;
            stock = products[0].stock;
            product_name = products[0].name;
        }
        
        if (stock < 1) {
            return res.status(400).json({ error: 'Sản phẩm đã hết hàng!' });
        }

        if (qty > stock) {
            return res.status(400).json({ error: 'Số lượng vượt quá kho (' + stock + '). Vui lòng nhập số lượng nhỏ hơn!' });
        }

        // Check if already in cart (with same variant)
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
            [user_id, product_id, variant_id, variant_id]
        );

        if (existing.length > 0) {
            const currentQty = existing[0].quantity;
            const newQty = currentQty + qty;
            
            if (newQty > stock) {
                return res.status(400).json({ error: 'Tổng số lượng trong giỏ hàng (' + newQty + ') vượt quá kho (' + stock + '). Vui lòng giảm số lượng!' });
            }
            
            // Update quantity
            await pool.query(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQty, existing[0].id]
            );
            return res.json({ success: true, message: 'Đã cập nhật số lượng trong giỏ hàng!' });
        }

        // Insert new
        await pool.query(
            'INSERT INTO cart (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
            [user_id, product_id, variant_id, qty]
        );

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

        // Get cart item and product stock
        const [cartItems] = await pool.query(
            `SELECT c.*, p.stock, p.name 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.id = ? AND c.user_id = ?`,
            [id, req.session.user_id]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng!' });
        }

        const item = cartItems[0];

        // Validate quantity
        if (quantity < 1) {
            // Delete item if quantity is 0
            await pool.query('DELETE FROM cart WHERE id = ?', [id]);
            return res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng!' });
        }

        if (quantity > item.stock) {
            return res.status(400).json({ error: 'Số lượng vượt quá kho (' + item.stock + '). Vui lòng nhập số lượng nhỏ hơn!' });
        }

        await pool.query(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [quantity, id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Clear cart (phải đặt TRƯỚC /:id để tránh bị bắt nhầm)
router.delete('/all', async (req, res) => {
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

// Buy now - tạo token tạm thời để mua 1 sản phẩm không ảnh hưởng giỏ hàng
router.post('/buy-now', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { product_id, quantity, product_name, price, thumbnail } = req.body;

        // Validate
        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Thông tin sản phẩm không hợp lệ!' });
        }

        // Check stock
        const [products] = await pool.query('SELECT id, stock, name FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) {
            return res.status(400).json({ error: 'Sản phẩm không tồn tại!' });
        }

        if (products[0].stock < quantity) {
            return res.status(400).json({ error: 'Số lượng vượt quá kho (' + products[0].stock + ')!' });
        }

        // Tạo token ngẫu nhiên
        const token = require('crypto').randomBytes(16).toString('hex');

        // Lưu vào session
        req.session.buyNow = {
            token: token,
            product_id: parseInt(product_id),
            quantity: parseInt(quantity),
            product_name: product_name || products[0].name,
            price: parseFloat(price),
            thumbnail: thumbnail,
            stock: products[0].stock,
            created_at: Date.now()
        };

        res.json({ success: true, token: token });
    } catch (error) {
        console.error('Buy now error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Get buy now data
router.get('/buy-now', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { token } = req.query;

        if (!req.session.buyNow || req.session.buyNow.token !== token) {
            return res.status(400).json({ error: 'Phiên mua ngay không hợp lệ!' });
        }

        // Kiểm tra token hết hạn (15 phút)
        if (Date.now() - req.session.buyNow.created_at > 15 * 60 * 1000) {
            delete req.session.buyNow;
            return res.status(400).json({ error: 'Phiên mua ngay đã hết hạn!' });
        }

        res.json({ success: true, buyNow: req.session.buyNow });
    } catch (error) {
        console.error('Get buy now error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
