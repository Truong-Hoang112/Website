const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// AI Chat consultation endpoint
router.post('/consult', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length < 3) {
            return res.status(400).json({ error: 'Vui lòng nhập câu hỏi cụ thể hơn!' });
        }

        // Analyze user intent and extract criteria
        const criteria = analyzeMessage(message);

        // Build SQL query based on criteria
        const { sql, params, explanation } = buildProductQuery(criteria);

        // Execute query
        const [products] = await pool.query(sql, params);

        // Generate AI-like response
        const response = generateResponse(criteria, products, explanation);

        res.json({
            products,
            total: products.length,
            response
        });

    } catch (error) {
        console.error('Chat consult error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tư vấn. Vui lòng thử lại!' });
    }
});

// Analyze message to extract criteria
function analyzeMessage(message) {
    const lowerMsg = message.toLowerCase();
    const criteria = {
        maxPrice: null,
        minPrice: null,
        brands: [],
        categories: [],
        features: [],
        keywords: [],
        sortBy: 'price',
        sortOrder: 'ASC'
    };

    // Extract budget/price range
    const pricePatterns = [
        // Dưới X triệu
        /duoi\s*(\d+)\s*triệu/i,
        /dưới\s*(\d+)\s*triệu/i,
        /chi\s*(\d+)\s*triệu/i,
        /tối\s*đa\s*(\d+)\s*triệu/i,
        /max\s*(\d+)/i,
        // Trên X triệu
        /trên\s*(\d+)\s*triệu/i,
        /trên\s*(\d+)m/i,
        /từ\s*(\d+)\s*triệu/i,
        /từ\s*(\d+)m/i,
        /trên\s*(\d+)/i,
        // Từ X đến Y triệu
        /từ\s*(\d+)\s*(?:đến|->)\s*(\d+)\s*triệu/i,
        /(\d+)\s*(?:đến|->)\s*(\d+)\s*triệu/i
    ];

    // Check for budget patterns
    for (const pattern of pricePatterns) {
        const match = lowerMsg.match(pattern);
        if (match) {
            if (pattern.source.includes('duoi') || pattern.source.includes('chi') || pattern.source.includes('max')) {
                criteria.maxPrice = parseInt(match[1]) * 1000000;
            } else if (pattern.source.includes('trên') && match[2]) {
                criteria.minPrice = parseInt(match[1]) * 1000000;
                criteria.maxPrice = parseInt(match[2]) * 1000000;
            } else if (pattern.source.includes('trên') && !match[2]) {
                criteria.minPrice = parseInt(match[1]) * 1000000;
            }
            break;
        }
    }

    // Check for "dưới" without number - set default budget
    if (lowerMsg.includes('rẻ') || lowerMsg.includes('tiết kiệm') || lowerMsg.includes('bình dân') || lowerMsg.includes('giá rẻ')) {
        criteria.maxPrice = 10000000; // 10 triệu
    }

    if (lowerMsg.includes('cao cấp') || lowerMsg.includes('sang trọng') || lowerMsg.includes('đắt')) {
        criteria.minPrice = 15000000; // 15 triệu trở lên
    }

    // Extract brands
    const brandKeywords = {
        'apple': ['apple', 'iphone', 'ipad', 'ios', 'macbook', '🍎'],
        'samsung': ['samsung', 'galaxy', 'samsung galaxy', 'galaxy s', 'galaxy a', 'galaxy z'],
        'xiaomi': ['xiaomi', 'redmi', 'poco', 'mi'],
        'oppo': ['oppo', 'oppo reno', 'oppo find'],
        'vivo': ['vivo', 'vivo v', 'vivo x'],
        'realme': ['realme'],
        'nokia': ['nokia']
    };

    for (const [brand, keywords] of Object.entries(brandKeywords)) {
        for (const keyword of keywords) {
            if (lowerMsg.includes(keyword)) {
                if (!criteria.brands.includes(brand)) {
                    criteria.brands.push(brand);
                }
                break;
            }
        }
    }

    // Extract features/requirements
    const featurePatterns = {
        'camera': ['chup anh', 'chụp ảnh', 'camera', 'selfie', 'chụp hình', 'nhiếp ảnh', 'ấn tượng'],
        'gaming': ['game', 'gaming', 'chơi game', 'chiến game', 'pubg', 'liên minh', 'liên quân'],
        'battery': ['pin', 'sạc', 'dung lượng pin', 'trâu', ' lâu'],
        'storage': ['bộ nhớ', 'rom', 'lưu trữ', '64gb', '128gb', '256gb', '512gb', '1tb', '1t'],
        'ram': ['ram', '6gb', '8gb', '12gb', '16gb'],
        '5g': ['5g', 'mạng 5g'],
        'foldable': ['gập', 'fold', 'flip', 'z fold', 'z flip']
    };

    for (const [feature, patterns] of Object.entries(featurePatterns)) {
        for (const pattern of patterns) {
            if (lowerMsg.includes(pattern)) {
                criteria.features.push(feature);
                break;
            }
        }
    }

    // Extract storage requirement
    const storageMatch = lowerMsg.match(/(\d+)\s*(?:gb|tb|1t)/i);
    if (storageMatch) {
        const storage = parseInt(storageMatch[1]);
        if (storage <= 2) {
            criteria.storageMin = storage * (storage === 1 ? 1000 : 1000); // Convert TB to GB
        } else {
            criteria.storageMin = storage;
        }
    }

    // Determine sort order
    if (lowerMsg.includes('giảm') || lowerMsg.includes('khuyến mãi') || lowerMsg.includes('sale') || lowerMsg.includes('rẻ nhất')) {
        criteria.sortBy = 'discount_percent';
        criteria.sortOrder = 'DESC';
    }

    if (lowerMsg.includes('đắt nhất') || lowerMsg.includes('cao nhất') || lowerMsg.includes('premium') || lowerMsg.includes('tốt nhất')) {
        criteria.sortBy = 'price';
        criteria.sortOrder = 'DESC';
    }

    if (lowerMsg.includes('mới nhất') || lowerMsg.includes('mới ra') || lowerMsg.includes('ra mắt')) {
        criteria.sortBy = 'created_at';
        criteria.sortOrder = 'DESC';
    }

    // Extract general keywords
    const generalKeywords = message.split(/\s+/).filter(word => word.length > 3);
    criteria.keywords = generalKeywords;

    return criteria;
}

