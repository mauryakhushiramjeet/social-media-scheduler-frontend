import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface OpenAuthModalOptions {
  mode?: 'login' | 'register';
  title?: string;
  subtitle?: string;
  onAuthenticated?: () => void | Promise<void>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalTitle: string;
  authModalSubtitle: string;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  executeWithAuth: (action: () => void | Promise<void>, options?: OpenAuthModalOptions) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Auth Gatekeeper Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalTitle, setAuthModalTitle] = useState<string>('Welcome to PulseSocial');
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string>(
    'Sign in to manage your connected channels and dispatch posts.'
  );

  const pendingCallbackRef = useRef<(() => void | Promise<void>) | null>(null);

  // Check /api/auth/me on app mount if token exists
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;
      try {
        const res: any = await api.get(API_ENDPOINTS.AUTH.ME);
        const userData = res.data?.user || res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    };
    verifyToken();
  }, []);

  const openAuthModal = (options?: OpenAuthModalOptions) => {
    setAuthModalMode(options?.mode || 'login');
    setAuthModalTitle(options?.title || (options?.mode === 'register' ? 'Create a Free Account' : 'Welcome Back'));
    setAuthModalSubtitle(
      options?.subtitle ||
      (options?.mode === 'register'
        ? 'Sign up to unlock multi-platform publishing and schedule queue.'
        : 'Sign in to access your social media accounts and schedule queue.')
    );
    if (options?.onAuthenticated) {
      pendingCallbackRef.current = options.onAuthenticated;
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    pendingCallbackRef.current = null;
  };

  const resumePendingAction = async () => {
    if (pendingCallbackRef.current) {
      const action = pendingCallbackRef.current;
      pendingCallbackRef.current = null;
      try {
        await action();
      } catch (err: any) {
        console.error('Failed to resume pending action:', err);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res: any = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const { user: userData, token: userToken } = res.data;
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      setIsAuthModalOpen(false);
      await resumePendingAction();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res: any = await api.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password });
      const { user: userData, token: userToken } = res.data;
      if (userToken) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
      }
      toast.success(`Account created! Welcome, ${userData.name}`);
      setIsAuthModalOpen(false);
      await resumePendingAction();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Signed out successfully');
  };

  // Smart Action Interceptor
  const executeWithAuth = (action: () => void | Promise<void>, options?: OpenAuthModalOptions) => {
    if (token && user) {
      action();
    } else {
      openAuthModal({
        ...options,
        onAuthenticated: action,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        isAuthModalOpen,
        authModalMode,
        authModalTitle,
        authModalSubtitle,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        register,
        logout,
        executeWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

