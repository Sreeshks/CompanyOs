// ============================================================
// Company OS — Dashboard Types
// ============================================================

export interface StaffWorkload {
  user_id: string;
  user_name: string;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

export interface MonthlyWork {
  target_month: string;
  total_items: number;
  completed_items: number;
  pending_items: number;
}

export interface WorkflowStatusItem {
  stage_id: string;
  stage_name: string;
  item_count: number;
}

export interface DashboardSummary {
  active_clients: number;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_percentage: number;
  total_rejections: number;
  open_rejections: number;
  workflow_stages: WorkflowStatusItem[];
}

export interface RejectionOverview {
  total_rejections: number;
  open_rejections: number;
  resolved_rejections: number;
  recent_rejections: Record<string, unknown>[];
}
