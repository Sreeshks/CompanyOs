'use client';

// ============================================================
// Company OS — Service Packages Master Data
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Layers, DollarSign, CheckCircle2 } from 'lucide-react';
import { masterDataApi } from '@/lib/api/index';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export default function PackagesAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState('Monthly');

  const { data: servicesRes } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => masterDataApi.getServices(),
  });

  const { data: packagesRes, isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: () => masterDataApi.getPackages(),
  });

  const services = servicesRes?.data || [];
  const packages = packagesRes?.data || [];
  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast.success('Package created successfully');
      setShowModal(false);
      setName('');
      setPrice(0);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create package');
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Packages & Pricing Tiers
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configure deliverable bundles, recurring fee tiers, and task compositions
          </p>
        </div>

        <button
          onClick={() => {
            if (services.length > 0 && !serviceId) setServiceId(services[0].id);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium metallic-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Package</span>
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
            placeholder="Search packages..."
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
          title="No Packages Configured"
          description="Create packages mapped to your services."
          actionLabel="Add Package"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
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
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {pkg.name}
                      </h2>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {pkg.duration || 'Monthly'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono" style={{ color: 'var(--foreground)' }}>
                      OMR {pkg.price}
                    </div>
                  </div>
                </div>

                <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                  {pkg.description || 'Deliverables package including standard monthly revisions.'}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Tasks included: {pkg.package_tasks?.length || 0}
                </span>
                <span className="font-medium text-emerald-500">Active</span>
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
              Create Package Tier
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Parent Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Package Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard Growth Plan (12 Posts)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Price (OMR)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Cadence / Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
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
                onClick={() => createMutation.mutate({ service_id: serviceId, name, price, duration, active: true })}
                disabled={!name || !serviceId || createMutation.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium metallic-btn disabled:opacity-40"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
