// ============================================================
// Company OS — Folders API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Folder, FolderTree, FolderCreate, FolderUpdate, FolderMoveRequest } from '@/types/folder';

export const foldersApi = {
  getTree: async (workspaceId: string) => {
    const res = await apiClient.get<ApiResponse<FolderTree[]>>(`/folders/workspace/${workspaceId}`);
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Folder>>(`/folders/${id}`);
    return res.data;
  },

  create: async (data: FolderCreate) => {
    const res = await apiClient.post<ApiResponse<Folder>>('/folders', data);
    return res.data;
  },

  update: async (id: string, data: FolderUpdate) => {
    const res = await apiClient.put<ApiResponse<Folder>>(`/folders/${id}`, data);
    return res.data;
  },

  move: async (id: string, data: FolderMoveRequest) => {
    const res = await apiClient.post<ApiResponse<Folder>>(`/folders/${id}/move`, data);
    return res.data;
  },
};
