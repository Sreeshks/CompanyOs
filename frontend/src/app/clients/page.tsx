'use client';

// ============================================================
// Company OS — Clients List Page & Creation Dialog
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { clientsApi } from '@/lib/api/clients';
import { masterDataApi } from '@/lib/api/index';
import { pipelineApi } from '@/lib/api/pipeline';
import { usersApi } from '@/lib/api/users';
import { Briefcase, Plus, Search, ExternalLink, X, Building2, User, Mail, Phone, Calendar, CreditCard, Layers } from 'lucide-react';
import type { Client, ClientCreate } from '@/types/client';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ClientCreate>({
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    billing_company_id: '',
    service_id: '',
    package_id: '',
    salesperson_id: '',
    status_id: '',
    payment_terms: 'Net 30',
    contract_start_date: '',
    contract_end_date: '',
    notes: '',
  });

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => clientsApi.list({ page, page_size: 20, search: search || undefined }),
  });

  const { data: billingRes } = useQuery({
    queryKey: ['billing-companies-select'],
    queryFn: () => masterDataApi.getBillingCompanies(),
    enabled: isCreateOpen,
  });

  const { data: servicesRes } = useQuery({
    queryKey: ['services-select'],
    queryFn: () => masterDataApi.getServices(),
    enabled: isCreateOpen,
  });

  const { data: packagesRes } = useQuery({
    queryKey: ['packages-select', formData.service_id],
    queryFn: () => masterDataApi.getPackages(formData.service_id || undefined),
    enabled: isCreateOpen && !!formData.service_id,
  });

  const { data: usersRes } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersApi.list({ page_size: 100 }),
    enabled: isCreateOpen,
  });

  const { data: statusesRes } = useQuery({
    queryKey: ['pipeline-statuses-select'],
    queryFn: () => pipelineApi.getStatuses(),
    enabled: isCreateOpen,
  });

  const clients = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.total_pages || 1;

  const billingCompanies = billingRes?.data || [];
  const services = servicesRes?.data || [];
  const packages = packagesRes?.data || [];
  const users = usersRes?.data?.items || [];
  const statuses = statusesRes?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (clientData: ClientCreate) => clientsApi.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
      setIsCreateOpen(false);
      setFormData({
        business_name: '',
        contact_person: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        billing_company_id: '',
        service_id: '',
        package_id: '',
        salesperson_id: '',
        status_id: '',
        payment_terms: 'Net 30',
        contract_start_date: '',
        contract_end_date: '',
        notes: '',
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.detail || 'Failed to create client';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.contact_person || !formData.email) {
      toast.error('Please fill in business name, contact person, and email');
      return;
    }

    const payload: ClientCreate = {
      business_name: formData.business_name,
      contact_person: formData.contact_person,
      email: formData.email,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      address: formData.address || undefined,
      billing_company_id: formData.billing_company_id || undefined,
      service_id: formData.service_id || undefined,
      package_id: formData.package_id || undefined,
      salesperson_id: formData.salesperson_id || undefined,
      status_id: formData.status_id || undefined,
      payment_terms: formData.payment_terms || undefined,
      contract_start_date: formData.contract_start_date || undefined,
      contract_end_date: formData.contract_end_date || undefined,
      notes: formData.notes || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Clients
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage client accounts, contracts, assigned services, and active deliverables
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search clients by name, code, contact..."
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
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <table className="w-full text-sm">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : clients.length > 0 ? (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Client', 'Service', 'Package', 'Billing Co.', 'Status', 'Salesperson', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition-colors hover:bg-[var(--accent)]/40"
                  >
                    {/* Client Name + Code */}
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {client.business_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="font-mono text-xs px-1.5 py-0.5 rounded border"
                            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                          >
                            {client.client_code}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {client.contact_person}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {client.service_name || '—'}
                    </td>

                    {/* Package */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {client.package_name || '—'}
                    </td>

                    {/* Billing Company */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {client.billing_company_name || '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={client.status_name || 'active'} />
                    </td>

                    {/* Salesperson */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {client.salesperson_name || '—'}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors border hover:bg-[var(--accent)]"
                        style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                        title="View Client Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {total} total clients
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  Previous
                </button>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No Clients"
          description="No clients have been created yet. Add your first client to start managing deliverables."
          action={
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Client
            </button>
          }
        />
      )}

      {/* Create Client Modal */}
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
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Create New Client
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Enter client profile, business information, and commercial service tier
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
                  1. Business & Contact Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Al Maha Real Estate LLC"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmed Al Harthy"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="ahmed@almaha.om"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+968 9123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Office / Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="Way 3015, Building 45, Al Khuwair, Muscat"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Setup */}
              <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                  2. Commercial & Service Assignment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Billing Entity
                    </label>
                    <select
                      value={formData.billing_company_id}
                      onChange={(e) => setFormData({ ...formData, billing_company_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Select Billing Company...
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
                      Service Line
                    </label>
                    <select
                      value={formData.service_id}
                      onChange={(e) => setFormData({ ...formData, service_id: e.target.value, package_id: '' })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Select Service...
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Package Plan
                    </label>
                    <select
                      value={formData.package_id}
                      onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                      disabled={!formData.service_id}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {formData.service_id ? 'Select Package...' : 'Select Service first'}
                      </option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {pkg.name} - OMR {pkg.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Initial Pipeline Stage
                    </label>
                    <select
                      value={formData.status_id}
                      onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Default / First Stage
                      </option>
                      {statuses.map((st) => (
                        <option key={st.id} value={st.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Account Manager / Salesperson
                    </label>
                    <select
                      value={formData.salesperson_id}
                      onChange={(e) => setFormData({ ...formData, salesperson_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        Assign Staff Member...
                      </option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                          {u.full_name} ({u.employee_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Net 30, Advance 50%"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Contract Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                      Contract End Date
                    </label>
                    <input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <label className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                  Internal Remarks & Operational Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Special client preferences, delivery deadlines, brand guidelines notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
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
                  {createMutation.isPending ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
