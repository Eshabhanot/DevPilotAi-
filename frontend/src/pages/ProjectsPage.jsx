import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { timeAgo } from '../utils/dateUtils';
import {
  FolderGit2,
  PlusCircle,
  ExternalLink,
  Code2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export function ProjectsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    taskApi
      .listTasks()
      .then((data) => setTasks(data || []))
      .catch((err) => {
        setError(err.userMessage || 'Unable to load projects from backend tasks.');
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const projects = Object.values(
    tasks.reduce((acc, task) => {
      const workspace = task.workspaceId || 'Unassigned workspace';
      const existing = acc[workspace] || {
        id: workspace,
        name: workspace.split(/[\\/]/).filter(Boolean).pop() || workspace,
        description: task.task || 'Backend task workspace',
        workspace,
        tasksCount: 0,
        activeTasks: 0,
        latestTaskId: task.taskId,
        updatedAt: task.updatedAt || task.createdAt,
      };

      const taskTime = new Date(task.updatedAt || task.createdAt || 0).getTime();
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      existing.tasksCount += 1;
      if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status)) {
        existing.activeTasks += 1;
      }
      if (taskTime >= existingTime) {
        existing.description = task.task || existing.description;
        existing.latestTaskId = task.taskId;
        existing.updatedAt = task.updatedAt || task.createdAt;
      }

      acc[workspace] = existing;
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Managed repositories and autonomous development workspaces.
          </p>
        </div>

        <Link
          to="/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Project Task</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500">Loading projects from backend tasks...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Projects appear here after backend tasks are created with a workspace directory."
          actionLabel="Create a task"
          actionTo="/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {p.activeTasks > 0 ? 'Active' : 'Idle'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-500 truncate">
                {p.workspace}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{p.updatedAt ? timeAgo(p.updatedAt) : 'No activity'}</span>
              <Link
                to={p.latestTaskId ? `/tasks/${p.latestTaskId}` : '/new'}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>{p.tasksCount} task{p.tasksCount === 1 ? '' : 's'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
