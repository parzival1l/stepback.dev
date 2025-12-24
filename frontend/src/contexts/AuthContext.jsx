/**
 * Authentication Context
 *
 * Provides authentication state and methods to the entire application.
 * Handles session storage persistence and auth expiration events.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

// Create the context
const AuthContext = createContext(null);

/**
 * Authentication Provider component.
 * Wrap your app with this to provide auth state to all children.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = authService.getAuthToken();

      if (token) {
        // Validate the existing token with the backend
        const result = await authService.validateToken(token);

        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear it
          authService.clearAuth();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkExistingAuth();
  }, []);

  // Listen for auth expiration events from apiClient
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  /**
   * Login with an auth code.
   * @param {string} code - The 16-digit auth code
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (code) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.login(code);

      if (result.success) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      } else {
        setError(result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Logout the current user.
   */
  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Get the current auth token.
   * @returns {string|null}
   */
  const getAuthToken = useCallback(() => {
    return authService.getAuthToken();
  }, []);

  /**
   * Clear any auth errors.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getAuthToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;

