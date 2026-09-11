const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { sendPasswordResetOTP } = require('../config/mail');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map(); // { email: { otp, expires, attempts } }

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
            'SELECT id, full_name, email, phone, address, birthdate, gender, role, avatar FROM users WHERE id = ?',
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

// Alias: update-profile (backward compatibility)
router.put('/update-profile', async (req, res) => {
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

// ============ FORGOT PASSWORD - OTP via Email ============

// Step 1: Request OTP
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
            return res.json({ 
                success: true, 
                message: 'Nếu email tồn tại, bạn sẽ nhận được mã xác nhận!',
                step: 'otp_sent' // Vẫn báo thành công để tránh user enumeration
            });
        }

        const user = users[0];

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        otpStore.set(email.toLowerCase(), {
            otp: otp,
            expires: expires,
            attempts: 0,
            user_id: user.id
        });

        // Delete old tokens for this user
        await pool.query('DELETE FROM reset_tokens WHERE user_id = ?', [user.id]);

        // Send OTP via email
        const sent = await sendPasswordResetOTP(email, otp, 5);
        
        if (sent) {
            console.log(`\n=== RESET PASSWORD OTP ===`);
            console.log(`Email: ${email}`);
            console.log(`OTP: ${otp}`);
            console.log(`Expires: ${new Date(expires).toLocaleString('vi-VN')}`);
            console.log(`============================\n`);
        }

        res.json({ 
            success: true, 
            message: 'Mã xác nhận đã được gửi đến email của bạn!',
            step: 'otp_sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Step 2: Verify OTP and resend password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ error: 'Thông tin không hợp lệ!' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự!' });
        }

        const emailLower = email.toLowerCase();
        const storedOTP = otpStore.get(emailLower);

        // Check if OTP exists
        if (!storedOTP) {
            return res.status(400).json({ error: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới!' });
        }

        // Check expiration
        if (Date.now() > storedOTP.expires) {
            otpStore.delete(emailLower);
            return res.status(400).json({ error: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới!' });
        }

        // Check attempts
        if (storedOTP.attempts >= 5) {
            otpStore.delete(emailLower);
            return res.status(400).json({ error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới!' });
        }

        // Verify OTP
        if (storedOTP.otp !== otp) {
            storedOTP.attempts++;
            const attemptsLeft = 5 - storedOTP.attempts;
            return res.status(400).json({ 
                error: `Mã xác nhận không đúng! Còn ${attemptsLeft} lần thử.` 
            });
        }

        // OTP verified - Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, storedOTP.user_id]);

        // Delete used OTP
        otpStore.delete(emailLower);

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Verify OTP (check if valid without resetting password)
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const emailLower = email.toLowerCase();
        const storedOTP = otpStore.get(emailLower);

        if (!storedOTP) {
            return res.status(400).json({ valid: false, error: 'Mã xác nhận đã hết hạn!' });
        }

        if (Date.now() > storedOTP.expires) {
            otpStore.delete(emailLower);
            return res.status(400).json({ valid: false, error: 'Mã xác nhận đã hết hạn!' });
        }

        if (storedOTP.otp !== otp) {
            return res.status(400).json({ valid: false, error: 'Mã xác nhận không đúng!' });
        }

        res.json({ valid: true, message: 'Mã xác nhận hợp lệ!' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Đổi mật khẩu khi đã đăng nhập (cần mật khẩu cũ)
router.put('/change-password', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }

        if (old_password === new_password) {
            return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu cũ!' });
        }

        // Lấy thông tin user hiện tại
        const [users] = await pool.query(
            'SELECT id, password FROM users WHERE id = ?',
            [req.session.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Người dùng không tồn tại!' });
        }

        const user = users[0];

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu cũ không chính xác!' });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Cập nhật
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.user_id]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Upload avatar
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo folder uploads/avatars nếu chưa có
const avatarDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'avatar-' + req.session.user_id + '-' + Date.now() + ext);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)!'));
    }
});

router.post('/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn file ảnh!' });
        }

        // Xóa avatar cũ nếu có
        const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.session.user_id]);
        if (users.length > 0 && users[0].avatar) {
            const oldPath = path.join(__dirname, '..', 'public', users[0].avatar);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) {}
            }
        }

        // Lưu path mới
        const avatarUrl = '/uploads/avatars/' + req.file.filename;
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.session.user_id]);

        res.json({
            success: true,
            message: 'Cập nhật avatar thành công!',
            avatar_url: avatarUrl
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        if (error.message && error.message.includes('Chỉ chấp nhận')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Xóa avatar (reset về mặc định)
router.delete('/avatar', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        // Lấy avatar hiện tại
        const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.session.user_id]);
        if (users.length > 0 && users[0].avatar) {
            const oldPath = path.join(__dirname, '..', 'public', users[0].avatar);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) {}
            }
        }

        await pool.query('UPDATE users SET avatar = NULL WHERE id = ?', [req.session.user_id]);

        res.json({ success: true, message: 'Đã xóa avatar!' });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
