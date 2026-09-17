// ============================================================
// Company OS — Tasks API
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type { Task, TaskCreate, TaskCompleteRequest, TaskReassignRequest, TaskHistory } from '@/types/task';

export interface TaskListParams extends PaginationParams {
  client_id?: string;
  workspace_id?: string;
  assigned_to?: string;
  status?: string;
}

export const tasksApi = {
  list: async (params?: TaskListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data;
  },

  create: async (data: TaskCreate) => {
    const res = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return res.data;
  },

  complete: async (id: string, data?: TaskCompleteRequest) => {
    const res = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/complete`, data || {});
    return res.data;
  },

  reassign: async (id: string, data: TaskReassignRequest) => {
    const res = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/reassign`, data);
    return res.data;
  },

  getHistory: async (id: string) => {
    const res = await apiClient.get<ApiResponse<TaskHistory[]>>(`/tasks/${id}/history`);
    return res.data;
  },
};
