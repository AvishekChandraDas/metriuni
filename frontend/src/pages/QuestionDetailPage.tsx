import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
}

interface Answer {
  id: number;
  content: string;
  author_name?: string;
  author_avatar?: string;
  votes: number;
  is_anonymous: boolean;
  is_accepted: boolean;
  created_at: string;
}

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [answerAnonymous, setAnswerAnonymous] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/qa/${id}`);
      const data = response.data.data;
      setQuestion(data.question);
      setAnswers(data.answers);
      setUserVotes(data.userVotes || {});
      setError(null);
    } catch (err) {
      setError('Failed to fetch question');
      console.error('Error fetching question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'question' | 'answer', itemId: number, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      let endpoint = '';
      if (type === 'question') {
        endpoint = `/qa/${itemId}/vote`;
      } else {
        endpoint = `/qa/${question?.id}/answers/${itemId}/vote`;
      }

      const response = await api.post(endpoint, { voteType });

      if (type === 'question' && question) {
        setQuestion(prev => prev ? { ...prev, votes: response.data.data.votes } : null);
        setUserVotes(prev => ({ ...prev, question: voteType }));
      } else {
        setAnswers(prev => prev.map(a => 
          a.id === itemId 
            ? { ...a, votes: response.data.data.votes }
            : a
        ));
        setUserVotes(prev => ({ ...prev, [`answer_${itemId}`]: voteType }));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim() || !user) return;

    try {
      setSubmittingAnswer(true);
      const response = await api.post(`/qa/${id}/answers`, {
        content: answerContent,
        isAnonymous: answerAnonymous
      });

      setAnswers(prev => [...prev, response.data.data]);
      setAnswerContent('');
      setAnswerAnonymous(false);
      setShowAnswerForm(false);
      
      // Update question answer count
      if (question) {
        setQuestion(prev => prev ? { ...prev, answer_count: prev.answer_count + 1 } : null);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    if (!user || !question) return;

    try {
      await api.post(`/qa/${question.id}/answers/${answerId}/accept`);
      setAnswers(prev => prev.map(a => ({
        ...a,
        is_accepted: a.id === answerId
      })));
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Question not found'}
        </div>
        <Link to="/qa" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Q&A
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/qa" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Q&A
      </Link>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-4">
          {/* Vote buttons */}
          {user && (
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleVote('question', question.id, 'up')}
                className={`p-2 rounded ${
                  userVotes.question === 'up' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-400 hover:text-green-600'
                }`}
              >
                ▲
              </button>
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {question.votes}
              </span>
              <button
                onClick={() => handleVote('question', question.id, 'down')}
                className={`p-2 rounded ${
                  userVotes.question === 'down' 
                    ? 'text-red-600 bg-red-100' 
                    : 'text-gray-400 hover:text-red-600'
                }`}
              >
                ▼
              </button>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {question.subject}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {question.title}
            </h1>

            <div className="prose dark:prose-invert max-w-none mb-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {question.content}
              </p>
            </div>

            {question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded"
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
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>
                  Asked by {question.is_anonymous ? 'Anonymous' : question.author_name}
                </span>
              </div>
              <span>
                {new Date(question.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>
          {user && (
            <button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showAnswerForm ? 'Cancel' : 'Answer Question'}
            </button>
          )}
        </div>

        {/* Answer Form */}
        {showAnswerForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Write your answer..."
                required
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="answerAnonymous"
                    checked={answerAnonymous}
                    onChange={(e) => setAnswerAnonymous(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="answerAnonymous" className="text-sm text-gray-700 dark:text-gray-300">
                    Answer anonymously
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={submittingAnswer || !answerContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Answers List */}
        <div className="space-y-4">
          {answers.map(answer => (
            <div 
              key={answer.id} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                answer.is_accepted ? 'border-2 border-green-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Vote buttons */}
                {user && (
                  <div className="flex flex-col items-center space-y-1">
                    <button
                      onClick={() => handleVote('answer', answer.id, 'up')}
                      className={`p-1 rounded ${
                        userVotes[`answer_${answer.id}`] === 'up' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      ▲
                    </button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {answer.votes}
                    </span>
                    <button
                      onClick={() => handleVote('answer', answer.id, 'down')}
                      className={`p-1 rounded ${
                        userVotes[`answer_${answer.id}`] === 'down' 
                          ? 'text-red-600 bg-red-100' 
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                    >
                      ▼
                    </button>
                  </div>
                )}

                {/* Accept button for question author */}
                {user && question.author_name === user.name && !answer.is_accepted && (
                  <button
                    onClick={() => handleAcceptAnswer(answer.id)}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title="Accept as best answer"
                  >
                    ✓
                  </button>
                )}

                <div className="flex-1">
                  {answer.is_accepted && (
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Accepted Answer
                      </span>
                    </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none mb-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {answer.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      {!answer.is_anonymous && answer.author_avatar && (
                        <img 
                          src={answer.author_avatar} 
                          alt="" 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>
                        {answer.is_anonymous ? 'Anonymous' : answer.author_name}
                      </span>
                    </div>
                    <span>
                      {new Date(answer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {answers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No answers yet. Be the first to answer!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;
