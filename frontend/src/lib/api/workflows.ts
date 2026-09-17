// ============================================================
// Company OS — Workflows API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Workflow, WorkflowCreate,
  WorkflowStage, WorkflowStageCreate,
  WorkflowTransition, WorkflowTransitionCreate,
} from '@/types/workflow';

export const workflowsApi = {
  list: async () => {
    const res = await apiClient.get<ApiResponse<Workflow[]>>('/workflows');
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Workflow>>(`/workflows/${id}`);
    return res.data;
  },

  create: async (data: WorkflowCreate) => {
    const res = await apiClient.post<ApiResponse<Workflow>>('/workflows', data);
    return res.data;
  },

  addStage: async (workflowId: string, data: WorkflowStageCreate) => {
    const res = await apiClient.post<ApiResponse<WorkflowStage>>(`/workflows/${workflowId}/stages`, data);
    return res.data;
  },

  addTransition: async (workflowId: string, data: WorkflowTransitionCreate) => {
    const res = await apiClient.post<ApiResponse<WorkflowTransition>>(`/workflows/${workflowId}/transitions`, data);
    return res.data;
  },
};
