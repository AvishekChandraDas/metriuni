const pool = require('../config/database');

class Post {
  static async create(postData) {
    const { authorId, content, mediaUrls = [], isBot = false } = postData;
    
    const query = `
      INSERT INTO posts (author_id, content, media_urls, is_bot)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [authorId, content, JSON.stringify(mediaUrls), isBot];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getFeed(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count,
             MAX(CASE WHEN l.user_id = $1 THEN 1 ELSE 0 END) as user_liked
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN follows f ON p.author_id = f.following_id AND f.follower_id = $1
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.author_id = $1 OR f.follower_id = $1 OR p.is_bot = true
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.author_id = $1
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async update(id, updateData) {
    const { content, mediaUrls } = updateData;
    const query = `
      UPDATE posts 
      SET content = $1, media_urls = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [content, JSON.stringify(mediaUrls), id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM posts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async like(userId, postId) {
    const checkQuery = 'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2';
    const existing = await pool.query(checkQuery, [userId, postId]);

    if (existing.rows.length > 0) {
      // Unlike
      const deleteQuery = 'DELETE FROM likes WHERE user_id = $1 AND post_id = $2';
      await pool.query(deleteQuery, [userId, postId]);
      return { liked: false };
    } else {
      // Like
      const insertQuery = 'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) RETURNING *';
      await pool.query(insertQuery, [userId, postId]);
      return { liked: true };
    }
  }

  static async getLikes(postId) {
    const query = `
      SELECT u.id, u.name, u.avatar_url
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, [postId]);
    return result.rows;
  }

  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async search(searchTerm, userId = null, limit = 20) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count,
             MAX(CASE WHEN ul.user_id = $3 THEN 1 ELSE 0 END) as user_liked
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = $3
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE (p.content ILIKE $1 OR u.name ILIKE $1 OR u.department ILIKE $1 OR u.batch ILIKE $1)
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY p.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, limit, userId]);
    return result.rows;
  }

  static async getByUserId(authorId, viewerId = null, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
             u.department, u.batch,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count,
             MAX(CASE WHEN ul.user_id = $2 THEN 1 ELSE 0 END) as user_liked
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = $2
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.author_id = $1
      GROUP BY p.id, u.name, u.avatar_url, u.department, u.batch
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [authorId, viewerId, limit, offset]);
    return result.rows;
  }
}

module.exports = Post;
