const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { sendOrderEmail } = require('../config/mail');

// Create order
router.post('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { shipping_name, shipping_phone, shipping_address, payment_method, notes, coupon_code, discount_amount, item_ids } = req.body;
        const user_id = req.session.user_id;

        if (!shipping_name || !shipping_phone || !shipping_address) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin giao hàng!' });
        }

        // Get cart items - lọc theo item_ids nếu có
        const itemIdsInt = (item_ids && Array.isArray(item_ids))
            ? item_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0)
            : [];

        let cartItems = [];

        // Nếu có session.buyNow và KHÔNG có item_ids hợp lệ → dùng buy-now
        // Nếu KHÔNG có session.buyNow → dùng cart (tất cả items)
        // Nếu CÓ item_ids hợp lệ → dùng cart (chỉ items đã chọn)
        if (itemIdsInt.length > 0) {
            // User chọn items cụ thể từ cart
            [cartItems] = await pool.query(
                `SELECT c.*, p.price, p.stock, p.name
                 FROM cart c
                 JOIN products p ON c.product_id = p.id
                 WHERE c.user_id = ? AND c.id IN (?)`,
                [user_id, itemIdsInt]
            );
        } else if (req.session.buyNow) {
            // Buy Now mode - dùng session.buyNow
            const bp = req.session.buyNow;
            const [products] = await pool.query(
                'SELECT id, name, price, stock FROM products WHERE id = ?',
                [bp.product_id]
            );
            if (products.length === 0) {
                return res.status(400).json({ error: 'Sản phẩm không tồn tại!' });
            }
            const p = products[0];
            cartItems = [{
                product_id: p.id,
                quantity: bp.quantity,
                price: bp.price,
                stock: p.stock,
                name: p.name,
                cart_id: 'buy_now'
            }];
        } else {
            // Cart mode - lấy TẤT CẢ items trong cart
            [cartItems] = await pool.query(
                `SELECT c.*, p.price, p.stock, p.name
                 FROM cart c
                 JOIN products p ON c.product_id = p.id
                 WHERE c.user_id = ?`,
                [user_id]
            );
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Giỏ hàng trống hoặc sản phẩm không hợp lệ!' });
        }

        // Calculate total
        let total = 0;
        const orderItems = [];

        for (const item of cartItems) {
            if (item.stock < item.quantity) {
                return res.status(400).json({ error: `Sản phẩm "${item.name}" không đủ hàng!` });
            }
            total += item.price * item.quantity;
            orderItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            });
        }

        // Shipping fee
        const shipping_fee = total >= 500000 ? 0 : 30000;

        // Discount từ coupon (nếu có)
        const validDiscount = Math.max(0, Math.min(parseFloat(discount_amount) || 0, total));

        const final_total = total + shipping_fee - validDiscount;

        // Generate payment code
        const payment_code = 'PS' + Date.now();

        // Auto-confirm for online payments (vnpay, momo)
        const initialStatus = ['vnpay', 'momo'].includes(payment_method) ? 'confirmed' : 'pending';

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
        // Insert order with appropriate status
            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, payment_code, total_price, shipping_fee, shipping_name, shipping_phone, shipping_address, notes, payment_method, status, discount_amount, coupon_code, cart_item_ids)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, payment_code, final_total, shipping_fee, shipping_name, shipping_phone, shipping_address, notes || '', payment_method, initialStatus, validDiscount, coupon_code || null, itemIdsInt.length > 0 ? itemIdsInt.join(',') : null]
            );

            const order_id = orderResult.insertId;

            // Insert order items
            for (const item of orderItems) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [order_id, item.product_id, item.quantity, item.price]
                );

                // Update stock
                await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Nếu có coupon, đánh dấu đã dùng
            if (coupon_code && validDiscount > 0) {
                try {
                    const [coupons] = await connection.query(
                        'SELECT id FROM coupons WHERE code = ?',
                        [coupon_code]
                    );
                    if (coupons.length > 0) {
                        await connection.query(
                            'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                            [coupons[0].id]
                        );
                        await connection.query(
                            'INSERT INTO user_coupons (user_id, coupon_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
                            [user_id, coupons[0].id, order_id, validDiscount]
                        );
                    }
                } catch (e) {
                    console.error('Coupon update error:', e);
                }
            }

            // Clear cart - chỉ xóa những sản phẩm đã đặt
            if (itemIdsInt.length > 0) {
                await connection.query('DELETE FROM cart WHERE id IN (?) AND user_id = ?', [itemIdsInt, user_id]);
            } else {
                await connection.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
            }

            // Clear buyNow session to prevent reuse
            if (req.session.buyNow) {
                delete req.session.buyNow;
            }

            await connection.commit();
            connection.release();

            // Gửi email xác nhận đơn hàng (async, không block response)
            (async () => {
                try {
                    const [userInfo] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
                    const [orderItems] = await pool.query(
                        `SELECT oi.*, p.name 
                         FROM order_items oi 
                         JOIN products p ON oi.product_id = p.id 
                         WHERE oi.order_id = ?`,
                        [order_id]
                    );
                    
                    if (userInfo.length > 0) {
                        const orderData = {
                            id: order_id,
                            payment_code,
                            total_price: final_total,
                            shipping_fee,
                            discount_amount: validDiscount,
                            shipping_name,
                            shipping_phone,
                            shipping_address,
                            created_at: new Date()
                        };
                        await sendOrderEmail(orderData, userInfo[0], orderItems);
                    }
                } catch (emailError) {
                    console.error('Lỗi gửi email xác nhận:', emailError.message);
                }
            })();

            res.json({
                success: true,
                order_id,
                payment_code,
                subtotal: total,
                shipping_fee,
                discount_amount: validDiscount,
                coupon_code: coupon_code || null,
                total: final_total,
                status: initialStatus
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi: ' + error.message });
    }
});

