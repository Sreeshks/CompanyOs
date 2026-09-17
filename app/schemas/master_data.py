import uuid
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr


# --- Departments ---
class DepartmentCreate(BaseModel):
    name: str
    code: str
    active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None


class DepartmentOut(DepartmentCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Designations ---
class DesignationCreate(BaseModel):
    name: str
    code: str
    active: bool = True


class DesignationUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None


class DesignationOut(DesignationCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Billing Companies ---
class BillingCompanyCreate(BaseModel):
    name: str
    short_code: str
    vat_applicable: bool = False
    tax_number: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str = "active"


class BillingCompanyUpdate(BaseModel):
    name: Optional[str] = None
    vat_applicable: Optional[bool] = None
    tax_number: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class BillingCompanyOut(BillingCompanyCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Task Types ---
class TaskTypeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    active: bool = True


class TaskTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class TaskTypeOut(TaskTypeCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Services & Packages ---
class ServiceCreate(BaseModel):
    name: str
    code: str
    type: str
    description: Optional[str] = None
    recurring: bool = False
    active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    recurring: Optional[bool] = None
    active: Optional[bool] = None


class PackageTaskCreate(BaseModel):
    task_type_id: uuid.UUID
    sequence: int = 0
    is_required: bool = True


class PackageTaskOut(BaseModel):
    id: uuid.UUID
    task_type_id: uuid.UUID
    task_type_name: Optional[str] = None
    sequence: int
    is_required: bool

    model_config = ConfigDict(from_attributes=True)


class PackageCreate(BaseModel):
    service_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Decimal = Decimal("0.00")
    duration: Optional[str] = None
    active: bool = True
    tasks: Optional[List[PackageTaskCreate]] = None


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration: Optional[str] = None
    active: Optional[bool] = None


class PackageOut(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    duration: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime
    package_tasks: List[PackageTaskOut] = []

    model_config = ConfigDict(from_attributes=True)


class ServiceOut(ServiceCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    packages: List[PackageOut] = []

    model_config = ConfigDict(from_attributes=True)


# --- Content Types ---
class ContentTypeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    active: bool = True


class ContentTypeOut(ContentTypeCreate):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
