import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID, get_json_type
from app.models.base import TimestampMixin


class Workflow(Base, TimestampMixin):
    __tablename__ = "workflows"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    stages = relationship("WorkflowStage", back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowStage.order_index")
    transitions = relationship("WorkflowTransition", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowStage(Base, TimestampMixin):
    __tablename__ = "workflow_stages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    workflow_id = Column(GUID, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    stage_type = Column(String(50), default="standard", nullable=False)  # 'initial', 'standard', 'approval', 'terminal'
    order_index = Column(Integer, default=0, nullable=False)
    default_folder_name = Column(String(150), nullable=True)

    workflow = relationship("Workflow", back_populates="stages")
    outgoing_transitions = relationship("WorkflowTransition", foreign_keys="WorkflowTransition.from_stage_id", back_populates="from_stage")
    incoming_transitions = relationship("WorkflowTransition", foreign_keys="WorkflowTransition.to_stage_id", back_populates="to_stage")
    folders = relationship("Folder", back_populates="workflow_stage")
    content_items = relationship("ContentItem", back_populates="current_stage")
    tasks = relationship("Task", back_populates="workflow_stage")

    __table_args__ = (
        UniqueConstraint("workflow_id", "code", name="uq_workflow_stage_code"),
    )


class WorkflowTransition(Base, TimestampMixin):
    __tablename__ = "workflow_transitions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    workflow_id = Column(GUID, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    from_stage_id = Column(GUID, ForeignKey("workflow_stages.id"), nullable=False)
    to_stage_id = Column(GUID, ForeignKey("workflow_stages.id"), nullable=False)
    action = Column(String(100), nullable=False)
    required_permission = Column(String(100), nullable=True)
    required_fields = Column(get_json_type(), default=list, nullable=True)  # e.g., ["rejection_reason"]
    auto_create_task_type_id = Column(GUID, ForeignKey("task_types.id"), nullable=True)
    assignment_mode = Column(String(20), default="automatic", nullable=False)  # 'automatic', 'manual', 'none'
    active = Column(Boolean, default=True, nullable=False)

    workflow = relationship("Workflow", back_populates="transitions")
    from_stage = relationship("WorkflowStage", foreign_keys=[from_stage_id], back_populates="outgoing_transitions")
    to_stage = relationship("WorkflowStage", foreign_keys=[to_stage_id], back_populates="incoming_transitions")
    auto_create_task_type = relationship("TaskType")

    __table_args__ = (
        UniqueConstraint("from_stage_id", "action", name="uq_workflow_transition_action"),
    )
