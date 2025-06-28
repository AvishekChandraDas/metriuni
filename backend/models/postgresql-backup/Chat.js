const pool = require('../config/database');

class Chat {
  static async createConversation(participants) {
    const query = `
      INSERT INTO conversations (participants, created_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING id, participants, created_at
    `;
    const result = await pool.query(query, [JSON.stringify(participants)]);
    return result.rows[0];
  }

  static async findConversation(user1Id, user2Id) {
    const query = `
      SELECT id, participants, created_at, updated_at
      FROM conversations
      WHERE participants @> $1 AND participants @> $2
      AND jsonb_array_length(participants) = 2
      LIMIT 1
    `;
    const result = await pool.query(query, [
      JSON.stringify([user1Id]), 
      JSON.stringify([user2Id])
    ]);
    return result.rows[0];
  }

  static async getUserConversations(userId, limit = 20, offset = 0) {
    const query = `
      SELECT 
        c.id,
        c.participants::text as participants_text,
        c.participants,
        c.created_at,
        c.updated_at,
        m.content as last_message,
        m.created_at as last_message_at,
        sender.name as last_sender_name,
        COUNT(CASE WHEN m2.is_read = false AND m2.sender_id != $1 THEN 1 END) as unread_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id 
        AND m.id = (
          SELECT id FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        )
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN messages m2 ON c.id = m2.conversation_id
      WHERE c.participants @> $2
      GROUP BY c.id, c.participants, c.created_at, c.updated_at, 
               m.content, m.created_at, sender.name
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [userId, JSON.stringify([userId]), limit, offset]);
    return result.rows;
  }

  static async sendMessage(conversationId, senderId, content, messageType = 'text') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert message
      const messageQuery = `
        INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, conversation_id, sender_id, content, message_type, created_at, is_read
      `;
      const messageResult = await client.query(messageQuery, [conversationId, senderId, content, messageType]);
      
      // Update conversation timestamp
      const updateConvQuery = `
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      await client.query(updateConvQuery, [conversationId]);
      
      await client.query('COMMIT');
      return messageResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getMessages(conversationId, userId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        m.is_read,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [conversationId, limit, offset]);
    
    // Mark messages as read for the requesting user
    await this.markMessagesAsRead(conversationId, userId);
    
    return result.rows.reverse(); // Return in chronological order
  }

  static async markMessagesAsRead(conversationId, userId) {
    const query = `
      UPDATE messages 
      SET is_read = true 
      WHERE conversation_id = $1 
      AND sender_id != $2 
      AND is_read = false
    `;
    await pool.query(query, [conversationId, userId]);
  }

  static async getUnreadMessageCount(userId) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.participants @> $1
      AND m.sender_id != $2
      AND m.is_read = false
    `;
    const result = await pool.query(query, [JSON.stringify([userId]), userId]);
    return parseInt(result.rows[0].unread_count);
  }

  static async deleteMessage(messageId, userId) {
    const query = `
      UPDATE messages 
      SET content = 'Message deleted', message_type = 'deleted'
      WHERE id = $1 AND sender_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [messageId, userId]);
    return result.rowCount > 0;
  }
}

module.exports = Chat;
