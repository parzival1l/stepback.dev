/**
 * Authentication Service
 *
 * This module provides a modular authentication interface that can be
 * swapped between different implementations (hash-based, OAuth, etc.)
 */

const STORAGE_KEY = 'stepback_auth_code';

/**
 * Abstract auth service interface.
 * All auth implementations should follow this pattern.
 */
class AbstractAuthService {
  getAuthToken() { throw new Error('Not implemented'); }
  setAuthToken(token) { throw new Error('Not implemented'); }
  clearAuth() { throw new Error('Not implemented'); }
  isAuthenticated() { throw new Error('Not implemented'); }
  async validateToken(token) { throw new Error('Not implemented'); }
}

/**
 * Hash-based authentication service.
 * Uses sessionStorage to persist auth code across page refreshes,
 * but clears when browser is closed.
 */
class HashAuthService extends AbstractAuthService {
  constructor(apiUrl = 'http://localhost:8000') {
    super();
    this.apiUrl = apiUrl;
  }

  /**
   * Get the current auth token from sessionStorage.
   * @returns {string|null} The auth token or null if not set
   */
  getAuthToken() {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  /**
   * Store the auth token in sessionStorage.
   * @param {string} token - The auth token to store
   */
  setAuthToken(token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  }

  /**
   * Clear the auth token from sessionStorage.
   */
  clearAuth() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if user is currently authenticated.
   * @returns {boolean} True if auth token exists
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  /**
   * Validate a token with the backend.
   * @param {string} token - The token to validate
   * @returns {Promise<{valid: boolean, error?: string}>} Validation result
   */
  async validateToken(token) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, user: data.user };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid authentication code' };
      } else {
        return { valid: false, error: 'Server error during validation' };
      }
    } catch (error) {
      return { valid: false, error: 'Network error: Unable to validate' };
    }
  }

  /**
   * Attempt to login with the given code.
   * @param {string} code - The 16-digit auth code
   * @returns {Promise<{success: boolean, error?: string}>} Login result
   */
  async login(code) {
    const result = await this.validateToken(code);

    if (result.valid) {
      this.setAuthToken(code);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  }

  /**
   * Logout the current user.
   */
  logout() {
    this.clearAuth();
  }
}

// Export singleton instance
export const authService = new HashAuthService();

// Export class for testing or custom instances
export { HashAuthService, AbstractAuthService };

