import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RejectionOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str] = None
    content_id: uuid.UUID
    content_name: Optional[str] = None
    content_type: Optional[str] = None
    reason: str
    rejected_by: Optional[str] = None
    rejected_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_status: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RejectionResolveRequest(BaseModel):
    resolution_notes: Optional[str] = None
