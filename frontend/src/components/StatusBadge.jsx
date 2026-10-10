import React from 'react';
import {
  Clock,
  Search,
  GitBranch,
  Code2,
  FlaskConical,
  Wrench,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';

const STATUS_CONFIG = {
  ACCEPTED: {
    label: 'Accepted',
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Clock,
    animate: false,
  },
  RESEARCHING: {
    label: 'Researching',
    bg: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    icon: Search,
    animate: true,
  },
  PLANNING: {
    label: 'Planning',
    bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
    icon: GitBranch,
    animate: true,
  },
  CODING: {
    label: 'Coding',
    bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    icon: Code2,
    animate: true,
  },
  TESTING: {
    label: 'Testing',
    bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
    icon: FlaskConical,
    animate: true,
  },
  REPAIRING: {
    label: 'Repairing',
    bg: 'bg-orange-950/80 text-orange-300 border-orange-800/80',
    icon: Wrench,
    animate: true,
  },
  DOCUMENTING: {
    label: 'Documenting',
    bg: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
    icon: FileText,
    animate: true,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    icon: CheckCircle2,
    animate: false,
  },
  FAILED: {
    label: 'Failed',
    bg: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    icon: XCircle,
    animate: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    icon: Ban,
    animate: false,
  },
};

export function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIG[normStatus] || {
    label: status || 'Unknown',
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Clock,
    animate: false,
  };

  const IconComponent = config.icon;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2 font-medium'
      : 'px-2.5 py-1 text-xs gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} shadow-sm`}
    >
      <IconComponent
        className={`w-3.5 h-3.5 ${config.animate ? 'animate-pulse text-current' : ''}`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}
