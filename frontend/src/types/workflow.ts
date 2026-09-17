// ============================================================
// Company OS — Workflow Types
// ============================================================

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  code: string;
  stage_type: string;
  order_index: number;
  default_folder_name?: string;
  created_at: string;
}

export interface WorkflowStageCreate {
  name: string;
  code: string;
  stage_type?: string;
  order_index?: number;
  default_folder_name?: string;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_stage_id: string;
  to_stage_id: string;
  from_stage_name?: string;
  to_stage_name?: string;
  action: string;
  required_permission?: string;
  required_fields?: string[];
  auto_create_task_type_id?: string;
  task_type_name?: string;
  assignment_mode: string;
  active: boolean;
  created_at: string;
}

export interface WorkflowTransitionCreate {
  from_stage_id: string;
  to_stage_id: string;
  action: string;
  required_permission?: string;
  required_fields?: string[];
  auto_create_task_type_id?: string;
  assignment_mode?: string;
  active?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
}

export interface WorkflowCreate {
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}
