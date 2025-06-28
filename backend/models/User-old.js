const pool = require('../config/database');

class User {
  static async create(userData) {
    const { 
      name, 
      email, 
      passwordHash, 
      muStudentId, 
      department, 
      batch, 
      avatarUrl = null, 
      role = 'user',
      idCardPhotoUrl = null,
      phoneNumber = null,
      address = null,
      dateOfBirth = null,
      status = 'pending'
    } = userData;
    
    const query = `
      INSERT INTO users (
        name, email, password_hash, mu_student_id, department, batch, avatar_url, role,
        id_card_photo_url, phone_number, address, date_of_birth, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, email, mu_student_id, department, batch, avatar_url, role, 
                id_card_photo_url, phone_number, address, date_of_birth, status, created_at
    `;
    
    const values = [
      name, email, passwordHash, muStudentId, department, batch, avatarUrl, role,
      idCardPhotoUrl, phoneNumber, address, dateOfBirth, status
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, mu_student_id, department, batch, avatar_url, role, 
             id_card_photo_url, phone_number, address, date_of_birth, status,
             approved_by, approved_at, rejection_reason, created_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByIdWithPassword(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, name, email, mu_student_id, department, batch, avatar_url, role, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getFollowers(userId) {
    const query = `
      SELECT u.id, u.name, u.avatar_url, u.department, u.batch
      FROM users u
      INNER JOIN follows f ON u.id = f.follower_id
      WHERE f.following_id = $1 AND u.role != 'admin' AND u.status = 'approved'
      ORDER BY f.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getFollowing(userId) {
    const query = `
      SELECT u.id, u.name, u.avatar_url, u.department, u.batch
      FROM users u
      INNER JOIN follows f ON u.id = f.following_id
      WHERE f.follower_id = $1 AND u.role != 'admin' AND u.status = 'approved'
      ORDER BY f.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getFollowCounts(userId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async isFollowing(followerId, followingId) {
    const query = 'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2';
    const result = await pool.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  }

  static async follow(followerId, followingId) {
    const query = 'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [followerId, followingId]);
    return result.rows[0];
  }

  static async unfollow(followerId, followingId) {
    const query = 'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2';
    const result = await pool.query(query, [followerId, followingId]);
    return result.rowCount > 0;
  }

  static async search(searchTerm, limit = 10) {
    let query, params;
    
    if (!searchTerm || searchTerm.trim() === '') {
      // Return all users if no search term (excluding admins for security)
      query = `
        SELECT id, name, email, department, batch, avatar_url, bio, created_at
        FROM users
        WHERE role != 'admin' AND status = 'approved'
        ORDER BY name
        LIMIT $1
      `;
      params = [limit];
    } else {
      // Search with the term (excluding admins for security)
      query = `
        SELECT id, name, email, department, batch, avatar_url, bio, created_at
        FROM users
        WHERE (name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1) 
        AND role != 'admin' AND status = 'approved'
        ORDER BY name
        LIMIT $2
      `;
      params = [`%${searchTerm}%`, limit];
    }
    
    const result = await pool.query(query, params);
    return result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      batch: user.batch,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      createdAt: user.created_at
    }));
  }

  static async adminSearch(searchTerm, limit = 10) {
    let query, params;
    
    if (!searchTerm || searchTerm.trim() === '') {
      // Return all users if no search term (including admins for admin use)
      query = `
        SELECT id, name, email, department, batch, avatar_url, bio, role, status, created_at
        FROM users
        ORDER BY name
        LIMIT $1
      `;
      params = [limit];
    } else {
      // Search with the term (including admins for admin use)
      query = `
        SELECT id, name, email, department, batch, avatar_url, bio, role, status, created_at
        FROM users
        WHERE (name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1)
        ORDER BY name
        LIMIT $2
      `;
      params = [`%${searchTerm}%`, limit];
    }
    
    const result = await pool.query(query, params);
    return result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      batch: user.batch,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role,
      status: user.status,
      createdAt: user.created_at
    }));
  }

  static async getAll(limit = 50, offset = 0, includeAdmins = false) {
    let query;
    if (includeAdmins) {
      // Include all users (for admin dashboard)
      query = `
        SELECT id, name, email, mu_student_id, department, batch, avatar_url, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
    } else {
      // Exclude admin users for security (for regular user views)
      query = `
        SELECT id, name, email, mu_student_id, department, batch, avatar_url, role, created_at
        FROM users
        WHERE role != 'admin' AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
    }
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  // Admin approval methods
  static async getPendingRegistrations(limit = 50, offset = 0) {
    const query = `
      SELECT id, name, email, mu_student_id, department, batch, avatar_url, 
             id_card_photo_url, phone_number, address, date_of_birth, status, created_at
      FROM users
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async approveUser(userId, approvedBy) {
    const query = `
      UPDATE users 
      SET status = 'approved', approved_by = $2, approved_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING id, name, email, status, approved_at
    `;
    const result = await pool.query(query, [userId, approvedBy]);
    return result.rows[0];
  }

  static async rejectUser(userId, approvedBy, rejectionReason) {
    const query = `
      UPDATE users 
      SET status = 'rejected', approved_by = $2, approved_at = CURRENT_TIMESTAMP, rejection_reason = $3
      WHERE id = $1 AND status = 'pending'
      RETURNING id, name, email, status, rejection_reason, approved_at
    `;
    const result = await pool.query(query, [userId, approvedBy, rejectionReason]);
    return result.rows[0];
  }

  static async getApprovalStats() {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(*) as total_count
      FROM users
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = User;
