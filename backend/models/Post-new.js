const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  mediaUrls: [{
    type: String,
    match: [/^https?:\/\//, 'Invalid URL format']
  }],
  isBot: {
    type: Boolean,
    default: false
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  department: {
    type: String,
    enum: [
      'Computer Science & Engineering',
      'Electronics & Communication Engineering',
      'Electrical & Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Business Administration',
      'English',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Economics',
      'Other'
    ]
  },
  batch: {
    type: String,
    match: [/^\d{4}$/, 'Batch must be a 4-digit year']
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ status: 1 });
postSchema.index({ department: 1, batch: 1 });
postSchema.index({ tags: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Static methods for compatibility with existing code
postSchema.statics.create = async function(postData) {
  const { authorId, content, mediaUrls = [], isBot = false, department, batch, tags = [], visibility = 'public' } = postData;
  
  const post = new this({
    author: authorId,
    content,
    mediaUrls,
    isBot,
    department,
    batch,
    tags,
    visibility
  });
  
  await post.save();
  return await this.findById(post._id).populate('author', 'name email avatarUrl department batch');
};

postSchema.statics.findById = async function(id) {
  try {
    return await this.findOne({ _id: id, status: 'active' })
      .populate('author', 'name email avatarUrl department batch')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email avatarUrl'
        }
      });
  } catch (error) {
    return null;
  }
};

postSchema.statics.findByAuthor = async function(authorId, options = {}) {
  const { page = 1, limit = 10, includeHidden = false } = options;
  const skip = (page - 1) * limit;
  
  const filter = { author: authorId };
  if (!includeHidden) {
    filter.status = 'active';
  }
  
  const posts = await this.find(filter)
    .populate('author', 'name email avatarUrl department batch')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { posts, total, page, totalPages: Math.ceil(total / limit) };
};

postSchema.statics.getFeed = async function(options = {}) {
  const { page = 1, limit = 10, department, batch, userId } = options;
  const skip = (page - 1) * limit;
  
  const filter = { status: 'active' };
  if (department) filter.department = department;
  if (batch) filter.batch = batch;
  
  const posts = await this.find(filter)
    .populate('author', 'name email avatarUrl department batch')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  // Add like status for each post if userId provided
  if (userId) {
    posts.forEach(post => {
      post.isLiked = post.likes.some(like => like.user.toString() === userId);
    });
  }
    
  const total = await this.countDocuments(filter);
  
  return { posts, total, page, totalPages: Math.ceil(total / limit) };
};

postSchema.statics.search = async function(query, options = {}) {
  const { page = 1, limit = 10, department, batch } = options;
  const skip = (page - 1) * limit;
  
  const filter = {
    status: 'active',
    $or: [
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (department) filter.department = department;
  if (batch) filter.batch = batch;
  
  const posts = await this.find(filter)
    .populate('author', 'name email avatarUrl department batch')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { posts, total, page, totalPages: Math.ceil(total / limit) };
};

// Instance methods
postSchema.methods.addLike = async function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId);
  if (existingLike) {
    return false; // Already liked
  }
  
  this.likes.push({ user: userId });
  await this.save();
  return true;
};

postSchema.methods.removeLike = async function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId);
  if (likeIndex === -1) {
    return false; // Not liked
  }
  
  this.likes.splice(likeIndex, 1);
  await this.save();
  return true;
};

postSchema.methods.addComment = async function(commentId) {
  this.comments.push(commentId);
  await this.save();
};

postSchema.methods.removeComment = async function(commentId) {
  const commentIndex = this.comments.findIndex(comment => comment.toString() === commentId);
  if (commentIndex !== -1) {
    this.comments.splice(commentIndex, 1);
    await this.save();
  }
};

postSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  await this.save();
};

postSchema.methods.hide = async function() {
  this.status = 'hidden';
  await this.save();
};

postSchema.methods.restore = async function() {
  this.status = 'active';
  await this.save();
};

module.exports = mongoose.model('Post', postSchema);
