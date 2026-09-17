'use client';

// ============================================================
// Company OS — Billing Companies Master Data
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Plus, Search, Building, Mail, Phone } from 'lucide-react';
import { masterDataApi } from '@/lib/api/index';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export default function BillingCompaniesAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [vatApplicable, setVatApplicable] = useState(true);

  const { data: billingRes, isLoading } = useQuery({
    queryKey: ['admin-billing-companies'],
    queryFn: () => masterDataApi.getBillingCompanies(),
  });

  const companies = billingRes?.data || [];
  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.short_code.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.createBillingCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing-companies'] });
      toast.success('Billing company created successfully');
      setShowModal(false);
      setName('');
      setShortCode('');
      setTaxNumber('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create billing company');
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Billing Companies & Legal Entities
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage legal invoicing entities, VAT registrations, and corporate billing details
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium metallic-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Entity</span>
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
            placeholder="Search billing entities..."
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
          title="No Billing Entities"
          description="Create your corporate billing entities to issue invoices and contracts."
          actionLabel="Add Billing Entity"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border p-5 space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                    {c.name}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                    {c.short_code}
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--accent)]" style={{ color: 'var(--foreground)' }}>
                  {c.vat_applicable ? 'VAT Registered (5%)' : 'No VAT'}
                </span>
              </div>

              <div className="space-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {c.tax_number && <div>Tax ID / TRN: <span className="font-mono text-[var(--foreground)]">{c.tax_number}</span></div>}
                {c.email && <div>Email: {c.email}</div>}
                {c.phone && <div>Phone: {c.phone}</div>}
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
              Create Billing Entity
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Company Legal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Company OS LLC (Oman)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Short Code (Prefix for invoices)
                </label>
                <input
                  type="text"
                  placeholder="e.g. COS-OM"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-md border text-sm bg-transparent outline-none font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Tax Number / TRN
                </label>
                <input
                  type="text"
                  placeholder="e.g. OM12345678"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
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
                onClick={() =>
                  createMutation.mutate({
                    name,
                    short_code: shortCode,
                    tax_number: taxNumber,
                    vat_applicable: vatApplicable,
                    status: 'active',
                  })
                }
                disabled={!name || !shortCode || createMutation.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium metallic-btn disabled:opacity-40"
              >
                {createMutation.isPending ? 'Creating...' : 'Save Entity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
