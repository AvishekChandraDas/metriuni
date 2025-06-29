const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
const { connectDB } = require('./config/database');

// Import security middleware
const { generalLimiter, authLimiter, uploadLimiter, cors, helmet } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const filesRoutes = require('./routes/files');
const healthRoutes = require('./routes/health');

const app = express();
const server = http.createServer(app);

// Trust proxy for Railway deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Socket.IO with proper CORS
const io = new socketIo.Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Security Middleware - Apply early in the middleware stack
app.use(helmet); // Security headers
app.use(cors); // CORS with our security configuration
app.use(compression()); // Gzip compression

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'public')));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
// General rate limiting for all API routes
app.use('/api', generalLimiter);

// Specific rate limiting for auth routes
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', filesRoutes);

// Health check routes
app.use('/', healthRoutes);

// Simple health check that always works (doesn't depend on database)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MetroUni API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: Math.floor(process.uptime())
  });
});

// Database-aware health check
app.get('/api/health/full', (req, res) => {
  const healthStatus = {
    status: 'OK', 
    service: 'MetroUni API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    uptime: Math.floor(process.uptime())
  };
  
  res.json(healthStatus);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join conversation rooms for real-time chat
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Try to connect to MongoDB, but don't fail if it's not available
    try {
      await connectDB();
    } catch (dbError) {
      console.error('⚠️ Database connection failed, but starting server anyway:', dbError.message);
      console.log('📝 Make sure to set MONGODB_URI environment variable');
    }
    
    // Start the server regardless of database status
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MetroUni server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🍃 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };
