const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
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
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Static methods for compatibility with existing code
commentSchema.statics.create = async function(commentData) {
  const { postId, authorId, content, parentCommentId = null } = commentData;
  
  const comment = new this({
    post: postId,
    author: authorId,
    content,
    parentComment: parentCommentId
  });
  
  await comment.save();
  
  // Add comment to post's comments array
  const Post = require('./Post');
  await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
  
  // If this is a reply, add to parent comment's replies
  if (parentCommentId) {
    await this.findByIdAndUpdate(parentCommentId, { $push: { replies: comment._id } });
  }
  
  return await this.findById(comment._id).populate('author', 'name email avatarUrl');
};

commentSchema.statics.findById = async function(id) {
  try {
    return await this.findOne({ _id: id, status: 'active' })
      .populate('author', 'name email avatarUrl')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'name email avatarUrl'
        }
      });
  } catch (error) {
    return null;
  }
};

commentSchema.statics.findByPost = async function(postId, options = {}) {
  const { page = 1, limit = 20, includeReplies = true } = options;
  const skip = (page - 1) * limit;
  
  const filter = { 
    post: postId, 
    status: 'active',
    parentComment: null // Only get top-level comments
  };
  
  let query = this.find(filter)
    .populate('author', 'name email avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  if (includeReplies) {
    query = query.populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name email avatarUrl'
      }
    });
  }
  
  const comments = await query;
  const total = await this.countDocuments(filter);
  
  return { comments, total, page, totalPages: Math.ceil(total / limit) };
};

commentSchema.statics.findByAuthor = async function(authorId, options = {}) {
  const { page = 1, limit = 10, includeHidden = false } = options;
  const skip = (page - 1) * limit;
  
  const filter = { author: authorId };
  if (!includeHidden) {
    filter.status = 'active';
  }
  
  const comments = await this.find(filter)
    .populate('author', 'name email avatarUrl')
    .populate('post', 'content author')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { comments, total, page, totalPages: Math.ceil(total / limit) };
};

commentSchema.statics.getReplies = async function(parentCommentId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  const filter = { 
    parentComment: parentCommentId, 
    status: 'active' 
  };
  
  const replies = await this.find(filter)
    .populate('author', 'name email avatarUrl')
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { replies, total, page, totalPages: Math.ceil(total / limit) };
};

// Instance methods
commentSchema.methods.addLike = async function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId);
  if (existingLike) {
    return false; // Already liked
  }
  
  this.likes.push({ user: userId });
  await this.save();
  return true;
};

commentSchema.methods.removeLike = async function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId);
  if (likeIndex === -1) {
    return false; // Not liked
  }
  
  this.likes.splice(likeIndex, 1);
  await this.save();
  return true;
};

commentSchema.methods.addReply = async function(replyId) {
  this.replies.push(replyId);
  await this.save();
};

commentSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  await this.save();
  
  // Remove from post's comments array
  const Post = require('./Post');
  await Post.findByIdAndUpdate(this.post, { $pull: { comments: this._id } });
  
  // Remove from parent comment's replies if it's a reply
  if (this.parentComment) {
    await this.constructor.findByIdAndUpdate(this.parentComment, { $pull: { replies: this._id } });
  }
};

commentSchema.methods.hide = async function() {
  this.status = 'hidden';
  await this.save();
};

commentSchema.methods.restore = async function() {
  this.status = 'active';
  await this.save();
  
  // Add back to post's comments array
  const Post = require('./Post');
  const post = await Post.findById(this.post);
  if (post && !post.comments.includes(this._id)) {
    await Post.findByIdAndUpdate(this.post, { $push: { comments: this._id } });
  }
  
  // Add back to parent comment's replies if it's a reply
  if (this.parentComment) {
    const parentComment = await this.constructor.findById(this.parentComment);
    if (parentComment && !parentComment.replies.includes(this._id)) {
      await this.constructor.findByIdAndUpdate(this.parentComment, { $push: { replies: this._id } });
    }
  }
};

module.exports = mongoose.model('Comment', commentSchema);
