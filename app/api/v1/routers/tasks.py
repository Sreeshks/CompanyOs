import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.task import Task, TaskHistory
from app.models.user import User
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskOut,
    TaskCompleteRequest, TaskReassignRequest, TaskHistoryOut
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=ApiResponse[PaginatedResponse[TaskOut]], summary="List tasks", dependencies=[Depends(require_permission("tasks.view"))])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client_id: Optional[uuid.UUID] = None,
    workspace_id: Optional[uuid.UUID] = None,
    assigned_to: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if client_id:
        query = query.filter(Task.client_id == client_id)
    if workspace_id:
        query = query.filter(Task.workspace_id == workspace_id)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    if status:
        query = query.filter(Task.status == status)

    total = query.count()
    items = query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for t in items:
        to = TaskOut.model_validate(t)
        to.client_name = t.client.business_name if t.client else None
        to.task_type_name = t.task_type.name if t.task_type else None
        to.workflow_stage_name = t.workflow_stage.name if t.workflow_stage else None
        to.content_item_name = t.content_item.display_name if t.content_item else None
        to.assigned_to_name = t.assignee.full_name if t.assignee else None
        to.assigned_by_name = t.creator.full_name if t.creator else None
        results.append(to)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedResponse(items=results, total=total, page=page, page_size=page_size, total_pages=total_pages)
    )


@router.post("", response_model=ApiResponse[TaskOut], summary="Create task", dependencies=[Depends(require_permission("tasks.create"))])
def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = TaskService.create_task(
        db=db,
        client_id=data.client_id,
        task_type_id=data.task_type_id,
        workspace_id=data.workspace_id,
        content_item_id=data.content_item_id,
        workflow_stage_id=data.workflow_stage_id,
        assigned_to=data.assigned_to,
        assigned_by=current_user.id,
        priority=data.priority,
        target_date=data.target_date,
        notes=data.notes
    )
    to = TaskOut.model_validate(task)
    to.client_name = task.client.business_name if task.client else None
    to.task_type_name = task.task_type.name if task.task_type else None
    to.assigned_to_name = task.assignee.full_name if task.assignee else None
    return ApiResponse(success=True, data=to, message="Task created successfully")


@router.get("/{task_id}", response_model=ApiResponse[TaskOut], summary="Get task details", dependencies=[Depends(require_permission("tasks.view"))])
def get_task(task_id: uuid.UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)
    to = TaskOut.model_validate(task)
    to.client_name = task.client.business_name if task.client else None
    to.task_type_name = task.task_type.name if task.task_type else None
    to.workflow_stage_name = task.workflow_stage.name if task.workflow_stage else None
    to.content_item_name = task.content_item.display_name if task.content_item else None
    to.assigned_to_name = task.assignee.full_name if task.assignee else None
    to.assigned_by_name = task.creator.full_name if task.creator else None
    return ApiResponse(success=True, data=to)


@router.post("/{task_id}/complete", response_model=ApiResponse[TaskOut], summary="Complete task")
def complete_task(
    task_id: uuid.UUID,
    req: TaskCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.role import RolePermission, Permission
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    # Allow completing if assigned to user OR has tasks.complete permission / super admin
    is_owner = (task.assigned_to == current_user.id)
    if not is_owner:
        has_perm = db.query(RolePermission).join(Permission).filter(
            RolePermission.role_id == current_user.role_id,
            (Permission.code == "tasks.complete") | (Permission.code == "*")
        ).first()
        if not has_perm and not (current_user.role and current_user.role.is_system):
            raise ForbiddenException("You are not assigned to this task and lack permission 'tasks.complete'.")

    task = TaskService.complete_task(db=db, task_id=task_id, user_id=current_user.id, notes=req.notes)
    to = TaskOut.model_validate(task)
    to.client_name = task.client.business_name if task.client else None
    to.task_type_name = task.task_type.name if task.task_type else None
    to.assigned_to_name = task.assignee.full_name if task.assignee else None
    return ApiResponse(success=True, data=to, message=f"Task {task.task_code} marked as completed")


@router.post("/{task_id}/reassign", response_model=ApiResponse[TaskOut], summary="Reassign task", dependencies=[Depends(require_permission("tasks.reassign"))])
def reassign_task(
    task_id: uuid.UUID,
    req: TaskReassignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = TaskService.reassign_task(
        db=db,
        task_id=task_id,
        new_assignee_id=req.new_assignee_id,
        changed_by_id=current_user.id,
        reason=req.reason
    )
    to = TaskOut.model_validate(task)
    to.assigned_to_name = task.assignee.full_name if task.assignee else None
    return ApiResponse(success=True, data=to, message=f"Task {task.task_code} reassigned")


@router.get("/{task_id}/history", response_model=ApiResponse[List[TaskHistoryOut]], summary="Get task history audit", dependencies=[Depends(require_permission("tasks.view"))])
def get_task_history(task_id: uuid.UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    histories = db.query(TaskHistory).filter(TaskHistory.task_id == task_id).order_by(TaskHistory.timestamp.desc()).all()
    results = []
    for h in histories:
        ho = TaskHistoryOut.model_validate(h)
        ho.changed_by_name = h.changed_by_user.full_name if h.changed_by_user else None
        results.append(ho)
    return ApiResponse(success=True, data=results)
