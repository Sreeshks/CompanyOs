import uuid
from typing import Optional, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User
from app.models.role import Role, Permission, RolePermission

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise UnauthorizedException("Authentication token is required")
    
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired authentication token")
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Invalid token payload")
    
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Invalid user ID in token")
    
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise UnauthorizedException("User no longer exists")
    
    if user.status != "active":
        raise ForbiddenException("User account is inactive or suspended")
    
    return user


def require_permission(permission_code: str) -> Callable:
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # 1. Check if user's role has the specific permission or wildcard
        has_perm = db.query(RolePermission).join(Permission).filter(
            RolePermission.role_id == current_user.role_id,
            (Permission.code == permission_code) | (Permission.code == "*")
        ).first()

        if not has_perm:
            # Check if role has system admin flag
            role = db.query(Role).filter(Role.id == current_user.role_id).first()
            if role and role.is_system and role.code.upper() in ["SUPER_ADMIN", "ADMIN"]:
                return current_user
            
            raise ForbiddenException(f"Missing required permission: '{permission_code}'")
        
        return current_user
    
    return dependency
