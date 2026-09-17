import uuid
from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin


class BillingCompany(Base, TimestampMixin):
    __tablename__ = "billing_companies"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(150), unique=True, nullable=False)
    short_code = Column(String(10), unique=True, nullable=False, index=True)
    vat_applicable = Column(Boolean, default=False, nullable=False)
    tax_number = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(20), default="active", nullable=False)

    clients = relationship("Client", back_populates="billing_company")
    documents = relationship("Document", back_populates="billing_company")
    counters = relationship("DocumentCounter", back_populates="billing_company")
