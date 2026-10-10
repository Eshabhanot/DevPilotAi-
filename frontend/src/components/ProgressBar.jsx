import React from 'react';

export function ProgressBar({
  progress = 0,
  currentStep = '',
  status = '',
  showLabel = true,
}) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes((status || '').toUpperCase());
  const isSuccess = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  let barColor = 'bg-sky-500';
  if (isSuccess) barColor = 'bg-emerald-500';
  else if (isFailed) barColor = 'bg-rose-500';
  else if (status === 'REPAIRING') barColor = 'bg-amber-500';

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="truncate max-w-[80%] text-slate-300">
            {currentStep || (isTerminal ? status : 'Processing...')}
          </span>
          <span className="font-semibold text-slate-200">{clamped}%</span>
        </div>
      )}

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} ${
            !isTerminal ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={currentStep || `Task progress: ${clamped}%`}
        />
      </div>
    </div>
  );
}
