import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceOut
from app.schemas.folder import FolderTreeOut
from app.schemas.common import ApiResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=ApiResponse[List[WorkspaceOut]], summary="List workspaces", dependencies=[Depends(require_permission("workspace.view"))])
def list_workspaces(client_id: Optional[uuid.UUID] = None, db: Session = Depends(get_db)):
    if client_id:
        # Ensure client workspace and folders are initialized
        WorkspaceService.ensure_client_workspace(db=db, client_id=client_id)
    query = db.query(Workspace).filter(Workspace.deleted_at.is_(None))
    if client_id:
        query = query.filter(Workspace.client_id == client_id)
    items = query.order_by(Workspace.created_at.desc()).all()
    return ApiResponse(success=True, data=[WorkspaceOut.model_validate(i) for i in items])


@router.get("/client/{client_id}/tree", response_model=ApiResponse[List[FolderTreeOut]], summary="Get folder tree for client workspace", dependencies=[Depends(require_permission("workspace.view"))])
def get_client_folder_tree(client_id: uuid.UUID, db: Session = Depends(get_db)):
    ws = WorkspaceService.ensure_client_workspace(db=db, client_id=client_id)
    tree = WorkspaceService.get_folder_tree(db=db, workspace_id=ws.id)
    return ApiResponse(success=True, data=tree)


@router.post("", response_model=ApiResponse[WorkspaceOut], summary="Create workspace", dependencies=[Depends(require_permission("workspace.create"))])
def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws = WorkspaceService.create_workspace(db=db, data=data, created_by_id=current_user.id)
    return ApiResponse(success=True, data=WorkspaceOut.model_validate(ws), message="Workspace created successfully")


@router.get("/{workspace_id}", response_model=ApiResponse[WorkspaceOut], summary="Get workspace details", dependencies=[Depends(require_permission("workspace.view"))])
def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.deleted_at.is_(None)).first()
    if not ws:
        raise NotFoundException("Workspace", workspace_id)
    return ApiResponse(success=True, data=WorkspaceOut.model_validate(ws))
