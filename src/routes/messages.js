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

function supportSessionStartedAt(req) {
    const stored = req.session.support_chat_started_at;
    const parsed = stored ? new Date(stored) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
        parsed.setMilliseconds(0);
        return parsed;
    }
    const startedAt = new Date();
    startedAt.setMilliseconds(0);
    req.session.support_chat_started_at = startedAt.toISOString();
    return startedAt;
}

// ============ USER ROUTES (cần đăng nhập) ============

/**
 * GET /api/messages/conversations
 * Chỉ trả conversation đại diện của tài khoản. Lịch sử hiển thị cho khách
 * được giới hạn trong phiên đăng nhập hiện tại.
 */
router.get('/conversations', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const startedAt = supportSessionStartedAt(req);
        const [rows] = await pool.query(
            `SELECT c.id, c.contact_id, c.status, c.created_at, c.last_message_at,
                    ct.subject, ct.message as first_message,
                    (SELECT m.content FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE mc.user_id = c.user_id AND m.created_at >= ?
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_message,
                    (SELECT m.sender_type FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE mc.user_id = c.user_id AND m.created_at >= ?
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_sender,
                    (SELECT COUNT(*) FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE mc.user_id = c.user_id AND m.sender_type = 'admin'
                       AND m.is_read = 0 AND m.created_at >= ?) as unread_count
             FROM conversations c
             LEFT JOIN contacts ct ON ct.id = c.contact_id
             WHERE c.user_id = ?
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
             LIMIT 1`,
            [startedAt, startedAt, startedAt, req.session.user_id]
        );

        res.json({ success: true, conversations: rows });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

/**
 * GET /api/messages/:conversation_id
 * Khách chỉ thấy tin nhắn phát sinh trong phiên đăng nhập hiện tại.
 */
router.get('/:conversation_id', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { conversation_id } = req.params;

        // Kiểm tra quyền sở hữu
        const [conv] = await pool.query(
            `SELECT current.*
             FROM conversations requested
             JOIN conversations current ON current.user_id = requested.user_id
             WHERE requested.id = ? AND requested.user_id = ?
             ORDER BY COALESCE(current.last_message_at, current.created_at) DESC, current.id DESC
             LIMIT 1`,
            [conversation_id, req.session.user_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        const startedAt = supportSessionStartedAt(req);
        const userId = req.session.user_id;

        // Đánh dấu các tin nhắn admin của phiên hiện tại là đã đọc.
        await pool.query(
            `UPDATE messages m
             JOIN conversations related ON related.id = m.conversation_id
             SET m.is_read = 1
             WHERE related.user_id = ? AND m.sender_type = 'admin' AND m.created_at >= ?`,
            [userId, startedAt]
        );

        const [messages] = await pool.query(
            `SELECT m.id, m.sender_type, m.sender_id, m.content, m.is_read, m.created_at
             FROM messages m
             JOIN conversations related ON related.id = m.conversation_id
             WHERE related.user_id = ? AND m.created_at >= ?
             ORDER BY m.created_at ASC, m.id ASC`,
            [userId, startedAt]
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

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung!' });
        }
        if (content.length > 5000) return res.status(400).json({ error: 'Tin nhắn không được vượt quá 5000 ký tự!' });

        // Kiểm tra quyền rồi luôn ghi vào conversation đại diện mới nhất.
        const [conv] = await pool.query(
            `SELECT current.id, current.status
             FROM conversations requested
             JOIN conversations current ON current.user_id = requested.user_id
             WHERE requested.id = ? AND requested.user_id = ?
             ORDER BY COALESCE(current.last_message_at, current.created_at) DESC, current.id DESC
             LIMIT 1`,
            [conversation_id, req.session.user_id]
        );

        if (conv.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        }

        if (conv[0].status === 'closed') {
            return res.status(400).json({ error: 'Hội thoại đã đóng!' });
        }

        const targetConversationId = conv[0].id;
        const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)',
            [targetConversationId, 'user', req.session.user_id, content.trim()]
        );

        // Cập nhật last_message_at
        await pool.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
            [targetConversationId]
        );

        const [msg] = await pool.query(
            'SELECT * FROM messages WHERE id = ?',
            [result.insertId]
        );

        // Emit socket event tới admin room
        const io = req.app.get('io');
        if (io) {
            io.to('admin_chat').emit('new_message', {
                conversation_id: Number(targetConversationId),
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
 * Admin thấy đúng một hộp thoại cho mỗi tài khoản. Khách vãng lai vẫn được
 * tách theo từng liên hệ vì không có user_id để xác định danh tính.
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
                    (SELECT m.content FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE (c.user_id IS NOT NULL AND mc.user_id = c.user_id)
                        OR (c.user_id IS NULL AND mc.id = c.id)
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_message,
                    (SELECT m.sender_type FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE (c.user_id IS NOT NULL AND mc.user_id = c.user_id)
                        OR (c.user_id IS NULL AND mc.id = c.id)
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_sender,
                    (SELECT COUNT(*) FROM messages m
                     JOIN conversations mc ON mc.id = m.conversation_id
                     WHERE ((c.user_id IS NOT NULL AND mc.user_id = c.user_id)
                         OR (c.user_id IS NULL AND mc.id = c.id))
                       AND m.sender_type = 'user' AND m.is_read = 0) as unread_count
             FROM conversations c
             LEFT JOIN contacts ct ON ct.id = c.contact_id
             LEFT JOIN users u ON u.id = c.user_id
             WHERE c.user_id IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM conversations newer
                    WHERE newer.user_id = c.user_id
                      AND (
                        COALESCE(newer.last_message_at, newer.created_at) > COALESCE(c.last_message_at, c.created_at)
                        OR (COALESCE(newer.last_message_at, newer.created_at) = COALESCE(c.last_message_at, c.created_at)
                            AND newer.id > c.id)
                      )
                )
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC`
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

        const selected = conv[0];
        let messages;
        if (selected.user_id) {
            await pool.query(
                `UPDATE messages m
                 JOIN conversations related ON related.id = m.conversation_id
                 SET m.is_read = 1
                 WHERE related.user_id = ? AND m.sender_type = 'user'`,
                [selected.user_id]
            );
            [messages] = await pool.query(
                `SELECT history.id, history.sender_type, history.sender_id,
                        history.content, history.is_read, history.created_at
                 FROM (
                    SELECT m.id, m.sender_type, m.sender_id, m.content, m.is_read, m.created_at
                    FROM messages m
                    JOIN conversations related ON related.id = m.conversation_id
                    WHERE related.user_id = ?
                    UNION ALL
                    SELECT -ct.id AS id, 'user' AS sender_type, related.user_id AS sender_id,
                           ct.message AS content, 1 AS is_read, ct.created_at
                    FROM conversations related
                    JOIN contacts ct ON ct.id = related.contact_id
                    WHERE related.user_id = ?
                      AND NOT EXISTS (
                        SELECT 1 FROM messages existing
                        WHERE existing.conversation_id = related.id
                          AND existing.sender_type = 'user'
                          AND existing.content = ct.message
                      )
                 ) history
                 ORDER BY history.created_at ASC, history.id ASC`,
                [selected.user_id, selected.user_id]
            );
        } else {
            await pool.query(
                `UPDATE messages SET is_read = 1
                 WHERE conversation_id = ? AND sender_type = 'user'`,
                [conversation_id]
            );
            [messages] = await pool.query(
                `SELECT history.id, history.sender_type, history.sender_id,
                        history.content, history.is_read, history.created_at
                 FROM (
                    SELECT id, sender_type, sender_id, content, is_read, created_at
                    FROM messages
                    WHERE conversation_id = ?
                    UNION ALL
                    SELECT -ct.id AS id, 'user' AS sender_type, NULL AS sender_id,
                           ct.message AS content, 1 AS is_read, ct.created_at
                    FROM conversations related
                    JOIN contacts ct ON ct.id = related.contact_id
                    WHERE related.id = ?
                      AND NOT EXISTS (
                        SELECT 1 FROM messages existing
                        WHERE existing.conversation_id = related.id
                          AND existing.sender_type = 'user'
                          AND existing.content = ct.message
                      )
                 ) history
                 ORDER BY history.created_at ASC, history.id ASC`,
                [conversation_id, conversation_id]
            );
        }

        res.json({
            success: true,
            conversation: selected,
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

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung!' });
        }
        if (content.length > 5000) return res.status(400).json({ error: 'Tin nhắn không được vượt quá 5000 ký tự!' });

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
        const [conversations] = await pool.query('SELECT user_id FROM conversations WHERE id = ?', [conversation_id]);
        if (!conversations.length) return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        if (conversations[0].user_id) {
            await pool.query('UPDATE conversations SET status = ? WHERE user_id = ?', ['closed', conversations[0].user_id]);
        } else {
            await pool.query('UPDATE conversations SET status = ? WHERE id = ?', ['closed', conversation_id]);
        }
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
        const [conversations] = await pool.query('SELECT user_id FROM conversations WHERE id = ?', [conversation_id]);
        if (!conversations.length) return res.status(404).json({ error: 'Không tìm thấy hội thoại!' });
        if (conversations[0].user_id) {
            await pool.query('UPDATE conversations SET status = ? WHERE user_id = ?', ['open', conversations[0].user_id]);
        } else {
            await pool.query('UPDATE conversations SET status = ? WHERE id = ?', ['open', conversation_id]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Reopen conversation error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
