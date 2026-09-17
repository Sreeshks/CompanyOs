// ============================================================
// Company OS — Roles & Permissions API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Role, RoleCreate, RoleUpdate, Permission, RolePermissionUpdate } from '@/types/role';

export const rolesApi = {
  list: async () => {
    const res = await apiClient.get<ApiResponse<Role[]>>('/roles');
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
    return res.data;
  },

  create: async (data: RoleCreate) => {
    const res = await apiClient.post<ApiResponse<Role>>('/roles', data);
    return res.data;
  },

  update: async (id: string, data: RoleUpdate) => {
    const res = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return res.data;
  },

  assignPermissions: async (id: string, data: RolePermissionUpdate) => {
    const res = await apiClient.post<ApiResponse<Role>>(`/roles/${id}/permissions`, data);
    return res.data;
  },
};

export const permissionsApi = {
  list: async () => {
    const res = await apiClient.get<ApiResponse<Permission[]>>('/permissions');
    return res.data;
  },
};
