const multer = require('multer');

function notFoundHandler(req, res) {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) {
        return res.status(404).json({ error: 'Không tìm thấy tài nguyên!' });
    }
    res.status(404).send('Không tìm thấy trang!');
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File tải lên không hợp lệ hoặc vượt quá dung lượng cho phép!' });
    }
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error.stack || error);
    const message = status < 500 && error.message ? error.message : 'Đã xảy ra lỗi trên máy chủ!';
    res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
