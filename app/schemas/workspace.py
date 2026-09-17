import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    client_id: uuid.UUID
    name: str
    status: str = "active"


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None


class WorkspaceOut(WorkspaceBase):
    id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
