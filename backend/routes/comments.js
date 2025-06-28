const express = require('express');
const { verifyJwt } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const router = express.Router();

// Reply to a comment
router.post('/:commentId/reply', verifyJwt, validate(schemas.createComment), async (req, res) => {
  try {
    const parentCommentId = parseInt(req.params.commentId);
    const parentComment = await Comment.findById(parentCommentId);
    
    if (!parentComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = {
      ...req.validatedData,
      postId: parentComment.post_id,
      authorId: req.user.id,
      parentCommentId
    };

    const reply = await Comment.create(commentData);
    const completeReply = await Comment.findById(reply.id);

    // Create notification for original comment author (if not replying to own comment)
    if (parentComment.author_id !== req.user.id) {
      await Notification.createReplyNotification(
        parentComment.author_id, 
        req.user.name, 
        parentComment.post_id
      );
      
      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${parentComment.author_id}`).emit('notification', {
          type: 'reply',
          message: `${req.user.name} replied to your comment`,
          link: `/posts/${parentComment.post_id}`,
          createdAt: new Date()
        });
      }
    }

    res.status(201).json({
      message: 'Reply created successfully',
      comment: completeReply
    });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Update comment (own comments only)
router.put('/:commentId', verifyJwt, validate(schemas.updateComment), async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit your own comments' });
    }

    const updatedComment = await Comment.update(commentId, req.validatedData.content);
    const completeComment = await Comment.findById(commentId);

    res.json({
      message: 'Comment updated successfully',
      comment: completeComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment (own comments only or admin)
router.delete('/:commentId', verifyJwt, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }

    const success = await Comment.delete(commentId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like/Unlike comment
router.post('/:commentId/like', verifyJwt, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const result = await Comment.like(req.user.id, commentId);

    // Create notification if comment was liked (not unliked) and it's not the user's own comment
    if (result.liked && comment.author_id !== req.user.id) {
      await Notification.create({
        userId: comment.author_id,
        message: `${req.user.name} liked your comment`,
        link: `/posts/${comment.post_id}`,
        type: 'like'
      });
      
      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${comment.author_id}`).emit('notification', {
          type: 'like',
          message: `${req.user.name} liked your comment`,
          link: `/posts/${comment.post_id}`,
          createdAt: new Date()
        });
      }
    }

    res.json({
      message: result.liked ? 'Comment liked' : 'Comment unliked',
      liked: result.liked
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Get comment likes
router.get('/:commentId/likes', async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const likes = await Comment.getLikes(commentId);
    
    res.json({
      likes,
      total: likes.length
    });
  } catch (error) {
    console.error('Get comment likes error:', error);
    res.status(500).json({ error: 'Failed to get comment likes' });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const replies = await Comment.getReplies(commentId, req.user?.id);
    
    res.json({
      replies,
      total: replies.length
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to get replies' });
  }
});

module.exports = router;
