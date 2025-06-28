const pool = require('../config/database');

class Question {
  static async create(questionData) {
    const { 
      authorId, 
      title, 
      content, 
      subject, 
      tags = [], 
      isAnonymous = false 
    } = questionData;
    
    const query = `
      INSERT INTO questions (
        author_id, title, content, subject, tags, is_anonymous, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, title, content, subject, tags, is_anonymous, created_at, view_count, vote_score
    `;
    
    const values = [authorId, title, content, subject, JSON.stringify(tags), isAnonymous];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id, viewerId = null) {
    const query = `
      SELECT 
        q.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.department as author_department,
        u.batch as author_batch,
        COUNT(DISTINCT a.id) as answer_count,
        COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'up') as upvotes,
        COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'down') as downvotes,
        COALESCE(uv.vote_type, null) as user_vote
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN answers a ON q.id = a.question_id
      LEFT JOIN question_votes v ON q.id = v.question_id
      LEFT JOIN question_votes uv ON q.id = uv.question_id AND uv.user_id = $2
      WHERE q.id = $1
      GROUP BY q.id, u.name, u.avatar_url, u.department, u.batch, uv.vote_type
    `;
    
    const result = await pool.query(query, [id, viewerId]);
    
    if (result.rows.length > 0) {
      // Increment view count
      await pool.query('UPDATE questions SET view_count = view_count + 1 WHERE id = $1', [id]);
    }
    
    return result.rows[0];
  }

  static async getAll(filters = {}, limit = 20, offset = 0) {
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 1;

    if (filters.subject) {
      whereClause += ` AND q.subject = $${paramCount}`;
      params.push(filters.subject);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND q.tags @> $${paramCount}`;
      params.push(JSON.stringify(filters.tags));
      paramCount++;
    }

    if (filters.search) {
      whereClause += ` AND (q.title ILIKE $${paramCount} OR q.content ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    let orderBy = 'ORDER BY q.created_at DESC';
    if (filters.sortBy === 'popular') {
      orderBy = 'ORDER BY (upvotes - downvotes) DESC, q.created_at DESC';
    } else if (filters.sortBy === 'unanswered') {
      whereClause += ' AND answer_count = 0';
    }

    const query = `
      SELECT 
        q.id,
        q.title,
        q.content,
        q.subject,
        q.tags,
        q.is_anonymous,
        q.created_at,
        q.view_count,
        CASE 
          WHEN q.is_anonymous THEN 'Anonymous'
          ELSE u.name 
        END as author_name,
        CASE 
          WHEN q.is_anonymous THEN null
          ELSE u.avatar_url 
        END as author_avatar,
        CASE 
          WHEN q.is_anonymous THEN null
          ELSE u.department 
        END as author_department,
        COUNT(DISTINCT a.id) as answer_count,
        COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'up') as upvotes,
        COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'down') as downvotes,
        (COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'up') - 
         COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 'down')) as vote_score
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN answers a ON q.id = a.question_id
      LEFT JOIN question_votes v ON q.id = v.question_id
      ${whereClause}
      GROUP BY q.id, q.title, q.content, q.subject, q.tags, q.is_anonymous, 
               q.created_at, q.view_count, u.name, u.avatar_url, u.department
      ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async vote(questionId, userId, voteType) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already voted on this question
      const existingVote = await client.query(
        'SELECT vote_type FROM question_votes WHERE question_id = $1 AND user_id = $2',
        [questionId, userId]
      );

      let voteChange = 0;
      if (existingVote.rows.length > 0) {
        const currentVote = existingVote.rows[0].vote_type;
        if (currentVote === voteType) {
          // Remove vote if clicking same vote type
          await client.query(
            'DELETE FROM question_votes WHERE question_id = $1 AND user_id = $2',
            [questionId, userId]
          );
          voteChange = voteType === 'up' ? -1 : 1;
        } else {
          // Change vote type
          await client.query(
            'UPDATE question_votes SET vote_type = $3 WHERE question_id = $1 AND user_id = $2',
            [questionId, userId, voteType]
          );
          voteChange = voteType === 'up' ? 2 : -2;
        }
      } else {
        // New vote
        await client.query(
          'INSERT INTO question_votes (question_id, user_id, vote_type) VALUES ($1, $2, $3)',
          [questionId, userId, voteType]
        );
        voteChange = voteType === 'up' ? 1 : -1;
      }

      // Update question votes count
      const updatedQuestion = await client.query(
        'UPDATE questions SET votes = votes + $2 WHERE id = $1 RETURNING votes',
        [questionId, voteChange]
      );

      await client.query('COMMIT');
      return updatedQuestion.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserVote(questionId, userId) {
    const query = 'SELECT vote_type FROM question_votes WHERE question_id = $1 AND user_id = $2';
    const result = await pool.query(query, [questionId, userId]);
    return result.rows[0]?.vote_type || null;
  }

  static async update(id, userId, updateData) {
    const { title, content, subject, tags } = updateData;
    
    const query = `
      UPDATE questions 
      SET title = $3, content = $4, subject = $5, tags = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND author_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, userId, title, content, subject, JSON.stringify(tags)]);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM questions WHERE id = $1 AND author_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  static async getPopularTags(limit = 20) {
    const query = `
      SELECT tag, COUNT(*) as count
      FROM (
        SELECT jsonb_array_elements_text(tags) as tag
        FROM questions
        WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
      ) tags
      GROUP BY tag
      ORDER BY count DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async getSubjects() {
    const query = `
      SELECT DISTINCT subject, COUNT(*) as question_count
      FROM questions
      GROUP BY subject
      ORDER BY question_count DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Question;
