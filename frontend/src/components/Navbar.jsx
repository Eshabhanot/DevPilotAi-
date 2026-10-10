import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  User,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  DevPilot<span className="text-sky-400 font-mono font-semibold">.AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">
                  Autonomous Developer
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/new"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/new')
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-sky-400" />
                  <span>New Task</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Gateway indicator pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Gateway: 8080</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono text-slate-200">
                    {user?.name || user?.email || 'Developer'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  type="button"
                  aria-label="Sign out"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle Navigation Menu"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isActive('/') ? 'bg-slate-800 text-sky-400' : 'text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/new"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isActive('/new') ? 'bg-slate-800 text-sky-400' : 'text-slate-300'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Task</span>
              </Link>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  {user?.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2 text-sm bg-sky-600 text-white rounded-lg font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
