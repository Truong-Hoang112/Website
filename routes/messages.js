/**
 * routes/messages.js
 * Hệ thống chat 2 chiều giữa Admin và Khách hàng
 * - Khách đã đăng nhập gửi liên hệ → tự tạo conversation
 * - Admin reply trong trang /admin/contacts
 * - Khách nhận qua widget chat nổi ở góc phải (riêng biệt với AI chatbot)
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ============ USER ROUTES (cần đăng nhập) ============

/**
 * GET /api/messages/conversations
 * Lấy tất cả conversation của user hiện tại
 */
router.get('/conversations', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const [rows] = await pool.query(
            `SELECT c.id, c.contact_id, c.status, c.created_at, c.last_message_at,
                    ct.subject, ct.message as first_message,
                    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
                    (SELECT sender_type FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_sender,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_type = 'admin' AND is_read = 0) as unread_count
             FROM conversations c
             LEFT JOIN contacts ct ON ct.id = c.contact_id
             WHERE c.user_id = ?
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
            [req.session.user_id]
        );

        res.json({ success: true, conversations: rows });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * GET /api/messages/:conversation_id
 * Lấy toàn bộ tin nhắn trong 1 conversation
 */
router.get('/:conversation_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { conversation_id } = req.params;

        // Kiểm tra quyền sở hữu
        const [conv] = await pool.query(
            'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
            [conversation_id, req.session.user_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        // Đánh dấu tin nhắn admin là đã đọc
        await pool.query(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = ?',
            [conversation_id, 'admin']
        );

        const [messages] = await pool.query(
            `SELECT id, sender_type, sender_id, content, is_read, created_at
             FROM messages
             WHERE conversation_id = ?
             ORDER BY id ASC`,
            [conversation_id]
        );

        res.json({
            success: true,
            conversation: conv[0],
            messages: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * POST /api/messages/:conversation_id
 * User gửi tin nhắn
 */
router.post('/:conversation_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { conversation_id } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung!' });
        }

        // Kiểm tra quyền
        const [conv] = await pool.query(
            'SELECT id, status FROM conversations WHERE id = ? AND user_id = ?',
            [conversation_id, req.session.user_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        if (conv[0].status === 'closed') {
            return res.status(400).json({ error: 'Hội thoại đã đóng!' });
        }

        const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)',
            [conversation_id, 'user', req.session.user_id, content.trim()]
        );

        // Cập nhật last_message_at
        await pool.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
            [conversation_id]
        );

        const [msg] = await pool.query(
            'SELECT * FROM messages WHERE id = ?',
            [result.insertId]
        );

        // Emit socket event tới admin room
        const io = req.app.get('io');
        if (io) {
            io.to('admin_chat').emit('new_message', {
                conversation_id: parseInt(conversation_id),
                message: msg[0]
            });
        }

        res.json({ success: true, message: msg[0] });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/messages/admin/conversations
 * Admin lấy tất cả conversation
 */
router.get('/admin/conversations', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        // Check admin role
        const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (userRows.length === 0 || userRows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập!' });
        }

        const [rows] = await pool.query(
            `SELECT c.id, c.contact_id, c.user_id, c.status, c.created_at, c.last_message_at,
                    ct.full_name, ct.email, ct.subject, ct.message as first_message,
                    u.full_name as user_name, u.email as user_email, u.avatar as user_avatar,
                    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
                    (SELECT sender_type FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_sender,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_type = 'user' AND is_read = 0) as unread_count
             FROM conversations c
             LEFT JOIN contacts ct ON ct.id = c.contact_id
             LEFT JOIN users u ON u.id = c.user_id
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
        );

        res.json({ success: true, conversations: rows });
    } catch (error) {
        console.error('Admin get conversations error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * GET /api/messages/admin/:conversation_id
 * Admin xem chi tiết 1 conversation
 */
router.get('/admin/:conversation_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (userRows.length === 0 || userRows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập!' });
        }

        const { conversation_id } = req.params;

        const [conv] = await pool.query(
            `SELECT c.*, ct.full_name, ct.email, ct.phone, ct.subject, ct.message as first_message,
                    u.full_name as user_name, u.email as user_email, u.avatar as user_avatar
             FROM conversations c
             LEFT JOIN contacts ct ON ct.id = c.contact_id
             LEFT JOIN users u ON u.id = c.user_id
             WHERE c.id = ?`,
            [conversation_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        // Đánh dấu tin nhắn user là đã đọc
        await pool.query(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = ?',
            [conversation_id, 'user']
        );

        const [messages] = await pool.query(
            `SELECT id, sender_type, sender_id, content, is_read, created_at
             FROM messages
             WHERE conversation_id = ?
             ORDER BY id ASC`,
            [conversation_id]
        );

        res.json({
            success: true,
            conversation: conv[0],
            messages: messages
        });
    } catch (error) {
        console.error('Admin get messages error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * POST /api/messages/admin/:conversation_id
 * Admin gửi reply
 */
router.post('/admin/:conversation_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (userRows.length === 0 || userRows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập!' });
        }

        const { conversation_id } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung!' });
        }

        const [conv] = await pool.query(
            'SELECT id, user_id, status FROM conversations WHERE id = ?',
            [conversation_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        if (conv[0].status === 'closed') {
            return res.status(400).json({ error: 'Hội thoại đã đóng!' });
        }

        const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)',
            [conversation_id, 'admin', req.session.user_id, content.trim()]
        );

        await pool.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
            [conversation_id]
        );

        const [msg] = await pool.query(
            'SELECT * FROM messages WHERE id = ?',
            [result.insertId]
        );

        // Emit tới user
        const io = req.app.get('io');
        if (io && conv[0].user_id) {
            io.to(`user_${conv[0].user_id}`).emit('new_message', {
                conversation_id: parseInt(conversation_id),
                message: msg[0]
            });
        }

        res.json({ success: true, message: msg[0] });
    } catch (error) {
        console.error('Admin send message error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * PUT /api/messages/admin/:conversation_id/close
 * Admin đóng hội thoại
 */
router.put('/admin/:conversation_id/close', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (userRows.length === 0 || userRows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập!' });
        }

        const { conversation_id } = req.params;
        await pool.query('UPDATE conversations SET status = ? WHERE id = ?', ['closed', conversation_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Close conversation error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * PUT /api/messages/admin/:conversation_id/reopen
 * Admin mở lại hội thoại
 */
router.put('/admin/:conversation_id/reopen', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.session.user_id]);
        if (userRows.length === 0 || userRows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập!' });
        }

        const { conversation_id } = req.params;
        await pool.query('UPDATE conversations SET status = ? WHERE id = ?', ['open', conversation_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Reopen conversation error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
