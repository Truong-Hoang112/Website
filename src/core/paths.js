const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');

module.exports = {
    projectRoot,
    publicDir: path.join(projectRoot, 'public'),
    viewsDir: path.join(projectRoot, 'views')
};
