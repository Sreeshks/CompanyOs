// ============================================================
// Company OS — Clients API
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type {
  Client, ClientCreate, ClientUpdate,
  ClientStaffAssignment, ClientStaffAssignmentCreate,
} from '@/types/client';

export interface ClientListParams extends PaginationParams {
  search?: string;
  status_id?: string;
  billing_company_id?: string;
}

export const clientsApi = {
  list: async (params?: ClientListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Client>>>('/clients', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
    return res.data;
  },

  create: async (data: ClientCreate) => {
    const res = await apiClient.post<ApiResponse<Client>>('/clients', data);
    return res.data;
  },

  update: async (id: string, data: ClientUpdate) => {
    const res = await apiClient.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/clients/${id}`);
    return res.data;
  },

  getStaffAssignments: async (clientId: string) => {
    const res = await apiClient.get<ApiResponse<ClientStaffAssignment[]>>(`/clients/${clientId}/staff-assignments`);
    return res.data;
  },

  assignStaff: async (clientId: string, data: ClientStaffAssignmentCreate) => {
    const res = await apiClient.post<ApiResponse<ClientStaffAssignment>>(`/clients/${clientId}/staff-assignments`, data);
    return res.data;
  },

  removeStaffAssignment: async (clientId: string, assignmentId: string) => {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/clients/${clientId}/staff-assignments/${assignmentId}`);
    return res.data;
  },
};
