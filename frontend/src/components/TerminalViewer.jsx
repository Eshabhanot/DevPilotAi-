import React, { useState } from 'react';
import { Copy, Check, Terminal as TerminalIcon } from 'lucide-react';

export function TerminalViewer({
  title = 'Console Output',
  content = '',
  maxHeight = 'max-h-96',
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lines = (content || '').split('\n');

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md ${className}`}>
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-300">{title}</span>
          <span className="text-slate-500">({lines.length} lines)</span>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          disabled={!content}
          aria-label="Copy output to clipboard"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Code View */}
      <div className={`p-4 font-mono text-xs overflow-x-auto overflow-y-auto ${maxHeight} text-slate-300 leading-relaxed selection:bg-sky-900`}>
        {content ? (
          <pre className="whitespace-pre font-mono">
            {lines.map((line, idx) => {
              // Highlight test outcomes
              let lineClass = 'text-slate-300';
              if (line.includes('BUILD SUCCESS') || line.includes('PASSED')) {
                lineClass = 'text-emerald-400 font-semibold';
              } else if (line.includes('BUILD FAILURE') || line.includes('FAILURE') || line.includes('ERROR')) {
                lineClass = 'text-rose-400 font-semibold';
              } else if (line.includes('[INFO]')) {
                lineClass = 'text-slate-400';
              } else if (line.includes('[WARNING]')) {
                lineClass = 'text-amber-400';
              }

              return (
                <div key={idx} className="flex">
                  <span className="w-8 select-none text-slate-600 text-right pr-3 font-mono text-[11px]">
                    {idx + 1}
                  </span>
                  <span className={lineClass}>{line}</span>
                </div>
              );
            })}
          </pre>
        ) : (
          <div className="text-slate-500 italic py-4 text-center">No terminal output recorded</div>
        )}
      </div>
    </div>
  );
}
