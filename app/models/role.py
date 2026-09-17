import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID
from app.models.base import TimestampMixin, utc_now


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(GUID, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(GUID, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(Base.metadata.tables.get("created_at", None) or TimestampMixin.created_at.type, default=utc_now)


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    module = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TimestampMixin.created_at.type, default=utc_now, nullable=False)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)

    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")
    users = relationship("User", back_populates="role")
