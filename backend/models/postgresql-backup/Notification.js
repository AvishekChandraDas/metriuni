const pool = require('../config/database');

class Notification {
  static async create(notificationData) {
    const { userId, message, link, type = 'general' } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, message, link, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [userId, message, link, type];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getByUser(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getUnreadByUser(userId) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async markAsRead(id) {
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const query = 'UPDATE notifications SET is_read = true WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rowCount;
  }

  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getUnreadCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async createBulk(notifications) {
    if (notifications.length === 0) return [];

    const values = [];
    const placeholders = [];
    
    notifications.forEach((notif, index) => {
      const base = index * 4;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      values.push(notif.userId, notif.message, notif.link, notif.type || 'general');
    });

    const query = `
      INSERT INTO notifications (user_id, message, link, type)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Helper methods for common notification types
  static async createLikeNotification(postAuthorId, likerName, postId) {
    if (!postAuthorId) return null;
    
    return this.create({
      userId: postAuthorId,
      message: `${likerName} liked your post`,
      link: `/posts/${postId}`,
      type: 'like'
    });
  }

  static async createCommentNotification(postAuthorId, commenterName, postId) {
    if (!postAuthorId) return null;
    
    return this.create({
      userId: postAuthorId,
      message: `${commenterName} commented on your post`,
      link: `/posts/${postId}`,
      type: 'comment'
    });
  }

  static async createFollowNotification(followedUserId, followerName) {
    if (!followedUserId) return null;
    
    return this.create({
      userId: followedUserId,
      message: `${followerName} started following you`,
      link: `/profile/${followerName}`,
      type: 'follow'
    });
  }

  static async createReplyNotification(commentAuthorId, replierName, postId) {
    if (!commentAuthorId) return null;
    
    return this.create({
      userId: commentAuthorId,
      message: `${replierName} replied to your comment`,
      link: `/posts/${postId}`,
      type: 'reply'
    });
  }
}

module.exports = Notification;
