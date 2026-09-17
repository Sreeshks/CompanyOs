import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PermissionOut(BaseModel):
    id: uuid.UUID
    code: str
    module: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class RoleOut(RoleBase):
    id: uuid.UUID
    is_system: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionOut] = []

    model_config = ConfigDict(from_attributes=True)


class RolePermissionUpdate(BaseModel):
    permission_ids: List[uuid.UUID]
