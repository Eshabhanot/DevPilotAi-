import React from 'react';
import { Layers, ShieldCheck, Cpu, TerminalSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">DevPilot AI Platform</span>
            <span>&bull;</span>
            <span>Multi-Agent Software Engineering</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5" title="Central routing & JWT filter">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Gateway:8080
            </span>
            <span className="flex items-center gap-1.5" title="Authentication service">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Auth:8081
            </span>
            <span className="flex items-center gap-1.5" title="Agent workflow orchestrator">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Orchestrator:8084
            </span>
            <span className="flex items-center gap-1.5" title="Controlled developer tool MCP server">
              <TerminalSquare className="w-3.5 h-3.5 text-amber-400" />
              MCP:8085
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
