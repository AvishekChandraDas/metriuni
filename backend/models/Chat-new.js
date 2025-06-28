const mongoose = require('mongoose');

// Message schema for embedding in conversation
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Conversation schema
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  groupAvatar: {
    type: String,
    default: null
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastMessage: messageSchema,
  lastActivity: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }]
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

// Message model for standalone messages
const chatMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
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

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ status: 1 });

chatMessageSchema.index({ conversation: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ 'readBy.user': 1 });

// Conversation static methods
conversationSchema.statics.createConversation = async function(participants, isGroup = false, groupName = null, groupAdmin = null) {
  // For private chat, ensure only 2 participants
  if (!isGroup && participants.length !== 2) {
    throw new Error('Private conversation must have exactly 2 participants');
  }
  
  const conversation = new this({
    participants,
    isGroup,
    groupName,
    groupAdmin: isGroup ? groupAdmin : null,
    unreadCounts: participants.map(userId => ({ user: userId, count: 0 }))
  });
  
  await conversation.save();
  await conversation.populate('participants', 'name email avatarUrl');
  return conversation;
};

conversationSchema.statics.findConversation = async function(user1Id, user2Id) {
  return await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    isGroup: false
  }).populate('participants', 'name email avatarUrl');
};

conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
  const { limit = 20, offset = 0, includeArchived = false } = options;
  
  const filter = { 
    participants: userId,
    status: includeArchived ? { $in: ['active', 'archived'] } : 'active'
  };
  
  const conversations = await this.find(filter)
    .populate('participants', 'name email avatarUrl')
    .populate('lastMessage.sender', 'name')
    .sort({ lastActivity: -1 })
    .skip(offset)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { conversations, total };
};

conversationSchema.statics.findById = async function(id) {
  return await this.findOne({ _id: id, status: { $ne: 'deleted' } })
    .populate('participants', 'name email avatarUrl')
    .populate('groupAdmin', 'name email avatarUrl');
};

// Conversation instance methods
conversationSchema.methods.addMessage = async function(senderId, content, messageType = 'text', fileData = null) {
  const ChatMessage = require('./ChatMessage');
  
  const messageData = {
    conversation: this._id,
    sender: senderId,
    content,
    messageType
  };
  
  if (fileData) {
    messageData.fileUrl = fileData.url;
    messageData.fileName = fileData.name;
    messageData.fileSize = fileData.size;
  }
  
  const message = new ChatMessage(messageData);
  await message.save();
  
  // Update conversation's last message and activity
  this.lastMessage = {
    sender: senderId,
    content,
    messageType,
    fileUrl: fileData?.url || null,
    fileName: fileData?.name || null,
    createdAt: message.createdAt
  };
  this.lastActivity = new Date();
  
  // Update unread counts for other participants
  this.unreadCounts.forEach(unreadCount => {
    if (unreadCount.user.toString() !== senderId.toString()) {
      unreadCount.count += 1;
    }
  });
  
  await this.save();
  await message.populate('sender', 'name email avatarUrl');
  
  return message;
};

conversationSchema.methods.markAsRead = async function(userId) {
  const unreadCount = this.unreadCounts.find(uc => uc.user.toString() === userId.toString());
  if (unreadCount) {
    unreadCount.count = 0;
    await this.save();
  }
  
  // Mark messages as read
  const ChatMessage = mongoose.model('ChatMessage');
  await ChatMessage.updateMany(
    { 
      conversation: this._id,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId }
    },
    { 
      $push: { readBy: { user: userId, readAt: new Date() } }
    }
  );
};

conversationSchema.methods.getUnreadCount = function(userId) {
  const unreadCount = this.unreadCounts.find(uc => uc.user.toString() === userId.toString());
  return unreadCount ? unreadCount.count : 0;
};

conversationSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
};

conversationSchema.methods.unarchive = async function() {
  this.status = 'active';
  await this.save();
};

conversationSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  await this.save();
};

// ChatMessage static methods
chatMessageSchema.statics.getMessages = async function(conversationId, options = {}) {
  const { limit = 50, before = null, after = null } = options;
  
  const filter = { 
    conversation: conversationId,
    deletedAt: null
  };
  
  if (before) filter.createdAt = { $lt: before };
  if (after) filter.createdAt = { $gt: after };
  
  const messages = await this.find(filter)
    .populate('sender', 'name email avatarUrl')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(limit);
    
  return messages.reverse(); // Return in chronological order
};

chatMessageSchema.statics.search = async function(conversationId, query, options = {}) {
  const { limit = 20 } = options;
  
  const messages = await this.find({
    conversation: conversationId,
    content: { $regex: query, $options: 'i' },
    deletedAt: null
  })
    .populate('sender', 'name email avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit);
    
  return messages;
};

// ChatMessage instance methods
chatMessageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
};

chatMessageSchema.methods.edit = async function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  await this.save();
};

chatMessageSchema.methods.softDelete = async function() {
  this.deletedAt = new Date();
  this.content = '[Message deleted]';
  await this.save();
};

// Create models
const Conversation = mongoose.model('Conversation', conversationSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Export for backwards compatibility
class Chat {
  static async createConversation(participants) {
    return await Conversation.createConversation(participants);
  }
  
  static async findConversation(user1Id, user2Id) {
    return await Conversation.findConversation(user1Id, user2Id);
  }
  
  static async getUserConversations(userId, limit = 20, offset = 0) {
    return await Conversation.getUserConversations(userId, { limit, offset });
  }
  
  static async addMessage(conversationId, senderId, content, messageType = 'text') {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    return await conversation.addMessage(senderId, content, messageType);
  }
  
  static async getMessages(conversationId, limit = 50, before = null) {
    return await ChatMessage.getMessages(conversationId, { limit, before });
  }
  
  static async markAsRead(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    return await conversation.markAsRead(userId);
  }
}

module.exports = { Chat, Conversation, ChatMessage };
