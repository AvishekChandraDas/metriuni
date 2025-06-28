const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    maxlength: 100
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    default: 50
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
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

studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ subject: 1 });

studyGroupSchema.statics.create = async function(groupData) {
  const { name, description, subject, creatorId, isPrivate = false } = groupData;
  
  const group = new this({
    name,
    description,
    subject,
    creator: creatorId,
    isPrivate,
    members: [{ user: creatorId, role: 'admin' }]
  });
  
  await group.save();
  return group;
};

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
