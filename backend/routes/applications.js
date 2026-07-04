const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/applications/student/:studentId (Student tracking their applications)
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const [rows] = await pool.query(`
            SELECT a.*, i.title, i.company_name, i.location, i.stipend, i.duration 
            FROM applications a 
            JOIN internships i ON a.internship_id = i.id 
            WHERE a.student_id = ? 
            ORDER BY a.applied_at DESC
        `, [studentId]);

        res.json({ success: true, count: rows.length, applications: rows });
    } catch (err) {
        console.error('Fetch Student Applications Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching applications.' });
    }
});

// GET /api/applications/employer/:employerId (Employer tracking candidates who applied to their internships)
router.get('/employer/:employerId', async (req, res) => {
    try {
        const { employerId } = req.params;
        const [rows] = await pool.query(`
            SELECT a.*, u.name as student_name, u.email as student_email, i.title, i.company_name 
            FROM applications a 
            JOIN internships i ON a.internship_id = i.id 
            JOIN users u ON a.student_id = u.id
            WHERE i.employer_id = ? 
            ORDER BY a.applied_at DESC
        `, [employerId]);

        res.json({ success: true, count: rows.length, applications: rows });
    } catch (err) {
        console.error('Fetch Employer Applications Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching candidates.' });
    }
});

// PUT /api/applications/:appId/status (Recruiter changes application status)
router.put('/:appId/status', async (req, res) => {
    try {
        const { appId } = req.params;
        const { status } = req.body; // e.g. 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Accepted'

        const [appRows] = await pool.query(`
            SELECT a.student_id, i.title, i.company_name 
            FROM applications a 
            JOIN internships i ON a.internship_id = i.id 
            WHERE a.id = ?
        `, [appId]);

        await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, appId]);

        if (appRows.length > 0) {
            const { student_id, title, company_name } = appRows[0];
            const [insRes] = await pool.query(
                'INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, "application", ?, ?, "myapplications.html")',
                [student_id, `🎯 Application Update: ${status}`, `${company_name} updated your application status for ${title} to "${status}".`]
            );
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${student_id}`).emit('new_notification', {
                    id: insRes.insertId,
                    user_id: student_id,
                    type: 'application',
                    title: `🎯 Application Update: ${status}`,
                    description: `${company_name} updated your application status for ${title} to "${status}".`,
                    link: 'myapplications.html',
                    is_read: 0,
                    created_at: new Date()
                });
            }
        }

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ success: false, message: 'Server error updating status.' });
    }
});

// POST /api/applications (Submit application)
router.post('/', async (req, res) => {
    try {
        const { student_id, internship_id, cover_letter, resume_link } = req.body;
        
        if (!student_id || !internship_id) {
            return res.status(400).json({ success: false, message: 'Student ID and Internship ID are required.' });
        }

        // Insert application
        await pool.query(
            'INSERT INTO applications (student_id, internship_id, cover_letter, resume_link) VALUES (?, ?, ?, ?)',
            [student_id, internship_id, cover_letter || '', resume_link || '']
        );

        // Increment application count on the internship table
        await pool.query('UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?', [internship_id]);

        // Record event for analytics timeline
        await pool.query(
            'INSERT INTO analytics_events (user_id, entity_type, entity_id, event_type, event_week) VALUES (?, "application", ?, "apply", "Current")',
            [student_id, internship_id]
        );

        // Fetch internship details for cross-role notifications
        const [internshipRows] = await pool.query('SELECT employer_id, title, company_name FROM internships WHERE id = ?', [internship_id]);
        if (internshipRows.length > 0) {
            const { employer_id, title, company_name } = internshipRows[0];
            
            // Notify Student
            const [sNotif] = await pool.query(
                'INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, "application", ?, ?, "myapplications.html")',
                [student_id, `📅 Applied for ${title}`, `You successfully applied to ${company_name}. Track status in My Applications.`]
            );
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${student_id}`).emit('new_notification', {
                    id: sNotif.insertId,
                    user_id: student_id,
                    type: 'application',
                    title: `📅 Applied for ${title}`,
                    description: `You successfully applied to ${company_name}. Track status in My Applications.`,
                    link: 'myapplications.html',
                    is_read: 0,
                    created_at: new Date()
                });
            }

            // Notify Employer
            if (employer_id) {
                const [eNotif] = await pool.query(
                    'INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, "application", ?, ?, "manage_internships.html")',
                    [employer_id, `📄 New Candidate Application`, `A student applied for your opening: ${title}`]
                );
                if (io) {
                    io.to(`user_${employer_id}`).emit('new_notification', {
                        id: eNotif.insertId,
                        user_id: employer_id,
                        type: 'application',
                        title: `📄 New Candidate Application`,
                        description: `A student applied for your opening: ${title}`,
                        link: 'manage_internships.html',
                        is_read: 0,
                        created_at: new Date()
                    });
                }
            }
        }

        res.status(201).json({ success: true, message: 'Application submitted successfully!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'You have already applied for this internship.' });
        }
        console.error('Submit Application Error:', err);
    }
});

// GET /api/applications/college/:collegeId (College tracking placed/top students)
router.get('/college/:collegeId', async (req, res) => {
    try {
        const [students] = await pool.query(`
            SELECT u.id, u.name as student_name, u.email, sp.department, sp.graduation_year, sp.overall_score, sp.profile_views 
            FROM student_profiles sp 
            JOIN users u ON sp.user_id = u.id 
            ORDER BY sp.overall_score DESC LIMIT 10
        `);
        res.json({ success: true, count: students.length, students });
    } catch (err) {
        console.error('Fetch College Students Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching college students.' });
    }
});

module.exports = router;
