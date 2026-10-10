import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { WorkflowTimeline } from '../components/WorkflowTimeline';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { EmptyState } from '../components/EmptyState';
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
  ExternalLink,
} from 'lucide-react';

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];
const POLLING_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 100; // Bounded polling limit (5 minutes)

export function TaskDetailPage() {
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const pollCountRef = useRef(0);
  const timerRef = useRef(null);

  // Fetch task from API Gateway
  const fetchTask = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      try {
        const data = await taskApi.getTask(taskId);
        setTask(data);

        // If terminal state reached, stop any background polling immediately
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

  // Bounded polling logic
  useEffect(() => {
    fetchTask();
    pollCountRef.current = 0;

    // Start bounded interval
    timerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        // Exceeded bounded limit, stop polling to preserve resources
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      try {
        const data = await taskApi.getTask(taskId);
        setTask(data);

        // Stop polling immediately on terminal states
        if (data?.status && TERMINAL_STATUSES.includes(data.status.toUpperCase())) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      } catch (err) {
        // Network hiccup during polling - do not overwrite existing data if already loaded
        console.warn('Poll error:', err);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [taskId, fetchTask]);

  const handleCopyId = () => {
    if (!taskId) return;
    navigator.clipboard.writeText(taskId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this workflow?')) {
      return;
    }

    setCancelling(true);
    try {
      const updated = await taskApi.cancelTask(taskId);
      setTask(updated);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      alert(`Unable to cancel task: ${err.userMessage || err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !task) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingSpinner message={`Loading task details for ${taskId}...`} size="lg" fullPage />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <AlertBanner
          type="error"
          title="Task Load Error"
          message={error}
          action={
            <button
              onClick={() => fetchTask(true)}
              className="px-3 py-1 text-xs font-semibold rounded bg-rose-900 text-white"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Task not found"
          description={`No record found for task ID: ${taskId}`}
          actionLabel="Go to Dashboard"
          actionTo="/"
        />
      </div>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes((task.status || '').toUpperCase());
  const isCompleted = task.status === 'COMPLETED';
  const isFailed = task.status === 'FAILED';

  // Sub-objects from backend TaskResponse DTO
  const research = task.researchResult;
  const plan = task.implementationPlan;
  const test = task.testResult;
  const doc = task.documentationResult;
  const changedFiles = task.changedFiles || [];
  const changes = task.changes || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-mono text-slate-300">Task Detail</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isTerminal && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-900/80 transition-colors disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Task'}</span>
            </button>
          )}

          <button
            onClick={() => fetchTask(true)}
            disabled={refreshing}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Task ID with Copy */}
              <button
                onClick={handleCopyId}
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 transition-colors"
                title="Click to copy full Task ID"
              >
                <span>{task.taskId}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <StatusBadge status={task.status} size="lg" />

              {task.repairAttempts > 0 && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/80">
                  {task.repairAttempts} test repair {task.repairAttempts === 1 ? 'attempt' : 'attempts'}
                </span>
              )}
            </div>

            {/* Task Prompt Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {task.task}
            </h1>

            {/* Workspace & Dates */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                {task.workspaceId}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Created: {formatDate(task.createdAt)}
              </span>
              {task.ownerId && (
                <>
                  <span>&bull;</span>
                  <span>Owner: <strong className="text-slate-300 font-mono">{task.ownerId}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="pt-2 border-t border-slate-800/80">
          <WorkflowTimeline
            currentStatus={task.status}
            repairAttempts={task.repairAttempts}
          />
        </div>

        {/* Progress bar */}
        <div className="pt-1">
          <ProgressBar
            progress={task.progress}
            status={task.status}
            currentStep={task.currentStep}
            showLabel
          />
        </div>

        {/* Failure Summary Callout if Failed */}
        {isFailed && task.failureSummary && (
          <AlertBanner
            type="error"
            title="Workflow Failed"
            message={task.failureSummary}
          />
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800">
        <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Overview & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'research'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Research Findings {research ? '✓' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Changed Files ({changedFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>
              Test Results{' '}
              {test ? (test.status === 'PASSED' ? '✓' : '✗') : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'docs'
                ? 'border-sky-500 text-sky-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documentation {doc ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}

      {/* 1. OVERVIEW & SUMMARY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Workflow Execution Summary</span>
            </h2>

            {task.summary ? (
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                {task.summary}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isTerminal
                  ? 'No workflow summary recorded.'
                  : 'Workflow is in progress. Summary will be generated during the documentation phase.'}
              </p>
            )}

            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-[11px] text-slate-400">Current Phase</span>
                <p className="text-sm font-semibold text-sky-300 font-mono mt-0.5">
                  {task.status}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-[11px] text-slate-400">Changed Files</span>
                <p className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                  {changedFiles.length} {changedFiles.length === 1 ? 'file' : 'files'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
                <span className="text-[11px] text-slate-400">Approved Test Status</span>
                <p
                  className={`text-sm font-semibold font-mono mt-0.5 ${
                    test?.status === 'PASSED'
                      ? 'text-emerald-400'
                      : test?.status === 'FAILED'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {test ? test.status : isTerminal ? 'None' : 'Pending execution'}
                </p>
              </div>
            </div>
          </div>

          {/* Implementation Plan Preview */}
          {plan && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Planned Implementation Steps</span>
              </h3>

              {plan.summary && (
                <p className="text-xs text-slate-300">{plan.summary}</p>
              )}

              {plan.steps && plan.steps.length > 0 ? (
                <ol className="space-y-2 text-xs text-slate-300">
                  {plan.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/60"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-500 italic">No explicit steps listed.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. RESEARCH FINDINGS */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          {!research ? (
            <EmptyState
              icon={Search}
              title="Research not initiated yet"
              description="The Research Agent will inspect workspace files, search technical documentation, and record findings here once started."
              actionLabel="Refresh Task"
              onAction={() => fetchTask(true)}
            />
          ) : (
            <>
              {/* Research Summary Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-400" />
                    <span>Research Synthesis</span>
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                      research.knowledgeServiceAvailable
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    Knowledge Service:{' '}
                    {research.knowledgeServiceAvailable ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {research.researchSummary || research.taskSummary || 'No research summary available.'}
                </div>
              </div>

              {/* Technical Evidence & Retrieved Sources */}
              {research.retrievedTechnicalEvidence && research.retrievedTechnicalEvidence.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-400" />
                    <span>Retrieved Technical Evidence</span>
                  </h4>
                  <div className="space-y-2">
                    {research.retrievedTechnicalEvidence.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1.5"
                      >
                        <p className="text-slate-200">{item.evidence}</p>
                        {item.source && (
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            <span className="text-sky-400">[{item.source.title || 'Source'}]</span>
                            <span>{item.source.headingPath}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Files Identified */}
              {research.relevantFiles && research.relevantFiles.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-emerald-400" />
                    <span>Relevant Files Identified</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {research.relevantFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono text-slate-200">
                          <span className="truncate">{file.filePath}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{file.kind}</span>
                        </div>
                        {file.preview && (
                          <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded overflow-x-auto">
                            {file.preview}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations and Potential Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {research.implementationRecommendations && research.implementationRecommendations.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Implementation Recommendations</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      {research.implementationRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {research.potentialRisks && research.potentialRisks.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Potential Risks</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside">
                      {research.potentialRisks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. CHANGED FILES & CODING RESULTS */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          {changedFiles.length === 0 && changes.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No changed files recorded yet"
              description="When the Coding Agent applies changes to your workspace, modified file paths, actions, and rationales will appear here."
              actionLabel="Refresh Task"
              onAction={() => fetchTask(true)}
            />
          ) : (
            <>
              {/* Changed files summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span>Workspace Modifications ({changedFiles.length})</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {changes.length > 0 ? (
                    changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-sky-300">
                            {change.path}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {change.action || 'updated'}
                          </span>
                        </div>
                        {change.rationale && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {change.rationale}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <ul className="space-y-2">
                      {changedFiles.map((file, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-200"
                        >
                          <FileCode2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Coding Assumptions */}
              {task.codingAssumptions && task.codingAssumptions.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Coding Assumptions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {task.codingAssumptions.map((assumption, i) => (
                      <li key={i}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. TEST RESULTS */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {!test ? (
            <EmptyState
              icon={FlaskConical}
              title="No test execution recorded yet"
              description="The Testing Agent runs approved tests (e.g. 'mvn test') once code modifications are completed. Results and console logs will be rendered here."
              actionLabel="Refresh Task"
              onAction={() => fetchTask(true)}
            />
          ) : (
            <>
              {/* Test Status Banner */}
              <div
                className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  test.status === 'PASSED'
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                    : test.status === 'TIMED_OUT'
                    ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {test.status === 'PASSED' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm">
                      {test.status === 'PASSED'
                        ? 'All Approved Tests Passed Successfully'
                        : `Approved Test Execution: ${test.status}`}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">{test.summary}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="opacity-75 block text-[10px]">Command</span>
                    <strong>{test.command || 'mvn test'}</strong>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">Exit Code</span>
                    <strong>{test.exitCode}</strong>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">Duration</span>
                    <strong>{formatDuration(test.duration)}</strong>
                  </div>
                </div>
              </div>

              {/* Failure Messages (if any) */}
              {test.relevantFailureMessages && test.relevantFailureMessages.length > 0 && (
                <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-semibold text-rose-300">Failure Highlights</h4>
                  <ul className="space-y-1 text-xs text-rose-200 font-mono">
                    {test.relevantFailureMessages.map((msg, i) => (
                      <li key={i} className="bg-rose-950/80 p-2 rounded border border-rose-900/50">
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Terminal Log Output */}
              <TerminalViewer
                title={`Test Console (${test.command || 'mvn test'})`}
                content={test.output || 'No output captured.'}
                maxHeight="max-h-[500px]"
              />
            </>
          )}
        </div>
      )}

      {/* 5. DOCUMENTATION */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {!doc ? (
            <EmptyState
              icon={FileText}
              title="Documentation not ready yet"
              description="The Documentation Agent prepares deployment instructions, API endpoints, and configuration notes upon test verification."
              actionLabel="Refresh Task"
              onAction={() => fetchTask(true)}
            />
          ) : (
            <>
              {/* Documentation Summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Documentation & Integration Summary</span>
                  </h3>
                  {doc.readmeUpdated && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      README.md Updated
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {doc.summary || 'Documentation generated.'}
                </div>
              </div>

              {/* Local Run Instructions */}
              {doc.localRunInstructions && doc.localRunInstructions.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Local Run Instructions
                  </h4>
                  <div className="space-y-2">
                    {doc.localRunInstructions.map((instruction, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-300"
                      >
                        {instruction}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration Requirements */}
              {doc.configurationRequirements && doc.configurationRequirements.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Configuration Requirements
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {doc.configurationRequirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documented API Endpoints */}
              {doc.apiEndpoints && doc.apiEndpoints.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Documented API Endpoints
                  </h4>
                  <div className="space-y-2">
                    {doc.apiEndpoints.map((ep, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono text-sky-300"
                      >
                        {ep}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
