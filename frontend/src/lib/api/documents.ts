// ============================================================
// Company OS — Documents API
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type { Document, DocumentCreate, DocumentStatusUpdate, DocumentType } from '@/types/document';

export interface DocumentListParams extends PaginationParams {
  search?: string;
  client_id?: string;
  document_type_id?: string;
  status?: string;
}

export const documentsApi = {
  getTypes: async () => {
    const res = await apiClient.get<ApiResponse<DocumentType[]>>('/document-types');
    return res.data;
  },

  list: async (params?: DocumentListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Document>>>('/documents', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
    return res.data;
  },

  create: async (data: DocumentCreate) => {
    const res = await apiClient.post<ApiResponse<Document>>('/documents', data);
    return res.data;
  },

  updateStatus: async (id: string, data: DocumentStatusUpdate) => {
    const res = await apiClient.patch<ApiResponse<Document>>(`/documents/${id}/status`, data);
    return res.data;
  },
};
