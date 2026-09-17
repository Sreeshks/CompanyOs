import uuid
from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID, get_json_type
from app.models.base import TimestampMixin, SoftDeleteMixin


class ContentType(Base, TimestampMixin):
    __tablename__ = "content_types"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    content_items = relationship("ContentItem", back_populates="content_type")


class ContentItem(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "content_items"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(GUID, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(GUID, ForeignKey("folders.id"), nullable=False, index=True)
    content_type_id = Column(GUID, ForeignKey("content_types.id"), nullable=False)
    
    file_name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    sequence_number = Column(Integer, default=1, nullable=False)
    target_month = Column(String(20), nullable=True)  # e.g., '2026-09'
    
    current_stage_id = Column(GUID, ForeignKey("workflow_stages.id"), nullable=False, index=True)
    assigned_user_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    
    storage_path = Column(Text, nullable=True)
    mime_type = Column(String(100), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    item_metadata = Column("metadata", get_json_type(), default=dict, nullable=True)
    
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="content_items")
    folder = relationship("Folder", back_populates="content_items")
    content_type = relationship("ContentType", back_populates="content_items")
    current_stage = relationship("WorkflowStage", back_populates="content_items")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    tasks = relationship("Task", back_populates="content_item", cascade="all, delete-orphan")
    approvals = relationship("ClientApproval", back_populates="content_item", cascade="all, delete-orphan")
    rejections = relationship("Rejection", back_populates="content_item", cascade="all, delete-orphan")
