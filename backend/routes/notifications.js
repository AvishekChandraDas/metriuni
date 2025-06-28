const express = require('express');
const { verifyJwt } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const Notification = require('../models/Notification');
const PushNotification = require('../models/PushNotification');
const pushService = require('../services/pushNotificationService');
const router = express.Router();

// Get user's notifications
router.get('/', verifyJwt, validatePagination, async (req, res) => {
  try {
    const notifications = await Notification.getByUser(
      req.user.id, 
      req.pagination.limit, 
      req.pagination.offset
    );
    
    res.json({
      notifications,
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        hasMore: notifications.length === req.pagination.limit
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread notifications
router.get('/unread', verifyJwt, async (req, res) => {
  try {
    const notifications = await Notification.getUnreadByUser(req.user.id);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ error: 'Failed to get unread notifications' });
  }
});

// Get unread count only
router.get('/unread/count', verifyJwt, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', verifyJwt, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await Notification.markAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', verifyJwt, async (req, res) => {
  try {
    const updatedCount = await Notification.markAllAsRead(req.user.id);
    
    res.json({
      message: 'All notifications marked as read',
      updatedCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', verifyJwt, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // First check if notification exists and belongs to user
    const notifications = await Notification.getByUser(req.user.id, 1, 0);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const success = await Notification.delete(notificationId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete notification' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Push Notification Routes

// Subscribe to push notifications
router.post('/push/subscribe', verifyJwt, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    await PushNotification.subscribePushNotification(req.user.id, subscription);
    
    res.json({ 
      message: 'Successfully subscribed to push notifications',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key'
    });
  } catch (error) {
    console.error('Subscribe to push notifications error:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

// Unsubscribe from push notifications
router.post('/push/unsubscribe', verifyJwt, async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    await PushNotification.removeSubscription(req.user.id, endpoint);
    
    res.json({ message: 'Successfully unsubscribed from push notifications' });
  } catch (error) {
    console.error('Unsubscribe from push notifications error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
  }
});

// Get notification settings
router.get('/settings', verifyJwt, async (req, res) => {
  try {
    const settings = await PushNotification.getNotificationSettings(req.user.id);
    res.json({ settings });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update notification settings
router.put('/settings', verifyJwt, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    await PushNotification.updateNotificationSettings(req.user.id, settings);
    
    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Test notification (for development)
router.post('/push/test', verifyJwt, async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test notification from MetroUni!' } = req.body;
    
    const success = await pushService.sendNotification(req.user.id, {
      title,
      body,
      icon: '/icons/test-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'test',
        url: '/notifications'
      }
    }, 'general');

    if (success) {
      res.json({ message: 'Test notification sent successfully' });
    } else {
      res.status(400).json({ error: 'Failed to send test notification' });
    }
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ 
    publicKey: process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key'
  });
});

module.exports = router;
