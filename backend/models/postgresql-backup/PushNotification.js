const pool = require('../config/database');

class PushNotification {
  static async subscribePushNotification(userId, subscription) {
    const query = `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, endpoint) 
      DO UPDATE SET p256dh_key = $3, auth_key = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    const result = await pool.query(query, [
      userId, 
      subscription.endpoint, 
      subscription.keys.p256dh, 
      subscription.keys.auth
    ]);
    return result.rows[0];
  }

  static async getUserSubscriptions(userId) {
    const query = `
      SELECT id, endpoint, p256dh_key, auth_key
      FROM push_subscriptions
      WHERE user_id = $1 AND is_active = true
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      }
    }));
  }

  static async removeSubscription(userId, endpoint) {
    const query = `
      UPDATE push_subscriptions 
      SET is_active = false 
      WHERE user_id = $1 AND endpoint = $2
    `;
    const result = await pool.query(query, [userId, endpoint]);
    return result.rowCount > 0;
  }

  static async createNotificationRecord(userId, title, body, data = {}, notificationType = 'general') {
    const query = `
      INSERT INTO push_notification_logs (
        user_id, title, body, data, notification_type, created_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const result = await pool.query(query, [
      userId, 
      title, 
      body, 
      JSON.stringify(data), 
      notificationType
    ]);
    return result.rows[0];
  }

  static async getNotificationHistory(userId, limit = 50, offset = 0) {
    const query = `
      SELECT id, title, body, data, notification_type, created_at, is_read
      FROM push_notification_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async markNotificationAsRead(notificationId, userId) {
    const query = `
      UPDATE push_notification_logs 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rowCount > 0;
  }

  static async getNotificationSettings(userId) {
    const query = `
      SELECT notification_type, is_enabled
      FROM notification_settings
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    
    // Default settings if none exist
    const defaultSettings = {
      new_message: true,
      new_post: true,
      new_comment: true,
      new_like: true,
      new_follower: true,
      study_group_invite: true,
      university_announcement: true
    };

    const userSettings = {};
    result.rows.forEach(row => {
      userSettings[row.notification_type] = row.is_enabled;
    });

    return { ...defaultSettings, ...userSettings };
  }

  static async updateNotificationSettings(userId, settings) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing settings
      await client.query('DELETE FROM notification_settings WHERE user_id = $1', [userId]);
      
      // Insert new settings
      for (const [type, enabled] of Object.entries(settings)) {
        await client.query(
          'INSERT INTO notification_settings (user_id, notification_type, is_enabled) VALUES ($1, $2, $3)',
          [userId, type, enabled]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = PushNotification;
