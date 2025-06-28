const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    const dbCheck = await mongoose.connection.db.admin().ping();
    const dbLatency = Date.now() - startTime;
    
    // Check file system
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        type: 'MongoDB',
        connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host || 'localhost',
        database: mongoose.connection.name
      },
      checks: {
        database: {
          status: 'ok',
          latency: `${dbLatency}ms`,
          ping: dbCheck
        },
        filesystem: {
          status: 'ok',
          uploadsDir: uploadsDir
        },
        memory: {
          usage: process.memoryUsage(),
          free: require('os').freemem(),
          total: require('os').totalmem()
        }
      }
    };
    
    res.status(200).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: {
          status: 'error',
          error: error.message
        }
      }
    });
  }
});

// Ready check endpoint (for container orchestration)
router.get('/ready', async (req, res) => {
  try {
    // More strict readiness check - ensure MongoDB is connected and can query
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    // Test basic database operation
    const User = require('../models/User');
    await User.countDocuments().limit(1);
    
    res.status(200).json({ 
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Live check endpoint (for container orchestration)
router.get('/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
