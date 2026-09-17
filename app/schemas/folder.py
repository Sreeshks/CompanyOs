from __future__ import annotations
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FolderBase(BaseModel):
    workspace_id: uuid.UUID
    parent_folder_id: Optional[uuid.UUID] = None
    name: str
    folder_type: str = "custom"  # 'workflow', 'system', 'custom'
    workflow_stage_id: Optional[uuid.UUID] = None
    status: str = "active"


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    workflow_stage_id: Optional[uuid.UUID] = None
    status: Optional[str] = None


class FolderMoveRequest(BaseModel):
    new_parent_folder_id: Optional[uuid.UUID] = None


class FolderOut(FolderBase):
    id: uuid.UUID
    stage_name: Optional[str] = None
    stage_code: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FolderTreeOut(FolderOut):
    subfolders: List[FolderTreeOut] = []

    model_config = ConfigDict(from_attributes=True)
