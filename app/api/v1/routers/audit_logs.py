import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogOut
from app.schemas.common import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=ApiResponse[PaginatedResponse[AuditLogOut]], summary="List system audit logs", dependencies=[Depends(require_permission("audit.view"))])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_type: Optional[str] = None,
    entity_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for item in items:
        out = AuditLogOut.model_validate(item)
        out.user_name = item.user.full_name if item.user else None
        results.append(out)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedResponse(items=results, total=total, page=page, page_size=page_size, total_pages=total_pages)
    )
