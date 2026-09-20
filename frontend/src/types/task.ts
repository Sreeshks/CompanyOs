// ============================================================
// Company OS — Task Types
// ============================================================

export interface Task {
  id: string;
  task_code: string;
  client_id: string;
  workspace_id?: string;
  content_item_id?: string;
  task_type_id: string;
  workflow_stage_id?: string;
  priority: string;
  assigned_to?: string;
  target_date?: string;
  notes?: string;
  status: string;
  client_name?: string;
  task_type_name?: string;
  workflow_stage_name?: string;
  content_item_name?: string;
  folder_id?: string;
  content_item_thumbnail?: string;
  content_item_image?: string;
  content_item_stage_id?: string;
  content_item_stage_name?: string;
  assigned_to_name?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  client_id: string;
  workspace_id?: string;
  content_item_id?: string;
  task_type_id: string;
  workflow_stage_id?: string;
  priority?: string;
  assigned_to?: string;
  target_date?: string;
  notes?: string;
}

export interface TaskUpdate {
  priority?: string;
  target_date?: string;
  notes?: string;
  status?: string;
}

export interface TaskCompleteRequest {
  notes?: string;
}

export interface TaskReassignRequest {
  new_assignee_id: string;
  reason?: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  previous_assignee_name?: string;
  new_assignee_name?: string;
  changed_by_name?: string;
  notes?: string;
  timestamp: string;
}
