import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission, get_current_user
from app.core.exceptions import AppException, NotFoundException
from app.models.role import Role, Permission, RolePermission
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate, RoleOut, PermissionOut, RolePermissionUpdate
from app.schemas.common import ApiResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Roles & Permissions"])


@router.get("/permissions", response_model=ApiResponse[List[PermissionOut]], summary="List all permissions", dependencies=[Depends(require_permission("settings.manage"))])
def list_permissions(db: Session = Depends(get_db)):
    perms = db.query(Permission).order_by(Permission.module.asc(), Permission.code.asc()).all()
    return ApiResponse(success=True, data=[PermissionOut.model_validate(p) for p in perms])


@router.get("/roles", response_model=ApiResponse[List[RoleOut]], summary="List all roles", dependencies=[Depends(require_permission("users.manage"))])
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).order_by(Role.name.asc()).all()
    return ApiResponse(success=True, data=[RoleOut.model_validate(r) for r in roles])


@router.post("/roles", response_model=ApiResponse[RoleOut], summary="Create role", dependencies=[Depends(require_permission("settings.manage"))])
def create_role(
    data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if db.query(Role).filter((Role.name == data.name) | (Role.code == data.code)).first():
        raise AppException("ROLE_EXISTS", f"Role with name '{data.name}' or code '{data.code}' already exists.")

    role = Role(name=data.name, code=data.code, description=data.description)
    db.add(role)
    db.flush()

    AuditService.log(
        db=db,
        action="ROLE_CREATE",
        entity_type="role",
        entity_id=role.id,
        user_id=current_user.id,
        new_data={"name": role.name, "code": role.code}
    )
    db.commit()
    db.refresh(role)
    return ApiResponse(success=True, data=RoleOut.model_validate(role), message="Role created")


@router.get("/roles/{role_id}", response_model=ApiResponse[RoleOut], summary="Get role by ID", dependencies=[Depends(require_permission("users.manage"))])
def get_role(role_id: uuid.UUID, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    return ApiResponse(success=True, data=RoleOut.model_validate(role))


@router.put("/roles/{role_id}", response_model=ApiResponse[RoleOut], summary="Update role", dependencies=[Depends(require_permission("settings.manage"))])
def update_role(
    role_id: uuid.UUID,
    data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    if role.is_system:
        raise AppException("SYSTEM_ROLE", "System roles cannot be modified.")

    if data.name:
        role.name = data.name
    if data.description is not None:
        role.description = data.description

    AuditService.log(
        db=db,
        action="ROLE_UPDATE",
        entity_type="role",
        entity_id=role.id,
        user_id=current_user.id,
        new_data=data.model_dump(exclude_unset=True)
    )
    db.commit()
    db.refresh(role)
    return ApiResponse(success=True, data=RoleOut.model_validate(role), message="Role updated")


@router.post("/roles/{role_id}/permissions", response_model=ApiResponse[RoleOut], summary="Assign permissions to role", dependencies=[Depends(require_permission("settings.manage"))])
def assign_role_permissions(
    role_id: uuid.UUID,
    data: RolePermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)

    # Delete existing and assign new
    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    for pid in data.permission_ids:
        db.add(RolePermission(role_id=role_id, permission_id=pid))

    AuditService.log(
        db=db,
        action="ROLE_PERMISSIONS_UPDATE",
        entity_type="role",
        entity_id=role.id,
        user_id=current_user.id,
        new_data={"permission_ids": [str(p) for p in data.permission_ids]}
    )
    db.commit()
    db.refresh(role)
    return ApiResponse(success=True, data=RoleOut.model_validate(role), message="Role permissions updated")
