const pool = require('../config/database');

class StudyGroup {
  static async create(groupData) {
    const {
      name,
      description,
      subject,
      isPrivate = false,
      maxMembers = 20,
      creatorId,
      tags = []
    } = groupData;

    const query = `
      INSERT INTO study_groups (name, description, subject, is_private, max_members, creator_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, subject, is_private, max_members, 
                creator_id, tags, member_count, created_at
    `;

    const values = [name, description, subject, isPrivate, maxMembers, creatorId, JSON.stringify(tags)];
    const result = await pool.query(query, values);
    
    // Add creator as admin member
    await pool.query(
      'INSERT INTO study_group_members (study_group_id, user_id, role, status) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, creatorId, 'admin', 'accepted']
    );

    // Update member count
    await pool.query(
      'UPDATE study_groups SET member_count = 1 WHERE id = $1',
      [result.rows[0].id]
    );

    const group = result.rows[0];
    group.tags = JSON.parse(group.tags || '[]');
    return group;
  }

  static async findById(id, userId = null) {
    const query = `
      SELECT sg.*, u.name as creator_name, u.avatar_url as creator_avatar,
             CASE WHEN $2 IS NOT NULL THEN 
               (SELECT role FROM study_group_members WHERE study_group_id = sg.id AND user_id = $2 AND status = 'accepted')
             END as user_role,
             CASE WHEN $2 IS NOT NULL THEN 
               (SELECT status FROM study_group_members WHERE study_group_id = sg.id AND user_id = $2)
             END as user_status
      FROM study_groups sg
      LEFT JOIN users u ON sg.creator_id = u.id
      WHERE sg.id = $1
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
      isPrivate = false,
      sortBy = 'recent',
      limit = 20,
      offset = 0
    } = filters;

    let query = `
      SELECT sg.*, u.name as creator_name, u.avatar_url as creator_avatar
      FROM study_groups sg
      LEFT JOIN users u ON sg.creator_id = u.id
      WHERE sg.is_private = $1
    `;
    const values = [isPrivate];
    let valueIndex = 2;

    // Apply filters
    if (subject) {
      query += ` AND sg.subject ILIKE $${valueIndex++}`;
      values.push(`%${subject}%`);
    }

    if (search) {
      query += ` AND (sg.name ILIKE $${valueIndex++} OR sg.description ILIKE $${valueIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    if (tags && tags.length > 0) {
      query += ` AND sg.tags::jsonb ?| $${valueIndex++}`;
      values.push(tags);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query += ' ORDER BY sg.member_count DESC, sg.created_at DESC';
        break;
      case 'name':
        query += ' ORDER BY sg.name ASC';
        break;
      default:
        query += ' ORDER BY sg.created_at DESC';
    }

    query += ` LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async update(id, groupData) {
    const { name, description, subject, isPrivate, maxMembers, tags } = groupData;
    
    const query = `
      UPDATE study_groups 
      SET name = $2, description = $3, subject = $4, is_private = $5, 
          max_members = $6, tags = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, description, subject, is_private, max_members, 
                creator_id, tags, member_count, updated_at
    `;
    
    const result = await pool.query(query, [
      id, name, description, subject, isPrivate, maxMembers, JSON.stringify(tags)
    ]);
    
    if (result.rows[0]) {
      result.rows[0].tags = JSON.parse(result.rows[0].tags || '[]');
    }
    
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM study_groups WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getMembers(groupId, limit = 50, offset = 0) {
    const query = `
      SELECT sgm.*, u.id as user_id, u.name, u.email, u.avatar_url, u.course, u.year_of_study
      FROM study_group_members sgm
      JOIN users u ON sgm.user_id = u.id
      WHERE sgm.study_group_id = $1 AND sgm.status = 'accepted'
      ORDER BY 
        CASE sgm.role 
          WHEN 'admin' THEN 1 
          WHEN 'moderator' THEN 2 
          ELSE 3 
        END,
        sgm.joined_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [groupId, limit, offset]);
    return result.rows;
  }

  static async getPendingRequests(groupId, limit = 20, offset = 0) {
    const query = `
      SELECT sgm.*, u.id as user_id, u.name, u.email, u.avatar_url, u.course, u.year_of_study
      FROM study_group_members sgm
      JOIN users u ON sgm.user_id = u.id
      WHERE sgm.study_group_id = $1 AND sgm.status = 'pending'
      ORDER BY sgm.requested_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [groupId, limit, offset]);
    return result.rows;
  }

  static async requestToJoin(groupId, userId, message = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is already a member or has pending request
      const existingMember = await client.query(
        'SELECT status FROM study_group_members WHERE study_group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (existingMember.rows.length > 0) {
        const status = existingMember.rows[0].status;
        if (status === 'accepted') {
          throw new Error('Already a member of this group');
        } else if (status === 'pending') {
          throw new Error('Join request already pending');
        }
      }

      // Check if group has space
      const group = await client.query(
        'SELECT member_count, max_members, is_private FROM study_groups WHERE id = $1',
        [groupId]
      );

      if (!group.rows.length) {
        throw new Error('Study group not found');
      }

      const { member_count, max_members, is_private } = group.rows[0];
      if (member_count >= max_members) {
        throw new Error('Study group is full');
      }

      // For public groups, auto-accept. For private groups, set as pending
      const status = is_private ? 'pending' : 'accepted';
      const role = 'member';

      await client.query(
        `INSERT INTO study_group_members 
         (study_group_id, user_id, role, status, message, requested_at, joined_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, ${status === 'accepted' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
        [groupId, userId, role, status, message]
      );

      // If auto-accepted, update member count
      if (status === 'accepted') {
        await client.query(
          'UPDATE study_groups SET member_count = member_count + 1 WHERE id = $1',
          [groupId]
        );
      }

      await client.query('COMMIT');
      return { status, message: status === 'accepted' ? 'Joined successfully' : 'Request sent' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async approveRequest(groupId, userId, approverId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify approver has permission
      const approver = await client.query(
        'SELECT role FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
        [groupId, approverId, 'accepted']
      );

      if (!approver.rows.length || !['admin', 'moderator'].includes(approver.rows[0].role)) {
        throw new Error('Not authorized to approve requests');
      }

      // Check if group has space
      const group = await client.query(
        'SELECT member_count, max_members FROM study_groups WHERE id = $1',
        [groupId]
      );

      const { member_count, max_members } = group.rows[0];
      if (member_count >= max_members) {
        throw new Error('Study group is full');
      }

      // Update request status
      const result = await client.query(
        `UPDATE study_group_members 
         SET status = 'accepted', joined_at = CURRENT_TIMESTAMP
         WHERE study_group_id = $1 AND user_id = $2 AND status = 'pending'
         RETURNING *`,
        [groupId, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('No pending request found');
      }

      // Update member count
      await client.query(
        'UPDATE study_groups SET member_count = member_count + 1 WHERE id = $1',
        [groupId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectRequest(groupId, userId, rejecterId) {
    // Verify rejecter has permission
    const rejecter = await pool.query(
      'SELECT role FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
      [groupId, rejecterId, 'accepted']
    );

    if (!rejecter.rows.length || !['admin', 'moderator'].includes(rejecter.rows[0].role)) {
      throw new Error('Not authorized to reject requests');
    }

    const result = await pool.query(
      'DELETE FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
      [groupId, userId, 'pending']
    );

    return result.rowCount > 0;
  }

  static async removeMember(groupId, userId, removerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get member and remover info
      const member = await client.query(
        'SELECT role FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
        [groupId, userId, 'accepted']
      );

      const remover = await client.query(
        'SELECT role FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
        [groupId, removerId, 'accepted']
      );

      if (!member.rows.length) {
        throw new Error('Member not found');
      }

      if (!remover.rows.length) {
        throw new Error('Not authorized');
      }

      const memberRole = member.rows[0].role;
      const removerRole = remover.rows[0].role;

      // Check permissions
      if (userId === removerId) {
        // Self-removal is always allowed (leaving group)
      } else if (removerRole === 'admin') {
        // Admins can remove anyone except other admins
        if (memberRole === 'admin') {
          throw new Error('Cannot remove admin members');
        }
      } else if (removerRole === 'moderator') {
        // Moderators can only remove regular members
        if (memberRole !== 'member') {
          throw new Error('Cannot remove admin or moderator members');
        }
      } else {
        throw new Error('Not authorized to remove members');
      }

      // Remove member
      await client.query(
        'DELETE FROM study_group_members WHERE study_group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      // Update member count
      await client.query(
        'UPDATE study_groups SET member_count = member_count - 1 WHERE id = $1',
        [groupId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateMemberRole(groupId, userId, newRole, updaterId) {
    // Verify updater has permission (only admins can change roles)
    const updater = await pool.query(
      'SELECT role FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 AND status = $3',
      [groupId, updaterId, 'accepted']
    );

    if (!updater.rows.length || updater.rows[0].role !== 'admin') {
      throw new Error('Only admins can change member roles');
    }

    if (!['member', 'moderator', 'admin'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    const result = await pool.query(
      'UPDATE study_group_members SET role = $3 WHERE study_group_id = $1 AND user_id = $2 AND status = $4 RETURNING *',
      [groupId, userId, newRole, 'accepted']
    );

    return result.rows[0];
  }

  static async getUserGroups(userId, limit = 20, offset = 0) {
    const query = `
      SELECT sg.*, sgm.role, sgm.joined_at, u.name as creator_name
      FROM study_groups sg
      JOIN study_group_members sgm ON sg.id = sgm.study_group_id
      LEFT JOIN users u ON sg.creator_id = u.id
      WHERE sgm.user_id = $1 AND sgm.status = 'accepted'
      ORDER BY sgm.joined_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }));
  }

  static async canAccess(groupId, userId) {
    const query = `
      SELECT sg.is_private, sgm.status
      FROM study_groups sg
      LEFT JOIN study_group_members sgm ON sg.id = sgm.study_group_id AND sgm.user_id = $2
      WHERE sg.id = $1
    `;
    
    const result = await pool.query(query, [groupId, userId]);
    const group = result.rows[0];
    
    if (!group) return false;
    
    // Public groups can be viewed by anyone
    if (!group.is_private) return true;
    
    // Private groups require membership
    return group.status === 'accepted';
  }

  static async getGroupStats(groupId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM study_group_members WHERE study_group_id = $1 AND status = 'accepted') as member_count,
        (SELECT COUNT(*) FROM study_group_members WHERE study_group_id = $1 AND status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM files WHERE study_group_id = $1) as file_count,
        (SELECT COUNT(*) FROM chat_messages cm 
         JOIN chat_rooms cr ON cm.room_id = cr.id 
         WHERE cr.study_group_id = $1) as message_count
    `;
    
    const result = await pool.query(query, [groupId]);
    return result.rows[0];
  }
}

module.exports = StudyGroup;
