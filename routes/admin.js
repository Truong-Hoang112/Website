const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper function to create URL-friendly slug
function createSlug(text) {
    let slug = text.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/[đ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug;
}

// Generate unique slug
async function generateUniqueSlug(name) {
    let baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
        const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
        if (existing.length === 0) {
            return slug;
        }
        slug = baseSlug + '-' + counter;
        counter++;
    }
}

// Middleware to check admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user_id || req.session.role !== 'admin') {
        // Return JSON for AJAX requests (including fetch with X-Requested-With header)
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(403).json({ error: 'Không có quyền truy cập!', requireLogin: true });
        }
        return res.redirect('/login');
    }
    next();
};

// Dashboard stats
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const [products] = await pool.query('SELECT COUNT(*) as c FROM products');
        const [orders] = await pool.query('SELECT COUNT(*) as c FROM orders');
        const [users] = await pool.query("SELECT COUNT(*) as c FROM users WHERE role='customer'");
        const [revenue] = await pool.query("SELECT SUM(total_price) as c FROM orders WHERE status='delivered'");
        const [pending] = await pool.query("SELECT COUNT(*) as c FROM orders WHERE status='pending'");
        const [reviews] = await pool.query('SELECT COUNT(*) as c FROM reviews');
        const [contacts] = await pool.query('SELECT COUNT(*) as c FROM contacts WHERE is_read=0');
        const [lowStock] = await pool.query('SELECT COUNT(*) as c FROM products WHERE stock <= 5');

        res.json({
            total_products: products[0].c,
            total_orders: orders[0].c,
            total_users: users[0].c,
            total_revenue: revenue[0].c || 0,
            pending_orders: pending[0].c,
            total_reviews: reviews[0].c,
            unread_contacts: contacts[0].c,
            low_stock: lowStock[0].c
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Admin dashboard page
router.get('/', (req, res) => {
    if (!req.session.user_id || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'index.html'));
});

// Products management
router.get('/products', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'products.html'));
});

router.get('/products/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
        }
        res.json({ product: products[0] });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.post('/products', requireAdmin, async (req, res) => {
    try {
        const {
            name, brand_id, category_id, price, old_price, discount_percent,
            description, thumbnail, ram, storage, stock, is_featured
        } = req.body;

        // Generate unique slug from name
        const slug = await generateUniqueSlug(name);

        const [result] = await pool.query(
            `INSERT INTO products (name, slug, brand_id, category_id, price, old_price, discount_percent, description, thumbnail, ram, storage, stock, is_featured)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, slug, brand_id, category_id, price, old_price, discount_percent, description, thumbnail, ram, storage, stock, is_featured ? 1 : 0]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, brand_id, category_id, price, old_price, discount_percent,
            description, thumbnail, ram, storage, stock, is_featured
        } = req.body;

        // Get current product to compare name
        const [current] = await pool.query('SELECT name FROM products WHERE id = ?', [id]);
        
        // Update slug only if name changed
        let newSlug = null;
        if (current.length > 0 && current[0].name !== name) {
            newSlug = await generateUniqueSlug(name);
        }

        let query, params;
        if (newSlug) {
            query = `UPDATE products SET name=?, slug=?, brand_id=?, category_id=?, price=?, old_price=?, discount_percent=?, description=?, thumbnail=?, ram=?, storage=?, stock=?, is_featured=? WHERE id=?`;
            params = [name, newSlug, brand_id, category_id, price, old_price, discount_percent, description, thumbnail, ram, storage, stock, is_featured ? 1 : 0, id];
        } else {
            query = `UPDATE products SET name=?, brand_id=?, category_id=?, price=?, old_price=?, discount_percent=?, description=?, thumbnail=?, ram=?, storage=?, stock=?, is_featured=? WHERE id=?`;
            params = [name, brand_id, category_id, price, old_price, discount_percent, description, thumbnail, ram, storage, stock, is_featured ? 1 : 0, id];
        }

        await pool.query(query, params);

        res.json({ success: true });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Orders management
router.get('/orders', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'orders.html'));
});

router.get('/orders/list', requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT o.*, u.full_name AS customer_name FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
        let params = [];

        if (status) {
            query += ' WHERE o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        const [orders] = await pool.query(query, params);
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [orders] = await pool.query(
            `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             WHERE o.id = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại!' });
        }

        const [items] = await pool.query(
            `SELECT oi.*, p.name AS product_name, p.thumbnail AS product_image
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

        res.json({ order: orders[0], items });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.put('/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Users management
router.get('/users', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'users.html'));
});

router.get('/users/list', requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { full_name, email, phone, password, role } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        // Check existing email
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email này đã được đăng ký!' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone || '', hashedPassword, role || 'customer']
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Reviews management
router.get('/reviews', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'reviews.html'));
});

router.get('/reviews/list', requireAdmin, async (req, res) => {
    try {
        const [reviews] = await pool.query(
            `SELECT r.*, u.full_name, p.name AS product_name
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             LEFT JOIN products p ON r.product_id = p.id
             ORDER BY r.created_at DESC`
        );
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.delete('/reviews/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Contacts management
router.get('/contacts', (req, res) => {
    res.sendFile(require('path').join(__dirname, '..', 'views', 'admin', 'contacts.html'));
});

router.get('/contacts/list', requireAdmin, async (req, res) => {
    try {
        const [contacts] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json({ contacts });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

router.put('/contacts/:id/read', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
