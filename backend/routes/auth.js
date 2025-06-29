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

// Initialize admin user (for production setup)
router.post('/init-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findByEmail('admin@metro.edu');
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@metro.edu',
      passwordHash: adminPasswordHash,
      muStudentId: 'MU000001',
      department: 'Administration',
      batch: '2020',
      role: 'admin',
      status: 'approved' // Admin is pre-approved
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Emergency admin creation (bypasses validation)
router.post('/emergency-admin', async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findByEmail('admin@metro.edu');
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Hash password
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    
    // Direct database insert bypassing model validation
    const db = User.db;
    const result = await db.collection('users').insertOne({
      name: 'Admin User',
      email: 'admin@metro.edu',
      password_hash: adminPasswordHash,
      mu_student_id: '000-000-001',
      department: 'Administration',
      batch: '2020',
      role: 'admin',
      status: 'approved',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      message: 'Emergency admin user created successfully',
      adminId: result.insertedId
    });
  } catch (error) {
    console.error('Emergency admin creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create emergency admin user',
      details: error.message 
    });
  }
});

// Promote user to admin and approve (emergency use)
router.post('/promote-admin', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user to admin status
    const updatedUser = await User.update(user.id, {
      role: 'admin',
      status: 'approved'
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('Promote admin error:', error);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
});

// Debug login endpoint (bypass validation)
router.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Debug login attempt for:', email);
    
    // Find user with password
    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    console.log('User status:', user.status);
    console.log('User role:', user.role);

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
    console.log('Checking password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials - wrong password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Debug login successful',
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
    console.error('Debug login error:', error);
    res.status(500).json({ 
      error: 'Debug login failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Check user data endpoint
router.get('/check-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash ? user.password_hash.length : 0,
        role: user.role,
        status: user.status,
        muStudentId: user.mu_student_id,
        department: user.department,
        batch: user.batch
      }
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: 'Failed to check user', details: error.message });
  }
});

// Fix user password endpoint
router.post('/fix-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Update the user with the correct password hash
    const updatedUser = await User.update(user.id, {
      password: passwordHash
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({
      message: 'Password hash fixed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        hasPasswordHash: true
      }
    });
  } catch (error) {
    console.error('Fix password error:', error);
    res.status(500).json({ error: 'Failed to fix password', details: error.message });
  }
});

// Direct database password fix (bypasses User model)
router.post('/fix-password-direct', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Direct database update bypassing User model
    const db = require('mongoose').connection.db;
    const result = await db.collection('users').updateOne(
      { email: email },
      { 
        $set: { 
          password_hash: passwordHash,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({
      message: 'Password hash fixed directly in database',
      updated: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Direct password fix error:', error);
    res.status(500).json({ error: 'Failed to fix password directly', details: error.message });
  }
});

module.exports = router;
