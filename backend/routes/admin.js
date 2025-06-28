const express = require('express');
const { verifyJwt, verifyAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const router = express.Router();

// Apply admin middleware to all routes
router.use(verifyJwt, verifyAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total users
      User.getAll(1, 0, true).then(users => ({ totalUsers: users.length })),
      
      // Total posts
      Post.getAll(1, 0).then(posts => ({ totalPosts: posts.length })),
      
      // Recent activity (last 7 days)
      // This would need more sophisticated queries in a real app
      User.getAll(10, 0, true).then(recentUsers => ({ recentUsers })),
      Post.getAll(10, 0).then(recentPosts => ({ recentPosts }))
    ]);

    const dashboardStats = stats.reduce((acc, stat) => ({ ...acc, ...stat }), {});

    res.json(dashboardStats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get all users with pagination
router.get('/users', validatePagination, async (req, res) => {
  try {
    const users = await User.getAll(req.pagination.limit, req.pagination.offset, true);
    
    // Get additional info for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const followCounts = await User.getFollowCounts(user.id);
      const userPosts = await Post.getByUser(user.id, 5, 0); // Recent 5 posts
      
      return {
        ...user,
        followersCount: parseInt(followCounts.followers_count),
        followingCount: parseInt(followCounts.following_count),
        postsCount: userPosts.length
      };
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: users.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [followCounts, posts, comments] = await Promise.all([
      User.getFollowCounts(userId),
      Post.getByUser(userId, 20, 0),
      Comment.getByUser(userId, 20, 0)
    ]);

    res.json({
      user,
      stats: {
        followersCount: parseInt(followCounts.followers_count),
        followingCount: parseInt(followCounts.following_count),
        postsCount: posts.length,
        commentsCount: comments.length
      },
      recentPosts: posts.slice(0, 5),
      recentComments: comments.slice(0, 5)
    });
  } catch (error) {
    console.error('Get admin user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user (admin can update any user)
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const allowedFields = ['name', 'department', 'batch', 'role', 'avatar_url'];
    
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedUser = await User.update(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const success = await User.delete(userId);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all posts with pagination
router.get('/posts', validatePagination, async (req, res) => {
  try {
    const posts = await Post.getAll(req.pagination.limit, req.pagination.offset);
    
    res.json({
      posts,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: posts.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get admin posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Delete any post
router.delete('/posts/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const success = await Post.delete(postId);
    
    if (!success) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get reported content (would need a reports table in a real app)
router.get('/reports', validatePagination, async (req, res) => {
  try {
    // For now, return empty reports
    // In a real app, you'd have a reports table with reported posts/comments
    res.json({
      reports: [],
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Search content (posts, users, comments)
router.get('/search', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.adminSearch(query, 10);
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.search(query, 10);
    }

    res.json({
      query,
      results
    });
  } catch (error) {
    console.error('Admin search error:', error);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

// Send system notification to all users
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { message, link = '/', type = 'system' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get all users
    const users = await User.getAll(1000, 0, true); // Adjust limit as needed
    
    const notifications = users.map(user => ({
      userId: user.id,
      message: message.trim(),
      link,
      type
    }));

    if (notifications.length > 0) {
      await Notification.createBulk(notifications);
      
      // Emit real-time notifications to all connected users
      if (req.io) {
        users.forEach(user => {
          req.io.to(`user_${user.id}`).emit('notification', {
            type,
            message: message.trim(),
            link,
            createdAt: new Date()
          });
        });
      }
    }

    res.json({
      message: 'Broadcast notification sent successfully',
      recipientCount: notifications.length
    });
  } catch (error) {
    console.error('Admin broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// Get pending registrations for approval
router.get('/pending-registrations', validatePagination, async (req, res) => {
  try {
    const pendingUsers = await User.getPendingRegistrations(
      req.pagination.limit, 
      req.pagination.offset
    );

    res.json({
      users: pendingUsers,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: pendingUsers.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

// Get approval statistics
router.get('/approval-stats', async (req, res) => {
  try {
    const stats = await User.getApprovalStats();
    res.json({
      pending: parseInt(stats.pending_count),
      approved: parseInt(stats.approved_count),
      rejected: parseInt(stats.rejected_count),
      total: parseInt(stats.total_count)
    });
  } catch (error) {
    console.error('Get approval stats error:', error);
    res.status(500).json({ error: 'Failed to get approval statistics' });
  }
});

// Approve user registration
router.post('/approve-user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const approvedBy = req.user.id;

    const approvedUser = await User.approveUser(userId, approvedBy);
    
    if (!approvedUser) {
      return res.status(404).json({ error: 'User not found or already processed' });
    }

    // Send notification to approved user (if notification system exists)
    if (req.io) {
      req.io.emit(`user_${userId}`, {
        type: 'approval',
        message: 'Your account has been approved! You can now log in.',
        timestamp: new Date()
      });
    }

    res.json({
      message: 'User approved successfully',
      user: approvedUser
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user registration
router.post('/reject-user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const approvedBy = req.user.id;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const rejectedUser = await User.rejectUser(userId, approvedBy, reason.trim());
    
    if (!rejectedUser) {
      return res.status(404).json({ error: 'User not found or already processed' });
    }

    // Send notification to rejected user (if notification system exists)
    if (req.io) {
      req.io.emit(`user_${userId}`, {
        type: 'rejection',
        message: `Your account registration has been rejected. Reason: ${reason}`,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'User rejected successfully',
      user: rejectedUser
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

module.exports = router;
