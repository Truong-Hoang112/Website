require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// ============ Passport Setup ============
const configureGoogleOAuth = require('./config/passport');
configureGoogleOAuth(passport);

// ============ Session ============
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'phonestore_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
});
app.use(sessionMiddleware);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Copy passport user to session (để các route dùng req.session.user_id)
app.use((req, res, next) => {
    if (req.user && req.user.id) {
        req.session.user_id = req.user.id;
        req.session.role = req.user.role || 'customer';
    }
    next();
});

// ============ Socket.IO ============
const io = new Server(server, {
    cors: { origin: '*', credentials: true },
    transports: ['websocket', 'polling']
});

// Map sessionId -> { user_id, role }
const sessionStore = new Map();

// Share express-session với Socket.IO handshake
// io.engine.use() share session store giữa HTTP và WebSocket
// -> socket.request.session sẽ có dữ liệu thật từ cookie người dùng
io.engine.use(sessionMiddleware);

io.use((socket, next) => {
    // Lấy session từ cookie kết nối socket
    const req = socket.request;
    const sess = req.session;
    if (sess && sess.user_id) {
        sessionStore.set(socket.id, { user_id: sess.user_id, role: sess.role || 'customer' });
    }
    next();
});

io.on('connection', (socket) => {
    const sess = sessionStore.get(socket.id);
    if (sess) {
        if (sess.role === 'admin') {
            socket.join('admin_chat');
            console.log(`🔌 Admin connected: ${sess.user_id} -> admin_chat room`);
        } else {
            socket.join(`user_${sess.user_id}`);
            console.log(`🔌 User connected: ${sess.user_id} -> user_${sess.user_id} room`);
        }
    } else {
        console.log('🔌 Anonymous socket connected');
    }

    // Check admin status
    socket.on('check_admin_status', () => {
        const hasAdmin = Array.from(io.sockets.adapter.rooms.get('admin_chat') || []).length > 0;
        socket.emit('admin_status', { online: hasAdmin });
    });

    // User join their room
    socket.on('join_user_room', () => {
        const sess = sessionStore.get(socket.id);
        if (sess && sess.user_id) {
            socket.join(`user_${sess.user_id}`);
        }
    });

    // User/Admin join room conversation cụ thể
    socket.on('join_conversation', (conversation_id) => {
        socket.join(`conv_${conversation_id}`);
    });

    socket.on('leave_conversation', (conversation_id) => {
        socket.leave(`conv_${conversation_id}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
        socket.broadcast.to(data.room).emit('typing', data);
    });

    socket.on('disconnect', () => {
        sessionStore.delete(socket.id);
    });
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve components FIRST (before static files)
app.use('/components', express.static(path.join(__dirname, 'views', 'components')));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images/products', express.static(path.join(__dirname, 'public', 'assets', 'images', 'products')));
app.use('/uploads/products', express.static(path.join(__dirname, 'public', 'assets', 'images', 'products')));

// Serve favicon.svg thay cho favicon.ico để tránh lỗi 404
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});
app.get('/favicon.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// View engine
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const wishlistRoutes = require('./routes/wishlist');
const couponsRoutes = require('./routes/coupons');
const messagesRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/admin', adminRoutes);

// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
        // Đăng nhập thành công - chuyển về trang chủ
        res.redirect('/');
    }
);

// Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

app.get('/promotions', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'promotions.html'));
});

app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'product-detail.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'orders.html'));
});

app.get('/order/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'order-detail.html'));
});

app.get('/wishlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'wishlist.html'));
});

app.get('/compare', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'compare.html'));
});

app.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'policy.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const mail = require('./config/mail');

server.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    const pool = require('./config/database');
    
    // Test kết nối email SMTP
    await mail.testConnection();

    // ============ Auto-migration ============
    // 1. Thêm cột user_id vào contacts nếu chưa có
    try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM contacts LIKE 'user_id'`);
        if (cols.length === 0) {
            await pool.query(`ALTER TABLE contacts ADD COLUMN user_id INT NULL AFTER id, ADD INDEX idx_user_id (user_id)`);
            console.log('✓ Added user_id column to contacts');
        }
    } catch (e) { /* column may already exist */ }

    // 2. Thêm cột subject vào contacts nếu chưa có
    try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM contacts LIKE 'subject'`);
        if (cols.length === 0) {
            await pool.query(`ALTER TABLE contacts ADD COLUMN subject VARCHAR(200) NULL AFTER phone`);
            console.log('✓ Added subject column to contacts');
        }
    } catch (e) { /* skip */ }

    // 3. Tạo bảng conversations
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                contact_id INT NOT NULL,
                user_id INT NULL,
                status ENUM('open', 'closed') DEFAULT 'open',
                last_message_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ conversations table ready');
    } catch (e) { console.log('conversations:', e.message); }

    // 4. Tạo bảng messages
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                sender_type ENUM('user', 'admin') NOT NULL,
                sender_id INT NULL,
                content TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_conversation (conversation_id),
                INDEX idx_is_read (is_read),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ messages table ready');
    } catch (e) { console.log('messages:', e.message); }

    // 5. Auto-create conversation cho các contacts đã có user_id nhưng chưa có conversation
    try {
        const [orphanContacts] = await pool.query(`
            SELECT c.id, c.user_id
            FROM contacts c
            LEFT JOIN conversations cv ON cv.contact_id = c.id
            WHERE c.user_id IS NOT NULL AND cv.id IS NULL
        `);
        for (const c of orphanContacts) {
            await pool.query(
                'INSERT INTO conversations (contact_id, user_id, status) VALUES (?, ?, ?)',
                [c.id, c.user_id, 'open']
            );
        }
        if (orphanContacts.length > 0) {
            console.log(`✓ Created ${orphanContacts.length} conversations for existing contacts`);
        }
    } catch (e) { console.log('orphan conversations:', e.message); }

    // ============ Legacy auto-alter ============
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM orders LIKE "discount_amount"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(15,0) DEFAULT 0 AFTER status');
            console.log('✓ Added discount_amount column to orders');
        }
    } catch (e) { /* column may already exist */ }

    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM orders LIKE "coupon_code"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER discount_amount');
            console.log('✓ Added coupon_code column to orders');
        }
    } catch (e) { /* column may already exist */ }

    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM orders LIKE "paid_at"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE orders ADD COLUMN paid_at DATETIME NULL AFTER cancelled_at');
            console.log('✓ Added paid_at column to orders');
        }
    } catch (e) { /* column may already exist */ }

    // Auto-seed demo coupons if none exist
    try {
        const [coupons] = await pool.query('SELECT COUNT(*) as count FROM coupons');
        if (coupons[0].count === 0) {
            const demoCoupons = [
                ['WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 1000000, 500000, 1, '2027-12-31 23:59:59'],
                ['FREESHIP', 'Miễn phí vận chuyển', 'fixed', 30000, 500000, 30000, 1, '2027-12-31 23:59:59'],
                ['VIP20', 'Giảm 20% cho khách VIP', 'percent', 20, 3000000, 1000000, 100, '2027-12-31 23:59:59'],
                ['SALE5TR', 'Giảm 500K cho đơn từ 5 triệu', 'fixed', 500000, 5000000, 500000, 50, '2027-12-31 23:59:59']
            ];
            for (const coupon of demoCoupons) {
                await pool.query(
                    `INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    coupon
                );
            }
            console.log('✓ Demo coupons seeded!');
        }
    } catch (e) {
        console.log('Coupon seed skipped (DB may not be ready)');
    }

    // Add google_id column if not exists (for Google OAuth)
    try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'google_id'`);
        if (cols.length === 0) {
            await pool.query(`ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER email`);
            console.log('✓ Added google_id column to users for Google OAuth');
        }
    } catch (e) { /* column may already exist */ }
});

module.exports = app;
