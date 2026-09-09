const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Create order
router.post('/', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { shipping_name, shipping_phone, shipping_address, payment_method, notes } = req.body;
        const user_id = req.session.user_id;

        if (!shipping_name || !shipping_phone || !shipping_address) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin giao hàng!' });
        }

        // Get cart items
        const [cartItems] = await pool.query(
            `SELECT c.*, p.price, p.stock, p.name 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ?`,
            [user_id]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Giỏ hàng trống!' });
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
        const final_total = total + shipping_fee;

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
                `INSERT INTO orders (user_id, payment_code, total_price, shipping_fee, shipping_name, shipping_phone, shipping_address, notes, payment_method, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, payment_code, final_total, shipping_fee, shipping_name, shipping_phone, shipping_address, notes || '', payment_method, initialStatus]
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

            // Clear cart
            await connection.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                order_id,
                payment_code,
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
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
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

module.exports = router;
