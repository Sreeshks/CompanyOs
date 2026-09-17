import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.document import Document, DocumentType
from app.models.user import User
from app.schemas.document import (
    DocumentCreate, DocumentStatusUpdate, DocumentOut, DocumentTypeOut
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.document_service import DocumentService

router = APIRouter(tags=["Documents"])


@router.get("/document-types", response_model=ApiResponse[List[DocumentTypeOut]], summary="List document types")
def list_document_types(db: Session = Depends(get_db)):
    types = db.query(DocumentType).filter(DocumentType.active == True).all()
    return ApiResponse(success=True, data=[DocumentTypeOut.model_validate(t) for t in types])


@router.get("/documents", response_model=ApiResponse[PaginatedResponse[DocumentOut]], summary="List documents", dependencies=[Depends(require_permission("documents.view"))])
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    client_id: Optional[uuid.UUID] = None,
    document_type_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    docs, total = DocumentService.list_documents(
        db=db, page=page, page_size=page_size, search=search,
        client_id=client_id, document_type_id=document_type_id, status=status
    )
    doc_outs = []
    for d in docs:
        do = DocumentOut.model_validate(d)
        do.document_type_name = d.document_type.name if d.document_type else None
        do.document_type_code = d.document_type.code if d.document_type else None
        do.client_name = d.client.business_name if d.client else None
        do.billing_company_name = d.billing_company.name if d.billing_company else None
        doc_outs.append(do)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedResponse(items=doc_outs, total=total, page=page, page_size=page_size, total_pages=total_pages)
    )


@router.post("/documents", response_model=ApiResponse[DocumentOut], summary="Generate document with gapless sequence number", dependencies=[Depends(require_permission("documents.create"))])
def create_document(
    data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = DocumentService.create_document(db=db, data=data, created_by_id=current_user.id)
    do = DocumentOut.model_validate(doc)
    do.document_type_name = doc.document_type.name if doc.document_type else None
    do.document_type_code = doc.document_type.code if doc.document_type else None
    do.client_name = doc.client.business_name if doc.client else None
    do.billing_company_name = doc.billing_company.name if doc.billing_company else None
    return ApiResponse(success=True, data=do, message=f"Document {doc.document_number} generated successfully")


@router.get("/documents/{document_id}", response_model=ApiResponse[DocumentOut], summary="Get document details", dependencies=[Depends(require_permission("documents.view"))])
def get_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.deleted_at.is_(None)).first()
    if not doc:
        raise NotFoundException("Document", document_id)
    do = DocumentOut.model_validate(doc)
    do.document_type_name = doc.document_type.name if doc.document_type else None
    do.document_type_code = doc.document_type.code if doc.document_type else None
    do.client_name = doc.client.business_name if doc.client else None
    do.billing_company_name = doc.billing_company.name if doc.billing_company else None
    return ApiResponse(success=True, data=do)


@router.patch("/documents/{document_id}/status", response_model=ApiResponse[DocumentOut], summary="Update document status", dependencies=[Depends(require_permission("documents.create"))])
def update_document_status(
    document_id: uuid.UUID,
    req: DocumentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = DocumentService.update_status(db=db, doc_id=document_id, new_status=req.status, user_id=current_user.id)
    do = DocumentOut.model_validate(doc)
    return ApiResponse(success=True, data=do, message=f"Document status changed to {req.status}")
