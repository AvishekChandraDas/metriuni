const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class FileStorageService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024; // 10MB default
    this.allowedTypes = process.env.ALLOWED_FILE_TYPES 
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Ensure upload directories exist
      const dirs = [
        `${this.uploadDir}`,
        `${this.uploadDir}/profiles`,
        `${this.uploadDir}/posts`,
        `${this.uploadDir}/files`,
        `${this.uploadDir}/id-cards`,
        `${this.uploadDir}/temp`
      ];

      for (const dir of dirs) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          console.log(`✅ Created directory: ${dir}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage directories:', error);
    }
  }

  // File filter for multer
  fileFilter(req, file, cb) {
    if (this.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`), false);
    }
  }

  // Generate unique filename
  generateFilename(originalname) {
    const ext = path.extname(originalname);
    const name = path.basename(originalname, ext);
    const uuid = uuidv4();
    return `${name}-${uuid}${ext}`;
  }

  // Multer storage configuration
  getMulterStorage(subfolder = '') {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, subfolder);
        try {
          await fs.access(uploadPath);
        } catch {
          await fs.mkdir(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, this.generateFilename(file.originalname));
      }
    });
  }

  // Create multer middleware for different file types
  createUploadMiddleware(subfolder = '', fieldName = 'file', multiple = false) {
    const storage = this.getMulterStorage(subfolder);
    
    const upload = multer({
      storage,
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: multiple ? 10 : 1
      }
    });

    return multiple ? upload.array(fieldName, 10) : upload.single(fieldName);
  }

  // Handle base64 file uploads (for ID cards)
  async saveBase64File(base64Data, filename, subfolder = 'id-cards') {
    try {
      // Extract base64 data and mime type
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 format');
      }

      const mimeType = matches[1];
      const data = matches[2];

      // Validate file type
      if (!this.allowedTypes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} not allowed`);
      }

      // Generate filename if not provided
      if (!filename) {
        const ext = mimeType.split('/')[1];
        filename = `${uuidv4()}.${ext}`;
      }

      // Ensure filename has proper extension
      if (!path.extname(filename)) {
        const ext = mimeType.split('/')[1];
        filename = `${filename}.${ext}`;
      }

      // Create buffer from base64
      const buffer = Buffer.from(data, 'base64');

      // Check file size
      if (buffer.length > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      // Save file
      const uploadPath = path.join(this.uploadDir, subfolder);
      await fs.mkdir(uploadPath, { recursive: true });
      
      const filePath = path.join(uploadPath, filename);
      await fs.writeFile(filePath, buffer);

      return {
        filename,
        filePath: filePath.replace(this.uploadDir + '/', ''), // Relative path
        fullPath: filePath,
        size: buffer.length,
        mimeType
      };
    } catch (error) {
      console.error('Error saving base64 file:', error);
      throw error;
    }
  }

  // Get file URL for serving
  getFileUrl(filePath) {
    if (!filePath) return null;
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // If it's a base64 data URL, return as is
    if (filePath.startsWith('data:')) {
      return filePath;
    }

    // Return relative path for local files
    return `/uploads/${filePath}`;
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      if (!filePath || filePath.startsWith('http') || filePath.startsWith('data:')) {
        return; // Can't delete external URLs or base64 data
      }

      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
      console.log(`✅ Deleted file: ${fullPath}`);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Clean up temporary files
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoff) {
          await fs.unlink(filePath);
          console.log(`✅ Cleaned up temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`);
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    return errors;
  }
}

// Singleton instance
const fileStorageService = new FileStorageService();

// Cleanup temp files every hour
setInterval(() => {
  fileStorageService.cleanupTempFiles();
}, 60 * 60 * 1000);

module.exports = fileStorageService;
