export interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  muStudentId: string;
  department: string;
  batch: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  bio?: string;
  location?: string;
  verified?: boolean;
  accountType?: 'teacher' | 'student';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  // New approval system fields (camelCase for frontend)
  idCardPhotoUrl?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string | null;
  updatedAt?: string | null;
  // API response snake_case fields (for admin endpoints)
  mu_student_id?: string;
  id_card_photo_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Post {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  department: string;
  batch: string;
  content: string;
  media_urls: string[];
  is_bot: boolean;
  likes_count: number;
  comments_count: number;
  user_liked?: boolean;
  created_at: string | null;
  updated_at?: string | null;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  department: string;
  batch: string;
  content: string;
  parent_comment_id?: number;
  likes_count: number;
  user_liked?: boolean;
  created_at: string | null;
  updated_at?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  link?: string;
  type: 'general' | 'like' | 'comment' | 'follow' | 'post' | 'reply' | 'system';
  is_read: boolean;
  created_at: string | null;
}

export interface Follow {
  id: number;
  name: string;
  avatar_url?: string;
  department: string;
  batch: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface UserProfile {
  user: User;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
}

export interface FeedResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  recentUsers: User[];
  recentPosts: Post[];
}

export interface CreatePostData {
  content: string;
  mediaUrls?: string[];
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: number;
}

export interface UpdateProfileData {
  name?: string;
  department?: string;
  batch?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  muStudentId: string;
  department: string;
  batch: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FeedResponse {
  posts: Post[];
  users?: User[]; // Users are included when searching
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  searchQuery?: string;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface PendingRegistration extends User {
  status: 'pending';
}
