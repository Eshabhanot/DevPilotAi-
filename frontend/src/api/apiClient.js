import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

/**
 * Base URL:
 * In development, Vite proxies '/api' to 'http://localhost:8080' (API Gateway).
 * Can be overridden with VITE_API_BASE_URL if needed.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds timeout for workflow operations
});

// Custom event name for expired sessions
export const SESSION_EXPIRED_EVENT = 'devpilot:session_expired';

/**
 * Request Interceptor:
 * Attaches the bearer token to protected API requests.
 * Explicitly prevents client-supplied user headers (X-Authenticated-User)
 * to ensure identity is only established by the Gateway validating the token.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Clean any accidentally supplied authentication headers
    delete config.headers['X-Authenticated-User'];

    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Handles 401 Unauthorized and 403 Forbidden responses.
 * Normalizes error messages from backend ApiError payloads.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    // Handle expired or invalid session
    if (status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/api/auth/login') ||
        error.config?.url?.includes('/api/auth/register');

      if (!isAuthRoute) {
        tokenStorage.clear();
        // Dispatch session expired event so React components can show notification
        window.dispatchEvent(
          new CustomEvent(SESSION_EXPIRED_EVENT, {
            detail: {
              message: 'Your session has expired or is invalid. Please log in again.',
            },
          })
        );
      }
    }

    // Extract user-friendly error message from backend DTOs
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.map((e) => e.defaultMessage || e).join(', ');
      }
    } else if (error.message) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'The server request timed out. Please verify the backend is running.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to API Gateway (http://localhost:8080). Ensure the backend services are running.';
      } else {
        errorMessage = error.message;
      }
    }

    // Attach extracted message for components to easily read
    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);
