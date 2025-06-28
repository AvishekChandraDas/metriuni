const express = require('express');
const { verifyJwt, optionalAuth } = require('../middleware/auth');
const { validate, validatePagination, schemas } = require('../middleware/validation');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const router = express.Router();

// Get feed (posts from followed users and bots) with optional search
router.get('/', verifyJwt, validatePagination, async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    let posts, users = [];

    if (searchQuery && searchQuery.trim()) {
      // Search both posts and users
      const trimmedQuery = searchQuery.trim();
      posts = await Post.search(trimmedQuery, req.user.id, req.pagination.limit);
      users = await User.search(trimmedQuery, Math.min(req.pagination.limit, 10)); // Limit users to 10 max
    } else {
      // Get regular feed
      posts = await Post.getFeed(req.user.id, req.pagination.limit, req.pagination.offset);
    }
    
    res.json({
      posts,
      users,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: posts.length === req.pagination.limit
      },
      searchQuery: searchQuery || ''
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Create post
router.post('/', verifyJwt, validate(schemas.createPost), async (req, res) => {
  try {
    const postData = {
      ...req.validatedData,
      authorId: req.user.id
    };

    const post = await Post.create(postData);
    
    // Get the complete post with author info
    const completePost = await Post.findById(post.id);

    // Notify followers about the new post
    const followers = await User.getFollowers(req.user.id);
    const notifications = followers.map(follower => ({
      userId: follower.id,
      message: `${req.user.name} created a new post`,
      link: `/posts/${post.id}`,
      type: 'post'
    }));

    if (notifications.length > 0) {
      await Notification.createBulk(notifications);
      
      // Emit real-time notifications
      if (req.io) {
        followers.forEach(follower => {
          req.io.to(`user_${follower.id}`).emit('notification', {
            type: 'post',
            message: `${req.user.name} created a new post`,
            link: `/posts/${post.id}`,
            createdAt: new Date()
          });
        });
      }
    }

    res.status(201).json({
      message: 'Post created successfully',
      post: completePost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get single post with comments
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get comments for the post
    const comments = await Comment.getByPost(postId, req.user?.id);

    res.json({
      post,
      comments
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Update post (own posts only)
router.put('/:postId', verifyJwt, validate(schemas.updatePost), async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit your own posts' });
    }

    const updatedPost = await Post.update(postId, req.validatedData);
    const completePost = await Post.findById(postId);

    res.json({
      message: 'Post updated successfully',
      post: completePost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post (own posts only or admin)
router.delete('/:postId', verifyJwt, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Can only delete your own posts' });
    }

    const success = await Post.delete(postId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/Unlike post
router.post('/:postId/like', verifyJwt, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await Post.like(req.user.id, postId);

    // Create notification if post was liked (not unliked) and it's not the user's own post
    if (result.liked && post.author_id !== req.user.id) {
      await Notification.createLikeNotification(post.author_id, req.user.name, postId);
      
      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${post.author_id}`).emit('notification', {
          type: 'like',
          message: `${req.user.name} liked your post`,
          link: `/posts/${postId}`,
          createdAt: new Date()
        });
      }
    }

    res.json({
      message: result.liked ? 'Post liked' : 'Post unliked',
      liked: result.liked
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get post likes
router.get('/:postId/likes', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const likes = await Post.getLikes(postId);
    
    res.json({
      likes,
      total: likes.length
    });
  } catch (error) {
    console.error('Get post likes error:', error);
    res.status(500).json({ error: 'Failed to get post likes' });
  }
});

// Get comments for a post
router.get('/:postId/comments', optionalAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const comments = await Comment.getByPost(postId, req.user?.id);
    
    res.json({
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment to post
router.post('/:postId/comments', verifyJwt, validate(schemas.createComment), async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentData = {
      ...req.validatedData,
      postId,
      authorId: req.user.id
    };

    const comment = await Comment.create(commentData);
    const completeComment = await Comment.findById(comment.id);

    // Create notification for post author (if not commenting on own post)
    if (post.author_id !== req.user.id) {
      await Notification.createCommentNotification(post.author_id, req.user.name, postId);
      
      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${post.author_id}`).emit('notification', {
          type: 'comment',
          message: `${req.user.name} commented on your post`,
          link: `/posts/${postId}`,
          createdAt: new Date()
        });
      }
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: completeComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Bot endpoint for Telegram integration
router.post('/bot', validate(schemas.botPost), async (req, res) => {
  try {
    const { content, botToken, mediaUrls } = req.validatedData;
    
    // Verify bot token (you should set this in environment variables)
    if (botToken !== process.env.BOT_SECRET_TOKEN) {
      return res.status(401).json({ error: 'Invalid bot token' });
    }

    // Create a system/bot user if it doesn't exist
    let botUser = await User.findByEmail('bot@metro.edu');
    if (!botUser) {
      const bcrypt = require('bcryptjs');
      botUser = await User.create({
        name: 'MetroUni Bot',
        email: 'bot@metro.edu',
        passwordHash: await bcrypt.hash('system', 12),
        muStudentId: 'MU000000',
        department: 'System',
        batch: '2024',
        role: 'user'
      });
    }

    const postData = {
      authorId: botUser.id,
      content,
      mediaUrls,
      isBot: true
    };

    const post = await Post.create(postData);
    const completePost = await Post.findById(post.id);

    // Notify all users about the university update
    // For efficiency, you might want to limit this or make it opt-in
    console.log('Bot post created:', completePost.id);

    res.status(201).json({
      message: 'Bot post created successfully',
      post: completePost
    });
  } catch (error) {
    console.error('Create bot post error:', error);
    res.status(500).json({ error: 'Failed to create bot post' });
  }
});

// Get posts by user ID
router.get('/user/:userId', optionalAuth, validatePagination, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const viewerId = req.user ? req.user.id : null;
    
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const posts = await Post.getByUserId(userId, viewerId, req.pagination.limit, req.pagination.offset);
    
    res.json({
      posts,
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatar_url,
        department: user.department,
        batch: user.batch
      },
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: posts.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to get user posts' });
  }
});

module.exports = router;
