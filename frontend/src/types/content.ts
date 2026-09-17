// ============================================================
// Company OS — Content Types
// ============================================================

export interface ContentItem {
  id: string;
  client_id: string;
  workspace_id: string;
  folder_id: string;
  content_type_id: string;
  file_name: string;
  display_name: string;
  sequence_number: number;
  target_month?: string;
  item_metadata?: Record<string, unknown>;
  current_stage_id: string;
  stage_name?: string;
  stage_code?: string;
  content_type_name?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  storage_path?: string;
  mime_type?: string;
  file_size_bytes?: number;
  thumbnail_url?: string;
  image_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItemCreate {
  client_id: string;
  workspace_id?: string;
  folder_id?: string;
  content_type_id: string;
  file_name: string;
  display_name: string;
  sequence_number?: number;
  target_month?: string;
  item_metadata?: Record<string, unknown>;
  current_stage_id?: string;
  assigned_user_id?: string;
  storage_path?: string;
  mime_type?: string;
  file_size_bytes?: number;
  thumbnail_url?: string;
  image_url?: string;
}

export interface ContentItemUpdate {
  display_name?: string;
  target_month?: string;
  assigned_user_id?: string;
  item_metadata?: Record<string, unknown>;
}

export interface ContentTransitionRequest {
  action: string;
  rejection_reason?: string;
  notes?: string;
  extra_fields?: Record<string, unknown>;
}

export interface ContentBatchTransitionRequest {
  item_ids: string[];
  action: string;
  rejection_reason?: string;
  notes?: string;
  extra_fields?: Record<string, unknown>;
}

export interface ContentMoveFolderRequest {
  new_folder_id: string;
}
