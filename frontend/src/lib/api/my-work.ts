// ============================================================
// Company OS — My Work API
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type { Task } from '@/types/task';

export const myWorkApi = {
  getAll: async (params?: PaginationParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/my-work', { params });
    return res.data;
  },

  getPending: async (params?: PaginationParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/my-work/pending', { params });
    return res.data;
  },

  getCompleted: async (params?: PaginationParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/my-work/completed', { params });
    return res.data;
  },

  getOverdue: async (params?: PaginationParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/my-work/overdue', { params });
    return res.data;
  },
};
