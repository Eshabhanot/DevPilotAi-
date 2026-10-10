/**
 * DevPilot AI - Token Storage Strategy & Security Documentation
 * 
 * BACKEND ARCHITECTURE CONTEXT:
 * - The DevPilot API Gateway (port 8080) and Auth Service (port 8081) use stateless JWT Bearer authentication.
 * - The login and register endpoints return `{ token, tokenType: "Bearer", expiresIn: number }` in the response body.
 * - The backend does not currently issue HttpOnly Set-Cookie headers.
 * 
 * FRONTEND TOKEN STORAGE STRATEGY:
 * - The JWT access token is stored in the browser's `localStorage` alongside the token expiration timestamp.
 * 
 * SECURITY TRADE-OFFS & HARDENING:
 * 1. XSS vs CSRF:
 *    - `localStorage` is immune to Cross-Site Request Forgery (CSRF) because browsers do not automatically attach
 *      localStorage items to cross-site requests (unlike cookies).
 *    - However, tokens in `localStorage` can be read if an attacker executes arbitrary JavaScript (XSS).
 *    - Mitigation: React's built-in JSX escaping prevents standard XSS. No unsanitized `dangerouslySetInnerHTML` is used.
 * 2. Password Safety:
 *    - Passwords are NEVER cached, stored, or persisted in localStorage, sessionStorage, or state after authentication.
 * 3. Identity Verification:
 *    - The frontend NEVER supplies or trusts a client-supplied user ID or `X-Authenticated-User` header.
 *    - The API Gateway strips any incoming `X-Authenticated-User` and injects the validated user subject
 *      extracted directly from the verified cryptographic JWT signature.
 * 4. Automatic Session Expiry:
 *    - When the token expires (HTTP 401/403 or calculated expiry), the token is immediately wiped from storage,
 *      and the user is redirected to the login view with an informative notification.
 */

const TOKEN_KEY = 'devpilot_auth_token';
const EXPIRY_KEY = 'devpilot_token_expiry';
const USER_KEY = 'devpilot_user_info';

export const tokenStorage = {
  /**
   * Save authentication payload
   * @param {string} token - The raw JWT bearer string
   * @param {number} expiresInSeconds - Lifetime in seconds (e.g. 900 for 15 minutes)
   * @param {object} userInfo - Optional user display info (email, name)
   */
  setToken(token, expiresInSeconds = 900, userInfo = null) {
    if (!token) return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      localStorage.setItem(EXPIRY_KEY, expiresAt.toString());
      if (userInfo) {
        localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      }
    } catch (err) {
      console.error('Failed to save auth token to localStorage:', err);
    }
  },

  /**
   * Get the stored bearer token
   * @returns {string|null}
   */
  getToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(EXPIRY_KEY);

      if (!token) return null;

      // Check if token has expired locally
      if (expiry && Date.now() > Number(expiry)) {
        this.clear();
        return null;
      }

      return token;
    } catch (err) {
      console.error('Failed to retrieve token:', err);
      return null;
    }
  },

  /**
   * Get cached user profile information
   * @returns {object|null}
   */
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set user profile information
   */
  setUser(userInfo) {
    try {
      if (userInfo) {
        localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error('Failed to set user info:', err);
    }
  },

  /**
   * Check if active session exists and is unexpired
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  },

  /**
   * Clear all auth credentials (on logout or 401)
   */
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Failed to clear token storage:', err);
    }
  },
};
