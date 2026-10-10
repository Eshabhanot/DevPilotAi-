import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';
import {
  Code2,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const navigate = useNavigate();
  const location = useLocation();

  // Validate form fields on the client before network call
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

      // Successful auth -> redirect to destination or dashboard
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch {
      // Error handled and captured in AuthContext
    }
  };

  const toggleMode = (loginMode) => {
    setIsLoginMode(loginMode);
    setFieldErrors({});
    clearAuthError();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Icon & Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isLoginMode ? 'Welcome back to DevPilot' : 'Create your DevPilot account'}
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous multi-agent assistant for software engineering tasks
          </p>
        </div>

        {/* Session Expired Banner if applicable */}
        {sessionMessage && (
          <AlertBanner
            type="warning"
            title="Session Notification"
            message={sessionMessage}
            onClose={clearSessionMessage}
          />
        )}

        {/* Server Error Alert if applicable */}
        {authError && (
          <AlertBanner
            type="error"
            title="Authentication Failed"
            message={authError}
            onClose={clearAuthError}
          />
        )}

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                isLoginMode
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLoginMode
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name Field (Register mode only) */}
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="user-name"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                    }}
                    placeholder="Jane Developer"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                      fieldErrors.name ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p id="name-error" className="mt-1 text-xs text-rose-400">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="user-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  placeholder="developer@company.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                    fieldErrors.email ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-rose-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="user-password"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  placeholder="At least 8 characters"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                    fieldErrors.password ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-xs text-rose-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isLoginMode ? 'Authenticating...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In to Workspace' : 'Create DevPilot Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Explicit Security & Token Documentation Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>Authentication Architecture</span>
            </div>
            <p className="leading-normal">
              Protected by API Gateway (port 8080) with cryptographic JWT bearer tokens. Passwords are never stored in browser memory, and client identity is strictly verified downstream.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
