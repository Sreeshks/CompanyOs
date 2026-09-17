import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class StaffWorkloadItem(BaseModel):
    user_id: uuid.UUID
    user_name: str
    pending_tasks: int
    completed_tasks: int
    overdue_tasks: int


class ClientWorkloadItem(BaseModel):
    client_id: uuid.UUID
    client_name: str
    client_code: str
    total_tasks: int
    pending_tasks: int
    completed_tasks: int


class MonthlyWorkItem(BaseModel):
    target_month: str
    total_items: int
    completed_items: int
    pending_items: int


class WorkflowStatusItem(BaseModel):
    stage_id: uuid.UUID
    stage_name: str
    item_count: int


class DashboardSummaryOut(BaseModel):
    active_clients: int
    pending_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_percentage: float
    total_rejections: int
    open_rejections: int
    workflow_stages: List[WorkflowStatusItem] = []


class TeamOverviewOut(BaseModel):
    staff_workload: List[StaffWorkloadItem] = []


class MonthlyWorkOverviewOut(BaseModel):
    monthly_data: List[MonthlyWorkItem] = []


class RejectionOverviewOut(BaseModel):
    total_rejections: int
    open_rejections: int
    resolved_rejections: int
    recent_rejections: List[Dict[str, Any]] = []
