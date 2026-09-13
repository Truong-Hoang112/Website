const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const { sendPasswordResetOTP } = require('../config/mail');
const { projectRoot } = require('../core/paths');
const { isAllowedImage } = require('../core/image-upload');
const { loginRateLimit, passwordResetRateLimit } = require('../middleware/rate-limit');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map(); // { email: { otp, expires, attempts } }
const passwordResetRequested = {
    success: true,
    message: 'Nếu email tồn tại, bạn sẽ nhận được mã xác nhận!',
    step: 'otp_sent'
};

function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(value) {
    return value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateProfile({ full_name, phone, address, birthdate, gender }) {
    if (typeof full_name !== 'string' || !full_name.trim() || full_name.trim().length > 100) {
        return 'Họ tên phải có từ 1 đến 100 ký tự!';
    }
    if (/[<>]/.test(full_name) || /[<>]/.test(String(phone || '')) || /[<>]/.test(String(address || ''))) {
        return 'Thông tin cá nhân chứa ký tự không hợp lệ!';
    }
    if (phone != null && String(phone).length > 30) return 'Số điện thoại không hợp lệ!';
    if (address != null && String(address).length > 500) return 'Địa chỉ không được vượt quá 500 ký tự!';
    if (birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(String(birthdate))) return 'Ngày sinh không hợp lệ!';
    if (gender && !['male', 'female', 'other'].includes(String(gender))) return 'Giới tính không hợp lệ!';
    return null;
}

// Register
router.post('/register', loginRateLimit, async (req, res) => {
    try {
        const { full_name, phone, password } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }
        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ error: 'Mật khẩu phải có từ 6 đến 128 ký tự!' });
        }
        const profileError = validateProfile({ full_name, phone });
        if (profileError) return res.status(400).json({ error: profileError });
        if (!isValidEmail(email)) return res.status(400).json({ error: 'Email không hợp lệ!' });

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
            [full_name.trim(), email, phone ? String(phone).trim() : '', hashedPassword]
        );

        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Login
router.post('/login', loginRateLimit, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu!' });
        }
        if (!isValidEmail(email) || typeof password !== 'string' || password.length > 128) {
            return res.status(400).json({ error: 'Email hoặc mật khẩu không hợp lệ!' });
        }

        const [users] = await pool.query(
            'SELECT id, full_name, email, password, role FROM users WHERE email = ?',
            [email]
        );
        const user = users[0];

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng!' });
        }

        // Đổi session ID sau khi xác thực để ngăn session fixation.
        await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
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
router.post('/logout', (req, res, next) => {
    req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie('ats.sid', { path: '/' });
        res.json({ success: true });
    });
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
        const profileError = validateProfile({ full_name, phone, address, birthdate, gender });
        if (profileError) return res.status(400).json({ error: profileError });
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, address = ?, birthdate = ?, gender = ? WHERE id = ?',
            [full_name.trim(), phone ? String(phone).trim() : '', address ? String(address).trim() : null, birthdate || null, gender || null, req.session.user_id]
        );

        req.session.full_name = full_name.trim();
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
        const profileError = validateProfile({ full_name, phone, address, birthdate, gender });
        if (profileError) return res.status(400).json({ error: profileError });
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, address = ?, birthdate = ?, gender = ? WHERE id = ?',
            [full_name.trim(), phone ? String(phone).trim() : '', address ? String(address).trim() : null, birthdate || null, gender || null, req.session.user_id]
        );

        req.session.full_name = full_name.trim();
        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// ============ FORGOT PASSWORD - OTP via Email ============

// Step 1: Request OTP
router.post('/forgot-password', passwordResetRateLimit, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({ error: 'Vui lòng nhập email!' });
        }
        if (!isValidEmail(email)) return res.json(passwordResetRequested);

        // Check if user exists
        const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            // Don't reveal if email exists or not for security
            return res.json(passwordResetRequested);
        }

        const user = users[0];

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        otpStore.set(email, {
            otp: otp,
            expires: expires,
            attempts: 0,
            user_id: user.id
        });

        // Delete old tokens for this user
        // Send OTP via email
        await sendPasswordResetOTP(email, otp, 5);

        res.json(passwordResetRequested);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Step 2: Verify OTP and resend password
router.post('/reset-password', passwordResetRateLimit, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ error: 'Thông tin không hợp lệ!' });
        }

        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ error: 'Mật khẩu phải có từ 6 đến 128 ký tự!' });
        }

        const emailLower = email;
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
        if (storedOTP.otp !== String(otp)) {
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
router.post('/verify-otp', passwordResetRateLimit, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const emailLower = email;
        const storedOTP = otpStore.get(emailLower);

        if (!storedOTP) {
            return res.status(400).json({ valid: false, error: 'Mã xác nhận đã hết hạn!' });
        }

        if (Date.now() > storedOTP.expires) {
            otpStore.delete(emailLower);
            return res.status(400).json({ valid: false, error: 'Mã xác nhận đã hết hạn!' });
        }

        if (storedOTP.otp !== String(otp)) {
            storedOTP.attempts++;
            if (storedOTP.attempts >= 5) otpStore.delete(emailLower);
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

        if (typeof old_password !== 'string' || typeof new_password !== 'string' || new_password.length < 6 || new_password.length > 128 || old_password.length > 128) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có từ 6 đến 128 ký tự!' });
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
const avatarDir = path.join(projectRoot, 'public', 'uploads', 'avatars');
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
        if (isAllowedImage(file)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)!'));
    }
});

function requireLogin(req, res, next) {
    if (!req.session.user_id) return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
    next();
}

const handleAvatarUpload = (req, res, next) => avatarUpload.single('avatar')(req, res, error => {
    if (!error) return next();
    const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? 'Ảnh đại diện không được vượt quá 2MB!'
        : error.message || 'Ảnh đại diện không hợp lệ!';
    return res.status(400).json({ error: message });
});

function removeAvatarFile(avatarPath) {
    if (!avatarPath || !String(avatarPath).startsWith('/uploads/avatars/')) return;
    const filePath = path.join(avatarDir, path.basename(avatarPath));
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (error) {}
}

router.post('/upload-avatar', requireLogin, handleAvatarUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn file ảnh!' });
        }

        const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.session.user_id]);
        if (users.length === 0) {
            removeAvatarFile('/uploads/avatars/' + req.file.filename);
            return res.status(404).json({ error: 'Tài khoản không tồn tại!' });
        }
        const avatarUrl = '/uploads/avatars/' + req.file.filename;
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.session.user_id]);
        removeAvatarFile(users[0].avatar);

        res.json({
            success: true,
            message: 'Cập nhật avatar thành công!',
            avatar_url: avatarUrl
        });
    } catch (error) {
        if (req.file) removeAvatarFile('/uploads/avatars/' + req.file.filename);
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

// Xóa avatar (reset về mặc định)
router.delete('/avatar', async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
        }

        const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.session.user_id]);
        await pool.query('UPDATE users SET avatar = NULL WHERE id = ?', [req.session.user_id]);
        if (users.length > 0) removeAvatarFile(users[0].avatar);

        res.json({ success: true, message: 'Đã xóa avatar!' });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi!' });
    }
});

module.exports = router;
