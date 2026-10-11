import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { RagChatPage } from './pages/RagChatPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { NewTaskPage } from './pages/NewTaskPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * AppShell provides the Unified Sidebar and Top Header
 * for authenticated application views (Screens 4 through 9).
 */
function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar (Screens 4 - 9) */}
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Home route controller:
 * Displays Landing Page (Screen 1) when unauthenticated,
 * or redirects straight to authenticated Workspace.
 */
function HomeRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Marketing */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Authentication Pages (Screens 2 & 3) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Authenticated Application Shell (Screens 4 to 9) */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Screen 4: Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Screen 5: Knowledge Base */}
            <Route path="/knowledge" element={<KnowledgeBasePage />} />

            {/* Screen 6: RAG Chat */}
            <Route path="/rag" element={<RagChatPage />} />

            {/* Additional Project Management */}
            <Route path="/projects" element={<ProjectsPage />} />

            {/* Screen 7: Create Coding Task */}
            <Route path="/new" element={<NewTaskPage />} />
            <Route path="/create-task" element={<NewTaskPage />} />

            {/* Screens 8 & 9: Task Progress and Generated Code View */}
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />

            {/* Settings & Configuration */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
