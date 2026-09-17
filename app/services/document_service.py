import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.exceptions import AppException, NotFoundException
from app.models.document import Document, DocumentType, DocumentCounter, DocumentItem
from app.models.billing_company import BillingCompany
from app.models.client import Client
from app.schemas.document import DocumentCreate, DocumentStatusUpdate
from app.services.audit_service import AuditService


class DocumentService:
    @staticmethod
    def generate_next_document_number(
        db: Session,
        billing_company_id: uuid.UUID,
        document_type_id: uuid.UUID,
        year: int
    ) -> str:
        # Retrieve doc type and company
        doc_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
        if not doc_type:
            raise NotFoundException("DocumentType", document_type_id)

        company = db.query(BillingCompany).filter(BillingCompany.id == billing_company_id).first()
        if not company:
            raise NotFoundException("BillingCompany", billing_company_id)

        # Concurrency-safe counter with row lock
        counter_query = db.query(DocumentCounter).filter(
            DocumentCounter.billing_company_id == billing_company_id,
            DocumentCounter.document_type_id == document_type_id,
            DocumentCounter.year == year
        )
        # SQLite doesn't support with_for_update, but PostgreSQL does
        if "postgresql" in str(db.bind.url):
            counter_query = counter_query.with_for_update()

        counter = counter_query.first()

        if not counter:
            counter = DocumentCounter(
                billing_company_id=billing_company_id,
                document_type_id=document_type_id,
                year=year,
                current_sequence=1
            )
            db.add(counter)
            sequence_num = 1
        else:
            counter.current_sequence += 1
            sequence_num = counter.current_sequence

        db.flush()

        doc_code = doc_type.code.upper().strip()
        comp_code = company.short_code.upper().strip()
        doc_number = f"{doc_code}-{comp_code}-{year}-{sequence_num:03d}"
        return doc_number

    @staticmethod
    def create_document(
        db: Session,
        data: DocumentCreate,
        created_by_id: Optional[uuid.UUID] = None
    ) -> Document:
        client = db.query(Client).filter(Client.id == data.client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", data.client_id)

        company = db.query(BillingCompany).filter(BillingCompany.id == data.billing_company_id).first()
        if not company:
            raise NotFoundException("BillingCompany", data.billing_company_id)

        year = data.issue_date.year
        doc_number = DocumentService.generate_next_document_number(
            db=db,
            billing_company_id=data.billing_company_id,
            document_type_id=data.document_type_id,
            year=year
        )

        subtotal = Decimal("0.00")
        for item in data.items:
            subtotal += Decimal(str(item.quantity)) * Decimal(str(item.unit_price))

        tax_amount = Decimal("0.00")
        if company.vat_applicable:
            # 5% Oman standard VAT
            tax_amount = (subtotal * Decimal("0.05")).quantize(Decimal("0.001"))

        total_amount = subtotal + tax_amount

        doc = Document(
            document_type_id=data.document_type_id,
            document_number=doc_number,
            client_id=data.client_id,
            billing_company_id=data.billing_company_id,
            issue_date=data.issue_date,
            due_date=data.due_date,
            status="draft",
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=data.currency,
            file_reference=data.file_reference,
            doc_metadata=data.metadata or {},
            created_by=created_by_id
        )
        db.add(doc)
        db.flush()

        for idx, item in enumerate(data.items):
            item_total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
            db.add(DocumentItem(
                document_id=doc.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item_total,
                order_index=idx
            ))

        AuditService.log(
            db=db,
            action="DOCUMENT_GENERATE",
            entity_type="document",
            entity_id=doc.id,
            user_id=created_by_id,
            new_data={"document_number": doc.document_number, "total_amount": str(doc.total_amount)}
        )
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def update_status(
        db: Session,
        doc_id: uuid.UUID,
        new_status: str,
        user_id: Optional[uuid.UUID] = None
    ) -> Document:
        doc = db.query(Document).filter(Document.id == doc_id, Document.deleted_at.is_(None)).first()
        if not doc:
            raise NotFoundException("Document", doc_id)

        old_status = doc.status
        doc.status = new_status

        AuditService.log(
            db=db,
            action="DOCUMENT_STATUS_CHANGE",
            entity_type="document",
            entity_id=doc.id,
            user_id=user_id,
            old_data={"status": old_status},
            new_data={"status": new_status}
        )
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def list_documents(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        client_id: Optional[uuid.UUID] = None,
        document_type_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Document], int]:
        query = db.query(Document).filter(Document.deleted_at.is_(None))

        if search:
            search_pat = f"%{search}%"
            query = query.filter(Document.document_number.ilike(search_pat))
        if client_id:
            query = query.filter(Document.client_id == client_id)
        if document_type_id:
            query = query.filter(Document.document_type_id == document_type_id)
        if status:
            query = query.filter(Document.status == status)

        total = query.count()
        items = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
