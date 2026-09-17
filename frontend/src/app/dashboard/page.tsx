'use client';

// ============================================================
// Company OS — Dashboard Page
// ============================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAuth } from '@/providers/AuthProvider';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { MetricCardSkeleton } from '@/components/ui/loading-skeleton';
import { dashboardApi } from '@/lib/api';
import {
  Users, ClipboardList, CheckCircle2, AlertTriangle,
  TrendingUp, BarChart3,
} from 'lucide-react';
import type { DashboardSummary, StaffWorkload, MonthlyWork } from '@/types/dashboard';

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div
      className="rounded-lg border p-5 transition-colors"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'company-overview'],
    queryFn: () => dashboardApi.getCompanyOverview(),
  });

  const { data: teamRes, isLoading: teamLoading } = useQuery({
    queryKey: ['dashboard', 'team-overview'],
    queryFn: () => dashboardApi.getTeamOverview(),
  });

  const { data: monthlyRes } = useQuery({
    queryKey: ['dashboard', 'monthly-work'],
    queryFn: () => dashboardApi.getMonthlyWork(),
  });

  const summary = summaryRes?.data;
  const team = teamRes?.data || [];
  const monthly = monthlyRes?.data || [];

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="page-container space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Here&apos;s what&apos;s happening across your business today.
          </p>
        </div>

        {/* Metrics */}
        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active Clients"
              value={summary.active_clients}
              icon={Users}
              color="var(--primary)"
            />
            <MetricCard
              label="Pending Tasks"
              value={summary.pending_tasks}
              icon={ClipboardList}
              color="var(--warning)"
            />
            <MetricCard
              label="Completed"
              value={summary.completed_tasks}
              icon={CheckCircle2}
              color="var(--success)"
              subtitle={`${summary.completion_percentage.toFixed(1)}% completion rate`}
            />
            <MetricCard
              label="Overdue"
              value={summary.overdue_tasks}
              icon={AlertTriangle}
              color="var(--danger)"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Workload */}
          <div
            className="rounded-lg border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Staff Workload
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      Staff
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      Pending
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      Completed
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      Overdue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-2.5"><div className="skeleton h-4 w-28" /></td>
                        <td className="px-3 py-2.5 text-center"><div className="skeleton h-4 w-8 mx-auto" /></td>
                        <td className="px-3 py-2.5 text-center"><div className="skeleton h-4 w-8 mx-auto" /></td>
                        <td className="px-3 py-2.5 text-center"><div className="skeleton h-4 w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : team.length > 0 ? (
                    team.map((s: StaffWorkload) => (
                      <tr
                        key={s.user_id}
                        className="transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--foreground)' }}>
                          {s.user_name}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: 'var(--warning)' }}>
                          {s.pending_tasks}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: 'var(--success)' }}>
                          {s.completed_tasks}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: s.overdue_tasks > 0 ? 'var(--danger)' : 'var(--muted-foreground)' }}>
                          {s.overdue_tasks}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        No team data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Work */}
          <div
            className="rounded-lg border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Monthly Work
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {monthly.length > 0 ? (
                monthly.slice(0, 6).map((m: MonthlyWork) => {
                  const pct = m.total_items > 0 ? (m.completed_items / m.total_items) * 100 : 0;
                  return (
                    <div key={m.target_month}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: 'var(--foreground)' }}>{m.target_month}</span>
                        <span style={{ color: 'var(--muted-foreground)' }}>
                          {m.completed_items}/{m.total_items}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--primary)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  No monthly data available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Stage Distribution */}
        {summary && summary.workflow_stages.length > 0 && (
          <div
            className="rounded-lg border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Workflow Stage Distribution
              </h2>
            </div>
            <div className="p-5 flex flex-wrap gap-3">
              {summary.workflow_stages.map((ws) => (
                <div
                  key={ws.stage_id}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2.5"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {ws.stage_name}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {ws.item_count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
