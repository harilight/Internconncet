const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool (best practice for Node.js + MySQL)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'internconnect',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection and apply performance indexes
pool.getConnection()
    .then(async conn => {
        console.log('✅ Successfully connected to MySQL database: internconnect');
        await ensureDatabaseIndexes(conn);
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

async function ensureDatabaseIndexes(conn) {
    const indexes = [
        { table: 'applications', name: 'idx_app_student', col: 'student_id' },
        { table: 'applications', name: 'idx_app_internship', col: 'internship_id' },
        { table: 'applications', name: 'idx_app_status', col: 'status' },
        { table: 'notifications', name: 'idx_notif_user', col: 'user_id' },
        { table: 'internships', name: 'idx_intern_employer', col: 'employer_id' },
        { table: 'messages', name: 'idx_msg_sender', col: 'sender_id' },
        { table: 'messages', name: 'idx_msg_receiver', col: 'receiver_id' }
    ];
    for (const idx of indexes) {
        try {
            const [rows] = await conn.query(`SHOW INDEX FROM ?? WHERE Key_name = ?`, [idx.table, idx.name]);
            if (rows.length === 0) {
                await conn.query(`ALTER TABLE ?? ADD INDEX ?? (??)`, [idx.table, idx.name, idx.col]);
                console.log(`⚡ Created index ${idx.name} on table ${idx.table}(${idx.col})`);
            }
        } catch (err) {
            // Ignore if table doesn't exist yet or index error
        }
    }
}

module.exports = pool;
