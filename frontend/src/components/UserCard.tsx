import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  showFollowButton = true,
  onClick
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const isCurrentUser = currentUser?.id === user.id;

  const checkFollowingStatus = useCallback(async () => {
    if (!currentUser?.id || isCurrentUser) return;
    
    try {
      const response = await userAPI.getFollowing(currentUser.id);
      const following = response.data.following || [];
      setIsFollowing(following.some((followedUser: User) => followedUser.id === user.id));
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  }, [currentUser?.id, isCurrentUser, user.id]);

  useEffect(() => {
    checkFollowingStatus();
  }, [checkFollowingStatus]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setFollowLoading(true);
      await userAPI.follow(user.id);
      setIsFollowing(true);
      toast.success('User followed successfully');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setFollowLoading(true);
      await userAPI.unfollow(user.id);
      setIsFollowing(false);
      toast.success('User unfollowed successfully');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div 
          className="flex items-center space-x-4 flex-1 cursor-pointer"
          onClick={handleCardClick}
        >
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.name}
              </h3>
              {user.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Verified
                </span>
              )}
              {user.accountType === 'teacher' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Teacher
                </span>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-2">{user.email}</p>
            
            {(user.department || user.batch) && (
              <div className="flex items-center text-gray-500 text-sm mb-2">
                <GraduationCap className="w-4 h-4 mr-1" />
                <span>
                  {user.department}
                  {user.department && user.batch && ' • '}
                  {user.batch}
                </span>
              </div>
            )}

            {user.bio && (
              <p className="text-gray-700 text-sm line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && !isCurrentUser && (
          <div className="ml-4">
            {isFollowing ? (
              <button
                onClick={handleUnfollow}
                disabled={followLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {followLoading ? 'Loading...' : 'Following'}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {followLoading ? 'Loading...' : 'Follow'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
