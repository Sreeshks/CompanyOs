import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission, get_current_user
from app.core.exceptions import NotFoundException
from app.models.rejection import Rejection
from app.models.user import User
from app.schemas.rejection import RejectionOut, RejectionResolveRequest
from app.schemas.common import ApiResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/rejections", tags=["Rejections"])


@router.get("", response_model=ApiResponse[List[RejectionOut]], summary="List all rejections", dependencies=[Depends(require_permission("approval.view"))])
def list_rejections(
    client_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Rejection)
    if client_id:
        query = query.filter(Rejection.client_id == client_id)
    if status:
        query = query.filter(Rejection.resolution_status == status)

    items = query.order_by(Rejection.rejected_at.desc()).all()
    results = []
    for r in items:
        ro = RejectionOut.model_validate(r)
        ro.client_name = r.client.business_name if r.client else None
        ro.content_name = r.content_item.display_name if r.content_item else None
        results.append(ro)
    return ApiResponse(success=True, data=results)


@router.post("/{rejection_id}/resolve", response_model=ApiResponse[RejectionOut], summary="Mark rejection as resolved", dependencies=[Depends(require_permission("approval.manage"))])
def resolve_rejection(
    rejection_id: uuid.UUID,
    req: RejectionResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rejection = db.query(Rejection).filter(Rejection.id == rejection_id).first()
    if not rejection:
        raise NotFoundException("Rejection", rejection_id)

    rejection.resolution_status = "resolved"
    rejection.resolved_at = datetime.now(timezone.utc)
    if req.resolution_notes:
        rejection.notes = (rejection.notes or "") + f"\n[Resolved] {req.resolution_notes}"

    AuditService.log(
        db=db,
        action="REJECTION_RESOLVE",
        entity_type="rejection",
        entity_id=rejection.id,
        user_id=current_user.id,
        new_data={"status": "resolved", "notes": req.resolution_notes}
    )
    db.commit()
    db.refresh(rejection)
    ro = RejectionOut.model_validate(rejection)
    return ApiResponse(success=True, data=ro, message="Rejection resolved successfully")
