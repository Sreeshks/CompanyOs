import uuid
from sqlalchemy import Column, String, Text, Boolean, Numeric, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, utc_now


class PackageTask(Base):
    __tablename__ = "package_tasks"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    package_id = Column(GUID, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False)
    task_type_id = Column(GUID, ForeignKey("task_types.id", ondelete="RESTRICT"), nullable=False)
    sequence = Column(Integer, default=0, nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    created_at = Column(Base.metadata.tables.get("created_at", None) or TimestampMixin.created_at.type, default=utc_now)

    package = relationship("Package", back_populates="package_tasks")
    task_type = relationship("TaskType", back_populates="package_tasks")

    __table_args__ = (
        UniqueConstraint("package_id", "task_type_id", name="uq_package_task"),
    )


class Package(Base, TimestampMixin):
    __tablename__ = "packages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    service_id = Column(GUID, ForeignKey("services.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(12, 2), default=0.00, nullable=False)
    duration = Column(String(50), nullable=True)  # e.g. "monthly", "quarterly", "annual"
    active = Column(Boolean, default=True, nullable=False)

    service = relationship("Service", back_populates="packages")
    package_tasks = relationship("PackageTask", back_populates="package", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="package")

    __table_args__ = (
        UniqueConstraint("service_id", "name", name="uq_service_package_name"),
    )
