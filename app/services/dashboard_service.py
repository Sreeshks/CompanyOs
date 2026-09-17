import uuid
from datetime import date
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.client import Client
from app.models.task import Task
from app.models.content import ContentItem
from app.models.rejection import Rejection
from app.models.workflow import WorkflowStage
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryOut, WorkflowStatusItem, StaffWorkloadItem,
    ClientWorkloadItem, MonthlyWorkItem, RejectionOverviewOut
)


class DashboardService:
    @staticmethod
    def get_summary(db: Session) -> DashboardSummaryOut:
        # 1. Active clients
        active_clients = db.query(func.count(Client.id)).filter(Client.deleted_at.is_(None)).scalar() or 0

        # 2. Tasks metrics
        pending_tasks = db.query(func.count(Task.id)).filter(Task.status.in_(["pending", "in_progress"])).scalar() or 0
        completed_tasks = db.query(func.count(Task.id)).filter(Task.status == "completed").scalar() or 0
        
        today = date.today()
        overdue_tasks = db.query(func.count(Task.id)).filter(
            Task.target_date < today,
            Task.status != "completed"
        ).scalar() or 0

        total_tasks = pending_tasks + completed_tasks
        completion_pct = 0.0
        if total_tasks > 0:
            completion_pct = round((completed_tasks / total_tasks) * 100, 2)

        # 3. Rejections
        total_rejections = db.query(func.count(Rejection.id)).scalar() or 0
        open_rejections = db.query(func.count(Rejection.id)).filter(Rejection.resolution_status == "open").scalar() or 0

        # 4. Workflow stages count
        stage_counts = (
            db.query(WorkflowStage.id, WorkflowStage.name, func.count(ContentItem.id))
            .outerjoin(ContentItem, (ContentItem.current_stage_id == WorkflowStage.id) & (ContentItem.deleted_at.is_(None)))
            .group_by(WorkflowStage.id, WorkflowStage.name, WorkflowStage.order_index)
            .order_by(WorkflowStage.order_index.asc())
            .all()
        )
        stages = [
            WorkflowStatusItem(stage_id=s_id, stage_name=s_name, item_count=count)
            for s_id, s_name, count in stage_counts
        ]

        return DashboardSummaryOut(
            active_clients=active_clients,
            pending_tasks=pending_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            completion_percentage=completion_pct,
            total_rejections=total_rejections,
            open_rejections=open_rejections,
            workflow_stages=stages
        )

    @staticmethod
    def get_team_overview(db: Session) -> List[StaffWorkloadItem]:
        users = db.query(User).filter(User.deleted_at.is_(None), User.status == "active").all()
        today = date.today()

        workloads = []
        for u in users:
            pending = db.query(func.count(Task.id)).filter(
                Task.assigned_to == u.id,
                Task.status.in_(["pending", "in_progress"])
            ).scalar() or 0

            completed = db.query(func.count(Task.id)).filter(
                Task.assigned_to == u.id,
                Task.status == "completed"
            ).scalar() or 0

            overdue = db.query(func.count(Task.id)).filter(
                Task.assigned_to == u.id,
                Task.target_date < today,
                Task.status != "completed"
            ).scalar() or 0

            workloads.append(StaffWorkloadItem(
                user_id=u.id,
                user_name=u.full_name,
                pending_tasks=pending,
                completed_tasks=completed,
                overdue_tasks=overdue
            ))

        return workloads

    @staticmethod
    def get_monthly_work(db: Session) -> List[MonthlyWorkItem]:
        results = (
            db.query(
                ContentItem.target_month,
                func.count(ContentItem.id),
            )
            .filter(ContentItem.deleted_at.is_(None), ContentItem.target_month.isnot(None))
            .group_by(ContentItem.target_month)
            .order_by(ContentItem.target_month.desc())
            .all()
        )

        monthly_items = []
        for month, total in results:
            completed = (
                db.query(func.count(ContentItem.id))
                .join(WorkflowStage, ContentItem.current_stage_id == WorkflowStage.id)
                .filter(
                    ContentItem.target_month == month,
                    WorkflowStage.stage_type == "terminal",
                    ContentItem.deleted_at.is_(None)
                )
                .scalar() or 0
            )
            pending = total - completed
            monthly_items.append(MonthlyWorkItem(
                target_month=month,
                total_items=total,
                completed_items=completed,
                pending_items=pending
            ))

        return monthly_items

    @staticmethod
    def get_rejection_overview(db: Session) -> RejectionOverviewOut:
        total = db.query(func.count(Rejection.id)).scalar() or 0
        open_count = db.query(func.count(Rejection.id)).filter(Rejection.resolution_status == "open").scalar() or 0
        resolved = db.query(func.count(Rejection.id)).filter(Rejection.resolution_status == "resolved").scalar() or 0

        recent = (
            db.query(Rejection)
            .order_by(Rejection.rejected_at.desc())
            .limit(10)
            .all()
        )
        recent_data = [
            {
                "id": str(r.id),
                "client_id": str(r.client_id),
                "content_id": str(r.content_id),
                "reason": r.reason,
                "rejected_at": r.rejected_at.isoformat(),
                "status": r.resolution_status
            }
            for r in recent
        ]

        return RejectionOverviewOut(
            total_rejections=total,
            open_rejections=open_count,
            resolved_rejections=resolved,
            recent_rejections=recent_data
        )
