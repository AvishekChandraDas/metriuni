const express = require('express');
const { verifyJwt } = require('../middleware/auth');
const router = express.Router();

// Simple test route to check if basic setup works
router.get('/', verifyJwt, async (req, res) => {
  try {
    res.json({
      conversations: [],
      pagination: {
        page: 1,
        limit: 20,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

module.exports = router;
