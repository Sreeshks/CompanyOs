import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.folder import Folder
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderUpdate, FolderMoveRequest, FolderOut, FolderTreeOut
from app.schemas.common import ApiResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/folders", tags=["Folders"])


@router.get("/workspace/{workspace_id}", response_model=ApiResponse[List[FolderTreeOut]], summary="Get hierarchical folder tree for workspace", dependencies=[Depends(require_permission("workspace.view"))])
def get_workspace_folders(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    tree = WorkspaceService.get_folder_tree(db=db, workspace_id=workspace_id)
    return ApiResponse(success=True, data=tree)


@router.post("", response_model=ApiResponse[FolderOut], summary="Create folder", dependencies=[Depends(require_permission("workspace.create"))])
def create_folder(
    data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = WorkspaceService.create_folder(db=db, data=data, created_by_id=current_user.id)
    return ApiResponse(success=True, data=FolderOut.model_validate(folder), message="Folder created successfully")


@router.get("/{folder_id}", response_model=ApiResponse[FolderOut], summary="Get folder details", dependencies=[Depends(require_permission("workspace.view"))])
def get_folder(folder_id: uuid.UUID, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.deleted_at.is_(None)).first()
    if not folder:
        raise NotFoundException("Folder", folder_id)
    return ApiResponse(success=True, data=FolderOut.model_validate(folder))


@router.put("/{folder_id}", response_model=ApiResponse[FolderOut], summary="Update folder name or stage", dependencies=[Depends(require_permission("workspace.edit"))])
def update_folder(
    folder_id: uuid.UUID,
    data: FolderUpdate,
    db: Session = Depends(get_db)
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.deleted_at.is_(None)).first()
    if not folder:
        raise NotFoundException("Folder", folder_id)

    if data.name:
        folder.name = data.name
    if data.workflow_stage_id is not None:
        folder.workflow_stage_id = data.workflow_stage_id
    if data.status:
        folder.status = data.status

    db.commit()
    db.refresh(folder)
    return ApiResponse(success=True, data=FolderOut.model_validate(folder), message="Folder updated")


@router.post("/{folder_id}/move", response_model=ApiResponse[FolderOut], summary="Move folder with circular hierarchy check", dependencies=[Depends(require_permission("workspace.edit"))])
def move_folder(
    folder_id: uuid.UUID,
    req: FolderMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = WorkspaceService.move_folder(
        db=db,
        folder_id=folder_id,
        new_parent_folder_id=req.new_parent_folder_id,
        user_id=current_user.id
    )
    return ApiResponse(success=True, data=FolderOut.model_validate(folder), message="Folder moved successfully")
