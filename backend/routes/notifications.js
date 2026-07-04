const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/notifications/:userId - Get persistent notifications from DB
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);

        // Also let's dynamically synthesize any unread messages into notification rows if not already present
        res.json({ success: true, count: rows.length, notifications: rows });
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching notifications' });
    }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res) => {
    try {
        const { user_id, type, title, description, link } = req.body;
        if (!user_id || !title || !description) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        const [result] = await pool.query(`
            INSERT INTO notifications (user_id, type, title, description, link)
            VALUES (?, ?, ?, ?, ?)
        `, [user_id, type || 'system', title, description, link || '#']);

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${user_id}`).emit('new_notification', {
                id: result.insertId,
                user_id,
                type: type || 'system',
                title,
                description,
                link: link || '#',
                is_read: 0,
                created_at: new Date()
            });
        }

        res.status(201).json({ success: true, notificationId: result.insertId });
    } catch (err) {
        console.error('Create notification error:', err);
        res.status(500).json({ success: false, message: 'Server error creating notification' });
    }
});

// PUT /api/notifications/mark-read/:userId - Mark all notifications as read for a user
router.put('/mark-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ success: false, message: 'Server error marking notifications read' });
    }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark single read error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/notifications/clear/:userId - Delete all notifications for a user
router.delete('/clear/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
        console.error('Clear notifications error:', err);
        res.status(500).json({ success: false, message: 'Server error clearing notifications' });
    }
});

module.exports = router;
