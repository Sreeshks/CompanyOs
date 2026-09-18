'use client';

// ============================================================
// Company OS — Pipeline / Kanban View
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  GitBranch, Plus, Search, Filter, MoreHorizontal,
  Building2, ArrowRight, ArrowLeft, CheckCircle2, User, ChevronRight,
  TrendingUp, Layers, RefreshCw
} from 'lucide-react';
import { pipelineApi } from '@/lib/api/pipeline';
import { clientsApi } from '@/lib/api/clients';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { Client, ClientStatus } from '@/types/client';

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch pipeline stages
  const { data: statusesRes, isLoading: statusesLoading } = useQuery({
    queryKey: ['pipeline-statuses'],
    queryFn: () => pipelineApi.getStatuses(),
  });

  // Fetch all clients
  const { data: clientsRes, isLoading: clientsLoading } = useQuery({
    queryKey: ['pipeline-clients'],
    queryFn: () => clientsApi.list({ page_size: 100 }),
  });

  const statuses = statusesRes?.data || [];
  const clients = clientsRes?.data?.items || [];

  // Filter clients by search query
  const filteredClients = clients.filter((c) =>
    c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_code?.toLowerCase().includes(search.toLowerCase())
  );

  // Group clients by status
  const clientsByStatus: Record<string, Client[]> = {};
  statuses.forEach((s) => {
    clientsByStatus[s.id] = filteredClients.filter((c) => c.status_id === s.id);
  });

  // Transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({ clientId, toStatusId, notes }: { clientId: string; toStatusId: string; notes?: string }) =>
      pipelineApi.executeTransition(clientId, { to_status_id: toStatusId, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-clients'] });
      toast.success('Pipeline stage updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to move client');
    },
  });

  if (statusesLoading || clientsLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Client Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Track lead progression, client onboarding, and lifecycle stages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          >
            <Building2 className="w-4 h-4" />
            <span>List View</span>
          </Link>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['pipeline-clients'] })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
            title="Refresh pipeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl border p-3 flex items-center gap-3"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Filter pipeline by client name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <div className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)' }}>
          {filteredClients.length} clients in pipeline
        </div>
      </div>

      {/* Kanban Board Columns */}
      {statuses.length === 0 ? (
        <EmptyState
          title="No Pipeline Stages Defined"
          description="Configure pipeline stages in Admin Settings to enable the visual stage tracker."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 items-start">
          {statuses.map((status, index) => {
            const columnClients = clientsByStatus[status.id] || [];
            const isLast = index === statuses.length - 1;
            const isFirst = index === 0;
            const nextStatus = !isLast ? statuses[index + 1] : null;
            const prevStatus = !isFirst ? statuses[index - 1] : null;

            return (
              <div
                key={status.id}
                className="w-80 flex-shrink-0 rounded-xl border flex flex-col max-h-[calc(100vh-250px)]"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Column Header */}
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: status.color || 'var(--primary)' }}
                    />
                    <h2 className="font-semibold text-sm tracking-wide" style={{ color: 'var(--foreground)' }}>
                      {status.name}
                    </h2>
                  </div>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {columnClients.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {columnClients.length === 0 ? (
                    <div
                      className="p-6 text-center text-xs rounded-lg border border-dashed"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      No clients in this stage
                    </div>
                  ) : (
                    columnClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-3.5 rounded-lg border space-y-3 transition-all duration-150 hover:shadow-md group"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-semibold text-sm hover:underline tracking-tight block line-clamp-1"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {client.business_name}
                          </Link>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0"
                            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                          >
                            {client.client_code}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span>{client.contact_person}</span>
                          </div>
                          {client.service_name && (
                            <div className="flex items-center gap-1.5 truncate text-[11px]">
                              <Layers className="w-3 h-3 flex-shrink-0" />
                              <span>{client.service_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer with Quick Move Actions */}
                        <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                          <span style={{ color: 'var(--muted-foreground)' }}>
                            {new Date(client.created_at).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {prevStatus && (
                              <button
                                onClick={() =>
                                  transitionMutation.mutate({
                                    clientId: client.id,
                                    toStatusId: prevStatus.id,
                                  })
                                }
                                disabled={transitionMutation.isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer"
                                style={{
                                  borderColor: 'var(--border)',
                                  color: 'var(--warning)',
                                }}
                                title={`Move back to ${prevStatus.name}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Back</span>
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() =>
                                  transitionMutation.mutate({
                                    clientId: client.id,
                                    toStatusId: nextStatus.id,
                                  })
                                }
                                disabled={transitionMutation.isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer"
                                style={{
                                  borderColor: 'var(--border)',
                                  color: 'var(--primary)',
                                }}
                                title={`Advance to ${nextStatus.name}`}
                              >
                                <span>Move</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
