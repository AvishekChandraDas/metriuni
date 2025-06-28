import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    muStudentId: string;
    department: string;
    batch: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
    idCardPhotoUrl?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),

  verifyToken: () => api.get('/auth/verify'),
};

// User API
export const userAPI = {
  getProfile: (id: number) => api.get(`/users/${id}`),
  updateProfile: (id: number, data: {
    name?: string;
    bio?: string;
    location?: string;
    [key: string]: unknown;
  }) => api.put(`/users/${id}`, data),
  getFollowers: (id: number) => api.get(`/users/${id}/followers`),
  getFollowing: (id: number) => api.get(`/users/${id}/following`),
  follow: (id: number) => api.post(`/users/${id}/follow`),
  unfollow: (id: number) => api.delete(`/users/${id}/unfollow`),
  search: (query: string) => api.get(`/users?q=${encodeURIComponent(query)}`),
};

// Post API
export const postAPI = {
  getFeed: (page: number = 1, limit: number = 20, searchQuery?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (searchQuery && searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }
    return api.get(`/posts?${params.toString()}`);
  },
  
  create: (data: { content: string; mediaUrls?: string[] }) => 
    api.post('/posts', data),
  
  getPost: (id: number) => api.get(`/posts/${id}`),
  update: (id: number, data: { content: string; mediaUrls?: string[] }) => 
    api.put(`/posts/${id}`, data),
  
  delete: (id: number) => api.delete(`/posts/${id}`),
  like: (id: number) => api.post(`/posts/${id}/like`),
  getLikes: (id: number) => api.get(`/posts/${id}/likes`),
  getComments: (id: number) => api.get(`/posts/${id}/comments`),
  addComment: (id: number, data: { content: string; parentCommentId?: number }) => 
    api.post(`/posts/${id}/comments`, data),
};

// Comment API
export const commentAPI = {
  reply: (id: number, data: { content: string }) => 
    api.post(`/comments/${id}/reply`, data),
  
  update: (id: number, data: { content: string }) => 
    api.put(`/comments/${id}`, data),
  
  delete: (id: number) => api.delete(`/comments/${id}`),
  like: (id: number) => api.post(`/comments/${id}/like`),
  getLikes: (id: number) => api.get(`/comments/${id}/likes`),
  getReplies: (id: number) => api.get(`/comments/${id}/replies`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (page: number = 1, limit: number = 20) => 
    api.get(`/notifications?page=${page}&limit=${limit}`),
  
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page: number = 1, limit: number = 20) => 
    api.get(`/admin/users?page=${page}&limit=${limit}`),
  
  getUserDetails: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: {
    role?: string;
    verified?: boolean;
    verification_status?: string;
    [key: string]: unknown;
  }) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getPosts: (page: number = 1, limit: number = 20) => 
    api.get(`/admin/posts?page=${page}&limit=${limit}`),
  
  deletePost: (id: number) => api.delete(`/admin/posts/${id}`),
  search: (query: string, type: string = 'all') => 
    api.get(`/admin/search?q=${encodeURIComponent(query)}&type=${type}`),
  
  broadcastNotification: (data: { message: string; link?: string; type?: string }) => 
    api.post('/admin/notifications/broadcast', data),
};

export default api;
