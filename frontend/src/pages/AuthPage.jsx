import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';
import { DevPilotLogo } from '../components/DevPilotLogo';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Check,
} from 'lucide-react';

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize mode: true for login, false for register
  const [isLoginMode, setIsLoginMode] = useState(() => location.pathname !== '/register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const {
    login,
    register,
    loading,
    authError,
    sessionMessage,
    clearAuthError,
    clearSessionMessage,
  } = useAuth();

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLoginMode(false);
    } else if (location.pathname === '/login') {
      setIsLoginMode(true);
    }
  }, [location.pathname]);

  const validateForm = () => {
    const errors = {};

    if (!isLoginMode) {
      if (!name.trim()) {
        errors.name = 'Full name is required';
      } else if (name.trim().length > 100) {
        errors.name = 'Name cannot exceed 100 characters';
      }
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (password.length > 72) {
      errors.password = 'Password cannot exceed 72 characters';
    }

    if (!isLoginMode && confirmPassword && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAuthError();

    if (!validateForm()) {
      return;
    }

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }

      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch {
      // Error is caught and surfaced in AuthContext
    }
  };

  const switchMode = (loginMode) => {
    setIsLoginMode(loginMode);
    setFieldErrors({});
    clearAuthError();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-indigo-500/10 selection:text-indigo-600">
      {/* Top Header with DevPilot AI Logo */}
      <div className="p-6 sm:px-10">
        <DevPilotLogo size="lg" linkTo="/" />
      </div>

      {/* Main Centered Auth Card */}
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoginMode ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isLoginMode
                ? 'Login to your DevPilot AI account'
                : 'Join DevPilot AI to start building with AI'}
            </p>
          </div>

          {/* Hidden/accessible tab switcher for test discovery */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                isLoginMode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                !isLoginMode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Session Expiry or Error Alert */}
          {sessionMessage && (
            <AlertBanner
              type="warning"
              message={sessionMessage}
              onClose={clearSessionMessage}
            />
          )}

          {authError && (
            <AlertBanner
              type="error"
              message={authError}
              onClose={clearAuthError}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name field (Only in Registration Mode) */}
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                    }}
                    placeholder="John Doe"
                    disabled={loading}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.name
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Address field */}
            <div>
              <label
                htmlFor="emailAddress"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <input
                  id="emailAddress"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  placeholder="john@example.com"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  placeholder={isLoginMode ? 'Enter your password' : 'Minimum 8 characters'}
                  disabled={loading}
                  className={`w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password field (Only in Registration Mode) */}
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors({ ...fieldErrors, confirmPassword: null });
                    }}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className={`w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Remember Me and Forgot Password (Only in Login Mode) */}
            {isLoginMode && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset is managed by Auth Service administrator.')}
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-label={isLoginMode ? 'Sign In to Workspace' : 'Create DevPilot Account'}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isLoginMode ? (
                <span>Sign In to Workspace</span>
              ) : (
                <span>Create DevPilot Account</span>
              )}
            </button>
          </form>

          {/* Social login divider (Screen 3) */}
          {isLoginMode && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert('Google Single Sign-On is configured via Enterprise OAuth 2.0.')}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Footer toggle link */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {isLoginMode ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Log in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacer / footer note */}
      <div className="py-6 text-center text-xs text-slate-400">
        Protected by Spring Cloud API Gateway JWT Security
      </div>
    </div>
  );
}
