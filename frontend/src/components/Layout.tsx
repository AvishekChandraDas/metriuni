import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Search,
  Menu,
  X,
  Compass,
  MessageCircle,

} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Get initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationAPI.getUnreadCount();
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Listen for new notifications
    const handleNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('notification', handleNotification);

    return () => {
      socketService.off('notification', handleNotification);
    };
  }, []);

  const navigationItems = [
    { 
      name: 'Feed', 
      href: '/feed', 
      icon: Home,
      isActive: location.pathname === '/feed'
    },
    { 
      name: 'Discover', 
      href: '/discover', 
      icon: Compass,
      isActive: location.pathname === '/discover'
    },
    { 
      name: 'Chat', 
      href: '/chat', 
      icon: MessageCircle,
      isActive: location.pathname === '/chat'
    },

    { 
      name: 'Profile', 
      href: `/profile/${user?.id}`, 
      icon: User,
      isActive: location.pathname === `/profile/${user?.id}`
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell,
      isActive: location.pathname === '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
  ];

  if (user?.role === 'admin') {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Settings,
      isActive: location.pathname === '/admin'
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">MetroUni</h1>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.department} • {user?.batch}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${item.isActive 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="hidden lg:block">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {location.pathname === '/feed' && 'Feed'}
                    {location.pathname === '/discover' && 'Discover People'}
                    {location.pathname === '/notifications' && 'Notifications'}
                    {location.pathname.startsWith('/profile') && 'Profile'}
                    {location.pathname.startsWith('/posts') && 'Post'}
                    {location.pathname === '/admin' && 'Admin Dashboard'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search bar */}
                <div className="hidden md:block">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input block w-full pl-10 pr-3 py-2 sm:text-sm"
                      placeholder="Search people..."
                      style={{ 
                        backgroundColor: '#ffffff !important',
                        color: '#111827 !important',
                        border: '1px solid #d1d5db !important'
                      }}
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
