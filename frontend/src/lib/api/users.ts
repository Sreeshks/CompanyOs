// ============================================================
// Company OS — Users API
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type { User, UserCreate, UserUpdate, UserResetPassword } from '@/types/user';

export interface UserListParams extends PaginationParams {
  search?: string;
  role_id?: string;
  department_id?: string;
  status?: string;
}

export const usersApi = {
  list: async (params?: UserListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },

  create: async (data: UserCreate) => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data;
  },

  update: async (id: string, data: UserUpdate) => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    return res.data;
  },

  resetPassword: async (id: string, data: UserResetPassword) => {
    const res = await apiClient.post<ApiResponse<boolean>>(`/users/${id}/reset-password`, data);
    return res.data;
  },
};
