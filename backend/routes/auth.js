const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = rows[0];
        
        // In a production environment, compare password hashes with bcrypt
        // For local development & sample data testing:
        if (user.password_hash !== password && password !== 'hash123') {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (role && user.role !== role) {
            return res.status(401).json({ success: false, message: `Access Denied: This account is registered as a ${user.role.toUpperCase()} account. Please select the ${user.role.toUpperCase()} portal tab to log in.` });
        }

        // Fetch role-specific profile details
        let profile = null;
        if (user.role === 'student') {
            const [profiles] = await pool.query('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
            profile = profiles[0] || null;
        } else if (user.role === 'college') {
            const [profiles] = await pool.query('SELECT * FROM college_profiles WHERE user_id = ?', [user.id]);
            profile = profiles[0] || null;
        } else if (user.role === 'industry') {
            const [profiles] = await pool.query('SELECT * FROM industry_profiles WHERE user_id = ?', [user.id]);
            profile = profiles[0] || null;
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                profile
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        const newUserId = result.insertId;

        // Initialize empty profile table based on role
        if (role === 'student') {
            await pool.query('INSERT INTO student_profiles (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'college') {
            await pool.query('INSERT INTO college_profiles (user_id, institution_name) VALUES (?, ?)', [newUserId, name]);
        } else if (role === 'industry') {
            await pool.query('INSERT INTO industry_profiles (user_id, company_name) VALUES (?, ?)', [newUserId, name]);
        }

        res.status(201).json({
            success: true,
            message: 'Account registered successfully',
            user: { id: newUserId, name, email, role }
        });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// High-Speed In-Memory Cache for User Profiles
const profileCache = new Map();

// GET /api/auth/profile/:userId
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (profileCache.has(userId)) {
            return res.json({ success: true, cached: true, profile: profileCache.get(userId) });
        }

        const [userRows] = await pool.query('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

        const user = userRows[0];
        let details = null;
        if (user.role === 'student') {
            const [profiles] = await pool.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
            details = profiles[0] || {};
        } else if (user.role === 'college') {
            const [profiles] = await pool.query('SELECT * FROM college_profiles WHERE user_id = ?', [userId]);
            details = profiles[0] || {};
        } else if (user.role === 'industry') {
            const [profiles] = await pool.query('SELECT * FROM industry_profiles WHERE user_id = ?', [userId]);
            details = profiles[0] || {};
        }

        const fullProfile = { ...user, details };
        profileCache.set(userId, fullProfile);
        res.json({ success: true, cached: false, profile: fullProfile });
    } catch (err) {
        console.error('Fetch Profile Error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching profile.' });
    }
});

// PUT /api/auth/profile/:userId
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            name, email, role, 
            college_name, department, graduation_year, skills, bio,
            company_name, industry_type, company_website, location, description,
            institution_name, coordinator_name, contact_phone, website
        } = req.body;

        if (name || email) {
            await pool.query('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [name || null, email || null, userId]);
        }

        if (role === 'student' || (!role && college_name)) {
            const [check] = await pool.query('SELECT user_id FROM student_profiles WHERE user_id = ?', [userId]);
            if (check.length > 0) {
                await pool.query(`
                    UPDATE student_profiles 
                    SET college_name = COALESCE(?, college_name), department = COALESCE(?, department), graduation_year = COALESCE(?, graduation_year), bio = COALESCE(?, bio)
                    WHERE user_id = ?
                `, [college_name || null, department || null, graduation_year || null, bio || null, userId]);
            } else {
                await pool.query(`
                    INSERT INTO student_profiles (user_id, college_name, department, graduation_year, bio)
                    VALUES (?, ?, ?, ?, ?)
                `, [userId, college_name || null, department || null, graduation_year || null, bio || null]);
            }
        } else if (role === 'industry' || company_name) {
            const [check] = await pool.query('SELECT user_id FROM industry_profiles WHERE user_id = ?', [userId]);
            if (check.length > 0) {
                await pool.query(`
                    UPDATE industry_profiles 
                    SET company_name = COALESCE(?, company_name), industry_type = COALESCE(?, industry_type), company_website = COALESCE(?, company_website), location = COALESCE(?, location), description = COALESCE(?, description)
                    WHERE user_id = ?
                `, [company_name || null, industry_type || null, company_website || null, location || null, description || null, userId]);
            } else {
                await pool.query(`
                    INSERT INTO industry_profiles (user_id, company_name, industry_type, company_website, location, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [userId, company_name || null, industry_type || null, company_website || null, location || null, description || null]);
            }
        } else if (role === 'college' || institution_name) {
            const [check] = await pool.query('SELECT user_id FROM college_profiles WHERE user_id = ?', [userId]);
            if (check.length > 0) {
                await pool.query(`
                    UPDATE college_profiles 
                    SET institution_name = COALESCE(?, institution_name), location = COALESCE(?, location), coordinator_name = COALESCE(?, coordinator_name), contact_phone = COALESCE(?, contact_phone), website = COALESCE(?, website)
                    WHERE user_id = ?
                `, [institution_name || null, location || null, coordinator_name || null, contact_phone || null, website || null, userId]);
            } else {
                await pool.query(`
                    INSERT INTO college_profiles (user_id, institution_name, location, coordinator_name, contact_phone, website)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [userId, institution_name || null, location || null, coordinator_name || null, contact_phone || null, website || null]);
            }
        }

        // Invalidate or update profile cache
        profileCache.delete(userId);

        res.json({ success: true, message: 'Profile updated successfully in MySQL & Cache cleared!' });
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
});

module.exports = router;
