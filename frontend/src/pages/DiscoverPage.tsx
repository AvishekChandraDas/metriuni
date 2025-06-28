import React, { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import type { User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import UserCard from '../components/UserCard';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const DiscoverPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a search query in URL
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      handleSearch(urlQuery);
    }
    
    fetchSuggestedUsers();
  }, [searchParams]);

  const fetchSuggestedUsers = async () => {
    try {
      setSuggestionsLoading(true);
      // For now, we'll get all users as suggestions (in a real app, this would be more sophisticated)
      const response = await userAPI.search('');
      setSuggestedUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.search(query.trim());
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;
  const isLoading = searchQuery.trim() ? loading : suggestionsLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover People</h1>
        <p className="text-gray-600">Find and connect with other members of the MetroUni community</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="input block w-full pl-10 pr-3 py-3 text-sm"
            placeholder="Search by name, email, or department..."
            style={{ 
              backgroundColor: '#ffffff !important',
              color: '#111827 !important',
              border: '1px solid #d1d5db !important'
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {searchQuery.trim() ? `Search Results (${searchResults.length})` : 'Suggested People'}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.trim() ? 'No users found' : 'No suggestions available'}
            </h3>
            <p className="text-gray-600">
              {searchQuery.trim() 
                ? 'Try adjusting your search terms' 
                : 'Check back later for user suggestions'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayUsers
              .filter(user => user.id !== currentUser?.id) // Filter out current user
              .map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
