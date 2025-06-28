const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  link: {
    type: String,
    maxlength: [200, 'Link cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['general', 'like', 'comment', 'follow', 'post', 'admin', 'system'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
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
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static methods for compatibility with existing code
notificationSchema.statics.create = async function(notificationData) {
  const { userId, message, link, type = 'general', priority = 'normal', metadata = {}, expiresAt = null } = notificationData;
  
  const notification = new this({
    user: userId,
    message,
    link,
    type,
    priority,
    metadata,
    expiresAt
  });
  
  await notification.save();
  await notification.populate('user', 'name email');
  return notification;
};

notificationSchema.statics.getByUser = async function(userId, options = {}) {
  const { limit = 50, offset = 0, includeRead = true, type = null } = options;
  
  const filter = { user: userId };
  if (!includeRead) filter.isRead = false;
  if (type) filter.type = type;
  
  const notifications = await this.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { notifications, total };
};

notificationSchema.statics.getUnreadByUser = async function(userId) {
  return await this.find({ user: userId, isRead: false })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.statics.markAsRead = async function(notificationId, userId = null) {
  const filter = { _id: notificationId };
  if (userId) filter.user = userId;
  
  const result = await this.findOneAndUpdate(
    filter,
    { 
      isRead: true, 
      readAt: new Date() 
    },
    { new: true }
  );
  
  return result;
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
  
  return result.modifiedCount;
};

notificationSchema.statics.deleteById = async function(notificationId, userId = null) {
  const filter = { _id: notificationId };
  if (userId) filter.user = userId;
  
  const result = await this.findOneAndDelete(filter);
  return result;
};

notificationSchema.statics.deleteOld = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
  
  return result.deletedCount;
};

notificationSchema.statics.createBulk = async function(notifications) {
  const results = await this.insertMany(notifications);
  return results;
};

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  await this.save();
  return this;
};

// Helper methods for different notification types
notificationSchema.statics.createLikeNotification = async function(postId, likedBy, postAuthor) {
  if (likedBy.toString() === postAuthor.toString()) return null; // Don't notify self
  
  return await this.create({
    userId: postAuthor,
    message: `${likedBy.name || 'Someone'} liked your post`,
    link: `/posts/${postId}`,
    type: 'like',
    metadata: { postId, likedBy: likedBy._id }
  });
};

notificationSchema.statics.createCommentNotification = async function(postId, commentedBy, postAuthor, commentContent) {
  if (commentedBy.toString() === postAuthor.toString()) return null; // Don't notify self
  
  return await this.create({
    userId: postAuthor,
    message: `${commentedBy.name || 'Someone'} commented on your post: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
    link: `/posts/${postId}`,
    type: 'comment',
    metadata: { postId, commentedBy: commentedBy._id }
  });
};

notificationSchema.statics.createFollowNotification = async function(followerId, followedId, followerName) {
  return await this.create({
    userId: followedId,
    message: `${followerName} started following you`,
    link: `/profile/${followerId}`,
    type: 'follow',
    metadata: { followerId }
  });
};

notificationSchema.statics.createSystemNotification = async function(userIds, message, link = null, priority = 'normal') {
  const notifications = userIds.map(userId => ({
    user: userId,
    message,
    link,
    type: 'system',
    priority
  }));
  
  return await this.createBulk(notifications);
};

notificationSchema.statics.createAdminNotification = async function(userIds, message, link = null, priority = 'high') {
  const notifications = userIds.map(userId => ({
    user: userId,
    message,
    link,
    type: 'admin',
    priority
  }));
  
  return await this.createBulk(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);
