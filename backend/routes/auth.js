const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate, schemas } = require('../middleware/validation');
const User = require('../models/User');
const fileStorage = require('../services/fileStorage');
const router = express.Router();

// Register
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      muStudentId, 
      department, 
      batch,
      idCardPhotoUrl,
      idCardPhoto, // base64 encoded image data
      phoneNumber,
      address,
      dateOfBirth
    } = req.validatedData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Process ID card photo if provided
    let processedIdCardUrl = idCardPhotoUrl;
    if (idCardPhoto && !idCardPhotoUrl) {
      try {
        const photoResult = await fileStorage.processUpload(idCardPhoto, {
          userId: email, // Use email as temp userId since user not created yet
          type: 'id-card'
        });
        processedIdCardUrl = photoResult.url;
      } catch (error) {
        console.error('Error processing ID card photo:', error);
        return res.status(400).json({ error: 'Invalid ID card photo format' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with pending status
    const user = await User.create({
      name,
      email,
      passwordHash,
      muStudentId,
      department,
      batch,
      idCardPhotoUrl: processedIdCardUrl,
      phoneNumber,
      address,
      dateOfBirth,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Registration submitted successfully. Please wait for admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        muStudentId: user.mu_student_id,
        department: user.department,
        batch: user.batch,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user with password
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved
    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please wait for approval.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Your account has been rejected. Please contact support.',
        status: 'rejected',
        rejectionReason: user.rejection_reason
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        muStudentId: user.mu_student_id,
        department: user.department,
        batch: user.batch,
        role: user.role,
        avatarUrl: user.avatar_url,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        muStudentId: user.mu_student_id,
        department: user.department,
        batch: user.batch,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

module.exports = router;
