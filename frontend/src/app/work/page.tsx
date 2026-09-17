'use client';

// ============================================================
// Company OS — My Work Page
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { myWorkApi } from '@/lib/api/my-work';
import { tasksApi } from '@/lib/api/tasks';
import {
  ClipboardList, Clock, CheckCircle2, AlertTriangle,
  ExternalLink, Calendar, User, X, Check, ArrowRight, FolderOpen
} from 'lucide-react';
import type { Task } from '@/types/task';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type TabFilter = 'all' | 'pending' | 'completed' | 'overdue';

const tabs: { key: TabFilter; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all', label: 'All Work', icon: ClipboardList, color: 'var(--primary)' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'var(--warning)' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'var(--success)' },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'var(--danger)' },
];

function TaskCard({ task, onSelect }: { task: Task; onSelect: (task: Task) => void }) {
  const priorityColors: Record<string, string> = {
    urgent: 'var(--danger)',
    high: 'var(--warning)',
    medium: 'var(--info)',
    low: 'var(--muted-foreground)',
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className="rounded-lg border p-4 transition-all hover:border-[var(--primary)] cursor-pointer group"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
              {task.task_code}
            </span>
            <StatusBadge variant={getStatusVariant(task.status)}>
              {task.status.replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          <h3 className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--foreground)' }}>
            {task.client_name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {task.task_type_name}
            {task.content_item_name && ` · ${task.content_item_name}`}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(task);
          }}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors flex-shrink-0 hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--primary)]"
          title="Inspect Task"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {task.workflow_stage_name && (
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--info)' }}
            />
            {task.workflow_stage_name}
          </span>
        )}
        {task.target_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(task.target_date).toLocaleDateString()}
          </span>
        )}
        <span
          className="flex items-center gap-1 font-medium capitalize"
          style={{ color: priorityColors[task.priority] || 'var(--muted-foreground)' }}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const queryFn = () => {
    const params = { page, page_size: 20 };
    switch (activeTab) {
      case 'pending':
        return myWorkApi.getPending(params);
      case 'completed':
        return myWorkApi.getCompleted(params);
      case 'overdue':
        return myWorkApi.getOverdue(params);
      default:
        return myWorkApi.getAll(params);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['my-work', activeTab, page],
    queryFn,
    refetchInterval: activeTab === 'pending' ? 15000 : undefined,
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.complete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task marked as completed');
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to complete task');
    },
  });

  const tasks = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.total_pages || 1;

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: 'My Work' }]}
    >
      <div className="page-container space-y-5">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
          My Work
        </h1>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--surface)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? tab.color : 'var(--muted-foreground)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {total} task{total !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {tasks.map((task: Task) => (
                <TaskCard key={task.id} task={task} onSelect={(t) => setSelectedTask(t)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 cursor-pointer"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  Previous
                </button>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 cursor-pointer"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={activeTab === 'pending' ? 'No Pending Work' : activeTab === 'overdue' ? 'No Overdue Tasks' : 'No Work Found'}
            description={activeTab === 'pending' ? "You're all caught up. No pending tasks." : 'No tasks match the selected filter.'}
          />
        )}
      </div>

      {/* ============================================================ */}
      {/* Task Details & Action Modal */}
      {/* ============================================================ */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-2xl space-y-5 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                    {selectedTask.task_code}
                  </span>
                  <StatusBadge variant={getStatusVariant(selectedTask.status)}>
                    {selectedTask.status.replace(/_/g, ' ')}
                  </StatusBadge>
                </div>
                <h2 className="text-base font-bold mt-1.5" style={{ color: 'var(--foreground)' }}>
                  {selectedTask.client_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Specialization
                </span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {selectedTask.task_type_name || 'General Task'}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Priority Level
                </span>
                <span className="font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                  {selectedTask.priority}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Stage Pipeline
                </span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {selectedTask.workflow_stage_name || 'Standard'}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Target Due Date
                </span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {selectedTask.target_date ? new Date(selectedTask.target_date).toLocaleDateString() : 'No date set'}
                </span>
              </div>
            </div>

            {selectedTask.content_item_name && (
              <div className="p-3 rounded-lg border flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-[10px] uppercase tracking-wider block" style={{ color: 'var(--muted-foreground)' }}>
                    Linked Asset Deliverable
                  </span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {selectedTask.content_item_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/content')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border bg-transparent hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>View Asset</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                {selectedTask.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate(selectedTask.id)}
                    disabled={completeMutation.isPending}
                    className="flex items-center gap-1.5 btn-metallic px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{completeMutation.isPending ? 'Completing...' : 'Mark as Completed'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
