'use client';

// ============================================================
// Company OS — Topbar
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Bell, Search, Sun, Moon, ChevronDown,
  LogOut, User, Settings, Palette,
} from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  sidebarCollapsed?: boolean;
}

export function Topbar({ title, breadcrumbs, sidebarCollapsed = false }: TopbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between border-b px-6"
      style={{
        height: 'var(--topbar-height)',
        left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        transition: 'left 0.2s ease-in-out',
      }}
    >
      {/* Left: Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:underline" style={{ color: 'var(--muted-foreground)' }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--foreground)' }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {title && !breadcrumbs && (
          <h1 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
          style={{
            backgroundColor: 'var(--muted)',
            color: 'var(--muted-foreground)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
          }}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd
            className="hidden md:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Theme shortcut */}
        <Link
          href="/admin/settings/appearance"
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--muted-foreground)';
          }}
          title="Theme Settings"
        >
          <Palette className="w-4 h-4" />
        </Link>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--muted-foreground)';
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--danger)' }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              if (!profileOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              {user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                {user?.full_name || 'User'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {user?.role_name || 'Staff'}
              </div>
            </div>
            <ChevronDown
              className="w-3 h-3 hidden md:block transition-transform"
              style={{
                color: 'var(--muted-foreground)',
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-lg py-1 z-50"
              style={{
                backgroundColor: 'var(--popover)',
                borderColor: 'var(--border)',
                color: 'var(--popover-foreground)',
              }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm font-medium">{user?.full_name}</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {user?.email}
                </div>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                onClick={() => setProfileOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                onClick={() => setProfileOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm w-full transition-colors"
                style={{ color: 'var(--danger)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
