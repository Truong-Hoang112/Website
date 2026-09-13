const pool = require('../config/database');

function configureChatSocket(io, sessionMiddleware) {
    const sessions = new Map();
    io.engine.use(sessionMiddleware);

    io.use((socket, next) => {
        const session = socket.request.session;
        if (session?.user_id) {
            sessions.set(socket.id, { user_id: session.user_id, role: session.role || 'customer' });
        }
        next();
    });

    io.on('connection', socket => {
        const session = sessions.get(socket.id);
        if (session?.role === 'admin') socket.join('admin_chat');
        if (session?.role !== 'admin' && session?.user_id) socket.join(`user_${session.user_id}`);

        socket.on('check_admin_status', () => {
            const online = (io.sockets.adapter.rooms.get('admin_chat')?.size || 0) > 0;
            socket.emit('admin_status', { online });
        });

        socket.on('join_user_room', () => {
            const current = sessions.get(socket.id);
            if (current?.user_id) socket.join(`user_${current.user_id}`);
        });

        async function canAccessConversation(conversationId) {
            const current = sessions.get(socket.id);
            if (!current || !Number.isInteger(conversationId) || conversationId < 1) return false;
            if (current.role === 'admin') {
                const [rows] = await pool.query('SELECT id FROM conversations WHERE id = ? LIMIT 1', [conversationId]);
                return rows.length > 0;
            }
            const [rows] = await pool.query(
                'SELECT id FROM conversations WHERE id = ? AND user_id = ? LIMIT 1',
                [conversationId, current.user_id]
            );
            return rows.length > 0;
        }

        socket.on('join_conversation', async value => {
            const conversationId = Number(value);
            try {
                if (await canAccessConversation(conversationId)) socket.join(`conv_${conversationId}`);
            } catch (error) {
                console.error('Socket authorization error:', error.message);
            }
        });

        socket.on('leave_conversation', value => {
            const conversationId = Number(value);
            if (Number.isInteger(conversationId) && conversationId > 0) socket.leave(`conv_${conversationId}`);
        });

        socket.on('typing', data => {
            const current = sessions.get(socket.id);
            const roomMatch = typeof data?.room === 'string' ? data.room.match(/^conv_(\d+)$/) : null;
            const conversationId = Number(data?.conversation_id || roomMatch?.[1]);
            const room = `conv_${conversationId}`;
            if (!current || !Number.isInteger(conversationId) || !socket.rooms.has(room)) return;
            const sender = current.role === 'admin' ? 'admin' : 'user';
            socket.broadcast.to(room).emit('typing', { conversation_id: conversationId, sender, user: sender });
        });

        socket.on('disconnect', () => sessions.delete(socket.id));
    });
}

module.exports = configureChatSocket;
