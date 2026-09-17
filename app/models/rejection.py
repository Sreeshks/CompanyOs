import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, utc_now


class Rejection(Base, TimestampMixin):
    __tablename__ = "rejections"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    client_id = Column(GUID, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    content_id = Column(GUID, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(100), nullable=True)
    reason = Column(Text, nullable=False)
    rejected_by = Column(String(150), nullable=True)
    rejected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_status = Column(String(20), default="open", nullable=False)  # 'open', 'in_review', 'resolved'
    notes = Column(Text, nullable=True)

    client = relationship("Client", back_populates="rejections")
    content_item = relationship("ContentItem", back_populates="rejections")
