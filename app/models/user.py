import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, SoftDeleteMixin, utc_now


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="skills")


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    role_id = Column(GUID, ForeignKey("roles.id"), nullable=False)
    designation_id = Column(GUID, ForeignKey("designations.id"), nullable=True)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    
    employment_type = Column(String(50), default="full_time", nullable=False)
    status = Column(String(20), default="active", nullable=False, index=True)
    joining_date = Column(Date, nullable=True)

    # Relationships
    role = relationship("Role", back_populates="users")
    designation = relationship("Designation", back_populates="users")
    department = relationship("Department", back_populates="users")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")

    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.assigned_by", back_populates="creator")
    client_assignments = relationship("ClientStaffAssignment", foreign_keys="ClientStaffAssignment.user_id", back_populates="user")
    sales_clients = relationship("Client", foreign_keys="Client.salesperson_id", back_populates="salesperson")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
