import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Edit3, MapPin, Calendar, Mail, Users, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { userAPI } from '../services/api';
import type { User as UserType, Post } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
  });

  const isOwnProfile = !userId || userId === currentUser?.id?.toString();
  const profileUserId = userId || currentUser?.id?.toString();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!profileUserId) {
        setLoading(false);
        return;
      }

      try {
        const response = await userAPI.getProfile(Number(profileUserId));
        const profileData = response.data;
        
        // The API should return user, followersCount, followingCount, isFollowing
        setUser(profileData.user);
        setFollowersCount(profileData.followersCount || 0);
        setFollowingCount(profileData.followingCount || 0);
        setIsFollowing(profileData.isFollowing || false);
        
        setEditForm({
          firstName: profileData.user.firstName || '',
          lastName: profileData.user.lastName || '',
          bio: profileData.user.bio || '',
          location: profileData.user.location || '',
        });
      } catch (error: unknown) {
        console.error('Error fetching user profile:', error);
        if (error instanceof Error && 'status' in error && error.status === 404) {
          toast.error('User not found');
          navigate('/feed');
        } else {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileUserId, navigate]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!profileUserId) return;

      setPostsLoading(true);
      try {
        const response = await api.get(`/posts/user/${profileUserId}`);
        const userPosts = response.data?.posts || [];
        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
        toast.error('Failed to load posts');
        setPosts([]); // Reset to empty array on error
      } finally {
        setPostsLoading(false);
      }
    };

    if (user) {
      fetchUserPosts();
    }
  }, [user, profileUserId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.id) {
      toast.error('User ID not found');
      return;
    }

    try {
      const response = await userAPI.updateProfile(currentUser.id, editForm);
      const updatedUser = response.data;
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleFollow = async () => {
    if (!user?.id) return;

    try {
      await userAPI.follow(user.id);
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      toast.success(`You are now following ${user.name}`);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async () => {
    if (!user?.id) return;

    try {
      await userAPI.unfollow(user.id);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      toast.success(`You unfollowed ${user.name}`);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatarUrl: newAvatarUrl });
    }
  };

  const handleStartConversation = async () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    try {
      const response = await api.post('/chat/start', {
        userId: user.id
      });

      const conversationId = response.data.conversation.id;
      navigate(`/chat?conversation=${conversationId}`);
      toast.success('Starting conversation...');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${currentUser?.id}`);
      logout();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isOwnProfile ? (
              <ProfilePhotoUpload 
                currentAvatarUrl={user.avatarUrl}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.name}
                  </h1>
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
                <p className="text-gray-600">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                    Admin
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStartConversation}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </button>
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Following
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Follow Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{followersCount}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{followingCount}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{posts.length}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
            </div>

            {/* User Details */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>{user.email}</span>
              </div>
              {user.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>

            {user.bio && (
              <p className="mt-4 text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="input mt-1 block w-full px-3 py-2"
                  style={{ 
                    backgroundColor: '#ffffff !important',
                    color: '#111827 !important',
                    border: '1px solid #d1d5db !important'
                  }}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="input mt-1 block w-full px-3 py-2"
                  style={{ 
                    backgroundColor: '#ffffff !important',
                    color: '#111827 !important',
                    border: '1px solid #d1d5db !important'
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="input mt-1 block w-full px-3 py-2"
                placeholder="Tell us about yourself..."
                style={{ 
                  backgroundColor: '#ffffff !important',
                  color: '#111827 !important',
                  border: '1px solid #d1d5db !important'
                }}
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="input mt-1 block w-full px-3 py-2"
                placeholder="City, State"
                style={{ 
                  backgroundColor: '#ffffff !important',
                  color: '#111827 !important',
                  border: '1px solid #d1d5db !important'
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          {isOwnProfile && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isOwnProfile ? 'Your Posts' : `${user.firstName}'s Posts`}
        </h2>

        {postsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't posted anything yet." : "No posts to show."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(posts || []).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
