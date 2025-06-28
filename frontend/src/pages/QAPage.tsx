import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  id: number;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  author_name?: string;
  author_avatar?: string;
  votes: number;
  answer_count: number;
  is_anonymous: boolean;
  created_at: string;
  user_vote?: 'up' | 'down' | null;
}

const QAPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    search: '',
    sortBy: 'recent'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/qa', { params: filters });
      setQuestions(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId: number, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const response = await api.post(`/qa/${questionId}/vote`, { voteType });
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, votes: response.data.data.votes, user_vote: voteType }
          : q
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const subjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Psychology', 'History', 'Literature'
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Q&A Forum</h1>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Ask Question
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search questions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map(question => (
          <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-start space-x-4">
              {/* Vote buttons */}
              {user && (
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => handleVote(question.id, 'up')}
                    className={`p-1 rounded ${
                      question.user_vote === 'up' 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    ▲
                  </button>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {question.votes}
                  </span>
                  <button
                    onClick={() => handleVote(question.id, 'down')}
                    className={`p-1 rounded ${
                      question.user_vote === 'down' 
                        ? 'text-red-600 bg-red-100' 
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    ▼
                  </button>
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {question.subject}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {question.answer_count} answers
                  </span>
                </div>

                <Link 
                  to={`/qa/questions/${question.id}`}
                  className="block hover:text-blue-600"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {question.title}
                  </h3>
                </Link>

                <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {question.content.substring(0, 200)}...
                </p>

                {question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {question.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    {!question.is_anonymous && question.author_avatar && (
                      <img 
                        src={question.author_avatar} 
                        alt="" 
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>
                      {question.is_anonymous ? 'Anonymous' : question.author_name}
                    </span>
                  </div>
                  <span>
                    {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No questions found</p>
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <CreateQuestionModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchQuestions}
        />
      )}
    </div>
  );
};

interface CreateQuestionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    tags: '',
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);

  const subjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Psychology', 'History', 'Literature'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.subject) return;

    try {
      setLoading(true);
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      await api.post('/qa', {
        ...formData,
        tags
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ask a Question</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What's your question?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question Details *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Provide more details about your question..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., algorithm, homework, exam"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
                Ask anonymously
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.content || !formData.subject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QAPage;
