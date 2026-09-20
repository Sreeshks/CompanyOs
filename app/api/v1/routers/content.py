import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.content import ContentItem
from app.models.user import User
from app.schemas.content import (
    ContentItemCreate,
    ContentItemOut,
    ContentTransitionRequest,
    ContentBatchTransitionRequest,
    ContentMoveFolderRequest
)
from app.schemas.common import ApiResponse
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/content", tags=["Content Deliverables"])


def _format_content_item(item: ContentItem) -> ContentItemOut:
    out = ContentItemOut.model_validate(item)
    out.stage_name = item.current_stage.name if item.current_stage else None
    out.stage_code = item.current_stage.code if item.current_stage else None
    out.content_type_name = item.content_type.name if item.content_type else None
    out.assigned_user_name = item.assigned_user.full_name if item.assigned_user else None
    if item.rejections:
        # Get latest rejection reason
        out.latest_rejection_reason = item.rejections[-1].reason
    return out


@router.get("", response_model=ApiResponse[List[ContentItemOut]], summary="List content items", dependencies=[Depends(require_permission("content.view"))])
def list_content(
    workspace_id: Optional[uuid.UUID] = None,
    folder_id: Optional[uuid.UUID] = None,
    current_stage_id: Optional[uuid.UUID] = None,
    client_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ContentItem).filter(ContentItem.deleted_at.is_(None))
    if workspace_id:
        query = query.filter(ContentItem.workspace_id == workspace_id)
    if folder_id:
        query = query.filter(ContentItem.folder_id == folder_id)
    if current_stage_id:
        query = query.filter(ContentItem.current_stage_id == current_stage_id)
    if client_id:
        query = query.filter(ContentItem.client_id == client_id)

    items = query.order_by(ContentItem.sequence_number.asc(), ContentItem.created_at.desc()).all()
    return ApiResponse(success=True, data=[_format_content_item(i) for i in items])


@router.post("", response_model=ApiResponse[ContentItemOut], summary="Register new content item", dependencies=[Depends(require_permission("content.create"))])
def create_content_item(
    data: ContentItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = WorkflowService.create_content_item(db=db, data=data, created_by_id=current_user.id)
    return ApiResponse(success=True, data=_format_content_item(item), message="Content item created successfully")


@router.post("/batch-transition", response_model=ApiResponse[List[ContentItemOut]], summary="Batch transition content items workflow stage", dependencies=[Depends(require_permission("content.move"))])
def batch_transition_content(
    req: ContentBatchTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = WorkflowService.batch_transition_content(
        db=db,
        item_ids=req.item_ids,
        action=req.action,
        rejection_reason=req.rejection_reason,
        notes=req.notes,
        assigned_user_id=req.assigned_user_id,
        target_date=req.target_date,
        days_allotted=req.days_allotted,
        priority=req.priority,
        user_id=current_user.id
    )
    return ApiResponse(success=True, data=[_format_content_item(i) for i in items], message=f"{len(items)} items transitioned via action '{req.action}'")


@router.get("/{content_id}", response_model=ApiResponse[ContentItemOut], summary="Get content item details", dependencies=[Depends(require_permission("content.view"))])
def get_content_item(content_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.deleted_at.is_(None)).first()
    if not item:
        raise NotFoundException("ContentItem", content_id)
    return ApiResponse(success=True, data=_format_content_item(item))


@router.post("/{content_id}/transition", response_model=ApiResponse[ContentItemOut], summary="Transition content item workflow stage", dependencies=[Depends(require_permission("content.move"))])
def transition_content(
    content_id: uuid.UUID,
    req: ContentTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = WorkflowService.transition_content(
        db=db,
        content_id=content_id,
        transition_req=req,
        user_id=current_user.id
    )
    return ApiResponse(success=True, data=_format_content_item(item), message=f"Content transitioned via action '{req.action}'")


@router.post("/{content_id}/move-folder", response_model=ApiResponse[ContentItemOut], summary="Move content item to folder", dependencies=[Depends(require_permission("content.move"))])
def move_content_folder(
    content_id: uuid.UUID,
    req: ContentMoveFolderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = WorkflowService.move_folder(
        db=db,
        content_id=content_id,
        new_folder_id=req.new_folder_id,
        user_id=current_user.id
    )
    return ApiResponse(success=True, data=_format_content_item(item), message="Content moved to folder")
