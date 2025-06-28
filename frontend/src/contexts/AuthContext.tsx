import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthResponse } from '../types';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.verifyToken();
          const userData = response.data.user;
          setUser(userData);
          
          // Connect to socket
          socketService.connect(userData.id);
        } catch {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token }: AuthResponse = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Connect to socket
      socketService.connect(userData.id);

      toast.success('Welcome back!');
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error) 
        : 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: {
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
  }) => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, message }: { user: User; message: string } = response.data;

      // For pending users, don't auto-login
      if (userData.status === 'pending') {
        toast.success(message || 'Registration submitted successfully! Please wait for admin approval.');
        return;
      }

      // For approved users (backwards compatibility)
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        socketService.connect(userData.id);
        toast.success('Account created successfully!');
      }
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error) 
        : 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Disconnect socket
    socketService.disconnect();
    
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
