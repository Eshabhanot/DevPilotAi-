import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { AlertBanner } from '../components/AlertBanner';
import {
  Code2,
  FolderGit2,
  ListPlus,
  Trash2,
  ArrowRight,
  Loader2,
  HelpCircle,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';

export function NewTaskPage() {
  const navigate = useNavigate();

  const [taskDescription, setTaskDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('D:/DevPilotAi');
  const [historyItems, setHistoryItems] = useState(['Keep existing code mockable and preserve unit tests.']);
  const [newConstraint, setNewConstraint] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Validate form fields on the client
  const validateForm = () => {
    const errors = {};

    if (!taskDescription.trim()) {
      errors.task = 'Please provide a clear description of the software change.';
    } else if (taskDescription.trim().length > 2000) {
      errors.task = 'Description cannot exceed 2000 characters.';
    }

    if (!workspaceId.trim()) {
      errors.workspaceId = 'Workspace directory path is required.';
    } else if (workspaceId.trim().length > 1000) {
      errors.workspaceId = 'Workspace path cannot exceed 1000 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddConstraint = (e) => {
    e.preventDefault();
    if (!newConstraint.trim()) return;
    if (historyItems.length >= 10) {
      alert('Maximum of 10 constraints / history items allowed.');
      return;
    }
    setHistoryItems([...historyItems, newConstraint.trim()]);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (index) => {
    setHistoryItems(historyItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await taskApi.createTask({
        task: taskDescription,
        workspaceId: workspaceId,
        conversationHistory: historyItems,
      });

      // Navigate to task detail page
      if (response?.taskId) {
        navigate(`/tasks/${response.taskId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setApiError(
        err.userMessage || 'Failed to submit task to API Gateway. Please check backend connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">API Gateway &bull; Autonomous Orchestrator</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Submit Software Change Task</span>
        </h1>
        <p className="text-xs text-slate-400">
          The AI Orchestrator will research the codebase, formulate an implementation plan, apply code changes, and verify with approved tests.
        </p>
      </div>

      {/* Error alert banner */}
      {apiError && (
        <AlertBanner
          type="error"
          title="Task Submission Failed"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Main form card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Software change description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="task-description"
                className="block text-xs font-semibold text-slate-200"
              >
                Software Change Request <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {taskDescription.length}/2000 characters
              </span>
            </div>

            <textarea
              id="task-description"
              rows={5}
              value={taskDescription}
              onChange={(e) => {
                setTaskDescription(e.target.value);
                if (fieldErrors.task) setFieldErrors({ ...fieldErrors, task: null });
              }}
              placeholder="e.g. Implement user login session refresh in AuthController and verify that invalid tokens return HTTP 401 with informative error DTOs..."
              aria-invalid={Boolean(fieldErrors.task)}
              aria-describedby={fieldErrors.task ? 'task-error' : 'task-help'}
              className={`w-full p-3.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed font-sans transition-colors ${
                fieldErrors.task ? 'border-rose-500' : 'border-slate-800'
              }`}
            />

            {fieldErrors.task ? (
              <p id="task-error" className="text-xs text-rose-400 font-medium">
                {fieldErrors.task}
              </p>
            ) : (
              <p id="task-help" className="text-[11px] text-slate-400">
                Be specific about the requirement, affected classes, and desired behavior.
              </p>
            )}
          </div>

          {/* Workspace ID / Path */}
          <div className="space-y-2">
            <label
              htmlFor="workspace-id"
              className="block text-xs font-semibold text-slate-200"
            >
              Target Workspace Directory <span className="text-rose-400">*</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <input
                id="workspace-id"
                type="text"
                value={workspaceId}
                onChange={(e) => {
                  setWorkspaceId(e.target.value);
                  if (fieldErrors.workspaceId) {
                    setFieldErrors({ ...fieldErrors, workspaceId: null });
                  }
                }}
                placeholder="D:/DevPilotAi or absolute path to project"
                aria-invalid={Boolean(fieldErrors.workspaceId)}
                aria-describedby={fieldErrors.workspaceId ? 'workspace-error' : 'workspace-help'}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                  fieldErrors.workspaceId ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
            </div>

            {fieldErrors.workspaceId ? (
              <p id="workspace-error" className="text-xs text-rose-400 font-medium">
                {fieldErrors.workspaceId}
              </p>
            ) : (
              <p id="workspace-help" className="text-[11px] text-slate-400">
                The MCP developer server workspace root where agents perform searches and modifications.
              </p>
            )}
          </div>

          {/* Constraints & History Guidelines */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                Coding Constraints & Architectural Guidelines
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {historyItems.length}/10 items
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Provide context rules that the Planning and Coding agents must follow (e.g. mock dependencies, do not alter database migrations, etc.).
            </p>

            {/* List of existing constraints */}
            {historyItems.length > 0 && (
              <div className="space-y-2">
                {historyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveConstraint(idx)}
                      aria-label={`Remove constraint ${idx + 1}`}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add constraint input */}
            {historyItems.length < 10 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddConstraint(e);
                    }
                  }}
                  placeholder="Add another constraint or guideline..."
                  aria-label="Add constraint"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  disabled={!newConstraint.trim()}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>

          {/* Workflow Execution Explainer */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/30 flex items-start gap-3 text-xs text-sky-200">
            <Lightbulb className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-sky-300">Deterministic Agent Lifecycle</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Upon submission, the AI Orchestrator executes:
                <strong className="text-slate-300 font-mono"> Research &rarr; Planning &rarr; Coding &rarr; Testing with auto-repair &rarr; Documentation</strong>.
                If tests fail, the Coding Agent repairs the failure up to the configured limit.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Link
              to="/"
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching to Gateway...</span>
                </>
              ) : (
                <>
                  <span>Submit Task to Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