// Get user's orders
router.get('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const [orders] = await pool.query(
            `SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
             (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as total_items
             FROM orders o 
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [req.session.user_id]
        );

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.session.user_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại!' });
        }

        const [items] = await pool.query(
            `SELECT oi.*, p.name, p.thumbnail
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

// Cancel order
router.put('/:id/cancel', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;
        const { reason } = req.body;

        // Get order
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.session.user_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại!' });
        }

        const order = orders[0];

        // Only pending orders can be cancelled
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng đang chờ xác nhận!' });
        }

        // Start transaction to restore stock
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update order status
            await connection.query(
                'UPDATE orders SET status = ?, cancel_reason = ?, cancelled_at = NOW() WHERE id = ?',
                ['cancelled', reason || '', id]
            );

            // Restore stock
            const [orderItems] = await connection.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [id]
            );

            for (const item of orderItems) {
                await connection.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            await connection.commit();
            connection.release();

            res.json({ success: true, message: 'Đơn hàng đã được hủy thành công!' });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Initiate order for online payment (MoMo/VNPay)
router.post('/initiate', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { shipping_name, shipping_phone, shipping_address, payment_method, notes, coupon_code, discount_amount, item_ids } = req.body;
        const user_id = req.session.user_id;

        if (!shipping_name || !shipping_phone || !shipping_address) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin giao hàng!' });
        }

        // Get cart items - lọc theo item_ids nếu có
        const itemIdsInt = (item_ids && Array.isArray(item_ids))
            ? item_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0)
            : [];

        let cartItems = [];

        // Nếu có session.buyNow và KHÔNG có item_ids hợp lệ → dùng buy-now
        // Nếu KHÔNG có session.buyNow → dùng cart (tất cả items)
        // Nếu CÓ item_ids hợp lệ → dùng cart (chỉ items đã chọn)
        if (itemIdsInt.length > 0) {
            // User chọn items cụ thể từ cart
            [cartItems] = await pool.query(
                `SELECT c.*, p.price, p.stock, p.name
                 FROM cart c
                 JOIN products p ON c.product_id = p.id
                 WHERE c.user_id = ? AND c.id IN (?)`,
                [user_id, itemIdsInt]
            );
        } else if (req.session.buyNow) {
            // Buy Now mode - dùng session.buyNow
            const bp = req.session.buyNow;
            const [products] = await pool.query(
                'SELECT id, name, price, stock FROM products WHERE id = ?',
                [bp.product_id]
            );
            if (products.length === 0) {
                return res.status(400).json({ error: 'Sản phẩm không tồn tại!' });
            }
            const p = products[0];
            cartItems = [{
                product_id: p.id,
                quantity: bp.quantity,
                price: bp.price,
                stock: p.stock,
                name: p.name,
                cart_id: 'buy_now'
            }];
        } else {
            // Cart mode - lấy TẤT CẢ items trong cart
            [cartItems] = await pool.query(
                `SELECT c.*, p.price, p.stock, p.name
                 FROM cart c
                 JOIN products p ON c.product_id = p.id
                 WHERE c.user_id = ?`,
                [user_id]
            );
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Giỏ hàng trống hoặc sản phẩm không hợp lệ!' });
        }

        // Calculate total
        let total = 0;
        const orderItems = [];

        for (const item of cartItems) {
            if (item.stock < item.quantity) {
                return res.status(400).json({ error: `Sản phẩm "${item.name}" không đủ hàng!` });
            }
            total += item.price * item.quantity;
            orderItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            });
        }

        const shipping_fee = total >= 500000 ? 0 : 30000;
        const validDiscount = Math.max(0, Math.min(parseFloat(discount_amount) || 0, total));
        const final_total = total + shipping_fee - validDiscount;
        const payment_code = 'PS' + Date.now();

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert order with PENDING status (chờ thanh toán)
            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, payment_code, total_price, shipping_fee, shipping_name, shipping_phone, shipping_address, notes, payment_method, status, discount_amount, coupon_code, cart_item_ids)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, payment_code, final_total, shipping_fee, shipping_name, shipping_phone, shipping_address, notes || '', payment_method, 'pending', validDiscount, coupon_code || null, itemIdsInt.length > 0 ? itemIdsInt.join(',') : null]
            );

            const order_id = orderResult.insertId;

                // Insert order items
            for (const item of orderItems) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [order_id, item.product_id, item.quantity, item.price]
                );
            }

            // Clear buyNow session to prevent reuse
            if (req.session.buyNow) {
                delete req.session.buyNow;
            }

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                order_id,
                payment_code,
                total: final_total
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('Initiate order error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi: ' + error.message });
    }
});

