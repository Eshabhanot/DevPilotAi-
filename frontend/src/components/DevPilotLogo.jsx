import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu } from 'lucide-react';

export function DevPilotLogo({ size = 'md', linkTo = '/' }) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const content = (
    <div className="flex items-center gap-2.5 group select-none">
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105`}
      >
        <div className="relative">
          <Cpu className="w-4 h-4 stroke-[2.2]" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-sky-300 rounded-full animate-ping" />
        </div>
      </div>
      <div className={`font-bold tracking-tight text-slate-900 ${textSizes[size]} flex items-center gap-1`}>
        <span>DevPilot</span>
        <span className="text-indigo-600 font-extrabold">AI</span>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
