const pool = require('../config/database');

class Comment {
  static async create(commentData) {
    const { postId, authorId, content, parentCommentId = null } = commentData;
    
    const query = `
      INSERT INTO comments (post_id, author_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [postId, authorId, content, parentCommentId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT c.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN likes l ON c.id = l.comment_id
      WHERE c.id = $1
      GROUP BY c.id, u.name, u.avatar_url, u.department, u.batch
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByPost(postId, userId = null) {
    const query = `
      SELECT c.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             MAX(CASE WHEN l.user_id = $2 THEN 1 ELSE 0 END) as user_liked
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN likes l ON c.id = l.comment_id
      WHERE c.post_id = $1
      GROUP BY c.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, [postId, userId]);
    return result.rows;
  }

  static async getReplies(parentCommentId, userId = null) {
    const query = `
      SELECT c.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             MAX(CASE WHEN l.user_id = $2 THEN 1 ELSE 0 END) as user_liked
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN likes l ON c.id = l.comment_id
      WHERE c.parent_comment_id = $1
      GROUP BY c.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, [parentCommentId, userId]);
    return result.rows;
  }

  static async update(id, content) {
    const query = `
      UPDATE comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [content, id]);
    return result.rows[0];
  }

  static async delete(id) {
    // Delete all replies first
    await pool.query('DELETE FROM comments WHERE parent_comment_id = $1', [id]);
    
    // Delete the comment
    const query = 'DELETE FROM comments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async like(userId, commentId) {
    const checkQuery = 'SELECT id FROM likes WHERE user_id = $1 AND comment_id = $2';
    const existing = await pool.query(checkQuery, [userId, commentId]);

    if (existing.rows.length > 0) {
      // Unlike
      const deleteQuery = 'DELETE FROM likes WHERE user_id = $1 AND comment_id = $2';
      await pool.query(deleteQuery, [userId, commentId]);
      return { liked: false };
    } else {
      // Like
      const insertQuery = 'INSERT INTO likes (user_id, comment_id) VALUES ($1, $2) RETURNING *';
      await pool.query(insertQuery, [userId, commentId]);
      return { liked: true };
    }
  }

  static async getLikes(commentId) {
    const query = `
      SELECT u.id, u.name, u.avatar_url
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.comment_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, [commentId]);
    return result.rows;
  }

  static async getByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT c.*, u.name as author_name, u.avatar_url as author_avatar,
             p.content as post_content
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.author_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }
}

module.exports = Comment;
