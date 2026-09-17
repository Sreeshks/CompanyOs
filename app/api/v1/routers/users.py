import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResetPassword, UserOut
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=ApiResponse[PaginatedResponse[UserOut]], summary="List users", dependencies=[Depends(require_permission("users.view"))])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role_id: Optional[uuid.UUID] = None,
    department_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    users, total = UserService.list_users(
        db=db, page=page, page_size=page_size, search=search,
        role_id=role_id, department_id=department_id, status=status
    )
    user_outs = []
    for u in users:
        uo = UserOut.model_validate(u)
        uo.role_name = u.role.name if u.role else None
        uo.designation_name = u.designation.name if u.designation else None
        uo.department_name = u.department.name if u.department else None
        user_outs.append(uo)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedResponse(items=user_outs, total=total, page=page, page_size=page_size, total_pages=total_pages)
    )


@router.post("", response_model=ApiResponse[UserOut], summary="Create user", dependencies=[Depends(require_permission("users.create"))])
def create_user(
    data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = UserService.create_user(db=db, data=data, created_by_id=current_user.id)
    uo = UserOut.model_validate(user)
    uo.role_name = user.role.name if user.role else None
    uo.designation_name = user.designation.name if user.designation else None
    uo.department_name = user.department.name if user.department else None
    return ApiResponse(success=True, data=uo, message="User created successfully")


@router.get("/{user_id}", response_model=ApiResponse[UserOut], summary="Get user by ID", dependencies=[Depends(require_permission("users.view"))])
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise NotFoundException("User", user_id)
    uo = UserOut.model_validate(user)
    uo.role_name = user.role.name if user.role else None
    uo.designation_name = user.designation.name if user.designation else None
    uo.department_name = user.department.name if user.department else None
    return ApiResponse(success=True, data=uo)


@router.put("/{user_id}", response_model=ApiResponse[UserOut], summary="Update user", dependencies=[Depends(require_permission("users.edit"))])
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = UserService.update_user(db=db, user_id=user_id, data=data, updated_by_id=current_user.id)
    uo = UserOut.model_validate(user)
    uo.role_name = user.role.name if user.role else None
    uo.designation_name = user.designation.name if user.designation else None
    uo.department_name = user.department.name if user.department else None
    return ApiResponse(success=True, data=uo, message="User updated successfully")


@router.patch("/{user_id}/status", response_model=ApiResponse[UserOut], summary="Activate or deactivate user", dependencies=[Depends(require_permission("users.manage"))])
def update_user_status(
    user_id: uuid.UUID,
    data: UserStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = UserService.update_user(db=db, user_id=user_id, data=UserUpdate(status=data.status), updated_by_id=current_user.id)
    uo = UserOut.model_validate(user)
    uo.role_name = user.role.name if user.role else None
    return ApiResponse(success=True, data=uo, message=f"User status changed to {data.status}")


@router.post("/{user_id}/reset-password", response_model=ApiResponse[bool], summary="Reset user password", dependencies=[Depends(require_permission("users.manage"))])
def reset_password(
    user_id: uuid.UUID,
    data: UserResetPassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    UserService.reset_password(db=db, user_id=user_id, new_password=data.new_password, changed_by_id=current_user.id)
    return ApiResponse(success=True, data=True, message="Password reset successfully")
