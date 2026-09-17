'use client';

// ============================================================
// Company OS — Premium Collapsible Sidebar
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList, FileText,
  FolderOpen, BarChart3, Settings, Shield, UserCog, Building2,
  Tag, Layers, GitBranch, Receipt, ScrollText, ChevronLeft,
  ChevronRight, Hexagon, PanelLeftClose, PanelLeft,
  Award, Package, Workflow,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Clients', href: '/clients', icon: Briefcase },
      { label: 'Pipeline', href: '/pipeline', icon: GitBranch },
      { label: 'My Work', href: '/work', icon: ClipboardList },
      { label: 'Content', href: '/content', icon: FolderOpen },
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Permissions', href: '/admin/permissions', icon: UserCog },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
      { label: 'Designations', href: '/admin/designations', icon: Award },
      { label: 'Services', href: '/admin/services', icon: Layers },
      { label: 'Packages', href: '/admin/packages', icon: Package },
      { label: 'Workflows', href: '/admin/workflows', icon: Workflow },
      { label: 'Task Types', href: '/admin/task-types', icon: Tag },
      { label: 'Billing Companies', href: '/admin/billing-companies', icon: Receipt },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ collapsed: controlledCollapsed, onToggle }: AppSidebarProps = {}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggle = onToggle || (() => setInternalCollapsed(!internalCollapsed));
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col border-r transition-all duration-200 ease-in-out',
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 border-b"
        style={{
          height: 'var(--topbar-height)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          }}
        >
          <Hexagon className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--foreground)' }}>
            COMPANY OS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.title && !collapsed && (
              <div
                className="px-3 py-2 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.title}
              </div>
            )}
            {group.title && collapsed && (
              <div className="mx-auto my-2 w-6 border-t" style={{ borderColor: 'var(--border)' }} />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                      collapsed && 'justify-center px-2'
                    )}
                    style={{
                      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--foreground)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--muted-foreground)';
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t px-2 py-2" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors duration-150',
            collapsed && 'justify-center px-2'
          )}
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
          {collapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="w-[18px] h-[18px]" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
