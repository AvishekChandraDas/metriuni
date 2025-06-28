const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  voteScore: {
    type: Number,
    default: 0
  },
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

answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1 });

answerSchema.statics.create = async function(answerData) {
  const { questionId, authorId, content, isAnonymous = false } = answerData;
  
  const answer = new this({
    question: questionId,
    author: authorId,
    content,
    isAnonymous
  });
  
  await answer.save();
  return answer;
};

module.exports = mongoose.model('Answer', answerSchema);
