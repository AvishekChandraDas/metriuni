const mongoose = require('mongoose');

// Question Model
const questionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  subject: {
    type: String,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  voteScore: {
    type: Number,
    default: 0
  },
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }],
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['up', 'down']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted'],
    default: 'active'
  },
  isSolved: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
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

// Answer Model
const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question is required']
  },
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
  isAnonymous: {
    type: Boolean,
    default: false
  },
  voteScore: {
    type: Number,
    default: 0
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['up', 'down']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAccepted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
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

// StudyGroup Model
const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxMembers: {
    type: Number,
    default: 50,
    min: [2, 'Group must allow at least 2 members'],
    max: [500, 'Group cannot exceed 500 members']
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  meetingInfo: {
    platform: {
      type: String,
      maxlength: [50, 'Platform cannot exceed 50 characters']
    },
    schedule: {
      type: String,
      maxlength: [200, 'Schedule cannot exceed 200 characters']
    },
    link: {
      type: String,
      maxlength: [500, 'Link cannot exceed 500 characters']
    }
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

// PushNotification Model
const pushNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    maxlength: [200, 'Body cannot exceed 200 characters']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative']
  },
  scheduledFor: {
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

// Indexes
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ status: 1, createdAt: -1 });

answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1 });
answerSchema.index({ status: 1 });

studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ subject: 1 });
studyGroupSchema.index({ isPrivate: 1, status: 1 });

pushNotificationSchema.index({ user: 1, createdAt: -1 });
pushNotificationSchema.index({ status: 1 });
pushNotificationSchema.index({ scheduledFor: 1 });

// Static methods for Question
questionSchema.statics.create = async function(questionData) {
  const { authorId, title, content, subject, tags = [], isAnonymous = false } = questionData;
  
  const question = new this({
    author: authorId,
    title,
    content,
    subject,
    tags,
    isAnonymous
  });
  
  await question.save();
  if (!isAnonymous) {
    await question.populate('author', 'name email');
  }
  return question;
};

// Static methods for Answer
answerSchema.statics.create = async function(answerData) {
  const { questionId, authorId, content, isAnonymous = false } = answerData;
  
  const answer = new this({
    question: questionId,
    author: authorId,
    content,
    isAnonymous
  });
  
  await answer.save();
  
  // Add to question's answers array
  await mongoose.model('Question').findByIdAndUpdate(questionId, { $push: { answers: answer._id } });
  
  if (!isAnonymous) {
    await answer.populate('author', 'name email');
  }
  return answer;
};

// Static methods for StudyGroup
studyGroupSchema.statics.create = async function(groupData) {
  const { name, description, subject, creatorId, isPrivate = false, maxMembers = 50 } = groupData;
  
  const group = new this({
    name,
    description,
    subject,
    creator: creatorId,
    isPrivate,
    maxMembers,
    members: [{ user: creatorId, role: 'admin' }]
  });
  
  await group.save();
  await group.populate('creator', 'name email');
  return group;
};

// Export models with backwards compatibility
const Question = mongoose.model('Question', questionSchema);
const Answer = mongoose.model('Answer', answerSchema);
const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
const PushNotification = mongoose.model('PushNotification', pushNotificationSchema);

module.exports = { Question, Answer, StudyGroup, PushNotification };
