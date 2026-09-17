'use client';

// ============================================================
// Company OS — Client Detail Page
// ============================================================

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Building2, User, Mail, Phone, MapPin, Calendar,
  CreditCard, Package, Shield, Edit3, Plus, ExternalLink, FolderOpen,
  FolderTree, FileText, CheckCircle2, AlertCircle, Clock,
  Send, Users, Trash2, X, Sparkles, FolderPlus, UserCheck
} from 'lucide-react';
import { clientsApi } from '@/lib/api/clients';
import { workspacesApi } from '@/lib/api/workspaces';
import { foldersApi } from '@/lib/api/folders';
import { documentsApi } from '@/lib/api/documents';
import { masterDataApi } from '@/lib/api/index';
import { usersApi } from '@/lib/api/users';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

type ActiveTab = 'overview' | 'assignments' | 'workspace' | 'documents' | 'activity';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clientId = params?.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modal Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    billing_company_id: '',
    notes: '',
  });

  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    task_type_id: '',
    user_id: '',
  });

  // Queries
  const { data: clientRes, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId),
    enabled: !!clientId,
  });

  const { data: assignmentsRes, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['client-assignments', clientId],
    queryFn: () => clientsApi.getStaffAssignments(clientId),
    enabled: !!clientId,
  });

  const { data: workspaceRes } = useQuery({
    queryKey: ['client-workspace', clientId],
    queryFn: () => workspacesApi.list(clientId),
    enabled: !!clientId,
  });

  const workspace = workspaceRes?.data?.[0];

  const { data: foldersRes, isLoading: foldersLoading } = useQuery({
    queryKey: ['workspace-folders', clientId],
    queryFn: () => workspacesApi.getClientTree(clientId),
    enabled: !!clientId,
  });

  const { data: documentsRes } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => documentsApi.list({ client_id: clientId }),
    enabled: !!clientId,
  });

  const { data: billingCompaniesRes } = useQuery({
    queryKey: ['billing-companies-select'],
    queryFn: () => masterDataApi.getBillingCompanies(),
  });

  const { data: taskTypesRes } = useQuery({
    queryKey: ['task-types-select'],
    queryFn: () => masterDataApi.getTaskTypes(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['staff-users-select'],
    queryFn: () => usersApi.list({ page_size: 100 }),
  });

  const client = clientRes?.data;
  const assignments = assignmentsRes?.data || [];
  const folders = foldersRes?.data || [];
  const documents = documentsRes?.data?.items || [];
  const billingCompanies = billingCompaniesRes?.data || [];
  const taskTypes = taskTypesRes?.data || [];
  const staffUsers = usersRes?.data?.items || [];

  // Mutations
  const updateClientMutation = useMutation({
    mutationFn: (data: any) => clientsApi.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients-list'] });
      toast.success('Client updated successfully');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update client');
    },
  });

  const assignStaffMutation = useMutation({
    mutationFn: (data: { user_id: string; task_type_id: string }) =>
      clientsApi.assignStaff(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-assignments', clientId] });
      toast.success('Team member assigned to client');
      setIsAssignStaffOpen(false);
      setAssignFormData({ task_type_id: '', user_id: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to assign staff member');
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      clientsApi.removeStaffAssignment(clientId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-assignments', clientId] });
      toast.success('Staff assignment removed');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to remove assignment');
    },
  });

  const initFoldersMutation = useMutation({
    mutationFn: () => workspacesApi.getClientTree(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-folders', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-workspace', clientId] });
      toast.success('Workspace and workflow folders initialized');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to initialize workspace folders');
    },
  });

  const handleOpenEdit = () => {
    if (client) {
      setEditFormData({
        business_name: client.business_name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        address: client.address || '',
        billing_company_id: client.billing_company_id || '',
        notes: client.notes || '',
      });
      setIsEditOpen(true);
    }
  };

  const handleOpenAssign = () => {
    setAssignFormData({
      task_type_id: taskTypes[0]?.id || '',
      user_id: staffUsers[0]?.id || '',
    });
    setIsAssignStaffOpen(true);
  };

  if (clientLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton variant="card" count={2} />
        <LoadingSkeleton variant="table" count={5} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push('/clients')}
          className="flex items-center gap-2 text-sm font-medium mb-6 hover:underline"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </button>
        <EmptyState
          title="Client Not Found"
          description="The client you are looking for does not exist or has been removed."
          actionLabel="Back to Clients"
          onAction={() => router.push('/clients')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/clients')}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/content?client_id=${clientId}&action=new`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium btn-metallic transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deliverable</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors hover:bg-[var(--accent)] cursor-pointer"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Client</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        className="rounded-xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--primary)',
              border: '1px solid var(--border)',
            }}
          >
            {client.business_name?.substring(0, 2).toUpperCase() || 'CO'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                {client.business_name}
              </h1>
              <StatusBadge status={client.status_name || 'Active'} />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)' }}>
                {client.client_code}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {client.contact_person}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {client.email}
              </span>
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Meta Badges */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <div>Created on {new Date(client.created_at).toLocaleDateString()}</div>
          {client.billing_company_name && (
            <div className="font-medium" style={{ color: 'var(--foreground)' }}>
              Entity: {client.billing_company_name}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b flex items-center gap-8 text-sm" style={{ borderColor: 'var(--border)' }}>
        {[
          { key: 'overview', label: 'Overview', icon: Building2 },
          { key: 'assignments', label: `Staff Assigned (${assignments.length})`, icon: Users },
          { key: 'workspace', label: 'Workspace & Drive', icon: FolderTree },
          { key: 'documents', label: `Documents (${documents.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className="pb-3 pt-1 flex items-center gap-2 font-medium transition-colors border-b-2"
              style={{
                borderColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div
            className="md:col-span-2 rounded-xl border p-6 space-y-6"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Company & Contact Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Business Name
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.business_name}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Contact Person
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.contact_person}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Email Address
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.email}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Phone / WhatsApp
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.phone || client.whatsapp || '—'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Physical / Business Address
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.address || '—'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Internal Notes & Remarks
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {client.notes || 'No internal notes recorded for this client.'}
              </p>
            </div>
          </div>

          {/* Service & Billing Info */}
          <div
            className="rounded-xl border p-6 space-y-6"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Commercial & Billing
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Billing Entity
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.billing_company_name || 'Standard'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Service Subscribed
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.service_name || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Package Plan
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.package_name || 'Custom Plan'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Payment Terms
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.payment_terms || 'Net 30'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Contract Period
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.contract_start_date ? new Date(client.contract_start_date).toLocaleDateString() : '—'}
                  {' to '}
                  {client.contract_end_date ? new Date(client.contract_end_date).toLocaleDateString() : 'Ongoing'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Account Manager / Salesperson
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {client.salesperson_name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Assignments Tab */}
      {activeTab === 'assignments' && (
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
                Assigned Team Members
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Role and task-specific specialists responsible for this client's deliverables
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAssign}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium btn-metallic cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Staff</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                title="No Staff Assigned"
                description="Assign designers, copywriters, or video editors to handle deliverables for this client."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                    <th className="px-6 py-3 font-semibold">Specialization / Task Type</th>
                    <th className="px-6 py-3 font-semibold">Assigned Staff Member</th>
                    <th className="px-6 py-3 font-semibold">Assigned Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {assignments.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--accent)]/40 transition-colors">
                      <td className="px-6 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                        {item.task_type_name || 'General Task'}
                      </td>
                      <td className="px-6 py-3" style={{ color: 'var(--foreground)' }}>
                        {item.user_name || 'Staff Member'}
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeStaffMutation.mutate(item.id)}
                          disabled={removeStaffMutation.isPending}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Workspace & Drive Tab */}
      {activeTab === 'workspace' && (
        <div
          className="rounded-xl border p-6 space-y-6"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                  Production Step Folders & Workspace
                </h2>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Workflow Stages
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Organized multi-step directories for camera raw assets, editing, approvals, and publication
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/content?client_id=${clientId}&view=folders`)}
                className="btn-metallic flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open in Production Explorer</span>
              </button>

              {workspace?.drive_folder_id && (
                <a
                  href={`https://drive.google.com/drive/folders/${workspace.drive_folder_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:underline"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Drive</span>
                </a>
              )}
            </div>
          </div>

          {foldersLoading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : folders.length === 0 ? (
            <EmptyState
              title="No Folders Synced"
              description="Initialize the workspace structure to generate step-by-step production folders (Raw, Selected, Editing, etc.)."
              actionLabel="Initialize Production Folders"
              onAction={() => initFoldersMutation.mutate()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {folders.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all hover:border-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                          {f.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {f.stage_name ? `Stage: ${f.stage_name}` : 'Production Directory'}
                        </div>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded border font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {f.folder_type || 'workflow'}
                    </span>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/content?client_id=${clientId}&folder_id=${f.id}&action=new`)}
                      className="flex items-center gap-1 font-medium hover:underline cursor-pointer"
                      style={{ color: 'var(--primary)' }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add File Here</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/content?client_id=${clientId}&folder_id=${f.id}&view=folders`)}
                      className="flex items-center gap-1 font-medium hover:underline cursor-pointer"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <span>Explore Assets</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
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
                Client Documents
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Proposals, contracts, briefs, and signed agreements
              </p>
            </div>
            <button
              onClick={() => router.push('/documents')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium metallic-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                title="No Documents Generated"
                description="Generate contracts, invoices, or proposals for this client from templates."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                    <th className="px-6 py-3 font-semibold">Document Title</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--accent)]/40 transition-colors">
                      <td className="px-6 py-3 font-medium font-mono" style={{ color: 'var(--foreground)' }}>
                        {doc.document_number}
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {doc.document_type_name || 'General'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* ============================================================ */}
      {/* Edit Client Modal */}
      {/* ============================================================ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-2xl space-y-5 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Edit Client Profile
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Update business information, primary contact, and legal entity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateClientMutation.mutate(editFormData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.business_name}
                  onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.contact_person}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_person: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editFormData.whatsapp}
                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Billing Legal Entity
                </label>
                <select
                  value={editFormData.billing_company_id}
                  onChange={(e) => setEditFormData({ ...editFormData, billing_company_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                    Select entity...
                  </option>
                  {billingCompanies.map((bc) => (
                    <option key={bc.id} value={bc.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      {bc.name} ({bc.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateClientMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updateClientMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Assign Staff Member Modal */}
      {/* ============================================================ */}
      {isAssignStaffOpen && (
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
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Assign Team Member
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Map a staff specialist to a specific workflow task type
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignStaffOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!assignFormData.task_type_id || !assignFormData.user_id) {
                  toast.error('Please select both task specialization and staff member');
                  return;
                }
                assignStaffMutation.mutate(assignFormData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Task Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignFormData.task_type_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, task_type_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {taskTypes.map((tt) => (
                    <option key={tt.id} value={tt.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      {tt.name} ({tt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Staff Specialist <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignFormData.user_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, user_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      {u.full_name} — {u.role_name || 'Staff'} ({u.department_name || 'Operations'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsAssignStaffOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignStaffMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
