'use client';

// ============================================================
// Company OS — Audit Logs Page
// ============================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { auditLogsApi } from '@/lib/api';
import { ScrollText, Filter } from 'lucide-react';
import type { AuditLog } from '@/types/audit';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditLogsApi.list({ page, page_size: 25 }),
  });

  const logs = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.total_pages || 1;

  const actionColors: Record<string, string> = {
    create: 'var(--success)',
    update: 'var(--info)',
    delete: 'var(--danger)',
    login: 'var(--primary)',
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: 'Admin', href: '/admin/users' },
        { label: 'Audit Logs' },
      ]}
    >
      <div className="page-container space-y-5">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Audit Logs
        </h1>

        {isLoading ? (
          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : logs.length > 0 ? (
          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium whitespace-nowrap"
                        style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--surface-elevated)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                        {log.user_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${actionColors[log.action] || 'var(--primary)'} 15%, transparent)`,
                            color: actionColors[log.action] || 'var(--primary)',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>
                        {log.entity_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {log.entity_id.slice(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{total} entries</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
                  >Previous</button>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={ScrollText} title="No Audit Logs" description="No activity has been recorded yet." />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
