import uuid
from typing import Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.services.audit_service import AuditService


class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str, ip_address: str = None) -> User:
        user = db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")
        
        if user.status != "active":
            raise UnauthorizedException("Account is inactive")
        
        AuditService.log(
            db=db,
            action="AUTH_LOGIN_SUCCESS",
            entity_type="user",
            entity_id=user.id,
            user_id=user.id,
            ip_address=ip_address
        )
        db.commit()
        return user

    @staticmethod
    def create_tokens_for_user(user: User) -> Dict[str, str]:
        claims = {
            "role_id": str(user.role_id),
            "email": user.email,
            "employee_code": user.employee_code
        }
        access_token = create_access_token(subject=str(user.id), claims=claims)
        refresh_token = create_refresh_token(subject=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def refresh(db: Session, refresh_token_str: str) -> Dict[str, str]:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")
        
        user_id = uuid.UUID(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user or user.status != "active":
            raise UnauthorizedException("User inactive or no longer exists")
        
        return AuthService.create_tokens_for_user(user)
