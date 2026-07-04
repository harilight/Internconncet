const express = require('express');
const router = express.Router();
const pool = require('../db');

// In-Memory API Response Cache for High-Traffic Internships Feed
const internshipsCache = {
    data: null,
    timestamp: 0,
    TTL: 15000 // 15 seconds TTL
};

// GET /api/internships (Search & Filter)
router.get('/', async (req, res) => {
    try {
        const { search, location, work_type } = req.query;
        const isUnfiltered = !search && !location && !work_type;

        // Serve from fast RAM cache if unfiltered and within TTL
        if (isUnfiltered && internshipsCache.data && (Date.now() - internshipsCache.timestamp < internshipsCache.TTL)) {
            return res.json({ success: true, count: internshipsCache.data.length, internships: internshipsCache.data, cached: true });
        }

        let query = 'SELECT * FROM internships WHERE status = "active"';
        const params = [];

        if (search) {
            query += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }
        if (work_type) {
            query += ' AND work_type = ?';
            params.push(work_type);
        }

        query += ' ORDER BY posted_at DESC';

        const [rows] = await pool.query(query, params);
        if (isUnfiltered) {
            internshipsCache.data = rows;
            internshipsCache.timestamp = Date.now();
        }
        res.json({ success: true, count: rows.length, internships: rows, cached: false });
    } catch (err) {
        console.error('Fetch Internships Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching internships.' });
    }
});

// GET /api/internships/:id (Single Internship details & increment views)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE internships SET views_count = views_count + 1 WHERE id = ?', [id]);
        const [rows] = await pool.query('SELECT * FROM internships WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Internship not found.' });
        }
        res.json({ success: true, internship: rows[0] });
    } catch (err) {
        console.error('Fetch Single Internship Error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/internships (Post a new internship - Employer role)
router.post('/', async (req, res) => {
    try {
        const { employer_id, title, company_name, location, stipend, duration, work_type, description, requirements, skills_required } = req.body;
        
        if (!employer_id || !title || !company_name || !location || !stipend || !duration) {
            return res.status(400).json({ success: false, message: 'Required fields are missing.' });
        }

        const skillsJson = JSON.stringify(skills_required || []);
        const [result] = await pool.query(
            'INSERT INTO internships (employer_id, title, company_name, location, stipend, duration, work_type, description, requirements, skills_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [employer_id, title, company_name, location, stipend, duration, work_type || 'Remote', description || '', requirements || '', skillsJson]
        );
        internshipsCache.data = null; // Invalidate cache

        // Notify College TPO (user_id 2)
        const [cNotif] = await pool.query(
            'INSERT INTO notifications (user_id, type, title, description, link) VALUES (2, "drive", ?, ?, "manage_internships.html")',
            [`🏢 New Placement Opportunity: ${title}`, `${company_name} posted a new internship drive offering ₹${stipend}/mo.`]
        );
        // Notify Student (user_id 1)
        const [sNotif] = await pool.query(
            'INSERT INTO notifications (user_id, type, title, description, link) VALUES (1, "system", ?, ?, "dashboard.html")',
            [`🚀 New Opportunity Posted: ${title}`, `${company_name} is hiring interns in ${location}. Check it out now!`]
        );

        const io = req.app.get('io');
        if (io) {
            io.to('user_2').emit('new_notification', {
                id: cNotif.insertId,
                user_id: 2,
                type: 'drive',
                title: `🏢 New Placement Opportunity: ${title}`,
                description: `${company_name} posted a new internship drive offering ₹${stipend}/mo.`,
                link: 'manage_internships.html',
                is_read: 0,
                created_at: new Date()
            });
            io.to('user_1').emit('new_notification', {
                id: sNotif.insertId,
                user_id: 1,
                type: 'system',
                title: `🚀 New Opportunity Posted: ${title}`,
                description: `${company_name} is hiring interns in ${location}. Check it out now!`,
                link: 'dashboard.html',
                is_read: 0,
                created_at: new Date()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Internship posted successfully!',
            internshipId: result.insertId
        });
    } catch (err) {
        console.error('Post Internship Error:', err);
        res.status(500).json({ success: false, message: 'Server error posting internship.' });
    }
});

module.exports = router;
