const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { verifyJwt } = require('../middleware/auth');
const File = require('../models/File');
const pool = require('../config/database');
const fileStorage = require('../services/fileStorage');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all files with filters
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      tags,
      search,
      mimeType,
      uploaderId,
      studyGroupId,
      sortBy = 'recent',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const files = await File.getAll({
      subject,
      tags: tags ? tags.split(',') : null,
      search,
      mimeType,
      uploaderId,
      studyGroupId,
      isPublic: true,
      sortBy,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: files.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    });
  }
});

// Get single file details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = await File.findById(id, userId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (userId) {
      const canAccess = await File.canAccess(id, userId);
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (!file.is_public) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file'
    });
  }
});

// Upload file
router.post('/upload', verifyJwt, async (req, res) => {
  try {
    const {
      subject,
      description,
      tags,
      isPublic = 'true',
      studyGroupId,
      fileData // base64 encoded file data
    } = req.body;

    if (!fileData) {
      return res.status(400).json({
        success: false,
        message: 'No file data provided'
      });
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = typeof tags === 'string' ? [tags] : [];
      }
    }

    // Process the file using our file storage service
    const fileResult = await fileStorage.processUpload(fileData, {
      userId: req.user.id,
      type: 'document'
    });

    const file = await File.create({
      filename: fileResult.filename,
      originalName: fileResult.originalName,
      mimeType: fileResult.mimeType,
      size: fileResult.size,
      filePath: fileResult.filePath,
      uploaderId: req.user.id,
      subject,
      description,
      tags: parsedTags,
      isPublic: isPublic === 'true',
      studyGroupId: studyGroupId ? parseInt(studyGroupId) : null
    });

    res.status(201).json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

// Traditional multipart file upload endpoint (for backward compatibility)
router.post('/upload-multipart', verifyJwt, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const {
      subject,
      description,
      tags,
      isPublic = 'true',
      studyGroupId
    } = req.body;

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = typeof tags === 'string' ? [tags] : [];
      }
    }

    // Convert uploaded file to our file storage format
    const fileBuffer = await fs.readFile(req.file.path);
    const base64Data = fileBuffer.toString('base64');
    const fileData = {
      data: base64Data,
      type: req.file.mimetype,
      name: req.file.originalname
    };

    // Clean up temporary file
    await fs.unlink(req.file.path).catch(console.error);

    // Process the file using our file storage service
    const fileResult = await fileStorage.processUpload(fileData, {
      userId: req.user.id,
      type: 'document'
    });

    const file = await File.create({
      filename: fileResult.filename,
      originalName: fileResult.originalName,
      mimeType: fileResult.mimeType,
      size: fileResult.size,
      filePath: fileResult.filePath,
      uploaderId: req.user.id,
      subject,
      description,
      tags: parsedTags,
      isPublic: isPublic === 'true',
      studyGroupId: studyGroupId ? parseInt(studyGroupId) : null
    });

    res.status(201).json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

// Download file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (userId) {
      const canAccess = await File.canAccess(id, userId);
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (!file.is_public) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(file.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Record download
    if (userId) {
      await pool.query(
        'INSERT INTO file_downloads (file_id, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [id, userId, req.ip, req.get('User-Agent')]
      );
    }

    // Increment download count
    await File.incrementDownloadCount(id);

    // Send file
    res.download(file.file_path, file.original_name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

// Update file metadata
router.put('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, tags, isPublic, subject } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (file.uploader_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this file'
      });
    }

    const updatedFile = await File.update(id, {
      description,
      tags: Array.isArray(tags) ? tags : [],
      isPublic,
      subject
    });

    res.json({
      success: true,
      data: updatedFile
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file'
    });
  }
});

// Delete file
router.delete('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (file.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    const deletedFile = await File.delete(id);
    
    // Delete physical file
    try {
      await fs.unlink(deletedFile.file_path);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// Vote on file
router.post('/:id/vote', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const result = await File.vote(id, req.user.id, voteType);
    res.json({
      success: true,
      data: { votes: result.votes }
    });
  } catch (error) {
    console.error('Error voting on file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on file'
    });
  }
});

// Get popular files
router.get('/discover/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const files = await File.getPopularFiles(parseInt(limit));
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error fetching popular files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular files'
    });
  }
});

// Get recent files
router.get('/discover/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const files = await File.getRecentFiles(parseInt(limit));
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error fetching recent files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent files'
    });
  }
});

// Get user's files
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const files = await File.getUserFiles(userId, parseInt(limit), offset);
    
    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: files.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user files'
    });
  }
});

module.exports = router;
