function createRateLimiter({ windowMs, max, message = 'Bạn thao tác quá nhanh. Vui lòng thử lại sau!' }) {
    const clients = new Map();
    let lastCleanup = Date.now();

    return function rateLimit(req, res, next) {
        const now = Date.now();
        if (now - lastCleanup > windowMs) {
            for (const [key, value] of clients) {
                if (value.resetAt <= now) clients.delete(key);
            }
            lastCleanup = now;
        }

        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        let record = clients.get(key);
        if (!record || record.resetAt <= now) {
            record = { count: 0, resetAt: now + windowMs };
            clients.set(key, record);
        }
        record.count++;

        const remaining = Math.max(0, max - record.count);
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', remaining);
        res.setHeader('RateLimit-Reset', Math.ceil(record.resetAt / 1000));
        if (record.count > max) {
            res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
            return res.status(429).json({ error: message });
        }
        next();
    };
}

const apiRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 });
const loginRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau!' });
const passwordResetRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Bạn đã yêu cầu quá nhiều mã xác nhận. Vui lòng thử lại sau!' });

module.exports = { createRateLimiter, apiRateLimit, loginRateLimit, passwordResetRateLimit };
