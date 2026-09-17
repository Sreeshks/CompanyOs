'use client';

// ============================================================
// Company OS — Universal App Shell (Always renders Sidebar & Topbar)
// ============================================================

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { Hexagon } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === '/login';

  // For the login page, render full screen without app chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            }}
          >
            <Hexagon className="w-6 h-6" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Loading Company OS...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated redirect to login
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed-width)'
    : 'var(--sidebar-width)';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Global Persistent Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* Main Container */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out"
        style={{
          marginLeft: sidebarWidth,
        }}
      >
        {/* Global Persistent Topbar */}
        <Topbar sidebarCollapsed={collapsed} />

        {/* Page Content */}
        <main
          className="flex-1 w-full"
          style={{ marginTop: 'var(--topbar-height)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
