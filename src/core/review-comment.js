const ADMIN_REPLY_MARKER = '\n\n[[ANHTRAISTORE_ADMIN_REPLY]]\n';

function parseReviewComment(value) {
    const stored = typeof value === 'string' ? value : '';
    const markerIndex = stored.indexOf(ADMIN_REPLY_MARKER);
    if (markerIndex < 0) {
        return { comment: stored, admin_reply: '' };
    }
    return {
        comment: stored.slice(0, markerIndex).trimEnd(),
        admin_reply: stored.slice(markerIndex + ADMIN_REPLY_MARKER.length).trim()
    };
}

function serializeReviewComment(value, reply) {
    const { comment } = parseReviewComment(value);
    const normalizedReply = typeof reply === 'string' ? reply.trim() : '';
    return normalizedReply ? comment + ADMIN_REPLY_MARKER + normalizedReply : comment;
}

module.exports = { parseReviewComment, serializeReviewComment };
