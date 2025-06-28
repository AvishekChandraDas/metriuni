const mongoose = require('mongoose');

const pushNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    maxlength: 200
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

pushNotificationSchema.index({ user: 1, createdAt: -1 });
pushNotificationSchema.index({ status: 1 });

pushNotificationSchema.statics.create = async function(notificationData) {
  const { userId, title, body, data = {} } = notificationData;
  
  const notification = new this({
    user: userId,
    title,
    body,
    data
  });
  
  await notification.save();
  return notification;
};

module.exports = mongoose.model('PushNotification', pushNotificationSchema);
