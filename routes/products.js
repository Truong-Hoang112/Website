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
        // ram/storage đã bị xóa khỏi bảng products, bỏ qua filter
        if (false) {
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
        }

        const whereSQL = where.join(' AND ');

        // Sort
        let orderSQL;
        switch (sort) {
            case 'price_asc': orderSQL = 'p.price ASC'; break;
            case 'price_desc': orderSQL = 'p.price DESC'; break;
            case 'discount_desc': orderSQL = 'p.discount_percent DESC, p.price ASC'; break;
            case 'discount_asc': orderSQL = 'p.discount_percent ASC, p.price ASC'; break;
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

        // Get variants (RAM/Storage options) - safe fallback if table not exists
        let variants = [];
        try {
            const [v] = await pool.query(
                `SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY storage`,
                [id]
            );
            variants = v;
        } catch (e) {
            // Table product_variants doesn't exist - use empty array
            variants = [];
        }

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
        let related = [];
        if (product.category_id) {
            const [relatedResult] = await pool.query(
                `SELECT p.*, b.name AS brand_name
                 FROM products p
                 LEFT JOIN brands b ON p.brand_id = b.id
                 WHERE p.category_id = ? AND p.id != ?
                 ORDER BY RAND()
                 LIMIT 4`,
                [product.category_id, id]
            );
            related = relatedResult;
        }

        res.json({
            product,
            images,
            variants,
            reviews,
            ratingStats: {
                avgRating,
                total: reviews.length,
                starCounts
            },
            related
        });
    } catch (error) {
        console.error('=== GET PRODUCT ERROR ===');
        console.error('Product ID:', req.params.id);
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Đã xảy ra lỗi!', details: error.message });
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

// Lấy thông tin nhiều sản phẩm theo IDs (cho chức năng so sánh)
router.post('/compare', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Vui lòng cung cấp danh sách ID sản phẩm!' });
        }

        if (ids.length > 4) {
            return res.status(400).json({ error: 'Chỉ có thể so sánh tối đa 4 sản phẩm!' });
        }

        const placeholders = ids.map(() => '?').join(',');
        const [products] = await pool.query(
            `SELECT p.id, p.name, p.price, p.old_price, p.discount_percent,
                    p.thumbnail, p.stock, p.description,
                    p.ram, p.storage, p.os, p.chipset, p.cpu, p.gpu,
                    p.screen_size, p.screen_resolution,
                    b.name AS brand_name,
                    c.name AS category_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id IN (${placeholders})`,
            ids
        );

        // Lấy images cho mỗi sản phẩm
        const productIds = products.map(p => p.id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const [images] = await pool.query(
                `SELECT product_id, image_url, is_primary FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
                productIds
            );
            // Group images by product_id
            images.forEach(img => {
                if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
                imagesMap[img.product_id].push(img);
            });
        }

        // Attach images to products
        products.forEach(p => {
            p.images = imagesMap[p.id] || [];
        });

        res.json({ products });
    } catch (error) {
        console.error('Compare products error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
