import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { WorkflowTimeline } from '../components/WorkflowTimeline';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { TerminalViewer } from '../components/TerminalViewer';
import { formatDate, formatDuration } from '../utils/dateUtils';
import {
  ArrowLeft,
  RefreshCw,
  Ban,
  Clock,
  FolderGit2,
  FileCode2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  GitBranch,
  Code2,
  FlaskConical,
  FileText,
  AlertTriangle,
  Info,
  Terminal,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Workflow,
  Sparkles,
  File,
  Folder,
} from 'lucide-react';

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];
const POLLING_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;

export function TaskDetailPage() {
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [viewMode, setViewMode] = useState('workflow');
  const [selectedFilePath, setSelectedFilePath] = useState('');

  const pollCountRef = useRef(0);
  const timerRef = useRef(null);

  const fetchTask = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      try {
        const data = await taskApi.getTask(taskId);
        setTask(data);

        if (data?.status && TERMINAL_STATUSES.includes(data.status.toUpperCase())) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      } catch (err) {
        setError(
          err.userMessage || `Failed to fetch task ${taskId} from API Gateway.`
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [taskId]
  );

  useEffect(() => {
    fetchTask();
    pollCountRef.current = 0;

    timerRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      fetchTask(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchTask]);

  const changedFilePaths = [
    ...(task?.changedFiles || []),
    ...(task?.changes || []).map((change) => change.path),
  ].filter(Boolean);

  const uniqueChangedFilePaths = [...new Set(changedFilePaths)];

  useEffect(() => {
    if (!selectedFilePath && uniqueChangedFilePaths.length > 0) {
      setSelectedFilePath(uniqueChangedFilePaths[0]);
    }
  }, [selectedFilePath, uniqueChangedFilePaths]);

  const handleCopy = (text, type = 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel task ${taskId}?`)) return;
    setCancelling(true);
    try {
      const updated = await taskApi.cancelTask(taskId);
      setTask(updated);
    } catch (err) {
      alert(`Could not cancel task: ${err.userMessage || err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !task) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">
          Retrieving agent execution graph from API Gateway...
        </p>
      </div>
    );
  }

  // Format creation date
  const createdDate = task?.createdAt
    ? formatDate(task.createdAt)
    : 'Not available';

  const status = task?.status || 'UNKNOWN';
  const isCompleted = status === 'COMPLETED';
  const isInProgress = !['COMPLETED', 'FAILED', 'CANCELLED', 'UNKNOWN'].includes(status);

  const agentLogs = [
    task?.currentStep && {
      time: task?.updatedAt ? formatDate(task.updatedAt) : 'Now',
      message: task.currentStep,
      done: !isInProgress,
      active: isInProgress,
    },
    task?.summary && {
      time: task?.updatedAt ? formatDate(task.updatedAt) : 'Now',
      message: task.summary,
      done: true,
    },
    task?.failureSummary && {
      time: task?.updatedAt ? formatDate(task.updatedAt) : 'Now',
      message: task.failureSummary,
      done: true,
    },
  ].filter(Boolean);

  const selectedChange = task?.changes?.find((c) => c.path === selectedFilePath);
  const currentCode =
    selectedChange?.content ||
    selectedChange?.rationale ||
    'File content was not returned by the backend for this task.';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Row (Screens 8 & 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {task?.task || 'Task details'}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
                }`}
              />
              <span>{status}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pl-8">
            <span className="font-mono">
              Task ID: <span className="font-semibold text-slate-600">{taskId}</span>
            </span>
            <span>|</span>
            <span>Created: {createdDate}</span>
          </div>
          {task?.summary && (
            <p className="text-xs text-slate-500 pl-8 mt-1">
              {task.summary}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTask(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {isInProgress && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Task</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Workflow Notice"
          message={error}
          actionLabel="Retry"
          onAction={() => fetchTask(false)}
        />
      )}

      {/* Screen 8: 4-Stage Multi-Agent Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="relative flex items-center justify-between max-w-3xl mx-auto">
          {/* Connector Line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-0 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, task?.progress || 0))}%`,
            }}
          />

          {/* Stage 1: Research */}
          <div className="flex flex-col items-center gap-2 z-10 bg-white px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-900 block">Research</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Done</span>
            </div>
          </div>

          {/* Stage 2: Coding */}
          <div className="flex flex-col items-center gap-2 z-10 bg-white px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-500/25 ring-4 ring-indigo-50 animate-pulse'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Code2 className="w-5 h-5" />}
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-900 block">Coding</span>
              <span
                className={`text-[10px] font-semibold ${
                  isCompleted ? 'text-emerald-600' : 'text-indigo-600'
                }`}
              >
                {isCompleted ? 'Done' : 'In Progress'}
              </span>
            </div>
          </div>

          {/* Stage 3: Testing */}
          <div className="flex flex-col items-center gap-2 z-10 bg-white px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <span>3</span>}
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-700 block">Testing</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isCompleted ? 'Passed' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Stage 4: Documentation */}
          <div className="flex flex-col items-center gap-2 z-10 bg-white px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <span>4</span>}
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-700 block">Documentation</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isCompleted ? 'Generated' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs (Screen 8 vs Screen 9 & Details) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setViewMode('workflow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'workflow'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Agent Workflow</span>
          </button>

          <button
            onClick={() => setViewMode('code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'code'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Generated Code View</span>
          </button>
        </div>

        {/* Buttons for test suite discovery */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setViewMode('research')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'research' ? 'bg-slate-200 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Research Findings
          </button>
          <button
            onClick={() => setViewMode('files')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'files' ? 'bg-slate-200 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Changed Files
          </button>
          <button
            onClick={() => setViewMode('tests')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'tests' ? 'bg-slate-200 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Test Results
          </button>
          <button
            onClick={() => setViewMode('docs')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'docs' ? 'bg-slate-200 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Documentation
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: Screen 8 Agent Logs View */}
      {viewMode === 'workflow' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Agent Logs</h3>
            </div>
            <button
              onClick={() => fetchTask(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs">
            {agentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No workflow log entries returned by the backend yet.
              </div>
            ) : (
            agentLogs.map((log, index) => (
              <div
                key={index}
                className="py-3 flex items-start gap-4 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <span className="text-slate-400 font-semibold shrink-0">
                  {log.time}
                </span>
                <span
                  className={`flex-1 ${
                    log.active
                      ? 'text-indigo-600 font-bold animate-pulse'
                      : 'text-slate-700'
                  }`}
                >
                  {log.message}
                </span>
                {log.done && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
            ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Workspace: {task?.workspaceId || 'Not returned by backend'}</span>
            <button
              onClick={() => setViewMode('code')}
              className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Generated Code</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Screen 9 Generated Code View */}
      {viewMode === 'code' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          {/* Left Pane: Generated Files Tree */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Generated Files
              </span>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {uniqueChangedFilePaths.length} file{uniqueChangedFilePaths.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs select-none">
              {uniqueChangedFilePaths.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No changed files returned.
                </div>
              ) : (
                uniqueChangedFilePaths.map((path) => (
                  <div
                    key={path}
                    onClick={() => setSelectedFilePath(path)}
                    className={`py-1 px-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors ${
                      selectedFilePath === path
                        ? 'bg-indigo-100 text-indigo-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <File className="w-3 h-3 text-indigo-600" />
                    <span className="truncate">{path}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Pane: Code Viewer */}
          <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-200">
            {/* File Header Bar */}
            <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold">
                {selectedFilePath.split('/').pop()}
              </span>

              <button
                onClick={() => handleCopy(currentCode, 'code')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Box with Line Numbers */}
            <div className="p-5 overflow-auto font-mono text-xs leading-relaxed dark-scroll flex-1">
              <pre className="text-slate-200">
                {currentCode.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-slate-900/50">
                    <span className="w-8 select-none text-slate-600 text-right pr-4 font-mono">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: Research Findings Tab (For test suite) */}
      {viewMode === 'research' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Research Findings</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {task?.researchResult?.researchSummary ||
              'No research findings returned by the backend yet.'}
          </p>
        </div>
      )}

      {/* VIEW MODE 4: Changed Files Tab (For test suite) */}
      {viewMode === 'files' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Changed Files</h3>
          <div className="space-y-2">
            {(task?.changes || []).length === 0 ? (
              <p className="text-xs text-slate-500">No changed files returned by the backend yet.</p>
            ) : (
            task.changes.map((c, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-mono font-bold text-slate-800">{c.path}</span>
                <p className="text-slate-600">{c.rationale}</p>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 5: Test Results Tab (For test suite) */}
      {viewMode === 'tests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Test Results</h3>
          {task?.testResult?.status && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              {task.testResult.status}
            </p>
          )}
          <div className="bg-slate-950 p-4 rounded-xl text-slate-200 font-mono text-xs">
            <pre>{task?.testResult?.output || 'No test output returned by the backend yet.'}</pre>
          </div>
        </div>
      )}

      {/* VIEW MODE 6: Documentation Tab (For test suite) */}
      {viewMode === 'docs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Documentation</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
            {task?.documentationResult?.localRunInstructions?.join('\n') ||
              'No documentation returned by the backend yet.'}
          </div>
        </div>
      )}
    </div>
  );
}
