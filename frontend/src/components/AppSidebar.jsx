import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DevPilotLogo } from './DevPilotLogo';
import {
  LayoutDashboard,
  MessageSquareCode,
  BookOpen,
  FolderGit2,
  PlusCircle,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export function AppSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Ask AI (RAG)', to: '/rag', icon: MessageSquareCode },
    { name: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
    { name: 'My Projects', to: '/projects', icon: FolderGit2 },
    { name: 'Create Task', to: '/new', icon: PlusCircle },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Logo container */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <DevPilotLogo size="md" linkTo="/" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-600 stroke-[2.3]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile card at bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-2 rounded-2xl">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold text-sm flex items-center justify-center shadow-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
              {displayEmail}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
