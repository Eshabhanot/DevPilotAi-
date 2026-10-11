import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, X, CheckCircle, ShieldCheck } from 'lucide-react';

export function AppHeader({ title, subtitle, onToggleMobileMenu }) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title || `Welcome back, ${displayName}!`}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/60"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-8 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  No notifications returned by the backend.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-indigo-100">
          {initial}
        </div>
      </div>
    </header>
  );
}
