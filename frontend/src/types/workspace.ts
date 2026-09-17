// ============================================================
// Company OS — Workspace Types
// ============================================================

export interface Workspace {
  id: string;
  client_id: string;
  name: string;
  status: string;
  drive_folder_id?: string;
  drive_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  client_id: string;
  name: string;
  status?: string;
  drive_folder_id?: string;
}

export interface WorkspaceUpdate {
  name?: string;
  status?: string;
  drive_folder_id?: string;
}
