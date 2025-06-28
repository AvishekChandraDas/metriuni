import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, User as UserIcon } from 'lucide-react';
import { postAPI } from '../services/api';
import type { Post, User, FeedResponse } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';
import CreatePostModal from '../components/CreatePostModal';

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState(''); // The query currently being searched

  const loadPosts = async (pageNum: number = 1, append: boolean = false, searchTerm: string = '') => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await postAPI.getFeed(pageNum, 20, searchTerm.trim() || undefined);
      const { posts: newPosts, users: searchUsers = [], pagination }: FeedResponse = response.data;

      if (append && !searchTerm) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
        setUsers(searchUsers); // Set users for search results
      }

      setHasMore(pagination.hasMore && !searchTerm); // Disable pagination when searching
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setPage(1);
    setUsers([]); // Clear users when clearing search
    loadPosts(); // Load regular feed
  }, []);

  // Only manual search - no auto-search
  useEffect(() => {
    // Reset to regular feed when search input is completely cleared
    if (searchQuery === '' && activeSearchQuery !== '') {
      handleClearSearch();
    }
  }, [searchQuery, activeSearchQuery, handleClearSearch]);

  const handleSearch = (query: string = searchQuery) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery === '') return; // Don't search empty queries
    
    setActiveSearchQuery(trimmedQuery);
    setPage(1);
    loadPosts(1, false, trimmedQuery);
  };

  const handleSearchButtonClick = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !activeSearchQuery) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    if (!activeSearchQuery) {
      setPosts(prev => [newPost, ...prev]);
    }
    setShowCreateModal(false);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative flex">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input block w-full pl-10 pr-24 py-3 rounded-l-lg text-sm"
            placeholder="Type to search posts, then press Enter or click Search button..."
            style={{ 
              backgroundColor: '#ffffff !important',
              color: '#111827 !important',
              border: '1px solid #d1d5db !important'
            }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-16 pr-2 flex items-center z-10"
              type="button"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button
            onClick={handleSearchButtonClick}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            type="button"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search results indicator */}
        {activeSearchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {(posts.length === 0 && users.length === 0) ? (
              <span>No posts or users found for "{activeSearchQuery}"</span>
            ) : (
              <span>
                Found {posts.length} post{posts.length !== 1 ? 's' : ''}
                {users.length > 0 && ` and ${users.length} user${users.length !== 1 ? 's' : ''}`} for "{activeSearchQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Create post button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          What's on your mind?
        </button>
      </div>

      {/* Search Results */}
      {activeSearchQuery && (users.length > 0 || posts.length > 0) && (
        <div className="space-y-6">
          {/* User Results */}
          {users.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                People ({users.length})
              </h3>
              <div className="space-y-4">
                {users.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    showFollowButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {posts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Posts ({posts.length})
              </h3>
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handlePostDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regular Posts feed - only show when not searching */}
      {!activeSearchQuery && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">
                Be the first to share something with the community!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handlePostDeleted}
                />
              ))}

              {/* Load more button */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="btn btn-outline"
                  >
                    {isLoadingMore ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  You've reached the end of the feed
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Search No Results */}
      {activeSearchQuery && posts.length === 0 && users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Search className="mx-auto w-12 h-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500 mb-4">
            No posts or users match your search for "{activeSearchQuery}". Try different keywords or check spelling.
          </p>
          <button
            onClick={handleClearSearch}
            className="btn btn-outline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Create post modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default FeedPage;
