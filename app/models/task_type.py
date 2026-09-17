import uuid
from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin


class TaskType(Base, TimestampMixin):
    __tablename__ = "task_types"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    package_tasks = relationship("PackageTask", back_populates="task_type")
    tasks = relationship("Task", back_populates="task_type")
    staff_assignments = relationship("ClientStaffAssignment", back_populates="task_type")
