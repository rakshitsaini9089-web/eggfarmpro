'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Use dynamic base URL to support network access (same as in api.ts)
// For localtunnel and external access, we need to determine the correct backend URL
function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:5001/api';
  }
  
  // For localtunnel, use the same hostname but with port 5001
  if (window.location.hostname.includes('loca.lt')) {
    // For localtunnel, we need to construct the backend URL
    // Assuming the backend is exposed on a similar subdomain
    const parts = window.location.hostname.split('.');
    if (parts.length >= 3) {
      // Replace the subdomain with the backend subdomain
      // This is a simplified approach - in practice, you might need to adjust this
      return `https://${parts.slice(1).join('.')}:5001/api`;
    }
    return `${window.location.protocol}//${window.location.hostname}:5001/api`;
  }
  
  // For ngrok, use the proxy route to avoid CORS issues
  if (window.location.hostname.includes('ngrok')) {
    // Use the Next.js API proxy route
    return `/api/proxy`;
  }
  
  // For local development, use the same hostname but with port 5001
  return `${window.location.protocol}//${window.location.hostname}:5001/api`;
}

const API_BASE_URL = getApiBaseUrl();

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        // Validate token before setting it
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Error parsing saved user data:', parseError);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      let url = `${API_BASE_URL}/auth/login`;
      let fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: usernameOrEmail, password }), // Still sending as 'email' to backend
      };
      
      // If using proxy (ngrok), pass the endpoint as a query parameter
      if (API_BASE_URL === '/api/proxy') {
        url = `${API_BASE_URL}?endpoint=${encodeURIComponent('/auth/login')}`;
        // For proxy, we need to include the Authorization header in the request to the proxy
        fetchOptions = {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      }
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = `Login failed: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isHydrated, login, logout, isAuthenticated: !!token }}>
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