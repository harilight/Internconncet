const express = require('express');
const router = express.Router();
const pool = require('../db');

const resourcesCache = {
    data: null,
    timestamp: 0,
    TTL: 30000 // 30 seconds TTL
};

// GET /api/resources - Get all resources
router.get('/', async (req, res) => {
    try {
        if (resourcesCache.data && (Date.now() - resourcesCache.timestamp < resourcesCache.TTL)) {
            return res.json({ success: true, resources: resourcesCache.data, cached: true });
        }
        let [rows] = await pool.query('SELECT * FROM resources ORDER BY id DESC');
        
        // If DB has fewer than 10 items, seed our 14 official materialspdfs
        if (rows.length < 10) {
            const defaultPdfs = [
                { title: 'DSA Cheatsheet for Coding Rounds', category: 'Cheatsheet', link: 'materialspdfs/intern_connect_pdfs_dsa_cheatsheet_coding_rounds.pdf' },
                { title: 'Resume Building & ATS Optimization', category: 'Guideline', link: 'materialspdfs/intern_connect_pdfs_resume_building_ats_optimization.pdf' },
                { title: 'System Design Fundamentals', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_system_design_fundamentals.pdf' },
                { title: 'Tech Interview Preparation Guide 2026', category: 'Interview', link: 'materialspdfs/intern_connect_pdfs_tech_interview_preparation_guide_2026.pdf' },
                { title: 'Backend Engineering & API Design Mastery', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_backend_engineering_api_design.pdf' },
                { title: 'Frontend Engineering Interview Handbook', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_frontend_engineering_interview_handbook.pdf' },
                { title: 'Full Stack Web Dev Roadmap 2026', category: 'Roadmap', link: 'materialspdfs/intern_connect_pdfs_full_stack_web_dev_roadmap.pdf' },
                { title: 'DBMS & SQL Mastery Guide', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_dbms_sql_mastery_guide.pdf' },
                { title: 'OS & Networking Interview Handbook', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_os_networking_interview_handbook.pdf' },
                { title: 'OOP Deep Dive Handbook', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_oop_deep_dive_handbook.pdf' },
                { title: 'Machine Learning Career Guide', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_machine_learning_career_guide.pdf' },
                { title: 'Competitive Programming Strategies', category: 'Technical', link: 'materialspdfs/intern_connect_pdfs_competitive_programming_strategies.pdf' },
                { title: 'Behavioral Interview Mastery Guide', category: 'Interview', link: 'materialspdfs/intern_connect_pdfs_behavioral_interview_mastery.pdf' },
                { title: 'Git & GitHub Version Control Guide', category: 'Cheatsheet', link: 'materialspdfs/intern_connect_pdfs_git_github_version_control.pdf' }
            ];
            await pool.query('DELETE FROM resources');
            for (const pdf of defaultPdfs) {
                await pool.query('INSERT INTO resources (title, category, link, uploaded_by) VALUES (?, ?, ?, 1)', [pdf.title, pdf.category, pdf.link]);
            }
            [rows] = await pool.query('SELECT * FROM resources ORDER BY id ASC');
        }

        resourcesCache.data = rows;
        resourcesCache.timestamp = Date.now();
        res.json({ success: true, resources: rows, cached: false });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ success: false, message: 'Server error fetching resources' });
    }
});

// POST /api/resources - Add a new resource
router.post('/', async (req, res) => {
    const { title, category, link, uploaded_by } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO resources (title, category, link, uploaded_by) VALUES (?, ?, ?, ?)',
            [title, category || 'Guideline', link || '#', uploaded_by || 1]
        );
        resourcesCache.data = null; // Invalidate cache
        res.status(201).json({ success: true, resource_id: result.insertId });
    } catch (error) {
        console.error('Error adding resource:', error);
        res.status(500).json({ success: false, message: 'Server error adding resource' });
    }
});

module.exports = router;
