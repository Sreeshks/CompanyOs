import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, Date, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, SoftDeleteMixin, utc_now


class ClientStatus(Base):
    __tablename__ = "client_statuses"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(20), default="#6B7280", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    is_terminal = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    clients = relationship("Client", back_populates="status")


class ClientStatusTransition(Base):
    __tablename__ = "client_status_transitions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    from_status_id = Column(GUID, ForeignKey("client_statuses.id"), nullable=False)
    to_status_id = Column(GUID, ForeignKey("client_statuses.id"), nullable=False)
    action = Column(String(100), nullable=False)
    required_permission = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    from_status = relationship("ClientStatus", foreign_keys=[from_status_id])
    to_status = relationship("ClientStatus", foreign_keys=[to_status_id])

    __table_args__ = (
        UniqueConstraint("from_status_id", "action", name="uq_client_transition_from_action"),
    )


class Client(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "clients"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    client_code = Column(String(50), unique=True, nullable=False, index=True)
    business_name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    
    billing_company_id = Column(GUID, ForeignKey("billing_companies.id"), nullable=True)
    service_id = Column(GUID, ForeignKey("services.id"), nullable=True)
    package_id = Column(GUID, ForeignKey("packages.id"), nullable=True)
    
    payment_terms = Column(String(100), nullable=True)
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    
    salesperson_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    status_id = Column(GUID, ForeignKey("client_statuses.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    # Relationships
    billing_company = relationship("BillingCompany", back_populates="clients")
    service = relationship("Service", back_populates="clients")
    package = relationship("Package", back_populates="clients")
    salesperson = relationship("User", foreign_keys=[salesperson_id], back_populates="sales_clients")
    status = relationship("ClientStatus", back_populates="clients")

    workspaces = relationship("Workspace", back_populates="client", cascade="all, delete-orphan")
    staff_assignments = relationship("ClientStaffAssignment", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client")
    tasks = relationship("Task", back_populates="client")
    rejections = relationship("Rejection", back_populates="client")


class ClientStaffAssignment(Base):
    __tablename__ = "client_staff_assignments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    task_type_id = Column(GUID, ForeignKey("task_types.id"), nullable=False)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    assigned_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    client = relationship("Client", back_populates="staff_assignments")
    task_type = relationship("TaskType", back_populates="staff_assignments")
    user = relationship("User", foreign_keys=[user_id], back_populates="client_assignments")

    __table_args__ = (
        UniqueConstraint("client_id", "task_type_id", name="uq_client_task_type_staff"),
    )
