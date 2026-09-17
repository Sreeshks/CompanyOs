from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.task import TaskOut
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/my-work", tags=["My Work"])


def _format_tasks(tasks, total, page, page_size):
    results = []
    for t in tasks:
        to = TaskOut.model_validate(t)
        to.client_name = t.client.business_name if t.client else None
        to.task_type_name = t.task_type.name if t.task_type else None
        to.workflow_stage_name = t.workflow_stage.name if t.workflow_stage else None
        to.content_item_name = t.content_item.display_name if t.content_item else None
        to.assigned_to_name = t.assignee.full_name if t.assignee else None
        to.assigned_by_name = t.creator.full_name if t.creator else None
        results.append(to)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(items=results, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("", response_model=ApiResponse[PaginatedResponse[TaskOut]], summary="Get all assigned work")
def get_all_my_work(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks, total = TaskService.get_my_work(db=db, user_id=current_user.id, page=page, page_size=page_size)
    return ApiResponse(success=True, data=_format_tasks(tasks, total, page, page_size))


@router.get("/pending", response_model=ApiResponse[PaginatedResponse[TaskOut]], summary="Get pending assigned work")
def get_pending_my_work(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks, total = TaskService.get_my_work(db=db, user_id=current_user.id, status_filter="pending", page=page, page_size=page_size)
    return ApiResponse(success=True, data=_format_tasks(tasks, total, page, page_size))


@router.get("/completed", response_model=ApiResponse[PaginatedResponse[TaskOut]], summary="Get completed work history")
def get_completed_my_work(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks, total = TaskService.get_my_work(db=db, user_id=current_user.id, status_filter="completed", page=page, page_size=page_size)
    return ApiResponse(success=True, data=_format_tasks(tasks, total, page, page_size))


@router.get("/overdue", response_model=ApiResponse[PaginatedResponse[TaskOut]], summary="Get overdue assigned work")
def get_overdue_my_work(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks, total = TaskService.get_my_work(db=db, user_id=current_user.id, overdue_only=True, page=page, page_size=page_size)
    return ApiResponse(success=True, data=_format_tasks(tasks, total, page, page_size))
