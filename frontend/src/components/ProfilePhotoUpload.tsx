import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  size = 'md'
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const uploadIconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl || !user?.id) return;

    try {
      setIsUploading(true);

      // In a real application, you would upload to a storage service like AWS S3, Cloudinary, etc.
      // For now, we'll simulate the upload and use a placeholder URL
      // You should implement actual file upload logic here
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll use the preview URL
      // In production, this would be the URL returned from your storage service
      const uploadedUrl = previewUrl;

      // Update user profile with new avatar URL
      await userAPI.updateProfile(user.id, { avatarUrl: uploadedUrl });

      // Notify parent component
      if (onAvatarUpdate) {
        onAvatarUpdate(uploadedUrl);
      }

      toast.success('Profile photo updated successfully!');
      setShowUploadModal(false);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast.error('Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;

    try {
      setIsUploading(true);
      await userAPI.updateProfile(user.id, { avatarUrl: '' });
      
      if (onAvatarUpdate) {
        onAvatarUpdate('');
      }

      toast.success('Profile photo removed successfully!');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error removing profile photo:', error);
      toast.error('Failed to remove profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Avatar Display with Upload Button */}
      <div className="relative group">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden`}>
          {currentAvatarUrl ? (
            <img 
              src={currentAvatarUrl} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={`${iconSizes[size]} text-white`} />
          )}
        </div>

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Camera className={`${uploadIconSizes[size]} text-white`} />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Profile Photo</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleUpload}
                disabled={isUploading || !previewUrl}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Set as Profile Photo
                  </>
                )}
              </button>

              {currentAvatarUrl && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Current Photo
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Different Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePhotoUpload;
