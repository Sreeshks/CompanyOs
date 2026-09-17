import uuid
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class DocumentTypeOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    active: bool

    model_config = ConfigDict(from_attributes=True)


class DocumentItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal = Decimal("0.00")


class DocumentItemOut(DocumentItemCreate):
    id: uuid.UUID
    total_price: Decimal
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class DocumentCreate(BaseModel):
    document_type_id: uuid.UUID
    client_id: uuid.UUID
    billing_company_id: uuid.UUID
    issue_date: date
    due_date: Optional[date] = None
    currency: str = "OMR"
    file_reference: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    items: List[DocumentItemCreate] = []


class DocumentStatusUpdate(BaseModel):
    status: str  # 'draft', 'sent', 'paid', 'cancelled', 'expired'


class DocumentOut(BaseModel):
    id: uuid.UUID
    document_type_id: uuid.UUID
    document_type_name: Optional[str] = None
    document_type_code: Optional[str] = None
    document_number: str
    client_id: uuid.UUID
    client_name: Optional[str] = None
    billing_company_id: uuid.UUID
    billing_company_name: Optional[str] = None
    issue_date: date
    due_date: Optional[date] = None
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    file_reference: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, validation_alias="doc_metadata")
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    items: List[DocumentItemOut] = []

    model_config = ConfigDict(from_attributes=True)
