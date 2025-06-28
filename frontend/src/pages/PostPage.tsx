import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { Post, Comment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { safeFormatDistanceToNow } from '../utils/helpers';
import toast from 'react-hot-toast';

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        navigate('/feed');
        return;
      }

      try {
        const response = await api.get(`/posts/${postId}`);
        setPost(response.data);
      } catch (error: unknown) {
        console.error('Error fetching post:', error);
        if (error instanceof Error && 'response' in error && 
            typeof error.response === 'object' && error.response !== null &&
            'status' in error.response && error.response.status === 404) {
          toast.error('Post not found');
          navigate('/feed');
        } else {
          toast.error('Failed to load post');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!post) return;

      setCommentsLoading(true);
      try {
        const response = await api.get(`/comments/post/${post.id}`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setCommentsLoading(false);
      }
    };

    if (post) {
      fetchComments();
    }
  }, [post]);

  const handleLikePost = async () => {
    if (!post || !user) return;

    try {
      const response = await api.post(`/posts/${post.id}/like`);
      setPost({ ...post, user_liked: !post.user_liked, likes_count: response.data.likes_count });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleDeletePost = async () => {
    if (!post || !user) return;

    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Post deleted successfully');
      navigate('/feed');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post || !user || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/comments`, {
        post_id: post.id,
        content: newComment.trim(),
      });

      const newCommentData = response.data;
      setComments([newCommentData, ...comments]);
      setNewComment('');
      setPost({ ...post, comments_count: post.comments_count + 1 });
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) return;

    try {
      const response = await api.post(`/comments/${commentId}/like`);
      setComments(comments.map(comment =>
        comment.id === commentId
          ? { ...comment, user_liked: !comment.user_liked, likes_count: response.data.likes_count }
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      if (post) {
        setPost({ ...post, comments_count: post.comments_count - 1 });
      }
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_name}`,
          text: post.content,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist.</p>
          <Link
            to="/feed"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const canDeletePost = user?.role === 'admin' || user?.id === post.author_id;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      {/* Post */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {post.author_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <Link
                  to={`/profile/${post.author_id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600"
                >
                  {post.author_name}
                </Link>
                <div className="text-sm text-gray-500">
                  {post.department} • {post.batch}
                  {post.is_bot && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Bot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canDeletePost && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button
                        onClick={handleDeletePost}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 gap-4">
                {post.media_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post media ${index + 1}`}
                    className="rounded-lg max-w-full h-auto"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLikePost}
                className={`flex items-center space-x-2 ${
                  post.user_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.likes_count}</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-500">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments_count}</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600"
              >
                <Share className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            <time className="text-sm text-gray-500">
              {safeFormatDistanceToNow(post.created_at)}
            </time>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comments ({post.comments_count})
          </h3>

          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-grow">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          to={`/profile/${comment.author_id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 text-sm"
                        >
                          {comment.author_name}
                        </Link>
                        {(user?.role === 'admin' || user?.id === comment.author_id) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-900 text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center space-x-1 text-sm ${
                          comment.user_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${comment.user_liked ? 'fill-current' : ''}`} />
                        <span>{comment.likes_count}</span>
                      </button>
                      <time className="text-sm text-gray-500">
                        {safeFormatDistanceToNow(comment.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
