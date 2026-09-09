const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
    try {
        const {
            q, category, brand, price_min, price_max,
            ram, storage, sort = 'newest', featured,
            page = 1, limit = 12
        } = req.query;

        // Normalize: skip "undefined" string values
        const catValue = (category && category !== 'undefined' && category !== '') ? category : null;
        const brandValue = (brand && brand !== 'undefined' && brand !== '') ? brand : null;

        let where = ['1=1'];
        let params = [];

        if (q) {
            where.push('(p.name LIKE ? OR b.name LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }
        if (catValue) {
            where.push('c.slug = ?');
            params.push(catValue);
        }
        if (featured === '1') {
            where.push('p.is_featured = 1');
        }
        if (brandValue) {
            const brandId = parseInt(brandValue);
            if (!isNaN(brandId) && brandId > 0) {
                where.push('p.brand_id = ?');
                params.push(brandId);
            }
        }
        if (price_min) {
            where.push('p.price >= ?');
            params.push(parseInt(price_min));
        }
        if (price_max) {
            where.push('p.price <= ?');
            params.push(parseInt(price_max));
        }

        // Handle ram/storage as arrays (multi-select)
        if (ram) {
            const ramArr = Array.isArray(ram) ? ram : [ram];
            const validRam = ramArr.filter(r => r && r !== 'undefined');
            if (validRam.length > 0) {
                const placeholders = validRam.map(() => '?').join(',');
                where.push(`p.ram IN (${placeholders})`);
                params.push(...validRam);
            }
        }
        if (storage) {
            const storageArr = Array.isArray(storage) ? storage : [storage];
            const validStorage = storageArr.filter(s => s && s !== 'undefined');
            if (validStorage.length > 0) {
                const placeholders = validStorage.map(() => '?').join(',');
                where.push(`p.storage IN (${placeholders})`);
                params.push(...validStorage);
            }
        }

        const whereSQL = where.join(' AND ');

        // Sort
        let orderSQL;
        switch (sort) {
            case 'price_asc': orderSQL = 'p.price ASC'; break;
            case 'price_desc': orderSQL = 'p.price DESC'; break;
            case 'discount': orderSQL = 'p.discount_percent DESC'; break;
            default: orderSQL = 'p.created_at DESC';
        }

        // Count total
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE ${whereSQL}`,
            params
        );
        const total = countResult[0].total;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get products
        const [products] = await pool.query(
            `SELECT p.*, b.name AS brand_name, c.name AS cat_name, c.slug AS cat_slug
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE ${whereSQL}
             ORDER BY ${orderSQL}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Get filters data
        const [brands] = await pool.query(
            'SELECT id, name FROM brands WHERE is_active = 1 ORDER BY name'
        );
        const [categories] = await pool.query('SELECT id, name, slug FROM categories WHERE is_active = 1 ORDER BY name');
        const [rams] = await pool.query(
            'SELECT DISTINCT ram FROM products WHERE ram IS NOT NULL AND ram != "" ORDER BY ram'
        );
        const [storages] = await pool.query(
            'SELECT DISTINCT storage FROM products WHERE storage IS NOT NULL AND storage != "" ORDER BY storage'
        );

        res.json({
            products,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            filters: {
                brands,
                categories,
                rams: rams.map(r => r.ram),
                storages: storages.map(s => s.storage)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!', details: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.query(
            `SELECT p.*, b.name AS brand_name, c.name AS cat_name, c.slug AS cat_slug
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
        }

        const product = products[0];

        // Get images
        const [images] = await pool.query(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
            [id]
        );

        // Get reviews
        const [reviews] = await pool.query(
            `SELECT r.*, u.full_name
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [id]
        );

        // Calculate rating stats
        let avgRating = 0;
        const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(rv => {
            avgRating += rv.rating;
            starCounts[rv.rating]++;
        });
        if (reviews.length > 0) avgRating = (avgRating / reviews.length).toFixed(1);

        // Get related products
        const [related] = await pool.query(
            `SELECT p.*, b.name AS brand_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.category_id = ? AND p.id != ?
             ORDER BY RAND()
             LIMIT 4`,
            [product.category_id, id]
        );

        res.json({
            product,
            images,
            reviews,
            ratingStats: {
                avgRating,
                total: reviews.length,
                starCounts
            },
            related
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Get featured products
router.get('/home/featured', async (req, res) => {
    try {
        // Featured products
        const [products] = await pool.query(
            `SELECT p.*, b.name AS brand_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.is_featured = 1
             ORDER BY p.created_at DESC
             LIMIT 10`
        );

        // New products
        const [newProducts] = await pool.query(
            `SELECT p.*, b.name AS brand_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             ORDER BY p.created_at DESC
             LIMIT 10`
        );

        // Promotion products (has discount)
        const [promoProducts] = await pool.query(
            `SELECT p.*, b.name AS brand_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.discount_percent > 0
             ORDER BY p.discount_percent DESC
             LIMIT 10`
        );

        const [categories] = await pool.query('SELECT * FROM categories ORDER BY id');

        const [promotions] = await pool.query(
            `SELECT * FROM promotions
             WHERE is_active = 1
             AND (start_date IS NULL OR start_date <= CURDATE())
             AND (end_date IS NULL OR end_date >= CURDATE())
             LIMIT 3`
        );

        res.json({ products, newProducts, promoProducts, categories, promotions });
    } catch (error) {
        console.error('Get featured error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
