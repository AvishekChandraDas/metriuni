const pool = require('../config/database');

class File {
  static async create(fileData) {
    const {
      filename,
      originalName,
      mimeType,
      size,
      filePath,
      uploaderId,
      subject,
      description,
      tags = [],
      isPublic = true,
      studyGroupId = null
    } = fileData;

    const query = `
      INSERT INTO files (
        filename, original_name, mime_type, size, file_path, 
        uploader_id, subject, description, tags, is_public, study_group_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, filename, original_name, mime_type, size, file_path,
                uploader_id, subject, description, tags, is_public, 
                study_group_id, download_count, created_at
    `;

    const values = [
      filename, originalName, mimeType, size, filePath,
      uploaderId, subject, description, JSON.stringify(tags),
      isPublic, studyGroupId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id, userId = null) {
    const query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar,
             CASE WHEN $2 IS NOT NULL THEN 
               (SELECT vote_type FROM file_votes WHERE file_id = f.id AND user_id = $2)
             END as user_vote
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.id = $1
    `;
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows[0]) {
      result.rows[0].tags = JSON.parse(result.rows[0].tags || '[]');
    }
    
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    const {
      subject,
      tags,
      search,
      mimeType,
      uploaderId,
      studyGroupId,
      isPublic = true,
      sortBy = 'recent',
      limit = 20,
      offset = 0
    } = filters;

    let query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let valueIndex = 1;

    // Apply filters
    if (isPublic !== null) {
      query += ` AND f.is_public = $${valueIndex++}`;
      values.push(isPublic);
    }

    if (subject) {
      query += ` AND f.subject ILIKE $${valueIndex++}`;
      values.push(`%${subject}%`);
    }

    if (search) {
      query += ` AND (f.original_name ILIKE $${valueIndex++} OR f.description ILIKE $${valueIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    if (mimeType) {
      query += ` AND f.mime_type ILIKE $${valueIndex++}`;
      values.push(`${mimeType}%`);
    }

    if (uploaderId) {
      query += ` AND f.uploader_id = $${valueIndex++}`;
      values.push(uploaderId);
    }

    if (studyGroupId) {
      query += ` AND f.study_group_id = $${valueIndex++}`;
      values.push(studyGroupId);
    }

    if (tags && tags.length > 0) {
      query += ` AND f.tags::jsonb ?| $${valueIndex++}`;
      values.push(tags);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query += ' ORDER BY f.download_count DESC, f.created_at DESC';
        break;
      case 'size_desc':
        query += ' ORDER BY f.size DESC';
        break;
      case 'size_asc':
        query += ' ORDER BY f.size ASC';
        break;
      case 'name':
        query += ' ORDER BY f.original_name ASC';
        break;
      default:
        query += ' ORDER BY f.created_at DESC';
    }

    query += ` LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async update(id, fileData) {
    const { description, tags, isPublic, subject } = fileData;
    
    const query = `
      UPDATE files 
      SET description = $2, tags = $3, is_public = $4, subject = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, filename, original_name, mime_type, size, file_path,
                uploader_id, subject, description, tags, is_public, 
                study_group_id, download_count, updated_at
    `;
    
    const result = await pool.query(query, [
      id, description, JSON.stringify(tags), isPublic, subject
    ]);
    
    if (result.rows[0]) {
      result.rows[0].tags = JSON.parse(result.rows[0].tags || '[]');
    }
    
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM files WHERE id = $1 RETURNING file_path';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async incrementDownloadCount(id) {
    const query = `
      UPDATE files 
      SET download_count = download_count + 1
      WHERE id = $1
      RETURNING download_count
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async vote(fileId, userId, voteType) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already voted on this file
      const existingVote = await client.query(
        'SELECT vote_type FROM file_votes WHERE file_id = $1 AND user_id = $2',
        [fileId, userId]
      );

      let voteChange = 0;
      if (existingVote.rows.length > 0) {
        const currentVote = existingVote.rows[0].vote_type;
        if (currentVote === voteType) {
          // Remove vote if clicking same vote type
          await client.query(
            'DELETE FROM file_votes WHERE file_id = $1 AND user_id = $2',
            [fileId, userId]
          );
          voteChange = voteType === 'up' ? -1 : 1;
        } else {
          // Change vote type
          await client.query(
            'UPDATE file_votes SET vote_type = $3 WHERE file_id = $1 AND user_id = $2',
            [fileId, userId, voteType]
          );
          voteChange = voteType === 'up' ? 2 : -2;
        }
      } else {
        // New vote
        await client.query(
          'INSERT INTO file_votes (file_id, user_id, vote_type) VALUES ($1, $2, $3)',
          [fileId, userId, voteType]
        );
        voteChange = voteType === 'up' ? 1 : -1;
      }

      // Update file votes count
      const updatedFile = await client.query(
        'UPDATE files SET votes = votes + $2 WHERE id = $1 RETURNING votes',
        [fileId, voteChange]
      );

      await client.query('COMMIT');
      return updatedFile.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getFilesByStudyGroup(studyGroupId, limit = 20, offset = 0) {
    const query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.study_group_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [studyGroupId, limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async getPopularFiles(limit = 10) {
    const query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.is_public = true
      ORDER BY f.download_count DESC, f.votes DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async getRecentFiles(limit = 10) {
    const query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.is_public = true
      ORDER BY f.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async getUserFiles(userId, limit = 20, offset = 0) {
    const query = `
      SELECT f.*, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.uploader_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async canAccess(fileId, userId) {
    const query = `
      SELECT f.is_public, f.uploader_id, f.study_group_id,
             CASE 
               WHEN f.study_group_id IS NOT NULL THEN
                 EXISTS(SELECT 1 FROM study_group_members sgm 
                        WHERE sgm.study_group_id = f.study_group_id AND sgm.user_id = $2)
               ELSE true
             END as has_group_access
      FROM files f
      WHERE f.id = $1
    `;
    
    const result = await pool.query(query, [fileId, userId]);
    const file = result.rows[0];
    
    if (!file) return false;
    
    // File owner can always access
    if (file.uploader_id === userId) return true;
    
    // Public files can be accessed by anyone
    if (file.is_public) return true;
    
    // Private files in study groups require membership
    if (file.study_group_id && file.has_group_access) return true;
    
    return false;
  }
}

module.exports = File;
