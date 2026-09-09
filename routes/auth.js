const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        // Check existing email
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email này đã được đăng ký!' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)',
            [full_name, email, phone || '', hashedPassword]
        );

        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu!' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng!' });
        }

        // Set session
        req.session.user_id = user.id;
        req.session.full_name = user.full_name;
        req.session.role = user.role;

        res.json({
            success: true,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Logout via GET (fallback)
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.json({ user: null });
        }

        const [users] = await pool.query(
            'SELECT id, full_name, email, phone, address, birthdate, gender, role FROM users WHERE id = ?',
            [req.session.user_id]
        );

        if (users.length === 0) {
            return res.json({ user: null });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { full_name, phone, address, birthdate, gender } = req.body;
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, address = ?, birthdate = ?, gender = ? WHERE id = ?',
            [full_name, phone, address || null, birthdate || null, gender || null, req.session.user_id]
        );

        req.session.full_name = full_name;
        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Forgot password - request reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Vui lòng nhập email!' });
        }

        // Check if user exists
        const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            // Don't reveal if email exists or not for security
            return res.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu!' });
        }

        const user = users[0];

        // Generate reset token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete old tokens for this user
        await pool.query('DELETE FROM reset_tokens WHERE user_id = ?', [user.id]);

        // Insert new token
        await pool.query(
            'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expires]
        );

        // Build reset link
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        // In production, send email here. For demo, return the link.
        console.log(`\n=== RESET PASSWORD LINK ===`);
        console.log(`Email: ${email}`);
        console.log(`Link: ${resetLink}`);
        console.log(`Expires: ${expires.toLocaleString('vi-VN')}`);
        console.log(`============================\n`);

        // TODO: Send actual email using nodemailer
        // For now, return success message
        res.json({ 
            success: true, 
            message: 'Liên kết đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email (hoặc xem console để lấy link).',
            // Remove this in production
            debug_link: resetLink
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Thông tin không hợp lệ!' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự!' });
        }

        // Find valid token
        const [tokens] = await pool.query(
            'SELECT user_id FROM reset_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Liên kết đã hết hạn hoặc không hợp lệ!' });
        }

        const userId = tokens[0].user_id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Delete used token
        await pool.query('DELETE FROM reset_tokens WHERE token = ?', [token]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
