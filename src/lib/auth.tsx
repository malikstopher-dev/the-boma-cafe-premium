'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { cmsService } from './client-cms';

interface AdminUser {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'boma_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('[checkAuth] entering');
    if (typeof window === 'undefined') {
      console.log('[checkAuth] SSR — bailing out, setting isLoading=false');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('[checkAuth] calling cmsService.verifyAuth()...');
      const result = await cmsService.verifyAuth();
      console.log('[checkAuth] verifyAuth() returned:', JSON.stringify(result));
      console.log('[checkAuth] result.authenticated ===', result?.authenticated);
      console.log('[checkAuth] result.user ===', result?.user);
      if (result.authenticated && result.user) {
        console.log('[checkAuth] BRANCH A: server says authenticated=true');
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      } else {
        console.log('[checkAuth] BRANCH B: server says NOT authenticated — clearing localStorage');
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.log('[checkAuth] BRANCH C: catch block EXECUTED');
      console.log('[checkAuth] error message:', err instanceof Error ? err.message : String(err));
      console.log('[checkAuth] error stack:', err instanceof Error ? err.stack : '(none)');
      const userData = localStorage.getItem(USER_KEY);
      console.log('[checkAuth] localStorage USER_KEY data:', userData ? 'FOUND' : 'NOT FOUND');
      if (userData) {
        try {
          console.log('[checkAuth] Falling back to localStorage — setting isAuthenticated=true');
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch {
          console.log('[checkAuth] localStorage parse failed — clearing');
          localStorage.removeItem(USER_KEY);
        }
      }
    } finally {
      console.log('[checkAuth] finally — setting isLoading=false');
      setIsLoading(false);
    }
    console.log('[checkAuth] exiting, isAuthenticated will be re-evaluated on next render');
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const result = await cmsService.login(password) as { success?: boolean; user?: any; error?: string };
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        return true;
      }
      if (result.error) {
        console.error('Login failed:', result.error);
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Server cookie clearing is best-effort; state is cleared regardless
    }
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('kitchen_auth');
    sessionStorage.removeItem('waiter_auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
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