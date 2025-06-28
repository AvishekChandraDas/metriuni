const express = require('express');
const { verifyJwt } = require('../middleware/auth');
const { validate, validatePagination, schemas } = require('../middleware/validation');
const Chat = require('../models/Chat');
const User = require('../models/User');
const router = express.Router();

// Get user's conversations
router.get('/', verifyJwt, validatePagination, async (req, res) => {
  try {
    const conversations = await Chat.getUserConversations(
      req.user.id, 
      req.pagination.limit, 
      req.pagination.offset
    );

    // Enrich conversations with participant details
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          // Handle both string and object participants
          let participants;
          if (typeof conv.participants === 'string') {
            participants = JSON.parse(conv.participants);
          } else if (Array.isArray(conv.participants)) {
            participants = conv.participants;
          } else if (conv.participants_text) {
            participants = JSON.parse(conv.participants_text);
          } else {
            console.error('Could not parse participants:', conv.participants);
            throw new Error('Invalid participants format');
          }
          
          const otherUserId = participants.find(id => id !== req.user.id);
          const otherUser = await User.findById(otherUserId);
          
          return {
            ...conv,
            otherUser: otherUser ? {
              id: otherUser.id,
              name: otherUser.name,
              avatarUrl: otherUser.avatar_url,
              department: otherUser.department,
              batch: otherUser.batch
            } : null,
            unread_count: parseInt(conv.unread_count)
          };
        } catch (error) {
          console.error('Error parsing conversation participants:', error);
          return {
            ...conv,
            otherUser: null,
            unread_count: parseInt(conv.unread_count)
          };
        }
      })
    );

    res.json({
      conversations: enrichedConversations,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: conversations.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Start or get conversation with a user
router.post('/start', verifyJwt, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId || userId === req.user.id) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists and is approved
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.status !== 'approved') {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Chat.findConversation(req.user.id, userId);
    
    if (!conversation) {
      // Create new conversation
      conversation = await Chat.createConversation([req.user.id, userId]);
    }

    res.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: targetUser.id,
          name: targetUser.name,
          avatarUrl: targetUser.avatar_url,
          department: targetUser.department,
          batch: targetUser.batch
        }
      }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Get messages in a conversation
router.get('/:conversationId/messages', verifyJwt, validatePagination, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    // Verify user is part of this conversation
    const conversation = await Chat.findConversation(req.user.id, req.user.id);
    // This is a simplified check - in real implementation, check if user is in participants
    
    const messages = await Chat.getMessages(
      conversationId, 
      req.user.id, 
      req.pagination.limit, 
      req.pagination.offset
    );

    res.json({
      messages,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: messages.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/:conversationId/messages', verifyJwt, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { content, messageType = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await Chat.sendMessage(conversationId, req.user.id, content.trim(), messageType);

    // Get sender info for real-time emission
    const sender = await User.findById(req.user.id);
    const messageWithSender = {
      ...message,
      sender_name: sender.name,
      sender_avatar: sender.avatar_url
    };

    // Emit real-time message to conversation participants
    if (req.io) {
      // Get conversation participants (simplified - in real implementation, get from DB)
      req.io.to(`conversation_${conversationId}`).emit('new_message', messageWithSender);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageWithSender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:conversationId/read', verifyJwt, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    await Chat.markMessagesAsRead(conversationId, req.user.id);
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread/count', verifyJwt, async (req, res) => {
  try {
    const unreadCount = await Chat.getUnreadMessageCount(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Delete a message
router.delete('/messages/:messageId', verifyJwt, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const deleted = await Chat.deleteMessage(messageId, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get user's chat rooms (new format for updated frontend)
router.get('/rooms', verifyJwt, validatePagination, async (req, res) => {
  try {
    const conversations = await Chat.getUserConversations(
      req.user.id, 
      req.pagination.limit, 
      req.pagination.offset
    );

    // Transform to new format
    const rooms = await Promise.all(
      conversations.map(async (conv) => {
        const participants = JSON.parse(conv.participants);
        const otherUserId = participants.find(id => id !== req.user.id);
        const otherUser = await User.findById(otherUserId);
        
        return {
          id: conv.id,
          name: conv.name || `Chat with ${otherUser?.name || 'Unknown'}`,
          type: conv.type,
          participants: participants,
          last_message: conv.last_message ? {
            content: conv.last_message,
            created_at: conv.last_message_at,
            sender_name: conv.last_message_sender || 'Unknown'
          } : null,
          unread_count: parseInt(conv.unread_count) || 0
        };
      })
    );

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get chat rooms' 
    });
  }
});

// Create new chat room
router.post('/rooms', verifyJwt, async (req, res) => {
  try {
    const { name, type = 'private', participantIds = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    // Add creator to participants
    const allParticipants = [...new Set([req.user.id, ...participantIds])];

    const room = await Chat.createRoom({
      name,
      type,
      createdBy: req.user.id,
      participants: allParticipants
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room'
    });
  }
});

// Get messages for a room (new format)
router.get('/rooms/:id/messages', verifyJwt, validatePagination, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const messages = await Chat.getMessages(
      roomId,
      req.pagination.limit,
      req.pagination.offset
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

// Send message to a room (new format)
router.post('/rooms/:id/messages', verifyJwt, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await Chat.sendMessage({
      conversationId: roomId,
      senderId: req.user.id,
      content: content.trim(),
      messageType: 'text'
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send room message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

module.exports = router;
