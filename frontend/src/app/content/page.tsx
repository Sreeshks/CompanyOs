'use client';

// ============================================================
// Company OS — Content & Production Deliverables Management
// Client & Working Step Folders with Step-by-Step Progression
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen, Plus, Search, Layers, FileText,
  User, Calendar, CheckCircle2, ArrowRight, Video, Image as ImageIcon,
  Sparkles, ExternalLink, X, ArrowLeft, ChevronRight,
  FolderTree, CheckSquare, Square, Scissors, ShieldCheck,
  Upload, UploadCloud, Loader2, Trash2, Edit3, Eye, ZoomIn
} from 'lucide-react';
import { contentApi } from '@/lib/api/content';
import { clientsApi } from '@/lib/api/clients';
import { workspacesApi } from '@/lib/api/workspaces';
import { masterDataApi } from '@/lib/api/index';
import { usersApi } from '@/lib/api/users';
import { uploadApi } from '@/lib/api/upload';
import type { ImgBBUploadResult } from '@/lib/api/upload';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { ContentItem, ContentItemCreate } from '@/types/content';
import type { FolderTree as FolderTreeType } from '@/types/folder';

type ViewMode = 'folders' | 'grid' | 'table';

export default function ContentPage() {
  const queryClient = useQueryClient();

  // Navigation & Folder drilldown states
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [search, setSearch] = useState('');

  // Multi-selection state for deliverables in current folder/view
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Creation form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    folder_id: '',
    content_type_id: '',
    display_name: '',
    file_name: '',
    target_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    sequence_number: 1,
    assigned_user_id: '',
  });

  // Image upload states
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadedResults, setUploadedResults] = useState<(ImgBBUploadResult & { displayName: string })[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renamePrefix, setRenamePrefix] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL query params sync on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get('client_id');
      const fId = params.get('folder_id');
      const action = params.get('action');
      const mode = params.get('view') as ViewMode;

      if (cId) setSelectedClientId(cId);
      if (fId) setSelectedFolderId(fId);
      if (mode && ['folders', 'grid', 'table'].includes(mode)) setViewMode(mode);
      if (action === 'new') setIsCreateOpen(true);
    }
  }, []);

  // Clear selections when switching folder or client
  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [selectedClientId, selectedFolderId]);

  // Queries
  const { data: clientsRes } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ page_size: 100 }),
  });

  const { data: contentRes, isLoading: contentLoading } = useQuery({
    queryKey: ['content-items', selectedClientId],
    queryFn: () => contentApi.list({ client_id: selectedClientId || undefined }),
  });

  const { data: clientFoldersRes, isLoading: foldersLoading } = useQuery({
    queryKey: ['client-workspace-folders', selectedClientId],
    queryFn: () => workspacesApi.getClientTree(selectedClientId),
    enabled: !!selectedClientId,
  });

  const { data: contentTypesRes } = useQuery({
    queryKey: ['content-types-select'],
    queryFn: () => masterDataApi.getContentTypes(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['staff-select'],
    queryFn: () => usersApi.list({ page_size: 100 }),
  });

  const clients = clientsRes?.data?.items || [];
  const contentItems = contentRes?.data || [];
  const clientFolders: FolderTreeType[] = clientFoldersRes?.data || [];
  const contentTypes = contentTypesRes?.data || [];
  const staff = usersRes?.data?.items || [];

  // Active client & active folder objects
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const activeFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return clientFolders.find((f) => f.id === selectedFolderId);
  }, [clientFolders, selectedFolderId]);

  // Order workflow folders cleanly by step
  const orderedWorkingFolders = useMemo(() => {
    const stageOrder: Record<string, number> = {
      raw: 1,
      selected: 2,
      editing: 3,
      approval: 4,
      pending_approval: 4,
      needs_edit: 5,
      rejected_needs_edit: 5,
      ready: 6,
      ready_to_post: 6,
      posted: 7,
    };

    return [...clientFolders].sort((a, b) => {
      const codeA = (a.stage_code || a.name || '').toLowerCase();
      const codeB = (b.stage_code || b.name || '').toLowerCase();
      let orderA = 99;
      let orderB = 99;
      for (const [k, v] of Object.entries(stageOrder)) {
        if (codeA.includes(k)) orderA = Math.min(orderA, v);
        if (codeB.includes(k)) orderB = Math.min(orderB, v);
      }
      return orderA - orderB;
    });
  }, [clientFolders]);

  // Map of deliverable count per client
  const clientItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (Array.isArray(contentItems)) {
      for (const item of contentItems) {
        counts[item.client_id] = (counts[item.client_id] || 0) + 1;
      }
    }
    return counts;
  }, [contentItems]);

  // Map of deliverable count per folder for the active client
  const folderItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (Array.isArray(contentItems)) {
      for (const item of contentItems) {
        if (item.folder_id) {
          counts[item.folder_id] = (counts[item.folder_id] || 0) + 1;
        }
        // Also fallback match by stage name if folder_id wasn't assigned directly
        if (item.stage_name) {
          const matchingF = clientFolders.find(
            (f) =>
              (f.stage_name && f.stage_name.toLowerCase() === item.stage_name?.toLowerCase()) ||
              f.name.toLowerCase() === item.stage_name?.toLowerCase()
          );
          if (matchingF && matchingF.id !== item.folder_id) {
            counts[matchingF.id] = (counts[matchingF.id] || 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [contentItems, clientFolders]);

  // Deliverables strictly for the currently opened folder
  const currentFolderItems = useMemo(() => {
    if (!activeFolder) return [];
    return (Array.isArray(contentItems) ? contentItems : []).filter((item) => {
      if (item.folder_id === activeFolder.id) return true;
      if (
        activeFolder.stage_name &&
        item.stage_name &&
        item.stage_name.toLowerCase() === activeFolder.stage_name.toLowerCase()
      ) {
        return true;
      }
      if (
        activeFolder.workflow_stage_id &&
        item.current_stage_id === activeFolder.workflow_stage_id
      ) {
        return true;
      }
      return false;
    });
  }, [contentItems, activeFolder]);

  // Global search filtered items (for grid/table view or client search)
  const searchLower = (search || '').toLowerCase().trim();
  const filteredGlobalItems = (Array.isArray(contentItems) ? contentItems : []).filter((item) => {
    const dName = (item.display_name || '').toLowerCase();
    const fName = (item.file_name || '').toLowerCase();
    const sName = (item.stage_name || '').toLowerCase();
    return dName.includes(searchLower) || fName.includes(searchLower) || sName.includes(searchLower);
  });

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const name = (c.business_name || '').toLowerCase();
    const code = (c.client_code || '').toLowerCase();
    const person = (c.contact_person || '').toLowerCase();
    return name.includes(searchLower) || code.includes(searchLower) || person.includes(searchLower);
  });

  // Mutations
  const transitionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      contentApi.transition(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['client-workspace-folders'] });
      toast.success('Deliverable stage updated and moved to next folder');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to update stage';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const batchTransitionMutation = useMutation({
    mutationFn: ({ itemIds, action }: { itemIds: string[]; action: string }) =>
      contentApi.batchTransition({ item_ids: itemIds, action }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['client-workspace-folders'] });
      toast.success(`${vars.itemIds.length} item(s) advanced to the next working step!`);
      setSelectedItemIds(new Set());
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || 'Batch transition failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['client-workspace-folders'] });
      toast.success('Deliverable created and placed in folder');
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to create deliverable';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Smart label helper for stage progression
  const getStageAction = (stageName?: string) => {
    const s = (stageName || '').toLowerCase();
    if (s.includes('raw')) return { label: 'Send to Selected', action: 'Select', nextFolder: 'Selected' };
    if (s.includes('selected')) return { label: 'Send to Editing', action: 'Start Editing', nextFolder: 'Editing' };
    if (s.includes('editing')) return { label: 'Submit for Approval', action: 'Submit for Approval', nextFolder: 'Pending Client Approval' };
    if (s.includes('approval') || s.includes('pending')) return { label: 'Approve & Ready', action: 'Approve', nextFolder: 'Ready to Post' };
    if (s.includes('needs edit') || s.includes('reject')) return { label: 'Restart Editing', action: 'Restart Editing', nextFolder: 'Editing' };
    if (s.includes('ready')) return { label: 'Mark as Posted', action: 'Mark Posted', nextFolder: 'Posted' };
    if (s.includes('posted')) return null;
    return { label: 'Send to Next Step', action: 'advance', nextFolder: 'Next Step' };
  };

  // Open modal with prefilled client and folder
  const handleOpenCreateInFolder = (clientId?: string, folderId?: string) => {
    const targetClient = clientId || selectedClientId || clients[0]?.id || '';
    const targetFolder = folderId || selectedFolderId || '';

    setFormData({
      client_id: targetClient,
      folder_id: targetFolder,
      content_type_id: contentTypes[0]?.id || '',
      display_name: '',
      file_name: '',
      target_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      sequence_number: (contentItems?.length || 0) + 1,
      assigned_user_id: '',
    });
    setIsCreateOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      toast.error('Please select a client');
      return;
    }
    if (!formData.content_type_id) {
      toast.error('Please select a content format');
      return;
    }
    if (!formData.display_name.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const defaultFilename =
      formData.file_name.trim() ||
      `${formData.display_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}.mp4`;

    createMutation.mutate({
      client_id: formData.client_id,
      folder_id: formData.folder_id || undefined,
      content_type_id: formData.content_type_id,
      display_name: formData.display_name.trim(),
      file_name: defaultFilename,
      target_month: formData.target_month || undefined,
      sequence_number: Number(formData.sequence_number) || 1,
      assigned_user_id: formData.assigned_user_id || undefined,
    });
  };

  // Toggle selection of an individual deliverable
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or deselect all in current folder
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === currentFolderItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(currentFolderItems.map((item) => item.id)));
    }
  };

  // Action to send all selected items to next step
  const handleSendSelectedToNextStep = () => {
    if (selectedItemIds.size === 0) return;
    const nextAction = getStageAction(activeFolder?.stage_name || activeFolder?.name);
    if (!nextAction) {
      toast.info('These items are already in the final stage.');
      return;
    }

    batchTransitionMutation.mutate({
      itemIds: Array.from(selectedItemIds),
      action: nextAction.action,
    });
  };

  // ── Image Upload Handlers ──────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDropFiles = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (droppedFiles.length === 0) {
      toast.error('Please drop image files only (JPG, PNG, WebP, etc.)');
      return;
    }
    setUploadingFiles((prev) => [...prev, ...droppedFiles]);
    setIsUploadPanelOpen(true);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).filter(f => f.type.startsWith('image/')) : [];
    if (files.length === 0) return;
    setUploadingFiles((prev) => [...prev, ...files]);
    setIsUploadPanelOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveStagedFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedResult = (index: number) => {
    setUploadedResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAllImages = async () => {
    if (uploadingFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    const newResults: (ImgBBUploadResult & { displayName: string })[] = [];
    const existingCount = contentItems?.length || 0;

    for (let i = 0; i < uploadingFiles.length; i++) {
      const file = uploadingFiles[i];
      const seqIndex = existingCount + uploadedResults.length + i + 1;
      let uploadName: string;

      if (renamePrefix.trim()) {
        uploadName = `${renamePrefix.trim()}_${seqIndex.toString().padStart(3, '0')}`;
      } else {
        uploadName = file.name.replace(/\.[^/.]+$/, '');
      }

      try {
        const res = await uploadApi.uploadImage(file, uploadName);
        if (res.success && res.data) {
          newResults.push({
            ...res.data,
            displayName: uploadName,
          });
        }
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err?.message || 'Unknown error'}`);
      }

      setUploadProgress(Math.round(((i + 1) / uploadingFiles.length) * 100));
    }

    setUploadedResults((prev) => [...prev, ...newResults]);
    setUploadingFiles([]);
    setIsUploading(false);
    setUploadProgress(0);

    if (newResults.length > 0) {
      toast.success(`${newResults.length} image(s) uploaded to cloud!`);
    }
  };

  const handleSaveUploadedAsContent = async () => {
    if (uploadedResults.length === 0) return;
    if (!selectedClientId) {
      toast.error('Please select a client first');
      return;
    }

    const targetFolderId = selectedFolderId || '';
    const contentTypeId = contentTypes[0]?.id || '';
    if (!contentTypeId) {
      toast.error('No content type configured');
      return;
    }

    let successCount = 0;
    const existingCount = currentFolderItems.length;

    for (let i = 0; i < uploadedResults.length; i++) {
      const img = uploadedResults[i];
      try {
        await contentApi.create({
          client_id: selectedClientId,
          folder_id: targetFolderId || undefined,
          content_type_id: contentTypeId,
          display_name: img.displayName,
          file_name: `${img.displayName}.${img.mime.split('/')[1] || 'jpg'}`,
          sequence_number: existingCount + i + 1,
          target_month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          thumbnail_url: img.thumb_url,
          image_url: img.display_url,
          storage_path: img.url,
          mime_type: img.mime,
          file_size_bytes: img.size,
        });
        successCount++;
      } catch (err: any) {
        toast.error(`Failed to save "${img.displayName}": ${err?.response?.data?.detail || err?.message || 'Error'}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} image(s) saved as deliverables!`);
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['client-workspace-folders'] });
      setUploadedResults([]);
      setIsUploadPanelOpen(false);
      setRenamePrefix('');
    }
  };
  const getFolderTheme = (folderName?: string, stageCode?: string) => {
    const s = ((folderName || '') + ' ' + (stageCode || '')).toLowerCase();
    if (s.includes('raw')) {
      return {
        stepNum: 1,
        color: '#f59e0b',
        bgGlow: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.25)',
        icon: ImageIcon,
        description: 'Original unedited photos & camera media',
      };
    }
    if (s.includes('selected')) {
      return {
        stepNum: 2,
        color: '#3b82f6',
        bgGlow: 'rgba(59, 130, 246, 0.08)',
        border: 'rgba(59, 130, 246, 0.25)',
        icon: Sparkles,
        description: 'Curated and approved shots picked for editing',
      };
    }
    if (s.includes('editing')) {
      return {
        stepNum: 3,
        color: '#a855f7',
        bgGlow: 'rgba(168, 85, 247, 0.08)',
        border: 'rgba(168, 85, 247, 0.25)',
        icon: Scissors,
        description: 'Work-in-progress retouching, color grade, and montage',
      };
    }
    if (s.includes('approval') || s.includes('pending')) {
      return {
        stepNum: 4,
        color: '#ec4899',
        bgGlow: 'rgba(236, 72, 153, 0.08)',
        border: 'rgba(236, 72, 153, 0.25)',
        icon: ShieldCheck,
        description: 'Exported drafts awaiting client review and feedback',
      };
    }
    if (s.includes('ready')) {
      return {
        stepNum: 5,
        color: '#10b981',
        bgGlow: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: CheckCircle2,
        description: 'Client approved masters scheduled for publication',
      };
    }
    if (s.includes('posted')) {
      return {
        stepNum: 6,
        color: '#06b6d4',
        bgGlow: 'rgba(6, 182, 212, 0.08)',
        border: 'rgba(6, 182, 212, 0.25)',
        icon: CheckCircle2,
        description: 'Published live assets and completed posts',
      };
    }
    return {
      stepNum: 99,
      color: '#6b7280',
      bgGlow: 'rgba(107, 114, 128, 0.08)',
      border: 'rgba(107, 114, 128, 0.25)',
      icon: FolderOpen,
      description: 'General production assets',
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-[calc(100vh-60px)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Content & Production Folders
            </h1>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              Workflow Steps
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Organize client deliverables through step-by-step production folders (Raw ➔ Selected ➔ Editing ➔ Approval ➔ Posted)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateInFolder()}
            className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Deliverable</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div
        className="rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder={
                viewMode === 'folders' && !selectedClientId
                  ? 'Search clients...'
                  : 'Search deliverables or files...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-md border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Client Quick Filter Dropdown */}
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedFolderId('');
            }}
            className="px-3 py-1.5 rounded-md border text-sm bg-transparent outline-none cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
              All Clients (Explorer Root)
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                {c.business_name} ({c.client_code})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setViewMode('folders')}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: viewMode === 'folders' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'folders' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Folder Steps</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: viewMode === 'table' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'table' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: THREE-TIER FOLDER EXPLORER VIEW                     */}
      {/* ============================================================ */}
      {viewMode === 'folders' && (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Breadcrumbs Navigation Bar */}
          <div
            className="rounded-lg border px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => {
                  setSelectedClientId('');
                  setSelectedFolderId('');
                }}
                className="flex items-center gap-1 font-medium transition-colors hover:underline cursor-pointer"
                style={{ color: selectedClientId ? 'var(--primary)' : 'var(--foreground)' }}
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>All Clients</span>
              </button>

              {activeClient && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                  <button
                    onClick={() => setSelectedFolderId('')}
                    className="font-medium transition-colors hover:underline cursor-pointer"
                    style={{ color: selectedFolderId ? 'var(--primary)' : 'var(--foreground)' }}
                  >
                    {activeClient.business_name}
                  </button>
                </>
              )}

              {activeFolder && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {activeFolder.name}
                  </span>
                </>
              )}
            </div>

            {/* Back Navigation Action */}
            <div className="flex items-center gap-2">
              {activeFolder ? (
                <button
                  onClick={() => setSelectedFolderId('')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors hover:bg-[var(--accent)] cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to {activeClient?.business_name} Folders</span>
                </button>
              ) : activeClient ? (
                <button
                  onClick={() => setSelectedClientId('')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors hover:bg-[var(--accent)] cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to All Clients</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* TIER 1: CLIENT FOLDERS ROOT */}
          {!selectedClientId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Client Accounts & Workspace Folders
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Select a client folder below to view their production step folders (Raw, Selected, Editing, etc.)
                  </p>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  {filteredClients.length} clients
                </span>
              </div>

              {filteredClients.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No Client Folders Found"
                  description="Create a client in the CRM to automatically generate their workspace and production folders."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredClients.map((c) => {
                    const count = clientItemCounts[c.id] || 0;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClientId(c.id)}
                        className="rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-[var(--primary)] group relative"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {/* Folder Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                              }}
                            >
                              <FolderOpen className="w-6 h-6" />
                            </div>
                            <span
                              className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                            >
                              {c.client_code}
                            </span>
                          </div>

                          <h3 className="font-bold text-base line-clamp-1 group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--foreground)' }}>
                            {c.business_name}
                          </h3>
                          <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
                            {c.contact_person || 'Client Account'}
                          </p>
                        </div>

                        {/* Folder Footer info */}
                        <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {count} {count === 1 ? 'deliverable' : 'deliverables'}
                          </span>
                          <span className="flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--primary)' }}>
                            <span>Open Steps</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TIER 2: INSIDE CLIENT FOLDER -> SHOW WORKING STEP SUBFOLDERS */}
          {selectedClientId && !selectedFolderId && (
            <div className="space-y-5">
              {/* Client Info Banner */}
              <div
                className="rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {activeClient?.business_name?.substring(0, 2).toUpperCase() || 'CL'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                        {activeClient?.business_name}
                      </h2>
                      <StatusBadge status={activeClient?.status_name || 'Active'} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Production Workflow Step Folders — Open any working folder below to manage files or progress items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateInFolder(selectedClientId)}
                    className="btn-metallic flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add File to Client</span>
                  </button>
                  <Link
                    href={`/clients/${selectedClientId}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    <span>Client Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Working Step Subfolders Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    Working Step Subfolders
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Click any step folder to open assets
                  </span>
                </div>

                {foldersLoading ? (
                  <LoadingSkeleton variant="card" count={4} />
                ) : orderedWorkingFolders.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="No Step Folders Synced"
                    description="This client's workflow folder tree is being initialized."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderedWorkingFolders.map((folder, idx) => {
                      const theme = getFolderTheme(folder.name, folder.stage_code);
                      const IconComp = theme.icon;
                      const itemCount = folderItemCounts[folder.id] || 0;

                      return (
                        <div
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)}
                          className="rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01] group relative"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: theme.border,
                            background: `linear-gradient(180deg, ${theme.bgGlow} 0%, var(--surface) 100%)`,
                          }}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: theme.bgGlow,
                                    color: theme.color,
                                    border: `1px solid ${theme.border}`,
                                  }}
                                >
                                  <IconComp className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold" style={{ backgroundColor: 'var(--accent)', color: theme.color }}>
                                      STEP {idx + 1}
                                    </span>
                                    {folder.stage_name && (
                                      <span className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                        {folder.stage_name}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-sm tracking-tight group-hover:text-[var(--primary)] transition-colors mt-0.5" style={{ color: 'var(--foreground)' }}>
                                    {folder.name}
                                  </h4>
                                </div>
                              </div>

                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: itemCount > 0 ? theme.color : 'var(--accent)',
                                  color: itemCount > 0 ? '#ffffff' : 'var(--muted-foreground)',
                                }}
                              >
                                {itemCount} {itemCount === 1 ? 'file' : 'files'}
                              </span>
                            </div>

                            <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                              {theme.description}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateInFolder(selectedClientId, folder.id);
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded hover:bg-[var(--accent)] transition-colors"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Create File Here</span>
                            </button>

                            <span className="flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: theme.color }}>
                              <span>Open Folder</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIER 3: INSIDE A WORKING STEP FOLDER -> LIST ASSETS + IN-FOLDER ACTIONS */}
          {selectedClientId && selectedFolderId && activeFolder && (
            <div className="space-y-4">
              {/* Active Folder Header Banner */}
              {(() => {
                const theme = getFolderTheme(activeFolder.name, activeFolder.stage_code);
                const nextAction = getStageAction(activeFolder.stage_name || activeFolder.name);
                const IconComp = theme.icon;

                return (
                  <div
                    className="rounded-xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: theme.border,
                      background: `linear-gradient(180deg, ${theme.bgGlow} 0%, var(--surface) 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: theme.bgGlow,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                            {activeFolder.name}
                          </h2>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{
                              backgroundColor: theme.color,
                              color: '#fff',
                            }}
                          >
                            {currentFolderItems.length} {currentFolderItems.length === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {theme.description} &bull; Client: <strong style={{ color: 'var(--foreground)' }}>{activeClient?.business_name}</strong>
                        </p>
                      </div>
                    </div>

                    {/* In-Folder Primary Actions Toolbar */}
                    <div className="flex items-center flex-wrap gap-2.5">
                      {/* Upload Photos Button */}
                      <button
                        onClick={() => {
                          setIsUploadPanelOpen(true);
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm hover:shadow-md"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          borderColor: 'rgba(16, 185, 129, 0.4)',
                          color: '#10b981',
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photos</span>
                      </button>

                      {/* "+ Create / Upload File" in this specific folder */}
                      <button
                        onClick={() => handleOpenCreateInFolder(selectedClientId, activeFolder.id)}
                        className="btn-metallic flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add File to {activeFolder.name}</span>
                      </button>

                      {/* "Send to Next Step" batch progression button */}
                      {nextAction && (
                        <button
                          onClick={handleSendSelectedToNextStep}
                          disabled={selectedItemIds.size === 0 || batchTransitionMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: selectedItemIds.size > 0 ? theme.color : 'transparent',
                            borderColor: theme.color,
                            color: selectedItemIds.size > 0 ? '#ffffff' : theme.color,
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>
                            {selectedItemIds.size > 0
                              ? `Send ${selectedItemIds.size} to ${nextAction.nextFolder} ➔`
                              : `Select Photos & ${nextAction.label}`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Selection Bar & Stats */}
              <div
                className="rounded-lg border px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSelectAll}
                    disabled={currentFolderItems.length === 0}
                    className="flex items-center gap-1.5 font-medium transition-colors hover:text-[var(--primary)] cursor-pointer disabled:opacity-40"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {selectedItemIds.size > 0 && selectedItemIds.size === currentFolderItems.length ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Square className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                    )}
                    <span>
                      {selectedItemIds.size > 0 && selectedItemIds.size === currentFolderItems.length
                        ? 'Deselect All'
                        : `Select All (${currentFolderItems.length})`}
                    </span>
                  </button>

                  {selectedItemIds.size > 0 && (
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                    >
                      {selectedItemIds.size} selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Target Next Step:</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {getStageAction(activeFolder.stage_name || activeFolder.name)?.nextFolder || 'Final Stage'}
                  </span>
                </div>
              </div>

              {/* ── DRAG-AND-DROP UPLOAD ZONE ─────────────────────── */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropFiles}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                  isDragging ? 'scale-[1.01]' : ''
                }`}
                style={{
                  borderColor: isDragging ? '#10b981' : 'var(--border)',
                  backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud
                    className={`w-8 h-8 transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}
                    style={{ color: isDragging ? '#10b981' : 'var(--muted-foreground)' }}
                  />
                  <p className="text-sm font-medium" style={{ color: isDragging ? '#10b981' : 'var(--foreground)' }}>
                    {isDragging ? 'Drop images here to upload' : 'Drag & drop images here'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold underline cursor-pointer hover:text-[var(--primary)] transition-colors"
                      style={{ color: 'var(--primary)' }}
                    >
                      browse files
                    </button>
                    {' '}— JPG, PNG, WebP, GIF (max 32MB each)
                  </p>
                </div>
              </div>

              {/* ── UPLOAD STAGING PANEL ──────────────────────────── */}
              {isUploadPanelOpen && (uploadingFiles.length > 0 || uploadedResults.length > 0) && (
                <div
                  className="rounded-xl border p-5 space-y-4"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" style={{ color: '#10b981' }} />
                      <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                        Image Upload Studio
                      </h3>
                      {uploadingFiles.length > 0 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent)', color: 'var(--muted-foreground)' }}>
                          {uploadingFiles.length} staged
                        </span>
                      )}
                      {uploadedResults.length > 0 && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          {uploadedResults.length} uploaded
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsUploadPanelOpen(false);
                        setUploadingFiles([]);
                        setUploadedResults([]);
                        setRenamePrefix('');
                      }}
                      className="p-1 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                  </div>

                  {/* Rename Prefix Input */}
                  {uploadingFiles.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Sequential Name Prefix (optional)
                        </label>
                        <input
                          type="text"
                          placeholder={`e.g. ${activeClient?.business_name || 'client'}_raw`}
                          value={renamePrefix}
                          onChange={(e) => setRenamePrefix(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-emerald-500"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                        <p className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {renamePrefix.trim()
                            ? `Files will be named: ${renamePrefix.trim()}_001, ${renamePrefix.trim()}_002, ...`
                            : 'Leave empty to keep original file names'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Staged Files Preview Grid */}
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Staged for Upload</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {uploadingFiles.map((file, idx) => {
                          const previewUrl = URL.createObjectURL(file);
                          const displayName = renamePrefix.trim()
                            ? `${renamePrefix.trim()}_${((contentItems?.length || 0) + uploadedResults.length + idx + 1).toString().padStart(3, '0')}`
                            : file.name.replace(/\.[^/.]+$/, '');

                          return (
                            <div
                              key={`staged-${idx}`}
                              className="rounded-lg border overflow-hidden group relative"
                              style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            >
                              <div className="aspect-square relative overflow-hidden">
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                                />
                                <button
                                  onClick={() => handleRemoveStagedFile(idx)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="p-2">
                                <p className="text-[11px] font-medium truncate" style={{ color: 'var(--foreground)' }} title={displayName}>
                                  {displayName}
                                </p>
                                <p className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#10b981' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                          Uploading... {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%`, backgroundColor: '#10b981' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Action Buttons */}
                  {uploadingFiles.length > 0 && !isUploading && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleUploadAllImages}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
                        style={{
                          backgroundColor: '#10b981',
                          color: '#fff',
                        }}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload {uploadingFiles.length} Image{uploadingFiles.length !== 1 ? 's' : ''} to Cloud</span>
                      </button>
                      <button
                        onClick={() => setUploadingFiles([])}
                        className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-[var(--accent)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                      >
                        Clear All
                      </button>
                    </div>
                  )}

                  {/* Uploaded Results Grid */}
                  {uploadedResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#10b981' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Uploaded to Cloud — Ready to Save</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {uploadedResults.map((img, idx) => (
                          <div
                            key={`uploaded-${idx}`}
                            className="rounded-lg border overflow-hidden group relative"
                            style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          >
                            <div className="aspect-square relative overflow-hidden">
                              <img
                                src={img.thumb_url || img.display_url}
                                alt={img.displayName}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setLightboxUrl(img.display_url)}
                                  className="p-1.5 rounded-full bg-white/90 text-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveUploadedResult(idx)}
                                  className="p-1.5 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="absolute top-1 left-1">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                  ✓ Uploaded
                                </span>
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-[11px] font-medium truncate" style={{ color: 'var(--foreground)' }} title={img.displayName}>
                                {img.displayName}
                              </p>
                              <p className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                {img.width}×{img.height} • {(img.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Save All as Deliverables Button */}
                      <button
                        onClick={handleSaveUploadedAsContent}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-md hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save {uploadedResults.length} Image{uploadedResults.length !== 1 ? 's' : ''} as Deliverables in {activeFolder?.name || 'Folder'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Folder Deliverables Content Items */}
              {contentLoading ? (
                <LoadingSkeleton variant="card" count={3} />
              ) : currentFolderItems.length === 0 && !isUploadPanelOpen ? (
                <EmptyState
                  icon={FolderOpen}
                  title={`No Files in ${activeFolder.name}`}
                  description="Upload raw photos or create deliverables directly inside this folder, or send items from preceding working steps."
                  action={
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer font-medium transition-all hover:shadow-md"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Images</span>
                      </button>
                      <button
                        onClick={() => handleOpenCreateInFolder(selectedClientId, activeFolder.id)}
                        className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add File Manually</span>
                      </button>
                    </div>
                  }
                />
              ) : currentFolderItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentFolderItems.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const next = getStageAction(item.stage_name || activeFolder.stage_name);
                    const hasImage = !!(item.thumbnail_url || item.image_url);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelect(item.id)}
                        className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-150 cursor-pointer ${isSelected ? 'ring-2 ring-[var(--primary)] shadow-md' : 'hover:shadow-sm'
                          }`}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        }}
                      >
                        {/* Image Thumbnail */}
                        {hasImage && (
                          <div className="relative aspect-[4/3] overflow-hidden group">
                            <img
                              src={item.thumbnail_url || item.image_url || ''}
                              alt={item.display_name}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxUrl(item.image_url || item.thumbnail_url || '');
                                }}
                                className="p-2 rounded-full bg-white/80 text-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white shadow-lg"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Selection checkbox overlay */}
                            <div className="absolute top-2 left-2">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(item.id);
                                }}
                                className="cursor-pointer p-0.5 rounded bg-black/40 hover:bg-black/60 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-white" />
                                ) : (
                                  <Square className="w-5 h-5 text-white/70 hover:text-white" />
                                )}
                              </div>
                            </div>
                            {/* Stage badge overlay */}
                            <div className="absolute top-2 right-2">
                              <StatusBadge status={item.stage_name || 'Draft'} />
                            </div>
                          </div>
                        )}

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Selection Checkbox (only show if no image thumbnail) */}
                                {!hasImage && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelect(item.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-zinc-400 hover:text-zinc-200 flex-shrink-0" />
                                    )}
                                  </div>
                                )}

                                {!hasImage && (
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                                  >
                                    {item.file_name?.endsWith('.mp4') ? (
                                      <Video className="w-4 h-4" />
                                    ) : (
                                      <ImageIcon className="w-4 h-4" />
                                    )}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }} title={item.display_name}>
                                    {item.display_name}
                                  </h4>
                                  <p className="text-xs font-mono truncate" style={{ color: 'var(--muted-foreground)' }}>
                                    {item.file_name}
                                  </p>
                                </div>
                              </div>

                              {!hasImage && <StatusBadge status={item.stage_name || 'Draft'} />}
                            </div>

                            <div className="space-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Target: {item.target_month || 'Not specified'}</span>
                              </div>
                              {item.assigned_user_name && (
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">Assigned: {item.assigned_user_name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Bottom: Individual Send to Next Step Button */}
                          <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                            <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                              #{item.sequence_number || 1}
                            </span>

                            {next ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  transitionMutation.mutate({ id: item.id, action: next.action });
                                }}
                                disabled={transitionMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-50"
                                style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                              >
                                <span>{next.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: FLAT GRID VIEW                                      */}
      {/* ============================================================ */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {contentLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : filteredGlobalItems.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No Deliverables Found"
              description="Create your first content deliverable or adjust your search filter."
              action={
                <button
                  onClick={() => handleOpenCreateInFolder()}
                  className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Item</span>
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGlobalItems.map((item) => {
                const next = getStageAction(item.stage_name);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                          >
                            {item.file_name?.endsWith('.mp4') ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }} title={item.display_name}>
                              {item.display_name}
                            </h2>
                            <p className="text-xs font-mono truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {item.file_name}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={item.stage_name || 'Draft'} />
                      </div>

                      <div className="space-y-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Target: {item.target_month || 'Not specified'}</span>
                        </div>
                        {item.assigned_user_name && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">Assigned: {item.assigned_user_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>#{item.sequence_number || 1}</span>

                      {next ? (
                        <button
                          onClick={() => transitionMutation.mutate({ id: item.id, action: next.action })}
                          disabled={transitionMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                        >
                          <span>{next.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Published</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 3: FLAT TABLE VIEW                                      */}
      {/* ============================================================ */}
      {viewMode === 'table' && (
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
                  <th className="px-6 py-3 font-semibold">Deliverable</th>
                  <th className="px-6 py-3 font-semibold">Stage</th>
                  <th className="px-6 py-3 font-semibold">Target Month</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filteredGlobalItems.map((item) => {
                  const next = getStageAction(item.stage_name);
                  return (
                    <tr key={item.id} className="hover:bg-[var(--accent)]/40 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {item.display_name}
                        </div>
                        <div className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                          {item.file_name}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={item.stage_name || 'Draft'} />
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {item.target_month || '—'}
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--foreground)' }}>
                        {item.assigned_user_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {next ? (
                          <button
                            onClick={() => transitionMutation.mutate({ id: item.id, action: next.action })}
                            disabled={transitionMutation.isPending}
                            className="px-2.5 py-1 rounded text-xs font-medium border hover:bg-[var(--accent)] transition-colors cursor-pointer disabled:opacity-50"
                            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                          >
                            {next.label}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-500">Published</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE DELIVERABLE (IN FOLDER / CLIENT)              */}
      {/* ============================================================ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-2xl space-y-5 my-8"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    New Content Deliverable
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Add an asset directly into the multi-stage production workflow
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
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Client Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                    Select Client...
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      {c.business_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Folder Selection */}
              {clientFolders.length > 0 && (
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Destination Step Folder
                  </label>
                  <select
                    value={formData.folder_id}
                    onChange={(e) => setFormData({ ...formData, folder_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      Default (Raw Photos & Assets)
                    </option>
                    {clientFolders.map((f) => (
                      <option key={f.id} value={f.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        📁 {f.name} {f.stage_name ? `(${f.stage_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Format / Asset Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.content_type_id}
                    onChange={(e) => setFormData({ ...formData, content_type_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      Select Type...
                    </option>
                    {contentTypes.map((ct) => (
                      <option key={ct.id} value={ct.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Sequence / Index #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sequence_number}
                    onChange={(e) => setFormData({ ...formData, sequence_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Deliverable Title / Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raw Photo Pack - Product Shoot 01"
                  value={formData.display_name}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                    setFormData({
                      ...formData,
                      display_name: title,
                      file_name: formData.file_name ? formData.file_name : (slug ? `${slug}.mp4` : ''),
                    });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Primary File Asset Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. shoot_raw_001.jpg or deliverable_final.mp4"
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Target Month
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. October 2026"
                    value={formData.target_month}
                    onChange={(e) => setFormData({ ...formData, target_month: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Assigned Specialist / Editor
                  </label>
                  <select
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                      Unassigned
                    </option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>
                        {u.full_name}
                      </option>
                    ))}
                  </select>
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
                  {createMutation.isPending ? 'Registering...' : 'Add Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LIGHTBOX IMAGE VIEWER                                        */}
      {/* ============================================================ */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <a
              href={lightboxUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-zinc-800 text-xs font-medium hover:bg-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Full Size</span>
            </a>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}