// Build SQL query based on criteria
function buildProductQuery(criteria) {
    let sql = `
        SELECT p.id, p.name, p.price, p.old_price, p.discount_percent, 
               p.thumbnail, p.ram, p.storage, p.stock, p.brand_id,
               b.name as brand_name,
               p.created_at
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.stock > 0
    `;

    const params = [];
    let conditions = [];

    // Price filters
    if (criteria.maxPrice) {
        conditions.push('p.price <= ?');
        params.push(criteria.maxPrice);
    }

    if (criteria.minPrice) {
        conditions.push('p.price >= ?');
        params.push(criteria.minPrice);
    }

    // Brand filter
    if (criteria.brands.length > 0) {
        const brandPlaceholders = criteria.brands.map(() => '?').join(',');
        conditions.push(`LOWER(b.slug) IN (${brandPlaceholders})`);
        params.push(...criteria.brands.map(b => b.toLowerCase()));
    }

    // Feature filters
    if (criteria.features.includes('gaming')) {
        // Prefer higher RAM and certain chipsets
        sql = sql.replace('p.stock > 0', 'p.stock > 0 AND p.ram IN ("8GB","12GB","16GB")');
    }

    if (criteria.features.includes('5g')) {
        // 5G phones (most modern phones support 5G)
        conditions.push('(p.name NOT LIKE "%4G%" OR p.name LIKE "%5G%")');
    }

    if (criteria.features.includes('foldable')) {
        conditions.push("p.name LIKE '%Fold%' OR p.name LIKE '%Flip%' OR p.name LIKE '%Z Fold%' OR p.name LIKE '%Z Flip%'");
    }

    // Storage filter
    if (criteria.storageMin) {
        conditions.push(`CAST(REPLACE(REPLACE(p.storage, 'GB', ''), 'TB', '000') AS UNSIGNED) >= ?`);
        params.push(criteria.storageMin);
    }

    // Apply conditions
    if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }

    // Sort
    const sortOptions = {
        'price': 'p.price',
        'discount_percent': 'p.discount_percent',
        'created_at': 'p.created_at'
    };

    const sortColumn = sortOptions[criteria.sortBy] || 'p.price';
    sql += ` ORDER BY ${sortColumn} ${criteria.sortOrder}`;

    // Limit results
    sql += ' LIMIT 8';

    // Generate explanation
    let explanation = [];
    if (criteria.maxPrice) {
        explanation.push(`dưới ${(criteria.maxPrice / 1000000).toFixed(0)} triệu`);
    }
    if (criteria.minPrice && criteria.maxPrice) {
        explanation.push(`từ ${(criteria.minPrice / 1000000).toFixed(0)} đến ${(criteria.maxPrice / 1000000).toFixed(0)} triệu`);
    } else if (criteria.minPrice) {
        explanation.push(`trên ${(criteria.minPrice / 1000000).toFixed(0)} triệu`);
    }
    if (criteria.brands.length > 0) {
        explanation.push(`${criteria.brands.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ')}`);
    }
    if (criteria.features.includes('camera')) explanation.push('chụp ảnh đẹp');
    if (criteria.features.includes('gaming')) explanation.push('chơi game mượt');
    if (criteria.features.includes('battery')) explanation.push('pin trâu');

    return { sql, params, explanation };
}

// Generate AI-like response
function generateResponse(criteria, products, explanation) {
    const filters = explanation.join(', ');

    if (products.length === 0) {
        return `Rất tiếc, tôi không tìm được sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể thử điều chỉnh ngân sách hoặc liên hệ trực tiếp với chúng tôi để được tư vấn thêm nhé!`;
    }

    if (products.length === 1) {
        const p = products[0];
        let response = `Tuyệt vời! Tôi tìm được chiếc điện thoại hoàn hảo cho bạn:\n\n`;
        response += `📱 **${p.name}**\n`;
        response += `💰 Giá: **${formatPriceVND(p.price)}**`;
        if (p.old_price) {
            response += ` (gốc: ${formatPriceVND(p.old_price)})`;
        }
        response += `\n`;
        if (p.ram || p.storage) {
            response += `⚡ Cấu hình: ${p.ram || ''} / ${p.storage || ''}\n`;
        }
        response += `\n👉 Nhấn vào sản phẩm để xem chi tiết hoặc đặt hàng ngay!`;
        return response;
    }

    let response = `Dựa trên yêu cầu của bạn`;
    if (filters) {
        response += ` (${filters})`;
    }
    response += `, tôi gợi ý ${products.length} sản phẩm phù hợp nhất:\n\n`;

    // Add brief commentary for top products
    if (products.length >= 1) {
        const top = products[0];
        response += `🏆 **Gợi ý hàng đầu:** ${top.name} - ${formatPriceVND(top.price)}`;
        if (top.discount_percent > 10) {
            response += ` (GIẢM ${top.discount_percent}%)`;
        }
        response += `\n`;
    }

    response += `\n👇 Xem chi tiết các sản phẩm bên dưới hoặc nhấn "Xem thêm" để khám phá thêm!`;

    return response;
}

// Format price to VND
function formatPriceVND(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

module.exports = router;
