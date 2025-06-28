import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Bot } from 'lucide-react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../services/api';
import { formatDate, getInitials, generateAvatarColor, formatPostContent } from '../utils/helpers';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === post.author_id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner && !post.is_bot;
  const canDelete = isOwner || isAdmin;

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await postAPI.like(post.id);
      const { liked } = response.data;
      
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postAPI.delete(post.id);
        onDelete?.(post.id);
        toast.success('Post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author_id}`}>
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${generateAvatarColor(post.author_name)}`}>
                {getInitials(post.author_name)}
              </div>
            )}
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${post.author_id}`}
                className="font-semibold text-gray-900 hover:text-primary-600"
              >
                {post.author_name}
              </Link>
              {post.is_bot && (
                <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <Bot className="w-3 h-3 mr-1" />
                  University Bot
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {post.department} • {post.batch} • {formatDate(post.created_at)}
            </div>
          </div>
        </div>

        {/* Menu */}
        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {canEdit && (
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Post
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <div 
          className="text-gray-900 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: formatPostContent(post.content) }}
        />
        
        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            {post.media_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post media ${index + 1}`}
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
              isLiked 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} 
            />
            <span>{likesCount}</span>
          </button>

          <Link
            to={`/posts/${post.id}`}
            className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments_count}</span>
          </Link>
        </div>

        <Link
          to={`/posts/${post.id}`}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View Post
        </Link>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
