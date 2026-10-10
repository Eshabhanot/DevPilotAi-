import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { EmptyState } from '../components/EmptyState';
import { formatDate, timeAgo } from '../utils/dateUtils';
import {
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderGit2,
  Copy,
  Check,
  Ban,
  Layers,
} from 'lucide-react';

export function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedTaskId, setCopiedTaskId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await taskApi.listTasks();
      // Sort tasks descending by createdAt
      const sorted = [...(data || [])].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setTasks(sorted);
    } catch (err) {
      setError(
        err.userMessage || 'Failed to fetch tasks from the API Gateway. Ensure all backend services are running.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCopyId = (taskId, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(taskId);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const handleCancelTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to cancel task ${taskId.slice(0, 8)}...?`)) {
      return;
    }

    setActionLoadingId(taskId);
    try {
      const updated = await taskApi.cancelTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      alert(`Could not cancel task: ${err.userMessage || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const activeCount = tasks.filter(
    (t) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(t.status)
  ).length;
  const failedCount = tasks.filter((t) => ['FAILED', 'CANCELLED'].includes(t.status)).length;

  // Filter & Search logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      (task.task || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.taskId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.workspaceId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? !['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status)
        : task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Engineering Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor, orchestrate, and review autonomous software modification workflows
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTasks(true)}
            disabled={loading || refreshing}
            type="button"
            aria-label="Refresh tasks"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Task</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Could Not Load Tasks"
          message={error}
          action={
            <button
              onClick={() => fetchTasks(false)}
              className="px-3 py-1 text-xs font-semibold rounded bg-rose-900/60 hover:bg-rose-800 text-white border border-rose-700 transition-colors"
            >
              Retry Connection
            </button>
          }
        />
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Tasks</p>
            <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
            <Clock className={`w-5 h-5 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Failed / Cancelled</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{failedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task description, Task ID, or repository..."
            aria-label="Search tasks"
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter tasks by status"
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Statuses ({totalCount})</option>
            <option value="ACTIVE">In Progress ({activeCount})</option>
            <option value="COMPLETED">Completed ({completedCount})</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Task List / Content Section */}
      {loading ? (
        <LoadingSpinner message="Querying tasks from API Gateway..." size="lg" fullPage />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No software tasks created yet"
          description="Submit your first software task to run autonomous research, planning, coding, and approved testing in your workspace."
          actionLabel="Describe Software Task"
          actionTo="/new"
        />
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800 p-8 space-y-3">
          <p className="text-slate-300 font-medium text-sm">No tasks match your criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or clearing your status filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            type="button"
            className="text-xs text-sky-400 hover:text-sky-300 underline font-mono"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status);
            const isCancelling = actionLoadingId === task.taskId;

            return (
              <div
                key={task.taskId}
                className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left info column */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Task ID chip with copy button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(task.taskId, e)}
                      title="Click to copy Task ID"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    >
                      <span>{task.taskId.slice(0, 10)}...</span>
                      {copiedTaskId === task.taskId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </button>

                    <StatusBadge status={task.status} />

                    {task.repairAttempts > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        {task.repairAttempts} repair {task.repairAttempts === 1 ? 'attempt' : 'attempts'}
                      </span>
                    )}

                    <span className="text-slate-500 text-xs">&bull;</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(task.createdAt)}
                    </span>
                  </div>

                  {/* Task Description */}
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2">
                    <Link to={`/tasks/${task.taskId}`}>
                      {task.task}
                    </Link>
                  </h3>

                  {/* Workspace & Step Details */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                      <FolderGit2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      {task.workspaceId || 'Default workspace'}
                    </span>

                    {task.currentStep && (
                      <span className="text-slate-400 text-xs italic">
                        &mdash; {task.currentStep}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Progress & Actions */}
                <div className="w-full md:w-72 flex flex-col items-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <ProgressBar
                    progress={task.progress}
                    status={task.status}
                    currentStep={task.currentStep}
                    showLabel
                  />

                  <div className="flex items-center gap-2">
                    {!isTerminal && (
                      <button
                        onClick={(e) => handleCancelTask(task.taskId, e)}
                        disabled={isCancelling}
                        type="button"
                        aria-label={`Cancel task ${task.taskId}`}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-300 hover:bg-rose-950/60 border border-rose-900/60 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3" />
                        <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}

                    <Link
                      to={`/tasks/${task.taskId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700/80 transition-all"
                    >
                      <span>View Detail</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
