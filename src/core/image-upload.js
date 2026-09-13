const path = require('path');

const mimeByExtension = new Map([
    ['.jpg', new Set(['image/jpeg'])],
    ['.jpeg', new Set(['image/jpeg'])],
    ['.png', new Set(['image/png'])],
    ['.gif', new Set(['image/gif'])],
    ['.webp', new Set(['image/webp'])]
]);

function isAllowedImage(file) {
    const extension = path.extname(file?.originalname || '').toLowerCase();
    return mimeByExtension.get(extension)?.has(String(file?.mimetype || '').toLowerCase()) || false;
}

module.exports = { isAllowedImage };
