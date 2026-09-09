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

// Contact form
router.post('/contact', async (req, res) => {
    try {
        const { full_name, email, phone, message } = req.body;

        if (!full_name || !email || !message) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        await pool.query(
            'INSERT INTO contacts (full_name, email, phone, message) VALUES (?, ?, ?, ?)',
            [full_name, email, phone || '', message]
        );

        res.json({ success: true, message: 'Gửi liên hệ thành công!' });
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

module.exports = router;
