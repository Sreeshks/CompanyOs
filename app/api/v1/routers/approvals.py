import uuid
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.models.user import User
from app.schemas.approval import ClientApprovalOut, ApprovalDecisionRequest, PublicContentReviewOut
from app.schemas.common import ApiResponse
from app.services.approval_service import ApprovalService

router = APIRouter(prefix="/approvals", tags=["Client Approvals"])


class GenerateLinkRequest(BaseModel):
    content_id: Optional[uuid.UUID] = None
    client_id: Optional[uuid.UUID] = None
    expires_days: int = 14


@router.post("/generate-link", response_model=ApiResponse[ClientApprovalOut], summary="Generate external review link for client", dependencies=[Depends(require_permission("approval.manage"))])
def generate_approval_link(
    req: GenerateLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = ApprovalService.generate_approval_link(
        db=db,
        content_id=req.content_id,
        client_id=req.client_id,
        expires_days=req.expires_days,
        created_by_id=current_user.id
    )
    return ApiResponse(success=True, data=ClientApprovalOut.model_validate(approval), message="Approval token generated")


@router.get("/review/{token}", response_model=ApiResponse[PublicContentReviewOut], summary="Public client portal review endpoint")
def get_public_review(token: str, db: Session = Depends(get_db)):
    review_data = ApprovalService.get_review(db=db, token=token)
    return ApiResponse(success=True, data=review_data)


@router.post("/review/{token}/decision", response_model=ApiResponse[ClientApprovalOut], summary="Submit client approval/rejection decision")
def submit_decision(token: str, req: ApprovalDecisionRequest, db: Session = Depends(get_db)):
    approval = ApprovalService.process_decision(db=db, token=token, data=req)
    return ApiResponse(
        success=True,
        data=ClientApprovalOut.model_validate(approval),
        message=f"Review decision '{req.decision}' recorded successfully"
    )
