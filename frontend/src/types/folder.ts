// ============================================================
// Company OS — Folder Types
// ============================================================

export interface Folder {
  id: string;
  workspace_id: string;
  parent_folder_id?: string;
  name: string;
  folder_type: string;
  workflow_stage_id?: string;
  stage_name?: string;
  stage_code?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderTree extends Folder {
  subfolders: FolderTree[];
}

export interface FolderCreate {
  workspace_id: string;
  parent_folder_id?: string;
  name: string;
  folder_type?: string;
  workflow_stage_id?: string;
  status?: string;
}

export interface FolderUpdate {
  name?: string;
  workflow_stage_id?: string;
  status?: string;
}

export interface FolderMoveRequest {
  new_parent_folder_id?: string;
}
