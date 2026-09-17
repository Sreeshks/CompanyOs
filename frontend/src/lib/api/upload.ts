// ============================================================
// Company OS — Upload API (ImgBB)
// ============================================================

import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface ImgBBUploadResult {
  display_url: string;
  thumb_url: string;
  url: string;
  delete_url: string;
  original_name: string;
  size: number;
  width: number;
  height: number;
  mime: string;
}

export interface ImgBBBatchUploadResult {
  results: ImgBBUploadResult[];
  failed: string[];
}

export const uploadApi = {
  /**
   * Upload a single image to ImgBB via backend proxy
   */
  uploadImage: async (file: File, name?: string): Promise<ApiResponse<ImgBBUploadResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await apiClient.post<ApiResponse<ImgBBUploadResult>>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },

  /**
   * Upload multiple images to ImgBB via backend proxy
   * Optionally rename with a prefix and start index for sequential naming
   */
  uploadImages: async (
    files: File[],
    prefix?: string,
    startIndex: number = 1
  ): Promise<ApiResponse<ImgBBBatchUploadResult>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (prefix) formData.append('prefix', prefix);
    formData.append('start_index', String(startIndex));

    const res = await apiClient.post<ApiResponse<ImgBBBatchUploadResult>>('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data;
  },
};
