import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Date, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID, get_json_type
from app.models.base import TimestampMixin, SoftDeleteMixin, utc_now


class DocumentType(Base, TimestampMixin):
    __tablename__ = "document_types"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False, index=True)  # 'QUO', 'AGR', 'INV', etc.
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    documents = relationship("Document", back_populates="document_type")
    counters = relationship("DocumentCounter", back_populates="document_type")


class DocumentCounter(Base):
    __tablename__ = "document_counters"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    billing_company_id = Column(GUID, ForeignKey("billing_companies.id", ondelete="CASCADE"), nullable=False)
    document_type_id = Column(GUID, ForeignKey("document_types.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    current_sequence = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    billing_company = relationship("BillingCompany", back_populates="counters")
    document_type = relationship("DocumentType", back_populates="counters")

    __table_args__ = (
        UniqueConstraint("billing_company_id", "document_type_id", "year", name="uq_billing_doc_type_year"),
    )


class Document(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "documents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    document_type_id = Column(GUID, ForeignKey("document_types.id"), nullable=False)
    document_number = Column(String(100), unique=True, nullable=False, index=True)
    client_id = Column(GUID, ForeignKey("clients.id"), nullable=False, index=True)
    billing_company_id = Column(GUID, ForeignKey("billing_companies.id"), nullable=False, index=True)
    
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="draft", nullable=False)  # 'draft', 'sent', 'paid', 'cancelled', 'expired'
    
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="OMR", nullable=False)
    
    file_reference = Column(Text, nullable=True)
    doc_metadata = Column("metadata", get_json_type(), default=dict, nullable=True)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    # Relationships
    document_type = relationship("DocumentType", back_populates="documents")
    client = relationship("Client", back_populates="documents")
    billing_company = relationship("BillingCompany", back_populates="documents")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("DocumentItem", back_populates="document", cascade="all, delete-orphan", order_by="DocumentItem.order_index")


class DocumentItem(Base):
    __tablename__ = "document_items"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    document_id = Column(GUID, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(10, 2), default=1.00, nullable=False)
    unit_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    document = relationship("Document", back_populates="items")
