import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={title}
          subtitle={subtitle}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
