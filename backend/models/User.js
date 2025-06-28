const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  muStudentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    match: [/^\d{3}-\d{3}-\d{3}$/, 'Student ID must be in format XXX-XXX-XXX']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
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
    required: [true, 'Batch is required'],
    match: [/^\d{4}$/, 'Batch must be a 4-digit year']
  },
  phoneNumber: {
    type: String,
    match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        if (!date) return true; // Optional field
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age >= 16 && age <= 100;
      },
      message: 'Age must be between 16 and 100 years'
    }
  },
  idCardPhotoUrl: {
    type: String, // Base64 encoded image or file path
    validate: {
      validator: function(photo) {
        if (!photo) return true; // Optional field
        return photo.startsWith('data:image/') || photo.startsWith('/uploads/') || photo.startsWith('http');
      },
      message: 'Invalid image format'
    }
  },
  avatarUrl: {
    type: String, // Profile picture
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'moderator', 'user'],
    default: 'student'
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { 
    transform: function(doc, ret) {
      // Convert MongoDB _id to id for frontend compatibility
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      // Don't return password
      delete ret.password;
      return ret;
    }
  }
});

// Index for better query performance (email and muStudentId already indexed as unique)
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1, batch: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static methods for compatibility with existing code
userSchema.statics.create = async function(userData) {
  // Handle passwordHash from old code
  if (userData.passwordHash && !userData.password) {
    userData.password = userData.passwordHash;
    delete userData.passwordHash;
  }
  
  const user = new this(userData);
  return await user.save();
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findById = function(id) {
  return this.findById(id);
};

userSchema.statics.findByIdWithPassword = function(id) {
  return this.findById(id).select('+password');
};

userSchema.statics.update = function(id, updateData) {
  return this.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

userSchema.statics.delete = function(id) {
  return this.findByIdAndDelete(id);
};

userSchema.statics.getAll = function(limit = 50, offset = 0, includeAdmins = false) {
  let query = {};
  if (!includeAdmins) {
    query = { role: { $ne: 'admin' }, status: 'approved' };
  }
  
  return this.find(query)
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: -1 });
};

userSchema.statics.search = function(searchTerm, limit = 10) {
  let query = { role: { $ne: 'admin' }, status: 'approved' };
  
  if (searchTerm && searchTerm.trim() !== '') {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .limit(limit)
    .sort({ name: 1 })
    .select('name email department batch avatarUrl bio createdAt');
};

userSchema.statics.adminSearch = function(searchTerm, limit = 10) {
  let query = {};
  
  if (searchTerm && searchTerm.trim() !== '') {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .limit(limit)
    .sort({ name: 1 })
    .select('name email department batch avatarUrl bio role status createdAt');
};

userSchema.statics.getPendingRegistrations = function(limit = 50, offset = 0) {
  return this.find({ status: 'pending' })
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: 1 });
};

userSchema.statics.approveUser = async function(userId, approvedBy) {
  return this.findOneAndUpdate(
    { _id: userId, status: 'pending' },
    { 
      status: 'approved',
      approvedBy: approvedBy,
      approvedAt: new Date(),
      $unset: { rejectionReason: 1 }
    },
    { new: true }
  );
};

userSchema.statics.rejectUser = async function(userId, approvedBy, rejectionReason) {
  return this.findOneAndUpdate(
    { _id: userId, status: 'pending' },
    { 
      status: 'rejected',
      approvedBy: approvedBy,
      approvedAt: new Date(),
      rejectionReason: rejectionReason || 'No reason provided'
    },
    { new: true }
  );
};

userSchema.statics.getApprovalStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_count: 0
  };

  stats.forEach(stat => {
    result[`${stat._id}_count`] = stat.count;
    result.total_count += stat.count;
  });

  return result;
};

userSchema.statics.getDepartmentStats = async function() {
  return this.aggregate([
    {
      $match: { status: 'approved' }
    },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

userSchema.statics.getBatchStats = async function() {
  return this.aggregate([
    {
      $match: { status: 'approved' }
    },
    {
      $group: {
        _id: '$batch',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Follow system (if you need it)
userSchema.statics.follow = async function(followerId, followingId) {
  // Implementation would require a separate Follow model
  // For now, just return a placeholder
  return { followerId, followingId };
};

userSchema.statics.unfollow = async function(followerId, followingId) {
  // Implementation would require a separate Follow model
  return true;
};

userSchema.statics.isFollowing = async function(followerId, followingId) {
  // Implementation would require a separate Follow model
  return false;
};

userSchema.statics.getFollowers = async function(userId) {
  // Implementation would require a separate Follow model
  return [];
};

userSchema.statics.getFollowing = async function(userId) {
  // Implementation would require a separate Follow model
  return [];
};

userSchema.statics.getFollowCounts = async function(userId) {
  return { followers_count: 0, following_count: 0 };
};

module.exports = mongoose.model('User', userSchema);
