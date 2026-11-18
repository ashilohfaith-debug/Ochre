import React, { createContext, useContext, useState, useEffect } from 'react';
import { signUpApi, signInApi, verifyTokenApi, AuthResponse } from '../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  color: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isVerifying: boolean;
  signup: (username: string, email: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ochre_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ochre_token') ?? null;
  });

  // True while we're verifying the stored token against the server on startup
  const [isVerifying, setIsVerifying] = useState<boolean>(() => {
    // Only need to verify if there's a stored token
    return !!(localStorage.getItem('ochre_token') && localStorage.getItem('ochre_auth_user'));
  });

  // On mount: if we have a stored token, validate it with the server.
  // This catches the case where the server restarted and the userId no longer
  // exists (e.g. old in-memory session), or where the profile changed.
  useEffect(() => {
    const storedToken = localStorage.getItem('ochre_token');
    const storedUser = localStorage.getItem('ochre_auth_user');

    if (!storedToken || !storedUser) {
      setIsVerifying(false);
      return;
    }

    verifyTokenApi()
      .then(freshUser => {
        // Update stored profile in case color/email changed server-side
        setUser(freshUser);
        setToken(storedToken);
      })
      .catch(() => {
        // Token is invalid or user doesn't exist anymore — clear stale session
        console.warn('Stored session invalid — clearing. Please sign in again.');
        clearSession();
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, []); // runs once on mount only

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('ochre_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ochre_auth_user');
    }
  }, [user]);

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('ochre_token', token);
    } else {
      localStorage.removeItem('ochre_token');
    }
  }, [token]);

  function clearSession() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ochre_token');
    localStorage.removeItem('ochre_auth_user');
  }

  const signup = async (username: string, email: string, password: string) => {
    const res: AuthResponse = await signUpApi(username, email, password);
    setUser(res.user);
    setToken(res.token);
  };

  const login = async (username: string, password: string) => {
    const res: AuthResponse = await signInApi(username, password);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !isVerifying, isVerifying, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
