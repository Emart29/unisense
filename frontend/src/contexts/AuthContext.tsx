'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, JWTPayload } from '@/lib/api-client';
import { SyncManager } from '@/lib/sync-manager';

interface User {
  id: string;
  email: string;
  role: string;
  university_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = apiClient.getToken();
    if (token && apiClient.isTokenValid()) {
      const decoded = apiClient.decodeToken();
      if (decoded) {
        setUser({
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          university_id: decoded.university_id,
        });
        
        // Refresh cached data
        SyncManager.refreshCachedData(decoded.sub, decoded.role);
      }
    }
    setLoading(false);

    // Setup sync manager
    SyncManager.setupOnlineListener();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      apiClient.setToken(token);
      setUser(userData);

      // Refresh cached data after login
      await SyncManager.refreshCachedData(userData.id, userData.role);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
