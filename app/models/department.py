import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    active = Column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="department")
