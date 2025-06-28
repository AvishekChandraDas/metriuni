const express = require('express');
const router = express.Router();
const { verifyJwt, optionalAuth } = require('../middleware/auth');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// Get all questions with filters
router.get('/', async (req, res) => {
  try {
    const { 
      subject, 
      tags, 
      search, 
      sortBy = 'recent', 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;
    const questions = await Question.getAll({
      subject,
      tags: tags ? tags.split(',') : null,
      search,
      sortBy,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: questions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions'
    });
  }
});

// Get single question with answers
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const offset = (page - 1) * limit;
    const answers = await Answer.findByQuestionId(id, parseInt(limit), offset);

    // If user is authenticated, get their votes
    let userVotes = {};
    if (req.user) {
      const questionVote = await Question.getUserVote(id, req.user.id);
      userVotes.question = questionVote;
      
      for (const answer of answers) {
        const answerVote = await Answer.getUserVote(answer.id, req.user.id);
        userVotes[`answer_${answer.id}`] = answerVote;
      }
    }

    res.json({
      success: true,
      data: {
        question,
        answers,
        userVotes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: answers.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question'
    });
  }
});

// Create new question
router.post('/', verifyJwt, async (req, res) => {
  try {
    const {
      title,
      content,
      subject,
      tags,
      isAnonymous = false
    } = req.body;

    if (!title || !content || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and subject are required'
      });
    }

    const questionData = {
      title,
      content,
      subject,
      tags: Array.isArray(tags) ? tags : [],
      authorId: req.user.id,
      isAnonymous
    };

    const question = await Question.create(questionData);
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question'
    });
  }
});

// Update question
router.put('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, subject, tags } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.author_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this question'
      });
    }

    const updatedQuestion = await Question.update(id, {
      title,
      content,
      subject,
      tags
    });

    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
});

// Delete question
router.delete('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    await Question.delete(id);
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
});

// Vote on question
router.post('/:id/vote', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const result = await Question.vote(id, req.user.id, voteType);
    res.json({
      success: true,
      data: { votes: result.votes }
    });
  } catch (error) {
    console.error('Error voting on question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on question'
    });
  }
});

// Create answer
router.post('/:id/answers', verifyJwt, async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const { content, isAnonymous = false } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Answer content is required'
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const answerData = {
      questionId,
      authorId: req.user.id,
      content,
      isAnonymous
    };

    const answer = await Answer.create(answerData);
    res.status(201).json({
      success: true,
      data: answer
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create answer'
    });
  }
});

// Update answer
router.put('/:questionId/answers/:answerId', verifyJwt, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    if (answer.author_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this answer'
      });
    }

    const updatedAnswer = await Answer.update(answerId, { content });
    res.json({
      success: true,
      data: updatedAnswer
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update answer'
    });
  }
});

// Delete answer
router.delete('/:questionId/answers/:answerId', verifyJwt, async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    if (answer.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer'
      });
    }

    await Answer.delete(answerId);
    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete answer'
    });
  }
});

// Vote on answer
router.post('/:questionId/answers/:answerId/vote', verifyJwt, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const result = await Answer.vote(answerId, req.user.id, voteType);
    res.json({
      success: true,
      data: { votes: result.votes }
    });
  } catch (error) {
    console.error('Error voting on answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on answer'
    });
  }
});

// Accept answer
router.post('/:questionId/answers/:answerId/accept', verifyJwt, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const acceptedAnswer = await Answer.markAsAccepted(answerId, questionId, req.user.id);
    res.json({
      success: true,
      data: acceptedAnswer
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept answer'
    });
  }
});

// Get user's questions
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const questions = await Question.getByUserId(userId, parseInt(limit), offset);
    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: questions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user questions'
    });
  }
});

// Get user's answers
router.get('/user/:userId/answers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const answers = await Answer.getByUserId(userId, parseInt(limit), offset);
    res.json({
      success: true,
      data: answers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: answers.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user answers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user answers'
    });
  }
});

module.exports = router;
