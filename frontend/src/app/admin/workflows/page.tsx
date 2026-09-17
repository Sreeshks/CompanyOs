'use client';

// ============================================================
// Company OS — Workflow Pipeline Architecture
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Workflow, Plus, ArrowRight, CheckCircle2, Shield,
  Layers, GitCommit, Settings2, Folder, X, Sparkles
} from 'lucide-react';
import { workflowsApi } from '@/lib/api/workflows';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { WorkflowStageCreate } from '@/types/workflow';

export default function WorkflowsAdminPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  // Add Stage State
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [addStageData, setAddStageData] = useState<WorkflowStageCreate>({
    name: '',
    code: '',
    stage_type: 'in_progress',
    order_index: 1,
    default_folder_name: '',
  });

  const { data: workflowsRes, isLoading } = useQuery({
    queryKey: ['admin-workflows'],
    queryFn: () => workflowsApi.list(),
  });

  const workflows = workflowsRes?.data || [];
  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const createMutation = useMutation({
    mutationFn: (data: any) => workflowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] });
      toast.success('Workflow created successfully');
      setShowModal(false);
      setName('');
      setCode('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create workflow');
    },
  });

  const addStageMutation = useMutation({
    mutationFn: (data: WorkflowStageCreate) =>
      workflowsApi.addStage(activeWorkflow.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] });
      toast.success('Workflow stage added successfully');
      setIsAddStageOpen(false);
      setAddStageData({
        name: '',
        code: '',
        stage_type: 'in_progress',
        order_index: (activeWorkflow?.stages?.length || 0) + 1,
        default_folder_name: '',
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to add workflow stage');
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Production Workflows & Approval Pipelines
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configure multi-stage state machines, transition gates, and automated task assignments
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium metallic-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          title="No Workflows Defined"
          description="Create your first deliverable approval workflow pipeline."
          actionLabel="Create Workflow"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflow List Selector */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider px-2" style={{ color: 'var(--muted-foreground)' }}>
              Configured Pipelines
            </h2>

            <div className="space-y-1">
              {workflows.map((w) => {
                const isSelected = w.id === activeWorkflow?.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkflowId(w.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--accent)]'
                        : 'border-transparent hover:bg-[var(--accent)]/50'
                    }`}
                  >
                    <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {w.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {w.stages?.length || 0} Stages &bull; {w.transitions?.length || 0} Transitions
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflow Pipeline Detail & Stepper */}
          <div
            className="lg:col-span-3 rounded-xl border p-6 space-y-6"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {activeWorkflow.name}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                    {activeWorkflow.code}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {activeWorkflow.description || 'Standard multi-stage production and client signoff pipeline'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAddStageData({
                    name: '',
                    code: '',
                    stage_type: 'in_progress',
                    order_index: (activeWorkflow?.stages?.length || 0) + 1,
                    default_folder_name: '',
                  });
                  setIsAddStageOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium btn-metallic transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stage</span>
              </button>
            </div>

            {/* Stages Stepper Chain */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Sequential Workflow Pipeline
              </h3>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {activeWorkflow.stages?.map((stage, idx) => {
                  const isLast = idx === activeWorkflow.stages.length - 1;
                  return (
                    <React.Fragment key={stage.id}>
                      <div
                        className="rounded-lg border p-3 flex flex-col justify-between space-y-1 min-w-[150px]"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                            Stage {idx + 1}
                          </span>
                          <span
                            className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                          >
                            {stage.stage_type}
                          </span>
                        </div>
                        <div className="font-semibold text-xs tracking-tight" style={{ color: 'var(--foreground)' }}>
                          {stage.name}
                        </div>
                        {stage.default_folder_name && (
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                            <Folder className="w-2.5 h-2.5" />
                            <span>{stage.default_folder_name}</span>
                          </div>
                        )}
                      </div>

                      {!isLast && (
                        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Transitions & Action Gates Table */}
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Transition Gateways & Auto-Task Rules
              </h3>

              {activeWorkflow.transitions?.length === 0 ? (
                <div className="text-xs py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  No transition logic defined yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                        <th className="px-4 py-2 font-semibold">Action Trigger</th>
                        <th className="px-4 py-2 font-semibold">From Stage</th>
                        <th className="px-4 py-2 font-semibold">To Stage</th>
                        <th className="px-4 py-2 font-semibold">Auto-Task Created</th>
                        <th className="px-4 py-2 font-semibold">Assignment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {activeWorkflow.transitions?.map((t) => (
                        <tr key={t.id} className="hover:bg-[var(--accent)]/30">
                          <td className="px-4 py-2.5 font-semibold font-mono" style={{ color: 'var(--primary)' }}>
                            {t.action}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                            {t.from_stage_name || t.from_stage_id}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                            {t.to_stage_name || t.to_stage_id}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--muted-foreground)' }}>
                            {t.task_type_name || 'None'}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                            {t.assignment_mode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              Create Production Workflow
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Social Media Standard 6-Stage"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. WF_SMM_STD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production and client sign-off flow"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate({ name, code, description, active: true })}
                disabled={!name || !code || createMutation.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium metallic-btn disabled:opacity-40"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* Add Stage Modal */}
      {/* ============================================================ */}
      {isAddStageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-5 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Add Workflow Stage
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Append a progression step to {activeWorkflow?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStageOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!addStageData.name.trim() || !addStageData.code.trim()) {
                  toast.error('Please specify both stage name and code');
                  return;
                }
                addStageMutation.mutate(addStageData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Stage Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Color Grading"
                  value={addStageData.name}
                  onChange={(e) => {
                    const stageName = e.target.value;
                    const stageCode = stageName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                    setAddStageData({
                      ...addStageData,
                      name: stageName,
                      code: addStageData.code ? addStageData.code : stageCode,
                      default_folder_name: addStageData.default_folder_name ? addStageData.default_folder_name : stageName,
                    });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Stage Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. COLOR_GRADING"
                    value={addStageData.code}
                    onChange={(e) => setAddStageData({ ...addStageData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Stage Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addStageData.stage_type}
                    onChange={(e) => setAddStageData({ ...addStageData, stage_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="initial" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>Initial / Ingest</option>
                    <option value="in_progress" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>In Progress</option>
                    <option value="review" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>Internal Review</option>
                    <option value="client_review" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>Client Review</option>
                    <option value="completed" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>Completed / Posted</option>
                    <option value="rejected" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Step Order #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={addStageData.order_index}
                    onChange={(e) => setAddStageData({ ...addStageData, order_index: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Default Workspace Folder
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In Review"
                    value={addStageData.default_folder_name || ''}
                    onChange={(e) => setAddStageData({ ...addStageData, default_folder_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddStageOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStageMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {addStageMutation.isPending ? 'Adding...' : 'Add Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
