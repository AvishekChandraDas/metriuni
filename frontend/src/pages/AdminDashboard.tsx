import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Search,
  Trash2,
  Shield,
  Bell,
  BarChart3,
  Settings,
  Clock,
  Check,
  X,
  Eye,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { User, Post, ApprovalStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { safeFormatDistanceToNow } from '../utils/helpers';
import toast from 'react-hot-toast';

interface AdminStats {
  usersCount: number;
  postsCount: number;
  commentsCount: number;
  todayUsers: number;
  todayPosts: number;
  todayComments: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'pending' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/feed');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || user.role !== 'admin') return;

      try {
        // Fetch stats and pending registrations
        const [usersResponse, postsResponse, pendingResponse, approvalStatsResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/posts'),
          api.get('/admin/pending-registrations'),
          api.get('/admin/approval-stats'),
        ]);

        // Handle the structured response from backend
        const users = usersResponse.data.users || [];
        const posts = postsResponse.data.posts || [];
        const pending = pendingResponse.data.users || [];
        const approval = approvalStatsResponse.data || { pending: 0, approved: 0, rejected: 0, total: 0 };

        setUsers(users);
        setPosts(posts);
        setPendingUsers(pending);
        setApprovalStats(approval);

        // Calculate basic stats
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const todayUsers = users.filter((u: User) => 
          u.createdAt && new Date(u.createdAt) >= todayStart
        ).length;

        const todayPosts = posts.filter((p: Post) => 
          p.created_at && new Date(p.created_at) >= todayStart
        ).length;

        setStats({
          usersCount: users.length,
          postsCount: posts.length,
          commentsCount: 0, // Would need separate endpoint
          todayUsers,
          todayPosts,
          todayComments: 0,
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
        // Set empty arrays as fallback
        setUsers([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user]);

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((users || []).filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((posts || []).filter(p => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    try {
      await api.post('/admin/notifications/broadcast', {
        message: broadcastMessage.trim(),
        type: 'system'
      });
      setBroadcastMessage('');
      toast.success('Notification sent to all users');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      await api.post(`/admin/approve-user/${userId}`);
      toast.success('User approved successfully');
      
      // Remove from pending and add to approved users
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
      // Refresh approval stats
      const statsResponse = await api.get('/admin/approval-stats');
      setApprovalStats(statsResponse.data);
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: number, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/admin/reject-user/${userId}`, { reason: reason.trim() });
      toast.success('User rejected successfully');
      
      // Remove from pending
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
      // Refresh approval stats
      const statsResponse = await api.get('/admin/approval-stats');
      setApprovalStats(statsResponse.data);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  const filteredUsers = (users || []).filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = (posts || []).filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-blue-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Manage users, content, and system settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'pending', label: `Pending (${approvalStats?.pending || 0})`, icon: Clock },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'posts', label: 'Posts', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'pending' | 'users' | 'posts' | 'settings')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
              {tab.id === 'pending' && approvalStats && approvalStats.pending > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {approvalStats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.usersCount || 0}</dd>
                      <dd className="text-sm text-green-600">+{stats?.todayUsers || 0} today</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.postsCount || 0}</dd>
                      <dd className="text-sm text-green-600">+{stats?.todayPosts || 0} today</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats ? Math.round((stats.postsCount / stats.usersCount) * 100) / 100 : 0}
                      </dd>
                      <dd className="text-sm text-gray-500">posts per user</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {(posts || []).slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900">{post.author_name}</p>
                      <p className="text-sm text-gray-600 truncate">{post.content}</p>
                      <p className="text-xs text-gray-500">
                        {safeFormatDistanceToNow(post.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
                style={{ 
                  backgroundColor: '#ffffff !important',
                  color: '#111827 !important',
                  border: '1px solid #d1d5db !important'
                }}
              />
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department}</div>
                      <div className="text-sm text-gray-500">{user.batch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {safeFormatDistanceToNow(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
                style={{ 
                  backgroundColor: '#ffffff !important',
                  color: '#111827 !important',
                  border: '1px solid #d1d5db !important'
                }}
              />
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {post.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{post.author_name}</p>
                        <p className="text-xs text-gray-500">
                          {safeFormatDistanceToNow(post.created_at)}
                        </p>
                      </div>
                      {post.is_bot && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Bot
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{post.likes_count} likes</span>
                      <span>{post.comments_count} comments</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Registrations Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {/* Approval Stats */}
          {approvalStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-900">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{approvalStats.pending}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{approvalStats.approved}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <X className="h-6 w-6 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{approvalStats.rejected}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total</p>
                    <p className="text-2xl font-bold text-blue-600">{approvalStats.total}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Users List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Registrations</h3>
              <p className="text-sm text-gray-500">Review and approve new user applications</p>
            </div>
            
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending registrations</h3>
                <p className="mt-1 text-sm text-gray-500">All registrations have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {(user.avatar_url || user.avatarUrl) ? (
                              <img 
                                src={user.avatar_url || user.avatarUrl} 
                                alt={user.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <span className="font-semibold text-blue-600">ID: {user.mu_student_id || user.muStudentId}</span>
                              <span>•</span>
                              <span>{user.department}</span>
                              <span>•</span>
                              <span>Batch {user.batch}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(user.phone_number || user.phoneNumber) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {user.phone_number || user.phoneNumber}
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {user.address}
                            </div>
                          )}
                          {(user.date_of_birth || user.dateOfBirth) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(user.date_of_birth || user.dateOfBirth!).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Applied {safeFormatDistanceToNow(user.created_at || user.createdAt)}
                          </div>
                        </div>

                        {/* ID Card Photo */}
                        {(user.id_card_photo_url || user.idCardPhotoUrl) && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Student ID Card:</p>
                            <div className="relative">
                              <img 
                                src={user.id_card_photo_url || user.idCardPhotoUrl} 
                                alt="Student ID Card"
                                className="max-w-xs rounded border shadow-sm"
                              />
                              <button
                                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75"
                                onClick={() => {
                                  // Open image in new tab for better viewing
                                  window.open(user.id_card_photo_url || user.idCardPhotoUrl, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:');
                            if (reason) {
                              handleRejectUser(user.id, reason);
                            }
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Broadcast Notification */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Broadcast Notification
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Send a notification to all users. Use this for important announcements.
              </p>
              <form onSubmit={handleBroadcastNotification} className="space-y-4">
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={!broadcastMessage.trim() || isSendingBroadcast}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingBroadcast ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                System Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats?.usersCount || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Posts</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats?.postsCount || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">New Users Today</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats?.todayUsers || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">New Posts Today</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats?.todayPosts || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
