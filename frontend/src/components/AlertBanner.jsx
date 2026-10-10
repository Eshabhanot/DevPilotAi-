import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const VARIANTS = {
  error: {
    bg: 'bg-rose-950/60 border-rose-800/80 text-rose-200',
    iconColor: 'text-rose-400',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-950/60 border-amber-800/80 text-amber-200',
    iconColor: 'text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-sky-950/60 border-sky-800/80 text-sky-200',
    iconColor: 'text-sky-400',
    Icon: Info,
  },
  success: {
    bg: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200',
    iconColor: 'text-emerald-400',
    Icon: CheckCircle2,
  },
};

export function AlertBanner({
  type = 'info',
  title = '',
  message = '',
  onClose = null,
  action = null,
  className = '',
}) {
  const config = VARIANTS[type] || VARIANTS.info;
  const IconComponent = config.Icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border text-sm backdrop-blur-sm shadow-sm ${config.bg} ${className}`}
    >
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold text-slate-100">{title}</h4>}
        <div className="text-slate-300 leading-relaxed text-xs sm:text-sm break-words">
          {message}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-100 p-1 -mr-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
