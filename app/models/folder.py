import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, SoftDeleteMixin


class Folder(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "folders"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    workspace_id = Column(GUID, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_folder_id = Column(GUID, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    folder_type = Column(String(50), default="custom", nullable=False)  # 'workflow', 'system', 'custom'
    workflow_stage_id = Column(GUID, ForeignKey("workflow_stages.id"), nullable=True)
    status = Column(String(20), default="active", nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    workspace = relationship("Workspace", back_populates="folders")
    parent = relationship("Folder", remote_side=[id], back_populates="subfolders")
    subfolders = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    workflow_stage = relationship("WorkflowStage", back_populates="folders")
    content_items = relationship("ContentItem", back_populates="folder")
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        UniqueConstraint("workspace_id", "parent_folder_id", "name", name="uq_folder_workspace_parent_name"),
    )
