'use client';

// ============================================================
// Company OS — Roles & Permissions Matrix
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Plus, Check, Lock, Save,
  AlertCircle, Users, CheckSquare, Square, X, Sparkles
} from 'lucide-react';
import { rolesApi, permissionsApi } from '@/lib/api/roles';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { Role, Permission, RoleCreate } from '@/types/role';

export default function RolesAdminPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRoleData, setCreateRoleData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Queries
  const { data: rolesRes, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => rolesApi.list(),
  });

  const { data: permissionsRes, isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => permissionsApi.list(),
  });

  const roles = rolesRes?.data || [];
  const permissions = permissionsRes?.data || [];

  // Default select first role
  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Set initial permissions when role changes
  React.useEffect(() => {
    if (activeRole && (!selectedRoleId || selectedRoleId !== activeRole.id || !isInitialized)) {
      setSelectedRoleId(activeRole.id);
      setSelectedPermissions(activeRole.permissions?.map((p) => p.id) || []);
      setIsInitialized(true);
    }
  }, [activeRole, selectedRoleId, isInitialized]);

  // Group permissions by module
  const permissionsByModule: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    const mod = p.module || 'General';
    if (!permissionsByModule[mod]) permissionsByModule[mod] = [];
    permissionsByModule[mod].push(p);
  });

  // Save permissions mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      rolesApi.assignPermissions(activeRole.id, {
        permission_ids: selectedPermissions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success(`Permissions updated for ${activeRole?.name}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update permissions');
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success(`Role ${res?.data?.name || ''} created successfully`);
      setIsCreateOpen(false);
      setCreateRoleData({ name: '', code: '', description: '' });
      if (res?.data?.id) setSelectedRoleId(res.data.id);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create role');
    },
  });

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleModuleAll = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...moduleIds])));
    }
  };

  if (rolesLoading || permissionsLoading) {
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
            Roles & Access Permissions
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage granular RBAC security policies and functional access privileges
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-metallic shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List Sidebar */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider px-2" style={{ color: 'var(--muted-foreground)' }}>
            System Roles
          </h2>

          <div className="space-y-1">
            {roles.map((r) => {
              const isSelected = r.id === activeRole?.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRoleId(r.id);
                    setSelectedPermissions(r.permissions?.map((p) => p.id) || []);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected ? 'border-[var(--primary)] bg-[var(--accent)]' : 'border-transparent hover:bg-[var(--accent)]/50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {r.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {r.permissions?.length || 0} permissions
                    </div>
                  </div>
                  {r.is_system && <Lock className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div
          className="lg:col-span-3 rounded-xl border p-6 space-y-6"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {activeRole ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                      {activeRole.name}
                    </h2>
                    {activeRole.is_system && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono border" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                        System Protected
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {activeRole.description || 'Configurable role permissions'}
                  </p>
                </div>

                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium metallic-btn"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              {/* Module-by-Module Permission Checkboxes */}
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([modName, modPerms]) => {
                  const allSelected = modPerms.every((p) => selectedPermissions.includes(p.id));
                  return (
                    <div key={modName} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                          {modName}
                        </h3>
                        <button
                          onClick={() => toggleModuleAll(modPerms)}
                          className="text-xs hover:underline"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {modPerms.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors hover:bg-[var(--accent)]/30"
                              style={{
                                borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                                backgroundColor: isChecked ? 'var(--accent)' : 'var(--background)',
                              }}
                            >
                              <div className="mt-0.5">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                ) : (
                                  <Square className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                )}
                              </div>
                              <div className="text-xs">
                                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                  {perm.code}
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                  {perm.description || 'Permission action rule'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState title="No Role Selected" description="Select a role from the left sidebar to configure its permissions." />
          )}
        </div>
      </div>
      {/* ============================================================ */}
      {/* Create Role Modal */}
      {/* ============================================================ */}
      {isCreateOpen && (
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
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Create System Role
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Define a new organizational role for RBAC permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createRoleData.name.trim() || !createRoleData.code.trim()) {
                  toast.error('Please specify both role name and code');
                  return;
                }
                createRoleMutation.mutate(createRoleData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance Specialist"
                  value={createRoleData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                    setCreateRoleData({
                      ...createRoleData,
                      name,
                      code: createRoleData.code ? createRoleData.code : code,
                    });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Role Code / Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. FINANCE_SPECIALIST"
                  value={createRoleData.code}
                  onChange={(e) => setCreateRoleData({ ...createRoleData, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe functional privileges granted by this role..."
                  value={createRoleData.description}
                  onChange={(e) => setCreateRoleData({ ...createRoleData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
