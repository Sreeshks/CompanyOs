import uuid
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class ClientStatusBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    color: str = "#6B7280"
    order_index: int = 0
    is_terminal: bool = False


class ClientStatusCreate(ClientStatusBase):
    pass


class ClientStatusOut(ClientStatusBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientStatusTransitionCreate(BaseModel):
    from_status_id: uuid.UUID
    to_status_id: uuid.UUID
    action: str
    required_permission: Optional[str] = None


class ClientStatusTransitionOut(BaseModel):
    id: uuid.UUID
    from_status_id: uuid.UUID
    to_status_id: uuid.UUID
    from_status_name: Optional[str] = None
    to_status_name: Optional[str] = None
    action: str
    required_permission: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClientBase(BaseModel):
    business_name: str
    contact_person: str
    email: EmailStr
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    billing_company_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    package_id: Optional[uuid.UUID] = None
    payment_terms: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    salesperson_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    # Optional status_id on creation; defaults to initial pipeline status (e.g. Lead)
    status_id: Optional[uuid.UUID] = None


class ClientUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    billing_company_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    package_id: Optional[uuid.UUID] = None
    payment_terms: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    salesperson_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class ClientOut(ClientBase):
    id: uuid.UUID
    client_code: str
    status_id: uuid.UUID
    status_name: Optional[str] = None
    billing_company_name: Optional[str] = None
    service_name: Optional[str] = None
    package_name: Optional[str] = None
    salesperson_name: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientStaffAssignmentCreate(BaseModel):
    task_type_id: uuid.UUID
    user_id: uuid.UUID


class ClientStaffAssignmentOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    task_type_id: uuid.UUID
    task_type_name: Optional[str] = None
    user_id: uuid.UUID
    user_name: Optional[str] = None
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PipelineTransitionRequest(BaseModel):
    action: Optional[str] = None
    to_status_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
