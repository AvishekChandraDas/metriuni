import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface FileData {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  uploader_name?: string;
  uploader_avatar?: string;
  subject?: string;
  description?: string;
  tags: string[];
  download_count: number;
  votes: number;
  created_at: string;
  user_vote?: 'up' | 'down' | null;
}

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    search: '',
    mimeType: '',
    sortBy: 'recent'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { user } = useAuth();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/files', { params: filters });
      setFiles(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleVote = async (fileId: number, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const response = await api.post(`/files/${fileId}/vote`, { voteType });
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, votes: response.data.data.votes, user_vote: voteType }
          : f
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Update download count
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, download_count: f.download_count + 1 }
          : f
      ));
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    return '📁';
  };

  const subjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Psychology', 'History', 'Literature'
  ];

  const fileTypes = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/msword', label: 'Word' },
    { value: 'application/vnd.ms-excel', label: 'Excel' },
    { value: 'application/vnd.ms-powerpoint', label: 'PowerPoint' },
    { value: 'image/', label: 'Images' },
    { value: 'text/', label: 'Text' },
    { value: 'application/zip', label: 'Archives' }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File Library</h1>
        {user && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Upload File
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File Type
            </label>
            <select
              value={filters.mimeType}
              onChange={(e) => setFilters(prev => ({ ...prev, mimeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {fileTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search files..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Downloaded</option>
              <option value="name">Name</option>
              <option value="size_desc">Largest First</option>
              <option value="size_asc">Smallest First</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map(file => (
          <div key={file.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.original_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {user && (
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => handleVote(file.id, 'up')}
                    className={`p-1 rounded text-xs ${
                      file.user_vote === 'up' 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    ▲
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {file.votes}
                  </span>
                  <button
                    onClick={() => handleVote(file.id, 'down')}
                    className={`p-1 rounded text-xs ${
                      file.user_vote === 'down' 
                        ? 'text-red-600 bg-red-100' 
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>

            {file.subject && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                {file.subject}
              </span>
            )}

            {file.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {file.description}
              </p>
            )}

            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {file.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {file.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                    +{file.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                {file.uploader_avatar && (
                  <img 
                    src={file.uploader_avatar} 
                    alt="" 
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span>{file.uploader_name}</span>
              </div>
              <span>{file.download_count} downloads</span>
            </div>

            <button
              onClick={() => handleDownload(file.id, file.original_name)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      {files.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No files found</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  );
};

interface FileUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    tags: '',
    isPublic: true
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Psychology', 'History', 'Literature'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('subject', formData.subject);
    data.append('description', formData.description);
    data.append('tags', formData.tags);
    data.append('isPublic', String(formData.isPublic));

    try {
      setUploading(true);
      await api.post('/files', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      setFormData({
        subject: '',
        description: '',
        tags: '',
        isPublic: true
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upload File
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={String(formData.isPublic)}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g. science, physics, notes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilesPage;
