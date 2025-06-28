const webpush = require('web-push');
const PushNotification = require('../models/PushNotification');

class PushNotificationService {
  constructor() {
    this.isConfigured = false;
    
    try {
      // Set VAPID keys for web push
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      
      if (publicKey && privateKey && publicKey !== 'your-vapid-public-key' && privateKey !== 'your-vapid-private-key') {
        webpush.setVapidDetails(
          'mailto:admin@metrouni.edu',
          publicKey,
          privateKey
        );
        this.isConfigured = true;
        console.log('Push notifications service configured successfully');
      } else {
        console.log('Push notifications disabled - VAPID keys not configured');
      }
    } catch (error) {
      console.error('Failed to configure push notifications:', error.message);
      console.log('Push notifications will be disabled');
    }
  }

  async sendNotification(userId, payload, notificationType = 'general') {
    if (!this.isConfigured) {
      console.log('Push notifications not configured, skipping notification');
      return { success: false, message: 'Push notifications not configured' };
    }

    try {
      // Get user's push subscriptions
      const subscriptions = await PushNotification.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return false;
      }

      // Check user's notification preferences
      const settings = await PushNotification.getNotificationSettings(userId);
      if (!settings[notificationType]) {
        console.log(`User ${userId} has disabled ${notificationType} notifications`);
        return false;
      }

      // Log notification
      await PushNotification.createNotificationRecord(
        userId, 
        payload.title, 
        payload.body, 
        payload.data || {}, 
        notificationType
      );

      // Send to all user's devices
      const sendPromises = subscriptions.map(subscription => 
        webpush.sendNotification(subscription, JSON.stringify(payload))
          .catch(error => {
            console.error('Error sending push notification:', error);
            // If subscription is no longer valid, mark as inactive
            if (error.statusCode === 410) {
              PushNotification.removeSubscription(userId, subscription.endpoint);
            }
          })
      );

      await Promise.allSettled(sendPromises);
      return true;
    } catch (error) {
      console.error('Push notification service error:', error);
      return false;
    }
  }

  async sendToMultipleUsers(userIds, payload, notificationType = 'general') {
    const sendPromises = userIds.map(userId => 
      this.sendNotification(userId, payload, notificationType)
    );
    
    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
    
    console.log(`Push notifications sent to ${successCount}/${userIds.length} users`);
    return successCount;
  }

  // Predefined notification templates
  async sendNewMessageNotification(recipientId, senderName, messagePreview) {
    const payload = {
      title: 'New Message',
      body: `${senderName}: ${messagePreview}`,
      icon: '/icons/message-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'new_message',
        url: '/chat'
      },
      actions: [
        {
          action: 'view',
          title: 'View Message'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    return this.sendNotification(recipientId, payload, 'new_message');
  }

  async sendNewPostNotification(followerIds, authorName, postPreview) {
    const payload = {
      title: 'New Post',
      body: `${authorName} shared: ${postPreview}`,
      icon: '/icons/post-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'new_post',
        url: '/feed'
      }
    };

    return this.sendToMultipleUsers(followerIds, payload, 'new_post');
  }

  async sendCommentNotification(postAuthorId, commenterName, postTitle) {
    const payload = {
      title: 'New Comment',
      body: `${commenterName} commented on your post: ${postTitle}`,
      icon: '/icons/comment-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'new_comment',
        url: '/feed'
      }
    };

    return this.sendNotification(postAuthorId, payload, 'new_comment');
  }

  async sendStudyGroupInviteNotification(inviteeId, inviterName, groupName) {
    const payload = {
      title: 'Study Group Invitation',
      body: `${inviterName} invited you to join "${groupName}"`,
      icon: '/icons/study-group-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'study_group_invite',
        url: '/study-groups'
      },
      actions: [
        {
          action: 'accept',
          title: 'Accept'
        },
        {
          action: 'decline',
          title: 'Decline'
        }
      ]
    };

    return this.sendNotification(inviteeId, payload, 'study_group_invite');
  }

  async sendUniversityAnnouncementNotification(userIds, title, message) {
    const payload = {
      title: `📢 ${title}`,
      body: message,
      icon: '/icons/university-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'university_announcement',
        url: '/announcements'
      }
    };

    return this.sendToMultipleUsers(userIds, payload, 'university_announcement');
  }

  async sendFollowerNotification(followedUserId, followerName) {
    const payload = {
      title: 'New Follower',
      body: `${followerName} started following you`,
      icon: '/icons/follower-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'new_follower',
        url: '/profile'
      }
    };

    return this.sendNotification(followedUserId, payload, 'new_follower');
  }

  async sendLikeNotification(postAuthorId, likerName, postTitle) {
    const payload = {
      title: 'New Like',
      body: `${likerName} liked your post: ${postTitle}`,
      icon: '/icons/like-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'new_like',
        url: '/feed'
      }
    };

    return this.sendNotification(postAuthorId, payload, 'new_like');
  }
}

module.exports = new PushNotificationService();
