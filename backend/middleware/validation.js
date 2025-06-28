const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  muStudentId: Joi.string().pattern(/^\d{3}-\d{3}-\d{3}$/).required().messages({
    'string.pattern.base': 'Student ID must be in format 232-115-304'
  }),
  department: Joi.string().min(2).max(100).required(),
  batch: Joi.string().pattern(/^\d{4}$/).required().messages({
    'string.pattern.base': 'Batch must be a 4-digit year'
  }),
  idCardPhotoUrl: Joi.string().uri().optional(),
  phoneNumber: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  address: Joi.string().max(500).optional(),
  dateOfBirth: Joi.date().max('now').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  department: Joi.string().min(2).max(100),
  batch: Joi.string().pattern(/^\d{4}$/),
  bio: Joi.string().max(500),
  avatarUrl: Joi.string().uri().allow('')
});

// Post validation schemas
const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(5).default([])
});

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(5).default([])
});

// Comment validation schemas
const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  parentCommentId: Joi.number().integer().positive().allow(null)
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
});

// Bot post validation
const botPostSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  botToken: Joi.string().required(),
  mediaUrls: Joi.array().items(Joi.string().uri()).max(5).default([])
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    req.validatedData = value;
    next();
  };
};

// Query parameter validation
const validatePagination = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limitParam = parseInt(req.query.limit);
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 20 : limitParam), 100); // Max 100 items per page, min 1
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
};

const validateSearch = (req, res, next) => {
  const { q: query } = req.query;
  
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ 
      error: 'Search query must be at least 2 characters long' 
    });
  }

  req.searchQuery = query.trim();
  next();
};

module.exports = {
  validate,
  validatePagination,
  validateSearch,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    updateProfile: updateProfileSchema,
    createPost: createPostSchema,
    updatePost: updatePostSchema,
    createComment: createCommentSchema,
    updateComment: updateCommentSchema,
    botPost: botPostSchema
  }
};
