/**
 * API Client
 *
 * Wrapper around fetch that automatically adds authentication headers
 * and handles auth errors (401 responses).
 */

import { authService } from '../services/auth';

const API_URL = 'http://localhost:8000';

/**
 * Make an authenticated API request.
 *
 * @param {string} endpoint - API endpoint (e.g., '/sessions')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} The fetch response
 * @throws {AuthError} If the request fails due to authentication
 */
export async function apiClient(endpoint, options = {}) {
  const authToken = authService.getAuthToken();

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth header if we have a token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Clear auth and trigger re-authentication
    authService.clearAuth();

    // Dispatch a custom event that the AuthContext can listen to
    window.dispatchEvent(new CustomEvent('auth-expired'));

    throw new AuthError('Authentication expired or invalid');
  }

  return response;
}

/**
 * Custom error class for authentication errors.
 */
export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Convenience methods for common HTTP operations.
 */
export const api = {
  /**
   * GET request
   */
  async get(endpoint) {
    return apiClient(endpoint, { method: 'GET' });
  },

  /**
   * POST request
   */
  async post(endpoint, data) {
    return apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return apiClient(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return apiClient(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;

