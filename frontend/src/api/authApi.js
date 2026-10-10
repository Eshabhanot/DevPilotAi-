import { apiClient } from './apiClient';

/**
 * Auth Service API calls routed through API Gateway
 */
export const authApi = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, password }
   * @returns {Promise<Object>} - AuthResponse { message, token, tokenType, expiresIn }
   */
  async register({ name, email, password }) {
    const response = await apiClient.post('/api/auth/register', {
      name: name?.trim(),
      email: email?.trim(),
      password,
    });
    return response.data;
  },

  /**
   * Log in an existing user
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>} - AuthResponse { message, token, tokenType, expiresIn }
   */
  async login({ email, password }) {
    const response = await apiClient.post('/api/auth/login', {
      email: email?.trim(),
      password,
    });
    return response.data;
  },

  /**
   * Health check for auth service
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/api/auth/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },
};
