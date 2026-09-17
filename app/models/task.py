import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, utc_now


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    task_code = Column(String(50), unique=True, nullable=False, index=True)
    
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(GUID, ForeignKey("workspaces.id"), nullable=True)
    content_item_id = Column(GUID, ForeignKey("content_items.id", ondelete="SET NULL"), nullable=True, index=True)
    task_type_id = Column(GUID, ForeignKey("task_types.id"), nullable=False, index=True)
    workflow_stage_id = Column(GUID, ForeignKey("workflow_stages.id"), nullable=True)
    
    status = Column(String(20), default="pending", nullable=False, index=True)  # 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'
    priority = Column(String(20), default="medium", nullable=False)  # 'low', 'medium', 'high', 'urgent'
    
    assigned_to = Column(GUID, ForeignKey("users.id"), nullable=True, index=True)
    assigned_by = Column(GUID, ForeignKey("users.id"), nullable=True)
    
    target_date = Column(Date, nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    client = relationship("Client", back_populates="tasks")
    workspace = relationship("Workspace", back_populates="tasks")
    content_item = relationship("ContentItem", back_populates="tasks")
    task_type = relationship("TaskType", back_populates="tasks")
    workflow_stage = relationship("WorkflowStage", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    creator = relationship("User", foreign_keys=[assigned_by], back_populates="created_tasks")
    
    assignment_history = relationship("TaskAssignmentHistory", back_populates="task", cascade="all, delete-orphan", order_by="TaskAssignmentHistory.reassigned_at.desc()")
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan", order_by="TaskHistory.timestamp.desc()")


class TaskAssignmentHistory(Base):
    __tablename__ = "task_assignment_history"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    task_id = Column(GUID, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_assignee_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    new_assignee_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    changed_by_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)
    reassigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    task = relationship("Task", back_populates="assignment_history")
    previous_assignee = relationship("User", foreign_keys=[previous_assignee_id])
    new_assignee = relationship("User", foreign_keys=[new_assignee_id])
    changed_by = relationship("User", foreign_keys=[changed_by_id])


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    task_id = Column(GUID, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    previous_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=True)
    previous_assignee = Column(GUID, ForeignKey("users.id"), nullable=True)
    new_assignee = Column(GUID, ForeignKey("users.id"), nullable=True)
    changed_by = Column(GUID, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    task = relationship("Task", back_populates="history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
