const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    unique: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    maxlength: [255, 'Original filename cannot exceed 255 characters']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    maxlength: [100, 'MIME type cannot exceed 100 characters']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  subject: {
    type: String,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  studyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'quarantined'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
    required: true
  },
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
  },
  virus_scan_status: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'error'],
    default: 'pending'
  },
  virus_scan_date: {
    type: Date,
    default: null
  },
  checksum: {
    type: String,
    maxlength: [128, 'Checksum cannot exceed 128 characters']
  },
  thumbnail: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  accessLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['view', 'download', 'share']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String
    }
  }],
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'download', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
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
fileSchema.index({ uploader: 1, createdAt: -1 });
fileSchema.index({ studyGroup: 1 });
fileSchema.index({ isPublic: 1, status: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ subject: 1 });
fileSchema.index({ department: 1, batch: 1 });
fileSchema.index({ filename: 1 }, { unique: true });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save middleware to determine category based on MIME type
fileSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('mimeType')) {
    this.category = this.getCategoryFromMimeType(this.mimeType);
  }
  next();
});

// Instance method to determine category from MIME type
fileSchema.methods.getCategoryFromMimeType = function(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  return 'other';
};

// Static methods for compatibility with existing code
fileSchema.statics.create = async function(fileData) {
  const {
    filename,
    originalName,
    mimeType,
    size,
    filePath,
    uploaderId,
    subject,
    description,
    tags = [],
    isPublic = true,
    studyGroupId = null,
    department,
    batch,
    checksum,
    metadata = {}
  } = fileData;

  const file = new this({
    filename,
    originalName,
    mimeType,
    size,
    filePath,
    uploader: uploaderId,
    subject,
    description,
    tags,
    isPublic,
    studyGroup: studyGroupId,
    department,
    batch,
    checksum,
    metadata
  });

  await file.save();
  await file.populate('uploader', 'name email department batch');
  return file;
};

fileSchema.statics.findById = async function(id) {
  return await this.findOne({ _id: id, status: 'active' })
    .populate('uploader', 'name email department batch')
    .populate('studyGroup', 'name description');
};

fileSchema.statics.getByUploader = async function(uploaderId, options = {}) {
  const { page = 1, limit = 20, includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const filter = { uploader: uploaderId };
  if (!includeDeleted) filter.status = 'active';
  
  const files = await this.find(filter)
    .populate('uploader', 'name email')
    .populate('studyGroup', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { files, total, page, totalPages: Math.ceil(total / limit) };
};

fileSchema.statics.getPublicFiles = async function(options = {}) {
  const { page = 1, limit = 20, subject, department, batch, tags } = options;
  const skip = (page - 1) * limit;
  
  const filter = { 
    isPublic: true, 
    status: 'active',
    virus_scan_status: { $ne: 'infected' }
  };
  
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (department) filter.department = department;
  if (batch) filter.batch = batch;
  if (tags && tags.length > 0) filter.tags = { $in: tags };
  
  const files = await this.find(filter)
    .populate('uploader', 'name email department batch')
    .populate('studyGroup', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { files, total, page, totalPages: Math.ceil(total / limit) };
};

fileSchema.statics.getByStudyGroup = async function(studyGroupId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const filter = { 
    studyGroup: studyGroupId, 
    status: 'active',
    virus_scan_status: { $ne: 'infected' }
  };
  
  const files = await this.find(filter)
    .populate('uploader', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { files, total, page, totalPages: Math.ceil(total / limit) };
};

fileSchema.statics.search = async function(query, options = {}) {
  const { page = 1, limit = 20, department, batch, category, isPublic = true } = options;
  const skip = (page - 1) * limit;
  
  const filter = {
    status: 'active',
    virus_scan_status: { $ne: 'infected' },
    $or: [
      { originalName: { $regex: query, $options: 'i' } },
      { subject: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (isPublic !== null) filter.isPublic = isPublic;
  if (department) filter.department = department;
  if (batch) filter.batch = batch;
  if (category) filter.category = category;
  
  const files = await this.find(filter)
    .populate('uploader', 'name email department batch')
    .populate('studyGroup', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(filter);
  
  return { files, total, page, totalPages: Math.ceil(total / limit) };
};

fileSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgSize: { $avg: '$size' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ]);
  
  const categoryStats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    }
  ]);
  
  return {
    general: stats[0] || { totalFiles: 0, totalSize: 0, avgSize: 0, totalDownloads: 0 },
    byCategory: categoryStats
  };
};

// Instance methods
fileSchema.methods.incrementDownloadCount = async function(user = null, ipAddress = null) {
  this.downloadCount += 1;
  
  // Add to access log
  if (user) {
    this.accessLog.push({
      user,
      action: 'download',
      ipAddress
    });
  }
  
  await this.save();
};

fileSchema.methods.logAccess = async function(userId, action, ipAddress = null) {
  this.accessLog.push({
    user: userId,
    action,
    ipAddress,
    timestamp: new Date()
  });
  
  await this.save();
};

fileSchema.methods.shareWithUser = async function(userId, permission = 'view', sharedBy) {
  const existingShare = this.sharedWith.find(share => share.user.toString() === userId.toString());
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
    existingShare.sharedBy = sharedBy;
  } else {
    this.sharedWith.push({
      user: userId,
      permission,
      sharedBy
    });
  }
  
  await this.save();
};

fileSchema.methods.removeShare = async function(userId) {
  this.sharedWith = this.sharedWith.filter(share => share.user.toString() !== userId.toString());
  await this.save();
};

fileSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  await this.save();
};

fileSchema.methods.quarantine = async function(reason = null) {
  this.status = 'quarantined';
  if (reason) {
    this.metadata.quarantineReason = reason;
  }
  await this.save();
};

fileSchema.methods.markVirusScanResult = async function(result, details = null) {
  this.virus_scan_status = result;
  this.virus_scan_date = new Date();
  if (details) {
    this.metadata.virusScanDetails = details;
  }
  await this.save();
};

fileSchema.methods.canAccess = function(userId) {
  // Owner can always access
  if (this.uploader.toString() === userId.toString()) return true;
  
  // Public files can be accessed by anyone
  if (this.isPublic) return true;
  
  // Check if explicitly shared
  const share = this.sharedWith.find(share => share.user.toString() === userId.toString());
  return !!share;
};

fileSchema.methods.getAccessPermission = function(userId) {
  // Owner has full access
  if (this.uploader.toString() === userId.toString()) return 'edit';
  
  // Check shared permissions
  const share = this.sharedWith.find(share => share.user.toString() === userId.toString());
  if (share) return share.permission;
  
  // Public files default to view
  if (this.isPublic) return 'view';
  
  return null;
};

module.exports = mongoose.model('File', fileSchema);
