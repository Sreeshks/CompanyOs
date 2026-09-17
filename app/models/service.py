import uuid
from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    type = Column(String(50), nullable=False)  # e.g., 'retainer', 'one_time', 'custom'
    description = Column(Text, nullable=True)
    recurring = Column(Boolean, default=False, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    packages = relationship("Package", back_populates="service", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="service")
