import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
        <Terminal className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono text-rose-400 uppercase tracking-widest mb-1">
        HTTP 404
      </span>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested endpoint or page does not exist in the DevPilot interface.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
