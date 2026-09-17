import uuid
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    client_id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    content_item_id: Optional[uuid.UUID] = None
    task_type_id: uuid.UUID
    workflow_stage_id: Optional[uuid.UUID] = None
    priority: str = "medium"  # 'low', 'medium', 'high', 'urgent'
    assigned_to: Optional[uuid.UUID] = None
    target_date: Optional[date] = None
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    priority: Optional[str] = None
    target_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class TaskCompleteRequest(BaseModel):
    notes: Optional[str] = None


class TaskReassignRequest(BaseModel):
    new_assignee_id: uuid.UUID
    reason: Optional[str] = None


class TaskOut(TaskBase):
    id: uuid.UUID
    task_code: str
    status: str
    client_name: Optional[str] = None
    task_type_name: Optional[str] = None
    workflow_stage_name: Optional[str] = None
    content_item_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_by: Optional[uuid.UUID] = None
    assigned_by_name: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskAssignmentHistoryOut(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    previous_assignee_id: Optional[uuid.UUID] = None
    previous_assignee_name: Optional[str] = None
    new_assignee_id: uuid.UUID
    new_assignee_name: Optional[str] = None
    changed_by_id: uuid.UUID
    changed_by_name: Optional[str] = None
    reason: Optional[str] = None
    reassigned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskHistoryOut(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    previous_assignee_name: Optional[str] = None
    new_assignee_name: Optional[str] = None
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
