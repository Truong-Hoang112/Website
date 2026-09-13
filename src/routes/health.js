const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'unavailable' });
    }
});

module.exports = router;
