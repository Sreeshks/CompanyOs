import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class ContentItemBase(BaseModel):
    client_id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    content_type_id: uuid.UUID
    file_name: str
    display_name: str
    sequence_number: int = 1
    target_month: Optional[str] = None
    storage_path: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    item_metadata: Optional[Dict[str, Any]] = {}


class ContentItemCreate(ContentItemBase):
    # If initial stage not provided, default to workflow initial stage
    current_stage_id: Optional[uuid.UUID] = None
    assigned_user_id: Optional[uuid.UUID] = None


class ContentItemUpdate(BaseModel):
    display_name: Optional[str] = None
    target_month: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    item_metadata: Optional[Dict[str, Any]] = None


class ContentTransitionRequest(BaseModel):
    action: str
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    extra_fields: Optional[Dict[str, Any]] = None
    assigned_user_id: Optional[uuid.UUID] = None
    target_date: Optional[date] = None
    days_allotted: Optional[int] = None
    priority: Optional[str] = "medium"


class ContentBatchTransitionRequest(BaseModel):
    item_ids: List[uuid.UUID]
    action: str
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    extra_fields: Optional[Dict[str, Any]] = None
    assigned_user_id: Optional[uuid.UUID] = None
    target_date: Optional[date] = None
    days_allotted: Optional[int] = None
    priority: Optional[str] = "medium"


class ContentMoveFolderRequest(BaseModel):
    new_folder_id: uuid.UUID


class ContentItemOut(ContentItemBase):
    id: uuid.UUID
    current_stage_id: uuid.UUID
    stage_name: Optional[str] = None
    stage_code: Optional[str] = None
    content_type_name: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    storage_path: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    latest_rejection_reason: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
