// ============================================================
// Company OS — Workspaces API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Workspace, WorkspaceCreate } from '@/types/workspace';
import type { FolderTree } from '@/types/folder';

export const workspacesApi = {
  list: async (clientId?: string) => {
    const res = await apiClient.get<ApiResponse<Workspace[]>>('/workspaces', {
      params: clientId ? { client_id: clientId } : undefined,
    });
    return res.data;
  },

  getClientTree: async (clientId: string) => {
    const res = await apiClient.get<ApiResponse<FolderTree[]>>(`/workspaces/client/${clientId}/tree`);
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
    return res.data;
  },

  create: async (data: WorkspaceCreate) => {
    const res = await apiClient.post<ApiResponse<Workspace>>('/workspaces', data);
    return res.data;
  },
};
