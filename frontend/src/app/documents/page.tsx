'use client';

// ============================================================
// Company OS — Financial & Legal Documents
// ============================================================

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Search, Filter, Download, ExternalLink,
  DollarSign, CheckCircle2, Clock, AlertTriangle, Eye, X,
  Trash2, Building2, Calendar, ShieldCheck, Sparkles, Send, Check,
  Printer, FileDown
} from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { clientsApi } from '@/lib/api/clients';
import { masterDataApi } from '@/lib/api/index';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { Document, DocumentCreate, DocumentItemCreate } from '@/types/document';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    document_type_id: string;
    client_id: string;
    billing_company_id: string;
    issue_date: string;
    due_date: string;
    currency: string;
    file_reference: string;
    items: Array<{ description: string; quantity: number; unit_price: number }>;
  }>({
    document_type_id: '',
    client_id: '',
    billing_company_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currency: 'OMR',
    file_reference: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
  });

  // Queries
  const { data: documentsRes, isLoading } = useQuery({
    queryKey: ['documents-list', page, search, statusFilter],
    queryFn: () =>
      documentsApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: docTypesRes } = useQuery({
    queryKey: ['document-types-select'],
    queryFn: () => documentsApi.getTypes(),
  });

  const { data: clientsRes } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ page_size: 100 }),
  });

  const { data: billingCompaniesRes } = useQuery({
    queryKey: ['billing-companies-select'],
    queryFn: () => masterDataApi.getBillingCompanies(),
  });

  const documents = documentsRes?.data?.items || [];
  const total = documentsRes?.data?.total || 0;
  const totalPages = documentsRes?.data?.total_pages || 1;

  const docTypes = docTypesRes?.data || [];
  const clients = clientsRes?.data?.items || [];
  const billingCompanies = billingCompaniesRes?.data || [];

  // Auto-sync initial dropdown defaults
  useEffect(() => {
    if (!formData.document_type_id && docTypes.length > 0) {
      setFormData((prev) => ({ ...prev, document_type_id: docTypes[0].id }));
    }
  }, [docTypes]);

  useEffect(() => {
    if (!formData.client_id && clients.length > 0) {
      const firstClient = clients[0];
      setFormData((prev) => ({
        ...prev,
        client_id: firstClient.id,
        billing_company_id: prev.billing_company_id || firstClient.billing_company_id || (billingCompanies[0]?.id || ''),
      }));
    }
  }, [clients, billingCompanies]);

  useEffect(() => {
    if (!formData.billing_company_id && billingCompanies.length > 0) {
      setFormData((prev) => ({ ...prev, billing_company_id: billingCompanies[0].id }));
    }
  }, [billingCompanies]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DocumentCreate) => documentsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      toast.success(res?.message || 'Document generated successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      let msg = 'Failed to generate document';
      const resData = err?.response?.data;
      if (resData?.error?.message) {
        msg = resData.error.message;
      } else if (typeof resData?.detail === 'string') {
        msg = resData.detail;
      } else if (Array.isArray(resData?.detail)) {
        msg = resData.detail.map((d: any) => `${d.loc ? d.loc.slice(-1) : ''}: ${d.msg}`).join(', ');
      }
      toast.error(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      documentsApi.updateStatus(id, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      toast.success(res?.message || 'Document status updated');
      if (viewingDoc && res?.data) {
        setViewingDoc(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update document status');
    },
  });

  const resetForm = () => {
    setFormData({
      document_type_id: docTypes[0]?.id || '',
      client_id: clients[0]?.id || '',
      billing_company_id: clients[0]?.billing_company_id || billingCompanies[0]?.id || '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: 'OMR',
      file_reference: '',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    });
  };

  // ── PDF generation helpers ─────────────────────────────────

  const generatePdfHtml = (doc: Document): string => {
    const itemsRows = (doc.items || []).map((item, idx) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#ccc;font-size:13px;">${idx + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;font-weight:500;font-size:13px;">${item.description}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#ccc;text-align:center;font-family:monospace;font-size:13px;">${Number(item.quantity).toFixed(2)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#ccc;text-align:right;font-family:monospace;font-size:13px;">${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#f0f0f0;text-align:right;font-weight:600;font-family:monospace;font-size:13px;">${Number(item.total_price).toFixed(2)}</td>
      </tr>
    `).join('');

    const docTypeName = doc.document_type_name || 'Document';
    const issueDate = doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const dueDate = doc.due_date ? new Date(doc.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${doc.document_number} — ${docTypeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #0d0d0d; color: #e0e0e0; padding: 40px; }
          .page { max-width: 800px; margin: 0 auto; background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 48px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #2a2a2a; }
          .company-name { font-size: 22px; font-weight: 700; color: #c8a96e; letter-spacing: 0.5px; }
          .doc-label { font-size: 28px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
          .doc-number { font-size: 14px; color: #c8a96e; font-family: monospace; margin-top: 6px; text-align: right; }
          .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
          .status-draft { background: #2a2a1e; color: #c8a96e; border: 1px solid #c8a96e40; }
          .status-sent { background: #1e2a2a; color: #6ec8c8; border: 1px solid #6ec8c840; }
          .status-paid { background: #1e2a1e; color: #6ec86e; border: 1px solid #6ec86e40; }
          .status-cancelled { background: #2a1e1e; color: #c86e6e; border: 1px solid #c86e6e40; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 36px; }
          .meta-card { background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 8px; padding: 14px 16px; }
          .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-bottom: 6px; }
          .meta-value { font-size: 13px; font-weight: 600; color: #e0e0e0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          thead th { padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 2px solid #2a2a2a; text-align: left; }
          thead th:nth-child(3) { text-align: center; }
          thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
          .summary { display: flex; justify-content: flex-end; margin-bottom: 32px; }
          .summary-table { width: 280px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #999; }
          .summary-row.total { border-top: 2px solid #c8a96e40; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 700; color: #c8a96e; }
          .footer { text-align: center; padding-top: 32px; border-top: 1px solid #2a2a2a; font-size: 11px; color: #555; }
          @media print {
            body { background: #0d0d0d; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { border: none; box-shadow: none; padding: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div>
              <div class="company-name">${doc.billing_company_name || 'Company'}</div>
              <div style="font-size:12px;color:#666;margin-top:4px;">Tax Invoice / ${docTypeName}</div>
            </div>
            <div>
              <div class="doc-label">${docTypeName}</div>
              <div class="doc-number">${doc.document_number}</div>
              <div style="text-align:right;"><span class="status-badge status-${doc.status}">${doc.status}</span></div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Client</div>
              <div class="meta-value">${doc.client_name || '—'}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Billing Entity</div>
              <div class="meta-value">${doc.billing_company_name || '—'}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Issue Date</div>
              <div class="meta-value">${issueDate}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Due Date</div>
              <div class="meta-value">${dueDate}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>Description</th>
                <th style="width:80px;">Qty</th>
                <th style="width:100px;">Unit Price</th>
                <th style="width:110px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#555;">No line items</td></tr>'}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-table">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${doc.currency} ${Number(doc.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Tax / VAT (5%)</span>
                <span>${doc.currency} ${Number(doc.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>${doc.currency} ${Number(doc.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Generated by Company OS &bull; ${doc.document_number}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPdf = (doc: Document) => {
    const html = generatePdfHtml(doc);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for fonts/styles to load before triggering print
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  const handleViewPdf = (doc: Document) => {
    const html = generatePdfHtml(doc);
    setPdfPreviewHtml(html);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleClientChange = (cId: string) => {
    const selected = clients.find((c) => c.id === cId);
    setFormData((prev) => ({
      ...prev,
      client_id: cId,
      billing_company_id: selected?.billing_company_id || prev.billing_company_id || (billingCompanies[0]?.id || ''),
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast.error('Document must include at least one item');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: val };
      return { ...prev, items: nextItems };
    });
  };

  // Calculations
  const calculatedSubtotal = formData.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const calculatedTax = calculatedSubtotal * 0.05; // 5% Oman VAT
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      toast.error('Please select a client account');
      return;
    }
    if (!formData.document_type_id) {
      toast.error('Please select a document type');
      return;
    }
    if (!formData.billing_company_id) {
      toast.error('Please select a billing legal entity');
      return;
    }
    if (!formData.issue_date) {
      toast.error('Please specify an issue date');
      return;
    }
    const hasEmptyItem = formData.items.some((i) => !i.description.trim());
    if (hasEmptyItem) {
      toast.error('Please enter a description for all line items');
      return;
    }

    createMutation.mutate({
      client_id: formData.client_id,
      document_type_id: formData.document_type_id,
      billing_company_id: formData.billing_company_id,
      issue_date: formData.issue_date,
      due_date: formData.due_date || undefined,
      currency: formData.currency,
      file_reference: formData.file_reference || undefined,
      items: formData.items.map((i) => ({
        description: i.description.trim(),
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
      })),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Documents & Invoices
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage commercial proposals, quotations, agreements, and tax invoices
          </p>
        </div>

        <button
          id="btn-generate-document"
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium btn-metallic shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search by doc number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border text-sm bg-transparent outline-none cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              All Statuses
            </option>
            <option value="draft" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              Draft
            </option>
            <option value="sent" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              Sent
            </option>
            <option value="paid" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              Paid
            </option>
            <option value="cancelled" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              Cancelled
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton variant="table" count={6} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description="Generate your first quotation, agreement, or tax invoice."
          action={
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Document</span>
            </button>
          }
        />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                  <th className="px-6 py-3 font-semibold">Doc Number</th>
                  <th className="px-6 py-3 font-semibold">Client</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Issue Date</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--accent)]/40 transition-colors">
                    <td className="px-6 py-3 font-mono font-semibold" style={{ color: 'var(--primary)' }}>
                      {doc.document_number}
                    </td>
                    <td className="px-6 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                      {doc.client_name || '—'}
                    </td>
                    <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {doc.document_type_name || 'General'}
                    </td>
                    <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-3 font-semibold font-mono" style={{ color: 'var(--foreground)' }}>
                      {doc.currency} {Number(doc.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
                        style={{ color: 'var(--primary)' }}
                        title="View Document Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <div>
              Showing {documents.length} of {total} documents
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border disabled:opacity-40 transition-opacity"
                style={{ borderColor: 'var(--border)' }}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border disabled:opacity-40 transition-opacity"
                style={{ borderColor: 'var(--border)' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Generate Document Modal Dialog */}
      {/* ============================================================ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-xl border p-6 shadow-2xl space-y-6 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Generate Official Document
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Issue quotations, invoices, and service agreements with gapless sequential numbering
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

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.document_type_id}
                    onChange={(e) => setFormData({ ...formData, document_type_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {docTypes.map((t) => (
                      <option key={t.id} value={t.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Client Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {c.business_name} ({c.client_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Billing Legal Entity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.billing_company_id}
                    onChange={(e) => setFormData({ ...formData, billing_company_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {billingCompanies.map((bc) => (
                      <option key={bc.id} value={bc.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {bc.name} ({bc.short_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="OMR" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>OMR — Omani Rial</option>
                    <option value="USD" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>USD — US Dollar</option>
                    <option value="SAR" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>SAR — Saudi Riyal</option>
                    <option value="AED" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>AED — UAE Dirham</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    PO / File Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-891"
                    value={formData.file_reference}
                    onChange={(e) => setFormData({ ...formData, file_reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                    Document Line Items ({formData.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border hover:bg-[var(--accent)] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg border text-xs"
                      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Item or service description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 rounded border text-xs bg-transparent outline-none"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                          className="w-full px-2 py-1.5 rounded border text-xs bg-transparent outline-none text-center font-mono"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                          required
                          className="w-full px-2 py-1.5 rounded border text-xs bg-transparent outline-none text-right font-mono"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div className="w-24 text-right font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                        {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Remove line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Financial Summary Card */}
                <div
                  className="rounded-lg border p-3 flex flex-col sm:flex-row items-end sm:items-center justify-between text-xs gap-2"
                  style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}
                >
                  <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    Automatic 5% Oman VAT included if applicable.
                  </div>
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Subtotal: </span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {formData.currency} {calculatedSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>VAT (5%): </span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {formData.currency} {calculatedTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                      Total: {formData.currency} {calculatedTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
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
                  disabled={createMutation.isPending}
                  className="btn-metallic px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending ? 'Generating Document...' : 'Generate & Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Document Details & Status Viewer Modal */}
      {/* ============================================================ */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-xl border p-6 shadow-2xl space-y-6 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold font-mono tracking-tight" style={{ color: 'var(--primary)' }}>
                    {viewingDoc.document_number}
                  </h2>
                  <StatusBadge status={viewingDoc.status} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {viewingDoc.document_type_name || 'Document'} issued for {viewingDoc.client_name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Meta Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Client Account
                </span>
                <span className="font-semibold line-clamp-1" style={{ color: 'var(--foreground)' }}>
                  {viewingDoc.client_name || '—'}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Billing Entity
                </span>
                <span className="font-semibold line-clamp-1" style={{ color: 'var(--foreground)' }}>
                  {viewingDoc.billing_company_name || '—'}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Issue Date
                </span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {viewingDoc.issue_date ? new Date(viewingDoc.issue_date).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Due Date
                </span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {viewingDoc.due_date ? new Date(viewingDoc.due_date).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Line Items
              </h4>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-left text-xs">
                  <thead className="border-b" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
                    <tr>
                      <th className="px-4 py-2 font-semibold" style={{ color: 'var(--foreground)' }}>Description</th>
                      <th className="px-4 py-2 font-semibold text-center w-16" style={{ color: 'var(--foreground)' }}>Qty</th>
                      <th className="px-4 py-2 font-semibold text-right w-24" style={{ color: 'var(--foreground)' }}>Unit Price</th>
                      <th className="px-4 py-2 font-semibold text-right w-24" style={{ color: 'var(--foreground)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {viewingDoc.items?.length > 0 ? (
                      viewingDoc.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>
                            {item.description}
                          </td>
                          <td className="px-4 py-2 text-center font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                            {Number(item.total_price).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-zinc-500">
                          No line items recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Subtotal:</span>
                  <span>{viewingDoc.currency} {Number(viewingDoc.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Tax / VAT (5%):</span>
                  <span>{viewingDoc.currency} {Number(viewingDoc.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-bold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                  <span>Total:</span>
                  <span>{viewingDoc.currency} {Number(viewingDoc.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* PDF Actions */}
            <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => handleViewPdf(viewingDoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-[1.02] cursor-pointer"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary)10' }}
              >
                <Eye className="w-3.5 h-3.5" /> View PDF
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(viewingDoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-[1.02] cursor-pointer"
                style={{ borderColor: '#6ec86e', color: '#6ec86e', background: '#6ec86e10' }}
              >
                <FileDown className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>

            {/* Status Change & Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Status:</span>
                {viewingDoc.status !== 'sent' && (
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ id: viewingDoc.id, status: 'sent' })}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--info)' }}
                  >
                    <Send className="w-3 h-3" /> Mark as Sent
                  </button>
                )}
                {viewingDoc.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ id: viewingDoc.id, status: 'paid' })}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--success)' }}
                  >
                    <Check className="w-3 h-3" /> Mark as Paid
                  </button>
                )}
                {viewingDoc.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ id: viewingDoc.id, status: 'cancelled' })}
                    disabled={statusMutation.isPending}
                    className="px-2.5 py-1 rounded text-xs font-medium border text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Cancel Doc
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PDF Preview Modal */}
      {/* ============================================================ */}
      {pdfPreviewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-4xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>PDF Preview</span>
              </div>
              <div className="flex items-center gap-2">
                {viewingDoc && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(viewingDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] cursor-pointer"
                    style={{ background: '#6ec86e20', color: '#6ec86e' }}
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPdfPreviewHtml(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Preview iframe */}
            <iframe
              srcDoc={pdfPreviewHtml}
              className="flex-1 w-full border-0"
              title="Document PDF Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
