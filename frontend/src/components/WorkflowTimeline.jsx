import React from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Ban,
  Search,
  GitBranch,
  Code2,
  FlaskConical,
  FileText,
} from 'lucide-react';

const STAGES = [
  { id: 'ACCEPTED', label: 'Accepted', icon: Clock },
  { id: 'RESEARCHING', label: 'Research', icon: Search },
  { id: 'PLANNING', label: 'Plan', icon: GitBranch },
  { id: 'CODING', label: 'Code', icon: Code2 },
  { id: 'TESTING', label: 'Test & Repair', icon: FlaskConical },
  { id: 'DOCUMENTING', label: 'Docs', icon: FileText },
  { id: 'COMPLETED', label: 'Finished', icon: CheckCircle2 },
];

const STAGE_ORDER = {
  ACCEPTED: 0,
  RESEARCHING: 1,
  PLANNING: 2,
  CODING: 3,
  TESTING: 4,
  REPAIRING: 4, // counts as testing stage
  DOCUMENTING: 5,
  COMPLETED: 6,
};

export function WorkflowTimeline({ currentStatus = 'ACCEPTED', repairAttempts = 0 }) {
  const normStatus = (currentStatus || '').toUpperCase();
  const isFailed = normStatus === 'FAILED';
  const isCancelled = normStatus === 'CANCELLED';
  const activeIndex = STAGE_ORDER[normStatus] ?? 0;

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line behind icons */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />

        {STAGES.map((stage, idx) => {
          const isPast = idx < activeIndex;
          const isCurrent = idx === activeIndex && !isFailed && !isCancelled;
          const isCompletedFinal = stage.id === 'COMPLETED' && normStatus === 'COMPLETED';

          let circleClass = 'bg-slate-900 border-slate-700 text-slate-500';
          let textClass = 'text-slate-500';
          let IconComponent = stage.icon;

          if (isPast) {
            circleClass = 'bg-sky-950 border-sky-500 text-sky-400';
            textClass = 'text-sky-300 font-medium';
            IconComponent = CheckCircle2;
          } else if (isCurrent) {
            circleClass = 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-500/20 ring-4 ring-sky-500/10';
            textClass = 'text-sky-300 font-semibold';
          } else if (isCompletedFinal) {
            circleClass = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20';
            textClass = 'text-emerald-300 font-semibold';
          } else if (isFailed && idx === activeIndex) {
            circleClass = 'bg-rose-900 border-rose-500 text-rose-300';
            textClass = 'text-rose-400 font-semibold';
            IconComponent = XCircle;
          } else if (isCancelled && idx === activeIndex) {
            circleClass = 'bg-zinc-800 border-zinc-600 text-zinc-400';
            textClass = 'text-zinc-400 font-semibold';
            IconComponent = Ban;
          }

          return (
            <div
              key={stage.id}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${circleClass}`}
              >
                {isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              <span className={`mt-2 text-xs text-center transition-colors ${textClass}`}>
                {stage.label}
              </span>

              {stage.id === 'TESTING' && repairAttempts > 0 && (
                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                  ({repairAttempts} {repairAttempts === 1 ? 'repair' : 'repairs'})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
