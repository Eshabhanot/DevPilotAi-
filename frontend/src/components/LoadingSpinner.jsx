import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
  className = '',
}) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 ${className}`}>
      <Loader2
        className={`animate-spin text-sky-400 ${sizeMap[size] || sizeMap.md}`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-slate-400 font-mono animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status">
        {spinner}
      </div>
    );
  }

  return <div role="status">{spinner}</div>;
}
