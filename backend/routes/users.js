const express = require('express');
const { verifyJwt, optionalAuth } = require('../middleware/auth');
const { validate, validatePagination, validateSearch, schemas } = require('../middleware/validation');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const router = express.Router();

// Get user profile (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get follow counts
    const followCounts = await User.getFollowCounts(userId);
    
    // Check if current user is following this user
    let isFollowing = false;
    if (req.user && req.user.id !== userId) {
      isFollowing = await User.isFollowing(req.user.id, userId);
    }

    // Get user's recent posts
    const posts = await Post.getByUser(userId, 10, 0);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        muStudentId: user.mu_student_id,
        department: user.department,
        batch: user.batch,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      followersCount: parseInt(followCounts.followers_count),
      followingCount: parseInt(followCounts.following_count),
      isFollowing,
      posts
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile (own profile only)
router.put('/:id', verifyJwt, validate(schemas.updateProfile), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const updatedUser = await User.update(userId, req.validatedData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's followers
router.get('/:id/followers', validatePagination, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const followers = await User.getFollowers(userId);
    
    res.json({
      followers,
      total: followers.length
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get user's following
router.get('/:id/following', validatePagination, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const following = await User.getFollowing(userId);
    
    res.json({
      following,
      total: following.length
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Follow user
router.post('/:id/follow', verifyJwt, async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const isAlreadyFollowing = await User.isFollowing(followerId, followingId);
    if (isAlreadyFollowing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await User.follow(followerId, followingId);

    // Create notification
    await Notification.createFollowNotification(followingId, req.user.name);

    // Emit real-time notification
    if (req.io) {
      req.io.to(`user_${followingId}`).emit('notification', {
        type: 'follow',
        message: `${req.user.name} started following you`,
        link: `/profile/${req.user.id}`,
        createdAt: new Date()
      });
    }

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
router.delete('/:id/unfollow', verifyJwt, async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }

    const success = await User.unfollow(followerId, followingId);
    
    if (!success) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Search users
router.get('/', validatePagination, async (req, res) => {
  try {
    const { q: query = '' } = req.query;
    const searchTerm = query.trim();
    
    // Allow empty search for discovery page
    const users = await User.search(searchTerm, req.pagination.limit);
    
    res.json({
      users,
      total: users.length,
      query: searchTerm
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
