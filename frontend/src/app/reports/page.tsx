'use client';

// ============================================================
// Company OS — Executive Reports & Analytics
// ============================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle,
  Clock, Download, RefreshCw, Calendar, ArrowUpRight
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/index';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => dashboardApi.getCompanyOverview(),
  });

  const { data: teamRes, isLoading: teamLoading } = useQuery({
    queryKey: ['reports-team'],
    queryFn: () => dashboardApi.getTeamOverview(),
  });

  const { data: monthlyRes, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: () => dashboardApi.getMonthlyWork(),
  });

  const { data: rejectionsRes, isLoading: rejectionsLoading } = useQuery({
    queryKey: ['reports-rejections'],
    queryFn: () => dashboardApi.getRejectionOverview(),
  });

  const summary = summaryRes?.data;
  const team = teamRes?.data || [];
  const monthly = monthlyRes?.data || [];
  const rejections = rejectionsRes?.data;

  if (summaryLoading || teamLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton variant="card" count={4} />
        <LoadingSkeleton variant="table" count={4} />
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!team || team.length === 0) {
      toast.info('No team report data available to export');
      return;
    }
    const headers = ['Team Member', 'Pending Tasks', 'Overdue Tasks', 'Completed Tasks'];
    const rows = team.map((m: any) => [
      `"${(m.user_name || '').replace(/"/g, '""')}"`,
      m.pending_tasks,
      m.overdue_tasks,
      m.completed_tasks,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `operations_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Operations report CSV downloaded');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Operations & Performance Reports
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Deep dive into staff throughput, SLA adherence, and rejection velocity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Active Clients',
            val: summary?.active_clients ?? 0,
            icon: Users,
            sub: 'Across all business entities',
          },
          {
            label: 'Pending Deliverables',
            val: summary?.pending_tasks ?? 0,
            icon: Clock,
            sub: 'Currently in workflow pipeline',
          },
          {
            label: 'Completed Deliverables',
            val: summary?.completed_tasks ?? 0,
            icon: CheckCircle2,
            sub: 'Total completed across workflows',
          },
          {
            label: 'Rejections / Revision Rate',
            val: `${rejections?.total_rejections ?? summary?.total_rejections ?? 0}`,
            icon: AlertTriangle,
            sub: 'Requiring rework iterations',
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="rounded-xl border p-5 flex flex-col justify-between space-y-2"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span className="font-medium">{card.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold tracking-tight font-mono" style={{ color: 'var(--foreground)' }}>
                {card.val}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Productivity Grid */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Staff Operational Workload & Delivery Velocity
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Individual member active task counts and monthly completions
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <th className="px-6 py-3 font-semibold">Team Member</th>
                <th className="px-6 py-3 font-semibold">Pending Tasks</th>
                <th className="px-6 py-3 font-semibold">Overdue Tasks</th>
                <th className="px-6 py-3 font-semibold">Completed Tasks</th>
                <th className="px-6 py-3 font-semibold">Load Index</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {team.map((member) => (
                <tr key={member.user_id} className="hover:bg-[var(--accent)]/40 transition-colors">
                  <td className="px-6 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                    {member.user_name}
                  </td>
                  <td className="px-6 py-3 font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                    {member.pending_tasks}
                  </td>
                  <td className="px-6 py-3 font-mono text-red-500 font-semibold">
                    {member.overdue_tasks}
                  </td>
                  <td className="px-6 py-3 font-mono text-emerald-500 font-semibold">
                    {member.completed_tasks}
                  </td>
                  <td className="px-6 py-3">
                    <div className="w-32 bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{
                          width: `${Math.min(100, (member.pending_tasks / 15) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
