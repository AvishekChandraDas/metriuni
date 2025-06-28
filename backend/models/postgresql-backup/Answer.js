const pool = require('../config/database');

class Answer {
  static async create(answerData) {
    const { 
      questionId, 
      authorId, 
      content, 
      isAnonymous = false 
    } = answerData;
    
    const query = `
      INSERT INTO answers (question_id, author_id, content, is_anonymous)
      VALUES ($1, $2, $3, $4)
      RETURNING id, question_id, author_id, content, is_anonymous, votes, is_accepted, created_at
    `;
    
    const values = [questionId, authorId, content, isAnonymous];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT a.*, u.name as author_name, u.avatar_url as author_avatar
      FROM answers a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByQuestionId(questionId, limit = 50, offset = 0) {
    const query = `
      SELECT a.*, u.name as author_name, u.avatar_url as author_avatar
      FROM answers a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.question_id = $1
      ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [questionId, limit, offset]);
    return result.rows;
  }

  static async update(id, answerData) {
    const { content } = answerData;
    const query = `
      UPDATE answers 
      SET content = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, question_id, author_id, content, is_anonymous, votes, is_accepted, updated_at
    `;
    const result = await pool.query(query, [id, content]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM answers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async vote(answerId, userId, voteType) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already voted on this answer
      const existingVote = await client.query(
        'SELECT vote_type FROM answer_votes WHERE answer_id = $1 AND user_id = $2',
        [answerId, userId]
      );

      let voteChange = 0;
      if (existingVote.rows.length > 0) {
        const currentVote = existingVote.rows[0].vote_type;
        if (currentVote === voteType) {
          // Remove vote if clicking same vote type
          await client.query(
            'DELETE FROM answer_votes WHERE answer_id = $1 AND user_id = $2',
            [answerId, userId]
          );
          voteChange = voteType === 'up' ? -1 : 1;
        } else {
          // Change vote type
          await client.query(
            'UPDATE answer_votes SET vote_type = $3 WHERE answer_id = $1 AND user_id = $2',
            [answerId, userId, voteType]
          );
          voteChange = voteType === 'up' ? 2 : -2;
        }
      } else {
        // New vote
        await client.query(
          'INSERT INTO answer_votes (answer_id, user_id, vote_type) VALUES ($1, $2, $3)',
          [answerId, userId, voteType]
        );
        voteChange = voteType === 'up' ? 1 : -1;
      }

      // Update answer votes count
      const updatedAnswer = await client.query(
        'UPDATE answers SET votes = votes + $2 WHERE id = $1 RETURNING votes',
        [answerId, voteChange]
      );

      await client.query('COMMIT');
      return updatedAnswer.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async markAsAccepted(answerId, questionId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify user owns the question
      const question = await client.query(
        'SELECT author_id FROM questions WHERE id = $1',
        [questionId]
      );

      if (!question.rows.length || question.rows[0].author_id !== userId) {
        throw new Error('Only question author can accept answers');
      }

      // Unmark any previously accepted answers for this question
      await client.query(
        'UPDATE answers SET is_accepted = false WHERE question_id = $1',
        [questionId]
      );

      // Mark the selected answer as accepted
      const result = await client.query(
        'UPDATE answers SET is_accepted = true WHERE id = $1 AND question_id = $2 RETURNING *',
        [answerId, questionId]
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

  static async getByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT a.*, q.title as question_title, q.subject as question_subject
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.author_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getUserVote(answerId, userId) {
    const query = 'SELECT vote_type FROM answer_votes WHERE answer_id = $1 AND user_id = $2';
    const result = await pool.query(query, [answerId, userId]);
    return result.rows[0]?.vote_type || null;
  }
}

module.exports = Answer;
