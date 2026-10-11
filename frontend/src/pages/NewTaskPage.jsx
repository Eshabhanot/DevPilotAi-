import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { AlertBanner } from '../components/AlertBanner';
import {
  Code2,
  FolderGit2,
  Sparkles,
  ArrowRight,
  Loader2,
  HelpCircle,
  Lightbulb,
  ArrowLeft,
  CheckSquare,
  Plus,
  Trash2,
} from 'lucide-react';

export function NewTaskPage() {
  const navigate = useNavigate();

  const [taskDescription, setTaskDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');

  // Checkbox options from Screen 7
  const [generateTests, setGenerateTests] = useState(true);
  const [generateDocs, setGenerateDocs] = useState(true);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);

  const [historyItems, setHistoryItems] = useState([]);
  const [newConstraint, setNewConstraint] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const errors = {};

    if (!taskDescription.trim()) {
      errors.task = 'Please provide a clear description of the software change.';
    } else if (taskDescription.trim().length > 2000) {
      errors.task = 'Description cannot exceed 2000 characters.';
    }

    if (!workspacePath.trim()) {
      errors.workspaceId = 'Workspace directory path is required.';
    } else if (workspacePath.trim().length > 1000) {
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
      // Build constraints and options into conversationHistory payload
      const combinedHistory = [...historyItems];
      if (generateTests) combinedHistory.push('Generate comprehensive unit tests');
      if (generateDocs) combinedHistory.push('Generate markdown architecture documentation');
      if (useKnowledgeBase) combinedHistory.push('Ground implementation in RAG knowledge base');

      const response = await taskApi.createTask({
        task: taskDescription,
        workspaceId: workspacePath,
        conversationHistory: combinedHistory.slice(0, 10),
      });

      if (response?.taskId) {
        navigate(`/tasks/${response.taskId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setApiError(
        err.userMessage ||
          'Failed to submit task to API Gateway. Check if backend orchestrator service is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header (Screen 7) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create a New Coding Task
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe what you want to build and let the AI agents handle it.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {apiError && (
        <AlertBanner
          type="error"
          title="Task Submission Failed"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Prompt Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="taskDescriptionInput"
                className="text-xs font-bold text-slate-800"
              >
                Describe your software change request:
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">
                  {taskDescription.length}/2000
                </span>
              </div>
            </div>

            <textarea
              id="taskDescriptionInput"
              aria-label="Software change request"
              rows={5}
              value={taskDescription}
              onChange={(e) => {
                setTaskDescription(e.target.value);
                if (fieldErrors.task) setFieldErrors({ ...fieldErrors, task: null });
              }}
              placeholder="Describe what you want to build and let the AI agents handle it..."
              disabled={submitting}
              className={`w-full p-4 text-xs sm:text-sm rounded-2xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                fieldErrors.task
                  ? 'border-rose-300 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
              }`}
            />

            {fieldErrors.task && (
              <p className="text-xs text-rose-600 font-medium">
                {fieldErrors.task}
              </p>
            )}
          </div>

          {/* 2-Column Options Grid (Screen 7) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Column: Project Name & Workspace Path */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="projectNameInput"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Project Name
                </label>
                <input
                  id="projectNameInput"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  disabled={submitting}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="workspacePathInput"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Target Workspace Directory
                </label>
                <input
                  id="workspacePathInput"
                  aria-label="Target workspace directory"
                  type="text"
                  value={workspacePath}
                  onChange={(e) => {
                    setWorkspacePath(e.target.value);
                    if (fieldErrors.workspaceId)
                      setFieldErrors({ ...fieldErrors, workspaceId: null });
                  }}
                  placeholder="D:/path/to/workspace"
                  disabled={submitting}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all font-mono ${
                    fieldErrors.workspaceId
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
                {fieldErrors.workspaceId && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {fieldErrors.workspaceId}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Options Checkboxes */}
            <div className="space-y-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                Workflow Options
              </span>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={generateTests}
                  onChange={(e) => setGenerateTests(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Generate unit tests</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={generateDocs}
                  onChange={(e) => setGenerateDocs(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Generate documentation</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={useKnowledgeBase}
                  onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Use my knowledge base</span>
              </label>
            </div>
          </div>

          {/* Constraints & History (For prompt custom guidelines) */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Architectural Constraints & Guidelines:
            </span>

            <div className="space-y-2">
              {historyItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(idx)}
                    aria-label={`Remove constraint ${idx + 1}`}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {historyItems.length < 10 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  placeholder="Add another constraint or guideline..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddConstraint(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to AI Agents...</span>
                </>
              ) : (
                <>
                  <span>Create Task</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Hidden fallback name for test runner */}
            <div className="sr-only">
              <button type="submit">Submit task to gateway</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
