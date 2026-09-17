'use client';

// ============================================================
// Company OS — Departments Master Data
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { masterDataApi } from '@/lib/api/index';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data: deptRes, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => masterDataApi.getDepartments(),
  });

  const departments = deptRes?.data || [];
  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: { name: string; code: string }) => masterDataApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      toast.success('Department created successfully');
      setShowModal(false);
      setName('');
      setCode('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create department');
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Departments
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configure organizational divisions and functional units
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium metallic-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Department</span>
        </button>
      </div>

      <div
        className="rounded-xl border p-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Departments"
          description="Create your first department to organize your workforce."
          actionLabel="Add Department"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <th className="px-6 py-3 font-semibold">Department Name</th>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[var(--accent)]/40 transition-colors">
                  <td className="px-6 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                    {d.name}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {d.code}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: d.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: d.active ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {d.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              Create Department
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creative & Design"
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
                  placeholder="e.g. CRTV"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none font-mono"
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
                onClick={() => createMutation.mutate({ name, code })}
                disabled={!name || !code || createMutation.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium metallic-btn disabled:opacity-40"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
