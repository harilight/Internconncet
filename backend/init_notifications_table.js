const pool = require('./db');

async function setupNotifications() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) DEFAULT 'system',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                link VARCHAR(255) DEFAULT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check if table is empty
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM notifications');
        if (rows[0].count === 0) {
            await pool.query(`
                INSERT INTO notifications (user_id, type, title, description, link) VALUES
                (1, 'interview', '🎯 Interview Scheduled with Google', 'Google LLC HR scheduled your technical interview for Oct 1 at 2 PM.', 'myapplications.html'),
                (1, 'application', '🎉 Application Shortlisted!', 'Microsoft India shortlisted your profile for AI & Systems Engineering Intern.', 'myapplications.html'),
                (1, 'message', '💬 New Message from Recruiter', 'Aman Verma sent you feedback on your resume draft.', 'chat.html'),
                (1, 'system', '⚡ Profile Score Updated', 'Your profile completeness reached 85%. Add project links to hit 100%.', 'settings.html')
            `);
            console.log('Inserted initial sample notifications!');
        }
        console.log('Notifications table setup completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error setting up notifications table:', err);
        process.exit(1);
    }
}

setupNotifications();
