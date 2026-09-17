import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin


class ClientApproval(Base, TimestampMixin):
    __tablename__ = "client_approvals"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    content_id = Column(GUID, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    approval_status = Column(String(20), default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    rejection_reason = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(150), nullable=True)
    access_token = Column(String(255), unique=True, nullable=False, index=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=False)

    content_item = relationship("ContentItem", back_populates="approvals")
    client = relationship("Client")
