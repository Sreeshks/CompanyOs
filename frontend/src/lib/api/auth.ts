// ============================================================
// Company OS — Auth API
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { LoginRequest, Token } from '@/types/auth';
import type { User } from '@/types/user';

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await apiClient.post<ApiResponse<Token>>('/auth/login', data);
    return res.data;
  },

  refresh: async (refreshToken: string) => {
    const res = await apiClient.post<ApiResponse<Token>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};
