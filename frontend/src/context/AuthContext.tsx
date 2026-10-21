import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fintrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fintrack_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    if (!localStorage.getItem('fintrack_token')) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem('fintrack_user', JSON.stringify(res.user));
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('fintrack_user');
      localStorage.removeItem('fintrack_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('fintrack_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('fintrack_unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('fintrack_token', res.token);
    localStorage.setItem('fintrack_user', JSON.stringify(res.user));
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('fintrack_token', res.token);
    localStorage.setItem('fintrack_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('fintrack_token');
      localStorage.removeItem('fintrack_user');
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('fintrack_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshMe }}>
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