// Check payment status for online payments
router.get('/:id/check-payment', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;

        // Lấy đơn hàng
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.session.user_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại!' });
        }

        const order = orders[0];

        // Kiểm tra xem đã thanh toán chưa
        // ⚠️ LƯU Ý: Đây là demo - thanh toán VNPay/MoMo cần tích hợp webhook/IPN thực tế
        // Trong production, cần verify signature từ VNPay/MoMo server
        const isPaid = order.payment_method === 'momo' || order.payment_method === 'vnpay';
        
        res.json({
            order_id: order.id,
            status: order.status,
            paid: isPaid && order.status === 'pending',
            payment_method: order.payment_method
        });
    } catch (error) {
        console.error('Check payment error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Complete order after payment verification
router.post('/:id/complete', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { id } = req.params;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Lấy đơn hàng
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [id, req.session.user_id]
            );

            if (orders.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: 'Đơn hàng không tồn tại!' });
            }

            const order = orders[0];

            // Kiểm tra đơn hàng có phải đang chờ thanh toán không
            if (order.status !== 'pending') {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Đơn hàng không ở trạng thái chờ thanh toán!' });
            }

            // Xác nhận thanh toán và cập nhật trạng thái
            await connection.query(
                'UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ?',
                ['confirmed', id]
            );

            // Update stock - CHỈ cho COD orders vì online payments đã được confirm ngay khi tạo
            if (order.payment_method === 'cod') {
                const [orderItems] = await connection.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                    [id]
                );

                for (const item of orderItems) {
                    await connection.query(
                        'UPDATE products SET stock = stock - ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            // Xử lý coupon
            if (order.coupon_code && order.discount_amount > 0) {
                try {
                    const [coupons] = await connection.query(
                        'SELECT id FROM coupons WHERE code = ?',
                        [order.coupon_code]
                    );
                    if (coupons.length > 0) {
                        await connection.query(
                            'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                            [coupons[0].id]
                        );
                        await connection.query(
                            'INSERT INTO user_coupons (user_id, coupon_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
                            [req.session.user_id, coupons[0].id, id, order.discount_amount]
                        );
                    }
                } catch (e) {
                    console.error('Coupon update error:', e);
                }
            }

            // Clear cart - chỉ xóa những sản phẩm đã đặt trong order này
            if (order.cart_item_ids) {
                const idsToDelete = order.cart_item_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);
                if (idsToDelete.length > 0) {
                    await connection.query('DELETE FROM cart WHERE id IN (?) AND user_id = ?', [idsToDelete, req.session.user_id]);
                }
            } else {
                // Backward compat: nếu order cũ không có cart_item_ids, xóa hết
                await connection.query('DELETE FROM cart WHERE user_id = ?', [req.session.user_id]);
            }

            await connection.commit();
            connection.release();

            // Gửi email xác nhận đơn hàng (async, không block response)
            (async () => {
                try {
                    const [userInfo] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.user_id]);
                    const [orderItems] = await pool.query(
                        `SELECT oi.*, p.name 
                         FROM order_items oi 
                         JOIN products p ON oi.product_id = p.id 
                         WHERE oi.order_id = ?`,
                        [id]
                    );
                    
                    if (userInfo.length > 0) {
                        const orderData = {
                            id: id,
                            payment_code: order.payment_code,
                            total_price: order.total_price,
                            shipping_fee: order.shipping_fee,
                            discount_amount: order.discount_amount,
                            shipping_name: order.shipping_name,
                            shipping_phone: order.shipping_phone,
                            shipping_address: order.shipping_address,
                            created_at: order.created_at,
                            status: 'confirmed'
                        };
                        await sendOrderEmail(orderData, userInfo[0], orderItems);
                    }
                } catch (emailError) {
                    console.error('Lỗi gửi email xác nhận:', emailError.message);
                }
            })();

            res.json({
                success: true,
                order_id: id,
                message: 'Thanh toán thành công! Đơn hàng đã được xác nhận.'
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('Complete order error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi: ' + error.message });
    }
});

module.exports = router;
