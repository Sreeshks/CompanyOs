// ============================================================
// Company OS — Pipeline API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { ClientStatus, ClientStatusTransition, Client, PipelineTransitionRequest } from '@/types/client';

export const pipelineApi = {
  getStatuses: async () => {
    const res = await apiClient.get<ApiResponse<ClientStatus[]>>('/pipeline/statuses');
    return res.data;
  },

  getTransitions: async () => {
    const res = await apiClient.get<ApiResponse<ClientStatusTransition[]>>('/pipeline/transitions');
    return res.data;
  },

  executeTransition: async (clientId: string, data: PipelineTransitionRequest) => {
    const res = await apiClient.post<ApiResponse<Client>>(`/pipeline/${clientId}/transition`, data);
    return res.data;
  },
};
