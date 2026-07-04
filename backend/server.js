const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db');

// Import route modules
const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');
const resourceRoutes = require('./routes/resources');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Enable CORS so HTML pages opened locally or via live-server can make requests
app.use(cors());
app.use(express.json());

// Serve PDF files statically
app.use('/materialspdfs', express.static(path.join(__dirname, '../materialspdfs')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Endpoint
app.get('/api/status', (req, res) => {
    res.json({ success: true, message: 'InternConnect Backend API is running smoothly 🚀' });
});

// =========================================================
// Real-Time Socket.io Setup (For chat.html)
// =========================================================
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for local development
        methods: ["GET", "POST"]
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    console.log('🔗 User connected via Socket.io:', socket.id);

    // Join a room based on user ID for personal messaging
    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room.`);
    });

    // Handle real-time message sending
    socket.on('send_message', async (data) => {
        const { senderId, receiverId, messageText } = data;
        
        try {
            // Save message to MySQL
            const [result] = await pool.query(
                'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
                [senderId, receiverId, messageText]
            );

            const newMessage = {
                id: result.insertId,
                sender_id: senderId,
                receiver_id: receiverId,
                message_text: messageText,
                sent_at: new Date()
            };

            // Emit instantly to receiver's socket room
            io.to(`user_${receiverId}`).emit('receive_message', newMessage);
            // Also confirm back to sender
            socket.emit('message_sent', newMessage);
        } catch (err) {
            console.error('Socket message error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 InternConnect Server running on port ${PORT}`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/status`);
    console.log(`======================================================\n`);
});
