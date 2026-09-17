'use client';

// ============================================================
// Company OS — Services & Offerings Master Data
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search, CheckCircle2, XCircle, Package } from 'lucide-react';
import { masterDataApi } from '@/lib/api/index';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export default function ServicesAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('retainer');
  const [recurring, setRecurring] = useState(true);

  const { data: servicesRes, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => masterDataApi.getServices(),
  });

  const services = servicesRes?.data || [];
  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Service created successfully');
      setShowModal(false);
      setName('');
      setCode('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create service');
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Services & Offerings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configure commercial service lines, retainer models, and deliverable catalogs
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium metallic-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Service</span>
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
            placeholder="Search service offerings..."
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
          title="No Services Configured"
          description="Define the agency services you offer to clients."
          actionLabel="Add Service"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-150"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {s.name}
                      </h2>
                      <span className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        {s.code}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border"
                    style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                  >
                    {s.type}
                  </span>
                </div>

                <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                  {s.description || 'Comprehensive client service package.'}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>
                  {s.recurring ? 'Monthly Recurring' : 'One-off Project'}
                </span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {s.packages?.length || 0} Packages
                </span>
              </div>
            </div>
          ))}
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
              Create Service Offering
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Social Media Management"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Service Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SMM"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  <option value="retainer" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                    Retainer (Monthly Recurring)
                  </option>
                  <option value="project" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                    Project (One-time)
                  </option>
                  <option value="adhoc" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                    Ad-hoc / Hourly
                  </option>
                </select>
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
                onClick={() => createMutation.mutate({ name, code, type, recurring })}
                disabled={!name || !code || createMutation.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium metallic-btn disabled:opacity-40"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
