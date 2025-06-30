import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import PostPage from './pages/PostPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';

import LoadingSpinner from './components/LoadingSpinner';

const AppRoutes: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  console.log('AppRoutes: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              (() => {
                console.log('AppRoutes: Redirecting to feed because isAuthenticated=true');
                return <Navigate to="/feed" replace />;
              })()
            ) : (
              (() => {
                console.log('AppRoutes: Showing login page because isAuthenticated=false');
                return <LoginPage />;
              })()
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/feed" replace /> : <RegisterPage />
          } 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="posts/:postId" element={<PostPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="chat" element={<ChatPage />} />

          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
};

export default App;
