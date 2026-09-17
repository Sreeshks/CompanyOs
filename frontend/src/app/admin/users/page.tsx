'use client';

// ============================================================
// Company OS — Staff & Users Administration Page
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { masterDataApi } from '@/lib/api/index';
import {
  Users, Plus, Search, Shield, Power, X,
  UserPlus, Mail, Lock, Phone, Building2, Award,
  Calendar, Briefcase, Sparkles, Eye, EyeOff
} from 'lucide-react';
import type { User, UserCreate } from '@/types/user';
import { toast } from 'sonner';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<UserCreate>({
    full_name: '',
    employee_code: '',
    email: '',
    password: '',
    role_id: '',
    department_id: '',
    designation_id: '',
    phone: '',
    employment_type: 'full_time',
    status: 'active',
    joining_date: '',
    skills: [],
  });

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, page_size: 20, search: search || undefined }),
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles-select'],
    queryFn: () => rolesApi.list(),
    enabled: isCreateOpen,
  });

  const { data: deptRes } = useQuery({
    queryKey: ['departments-select'],
    queryFn: () => masterDataApi.getDepartments(),
    enabled: isCreateOpen,
  });

  const { data: desigRes } = useQuery({
    queryKey: ['designations-select'],
    queryFn: () => masterDataApi.getDesignations(),
    enabled: isCreateOpen,
  });

  const users = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.total_pages || 1;

  const roles = rolesRes?.data || [];
  const departments = deptRes?.data || [];
  const designations = desigRes?.data || [];

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Staff status updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update status');
    },
  });

  const createMutation = useMutation({
    mutationFn: (userData: UserCreate) => usersApi.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Staff member created successfully');
      setIsCreateOpen(false);
      setFormData({
        full_name: '',
        employee_code: '',
        email: '',
        password: '',
        role_id: '',
        department_id: '',
        designation_id: '',
        phone: '',
        employment_type: 'full_time',
        status: 'active',
        joining_date: '',
        skills: [],
      });
      setSkillsInput('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.detail || 'Failed to create user';
      toast.error(msg);
    },
  });

  const handleOpenCreate = () => {
    // Generate auto-suggested employee code based on total
    const nextNum = String(total + 1).padStart(3, '0');
    setFormData((prev) => ({
      ...prev,
      employee_code: `EMP-${nextNum}`,
      password: 'StaffPassword123!',
      role_id: roles[0]?.id || '',
    }));
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.employee_code || !formData.email || !formData.password || !formData.role_id) {
      toast.error('Please fill in all required fields (Name, Code, Email, Password, Role)');
      return;
    }

    const parsedSkills = skillsInput
      ? skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: UserCreate = {
      full_name: formData.full_name,
      employee_code: formData.employee_code,
      email: formData.email,
      password: formData.password,
      role_id: formData.role_id,
      department_id: formData.department_id || undefined,
      designation_id: formData.designation_id || undefined,
      phone: formData.phone || undefined,
      employment_type: formData.employment_type || 'full_time',
      status: formData.status || 'active',
      joining_date: formData.joining_date || undefined,
      skills: parsedSkills,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Staff & User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configure internal team accounts, functional roles, job designations, and system credentials
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search staff by name, code, or email..."
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : users.length > 0 ? (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Employee', 'Email', 'Role', 'Department', 'Designation', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {users.map((u: User) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-[var(--accent)]/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--primary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {u.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {u.full_name}
                          </div>
                          <div className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {u.employee_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                        <Shield className="w-3 h-3" />
                        <span>{u.role_name || 'Staff'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--foreground)' }}>
                      {u.department_name || '—'}
                    </td>

                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {u.designation_name || '—'}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const newStatus = u.status === 'active' ? 'inactive' : 'active';
                          statusMutation.mutate({ id: u.id, status: newStatus });
                        }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors border hover:bg-[var(--accent)]"
                        style={{ color: u.status === 'active' ? 'var(--muted-foreground)' : '#ef4444', borderColor: 'var(--border)' }}
                        title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              <span>{total} total users</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
                >
                  Previous
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No Staff Accounts Found"
          description="Create staff members to assign tasks, workflows, and client deliverables."
          action={
            <button
              onClick={handleOpenCreate}
              className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Staff Member
            </button>
          }
        />
      )}

      {/* Add Staff / User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-xl border p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Add Staff Member
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Provision an internal employee account, permissions role, and designation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                  1. Profile & Access Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Salim Al Rawahi"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Employee Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="EMP-002"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value.toUpperCase() })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="salim@companyos.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full px-3 py-2 pr-9 rounded-lg border text-sm bg-transparent outline-none font-mono focus:ring-1 focus:ring-[var(--primary)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+968 9876 5432"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Employment Type
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="full_time" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Full-Time Regular
                      </option>
                      <option value="part_time" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Part-Time
                      </option>
                      <option value="contractor" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Freelance / Contractor
                      </option>
                      <option value="intern" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Intern
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Organizational Placement */}
              <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                  2. Role & Organizational Placement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Security Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role_id}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Select Role...
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Department
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Select Department...
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Designation / Title
                    </label>
                    <select
                      value={formData.designation_id}
                      onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Select Designation...
                      </option>
                      {designations.map((ds) => (
                        <option key={ds.id} value={ds.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {ds.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Skills & Specializations (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Photoshop, Premiere Pro, Copywriting, Reels..."
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
