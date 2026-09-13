const http = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const pool = require('./config/database');
const mail = require('./config/mail');
const { corsOrigin, port } = require('./config/runtime');
const configureChatSocket = require('./realtime/chat-socket');

function startServer() {
    const { app, sessionMiddleware } = createApp();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: corsOrigin, credentials: true },
        transports: ['websocket', 'polling']
    });
    configureChatSocket(io, sessionMiddleware);
    app.set('io', io);

    server.listen(port, async () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        await mail.testConnection();
    });

    async function shutdown(signal) {
        console.log(`${signal}: đang dừng máy chủ...`);
        io.close();
        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
    }
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    return server;
}

module.exports = { startServer };
