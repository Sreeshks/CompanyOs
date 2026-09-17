import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, SoftDeleteMixin


class Workspace(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "workspaces"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    status = Column(String(20), default="active", nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)

    client = relationship("Client", back_populates="workspaces")
    creator = relationship("User", foreign_keys=[created_by])
    folders = relationship("Folder", back_populates="workspace", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="workspace", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="workspace")
