import uuid
from typing import Optional, List, Tuple
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.exceptions import AppException, NotFoundException, ForbiddenException
from app.models.task import Task, TaskAssignmentHistory, TaskHistory
from app.models.task_type import TaskType
from app.models.client import Client
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService


class TaskService:
    @staticmethod
    def _generate_task_code(db: Session) -> str:
        tasks = db.query(Task.task_code).all()
        max_seq = 0
        for (code,) in tasks:
            if code and code.startswith("TSK-"):
                try:
                    num = int(code.split("-")[1])
                    if num > max_seq:
                        max_seq = num
                except (IndexError, ValueError):
                    continue
        return f"TSK-{(max_seq + 1):03d}"

    @staticmethod
    def create_task(
        db: Session,
        client_id: uuid.UUID,
        task_type_id: uuid.UUID,
        workspace_id: Optional[uuid.UUID] = None,
        content_item_id: Optional[uuid.UUID] = None,
        workflow_stage_id: Optional[uuid.UUID] = None,
        assigned_to: Optional[uuid.UUID] = None,
        assigned_by: Optional[uuid.UUID] = None,
        priority: str = "medium",
        target_date: Optional[date] = None,
        notes: Optional[str] = None
    ) -> Task:
        # Validate client and task type
        if not db.query(Client).filter(Client.id == client_id).first():
            raise NotFoundException("Client", client_id)
        task_type = db.query(TaskType).filter(TaskType.id == task_type_id).first()
        if not task_type:
            raise NotFoundException("TaskType", task_type_id)

        task_code = TaskService._generate_task_code(db)

        task = Task(
            task_code=task_code,
            client_id=client_id,
            workspace_id=workspace_id,
            content_item_id=content_item_id,
            task_type_id=task_type_id,
            workflow_stage_id=workflow_stage_id,
            status="pending",
            priority=priority,
            assigned_to=assigned_to,
            assigned_by=assigned_by,
            target_date=target_date,
            notes=notes
        )
        db.add(task)
        db.flush()

        # Log history
        db.add(TaskHistory(
            task_id=task.id,
            action="TASK_CREATED",
            new_status="pending",
            new_assignee=assigned_to,
            changed_by=assigned_by or assigned_to or task.client_id,  # fallback if system
            notes=f"Task {task_code} created for {task_type.name}"
        ))

        # If assigned, log assignment and send notification
        if assigned_to:
            db.add(TaskAssignmentHistory(
                task_id=task.id,
                new_assignee_id=assigned_to,
                changed_by_id=assigned_by or assigned_to,
                reason="Initial assignment on task creation"
            ))
            NotificationService.send(
                db=db,
                user_id=assigned_to,
                type_="task_assigned",
                title=f"New Task Assigned: {task.task_code}",
                message=f"You have been assigned to task {task.task_code} ({task_type.name}).",
                entity_type="task",
                entity_id=task.id
            )

        AuditService.log(
            db=db,
            action="TASK_CREATE",
            entity_type="task",
            entity_id=task.id,
            user_id=assigned_by,
            new_data={"task_code": task.task_code, "assigned_to": str(assigned_to) if assigned_to else None}
        )
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def complete_task(
        db: Session,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise NotFoundException("Task", task_id)

        if task.status == "completed":
            raise AppException("TASK_ALREADY_COMPLETED", f"Task {task.task_code} is already completed.")

        old_status = task.status
        now = datetime.now(timezone.utc)
        task.status = "completed"
        task.completed_at = now
        if notes:
            task.notes = (task.notes or "") + f"\n[Completed] {notes}"

        # History
        db.add(TaskHistory(
            task_id=task.id,
            action="TASK_COMPLETED",
            previous_status=old_status,
            new_status="completed",
            changed_by=user_id,
            notes=notes
        ))

        AuditService.log(
            db=db,
            action="TASK_COMPLETE",
            entity_type="task",
            entity_id=task.id,
            user_id=user_id,
            old_data={"status": old_status},
            new_data={"status": "completed", "completed_at": now.isoformat(), "notes": notes}
        )

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def reassign_task(
        db: Session,
        task_id: uuid.UUID,
        new_assignee_id: uuid.UUID,
        changed_by_id: uuid.UUID,
        reason: Optional[str] = None
    ) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise NotFoundException("Task", task_id)

        new_user = db.query(User).filter(User.id == new_assignee_id, User.deleted_at.is_(None)).first()
        if not new_user:
            raise NotFoundException("User (New Assignee)", new_assignee_id)

        prev_assignee_id = task.assigned_to
        task.assigned_to = new_assignee_id

        db.add(TaskAssignmentHistory(
            task_id=task.id,
            previous_assignee_id=prev_assignee_id,
            new_assignee_id=new_assignee_id,
            changed_by_id=changed_by_id,
            reason=reason
        ))

        db.add(TaskHistory(
            task_id=task.id,
            action="TASK_REASSIGNED",
            previous_assignee=prev_assignee_id,
            new_assignee=new_assignee_id,
            changed_by=changed_by_id,
            notes=f"Reassigned from {prev_assignee_id} to {new_assignee_id}. Reason: {reason}"
        ))

        NotificationService.send(
            db=db,
            user_id=new_assignee_id,
            type_="task_assigned",
            title=f"Task Reassigned to You: {task.task_code}",
            message=f"You have been assigned to task {task.task_code}. Reason: {reason or 'N/A'}",
            entity_type="task",
            entity_id=task.id
        )

        AuditService.log(
            db=db,
            action="TASK_REASSIGN",
            entity_type="task",
            entity_id=task.id,
            user_id=changed_by_id,
            old_data={"assigned_to": str(prev_assignee_id) if prev_assignee_id else None},
            new_data={"assigned_to": str(new_assignee_id), "reason": reason}
        )

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_my_work(
        db: Session,
        user_id: uuid.UUID,
        status_filter: Optional[str] = None,
        overdue_only: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Task], int]:
        query = db.query(Task).filter(Task.assigned_to == user_id)

        if status_filter:
            if status_filter == "pending":
                query = query.filter(Task.status.in_(["pending", "in_progress"]))
            elif status_filter == "completed":
                query = query.filter(Task.status == "completed")
            else:
                query = query.filter(Task.status == status_filter)

        if overdue_only:
            today = date.today()
            query = query.filter(
                Task.target_date < today,
                Task.status != "completed"
            )

        total = query.count()
        items = query.order_by(Task.target_date.asc().nulls_last(), Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
