import React from 'react';
import { Terminal, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({
  icon: Icon = Terminal,
  title = 'No tasks found',
  description = 'You have not submitted any AI coding tasks yet. Start a task to automate software changes.',
  actionLabel = 'Create Software Task',
  actionTo = '/new',
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 my-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {onAction ? (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      ) : actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Link>
      ) : null}
    </div>
  );
}
