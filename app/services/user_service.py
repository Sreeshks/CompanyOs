import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.security import get_password_hash
from app.core.exceptions import AppException, NotFoundException
from app.models.user import User, UserSkill
from app.models.role import Role
from app.models.department import Department
from app.models.designation import Designation
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import AuditService


class UserService:
    @staticmethod
    def create_user(db: Session, data: UserCreate, created_by_id: Optional[uuid.UUID] = None) -> User:
        # Check existing email
        if db.query(User).filter(User.email == data.email).first():
            raise AppException("EMAIL_EXISTS", f"User with email '{data.email}' already exists.")
        
        # Check existing employee_code
        if db.query(User).filter(User.employee_code == data.employee_code).first():
            raise AppException("EMPLOYEE_CODE_EXISTS", f"Employee code '{data.employee_code}' already exists.")
        
        # Validate role
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise NotFoundException("Role", data.role_id)
        
        # Validate designation & department if supplied
        if data.designation_id and not db.query(Designation).filter(Designation.id == data.designation_id).first():
            raise NotFoundException("Designation", data.designation_id)
        if data.department_id and not db.query(Department).filter(Department.id == data.department_id).first():
            raise NotFoundException("Department", data.department_id)

        user = User(
            employee_code=data.employee_code,
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            password_hash=get_password_hash(data.password),
            role_id=data.role_id,
            designation_id=data.designation_id,
            department_id=data.department_id,
            employment_type=data.employment_type,
            status=data.status,
            joining_date=data.joining_date
        )
        db.add(user)
        db.flush()

        if data.skills:
            for skill in data.skills:
                db.add(UserSkill(user_id=user.id, skill_name=skill))
            db.flush()

        AuditService.log(
            db=db,
            action="USER_CREATE",
            entity_type="user",
            entity_id=user.id,
            user_id=created_by_id,
            new_data={"email": user.email, "employee_code": user.employee_code, "role_id": str(user.role_id)}
        )
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_user(db: Session, user_id: uuid.UUID, data: UserUpdate, updated_by_id: Optional[uuid.UUID] = None) -> User:
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise NotFoundException("User", user_id)

        old_data = {
            "full_name": user.full_name,
            "status": user.status,
            "role_id": str(user.role_id)
        }

        update_dict = data.model_dump(exclude_unset=True)
        skills = update_dict.pop("skills", None)

        for field, value in update_dict.items():
            setattr(user, field, value)

        if skills is not None:
            db.query(UserSkill).filter(UserSkill.user_id == user.id).delete()
            for skill in skills:
                db.add(UserSkill(user_id=user.id, skill_name=skill))

        AuditService.log(
            db=db,
            action="USER_UPDATE",
            entity_type="user",
            entity_id=user.id,
            user_id=updated_by_id,
            old_data=old_data,
            new_data=update_dict
        )
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def reset_password(db: Session, user_id: uuid.UUID, new_password: str, changed_by_id: Optional[uuid.UUID] = None) -> User:
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise NotFoundException("User", user_id)

        user.password_hash = get_password_hash(new_password)
        AuditService.log(
            db=db,
            action="USER_PASSWORD_RESET",
            entity_type="user",
            entity_id=user.id,
            user_id=changed_by_id
        )
        db.commit()
        return user

    @staticmethod
    def list_users(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role_id: Optional[uuid.UUID] = None,
        department_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None
    ) -> Tuple[List[User], int]:
        query = db.query(User).filter(User.deleted_at.is_(None))
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.employee_code.ilike(search_pattern)
                )
            )
        if role_id:
            query = query.filter(User.role_id == role_id)
        if department_id:
            query = query.filter(User.department_id == department_id)
        if status:
            query = query.filter(User.status == status)

        total = query.count()
        items = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
