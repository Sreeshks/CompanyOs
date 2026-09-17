// ============================================================
// Company OS — Content API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type {
  ContentItem,
  ContentItemCreate,
  ContentTransitionRequest,
  ContentBatchTransitionRequest,
  ContentMoveFolderRequest
} from '@/types/content';

export interface ContentListParams {
  workspace_id?: string;
  folder_id?: string;
  current_stage_id?: string;
  client_id?: string;
}

export const contentApi = {
  list: async (params?: ContentListParams) => {
    const res = await apiClient.get<ApiResponse<ContentItem[]>>('/content', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<ContentItem>>(`/content/${id}`);
    return res.data;
  },

  create: async (data: ContentItemCreate) => {
    const res = await apiClient.post<ApiResponse<ContentItem>>('/content', data);
    return res.data;
  },

  transition: async (id: string, data: ContentTransitionRequest) => {
    const res = await apiClient.post<ApiResponse<ContentItem>>(`/content/${id}/transition`, data);
    return res.data;
  },

  batchTransition: async (data: ContentBatchTransitionRequest) => {
    const res = await apiClient.post<ApiResponse<ContentItem[]>>('/content/batch-transition', data);
    return res.data;
  },

  moveToFolder: async (id: string, data: ContentMoveFolderRequest) => {
    const res = await apiClient.post<ApiResponse<ContentItem>>(`/content/${id}/move-folder`, data);
    return res.data;
  },
};
