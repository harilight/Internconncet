const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/chat/contacts/:userId (List all recent chat contacts for a user with role filtering)
router.get('/contacts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [userRes] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
        const userRole = userRes[0] ? userRes[0].role : null;

        let roleCondition = 'u.id != ?';
        if (userRole === 'industry') {
            // Industry recruiters ONLY see Students and College Placement Cells (no competitor companies)
            roleCondition = "u.id != ? AND u.role != 'industry'";
        } else if (userRole === 'college') {
            // College Placement Cells ONLY see Industry Recruiters and Students (no competitor colleges)
            roleCondition = "u.id != ? AND u.role != 'college'";
        } else if (userRole === 'student') {
            // Students ONLY see Industry Recruiters and College Placement Cells (no random peer students)
            roleCondition = "u.id != ? AND (u.role = 'industry' OR u.role = 'college')";
        }

        const [contacts] = await pool.query(`
            SELECT u.id, u.name, u.role,
                   COALESCE(ip.company_name, cp.institution_name, 'Student Candidate') as company,
                   COALESCE(ip.badge_color, '#4d8dff') as badge_color
            FROM users u 
            LEFT JOIN industry_profiles ip ON u.id = ip.user_id
            LEFT JOIN college_profiles cp ON u.id = cp.user_id
            WHERE ${roleCondition}
        `, [userId]);

        res.json({ success: true, contacts });
    } catch (err) {
        console.error('Fetch Contacts Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching contacts.' });
    }
});

// GET /api/chat/:userId/:contactId (Get conversation between two users)
router.get('/:userId/:contactId', async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        const [messages] = await pool.query(`
            SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?) 
            ORDER BY sent_at ASC
        `, [userId, contactId, contactId, userId]);

        res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        console.error('Fetch Chat Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching chat history.' });
    }
});

// POST /api/chat/messages (Send a message & trigger notification)
router.post('/messages', async (req, res) => {
    try {
        const { sender_id, receiver_id, message_text } = req.body;
        if (!sender_id || !receiver_id || !message_text) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const [result] = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
            [sender_id, receiver_id, message_text]
        );

        // Fetch sender name for notification
        const [senderRows] = await pool.query('SELECT name FROM users WHERE id = ?', [sender_id]);
        const senderName = senderRows.length > 0 ? senderRows[0].name : 'A Recruiter';

        // Fetch receiver role to determine correct chat link
        const [receiverRows] = await pool.query('SELECT role FROM users WHERE id = ?', [receiver_id]);
        const receiverRole = receiverRows.length > 0 ? receiverRows[0].role : 'student';
        const targetLink = receiverRole === 'industry' ? 'industry_chat.html' : (receiverRole === 'college' ? 'college_chat.html' : 'chat.html');

        // Insert notification for receiver
        const [notifRes] = await pool.query(
            'INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, "message", ?, ?, ?)',
            [receiver_id, `💬 Message from ${senderName}`, message_text.substring(0, 80), targetLink]
        );

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${receiver_id}`).emit('new_message', {
                id: result.insertId,
                sender_id,
                receiver_id,
                message_text,
                sender_name: senderName,
                sent_at: new Date()
            });
            io.to(`user_${receiver_id}`).emit('new_notification', {
                id: notifRes.insertId,
                user_id: receiver_id,
                type: 'message',
                title: `💬 Message from ${senderName}`,
                description: message_text.substring(0, 80),
                link: targetLink,
                is_read: 0,
                created_at: new Date()
            });
        }

        res.status(201).json({ success: true, messageId: result.insertId });
    } catch (err) {
        console.error('Post Message Error:', err);
        res.status(500).json({ success: false, message: 'Server error sending message.' });
    }
});

module.exports = router;
