import uuid
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WorkflowStageBase(BaseModel):
    name: str
    code: str
    stage_type: str = "standard"
    order_index: int = 0
    default_folder_name: Optional[str] = None


class WorkflowStageCreate(WorkflowStageBase):
    pass


class WorkflowStageOut(WorkflowStageBase):
    id: uuid.UUID
    workflow_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowTransitionBase(BaseModel):
    from_stage_id: uuid.UUID
    to_stage_id: uuid.UUID
    action: str
    required_permission: Optional[str] = None
    required_fields: Optional[List[str]] = []
    auto_create_task_type_id: Optional[uuid.UUID] = None
    assignment_mode: str = "automatic"
    active: bool = True


class WorkflowTransitionCreate(WorkflowTransitionBase):
    pass


class WorkflowTransitionOut(WorkflowTransitionBase):
    id: uuid.UUID
    workflow_id: uuid.UUID
    from_stage_name: Optional[str] = None
    to_stage_name: Optional[str] = None
    task_type_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    active: bool = True


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowOut(WorkflowBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    stages: List[WorkflowStageOut] = []
    transitions: List[WorkflowTransitionOut] = []

    model_config = ConfigDict(from_attributes=True)
