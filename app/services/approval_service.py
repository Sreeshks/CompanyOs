import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import AppException, NotFoundException
from app.models.approval import ClientApproval
from app.models.content import ContentItem
from app.models.workflow import WorkflowTransition, WorkflowStage
from app.schemas.approval import ApprovalDecisionRequest, PublicContentReviewOut
from app.services.audit_service import AuditService
from app.services.workflow_service import WorkflowService
from app.schemas.content import ContentTransitionRequest


class ApprovalService:
    @staticmethod
    def generate_approval_link(
        db: Session,
        content_id: uuid.UUID,
        expires_days: int = 14,
        created_by_id: Optional[uuid.UUID] = None
    ) -> ClientApproval:
        content = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.deleted_at.is_(None)).first()
        if not content:
            raise NotFoundException("ContentItem", content_id)

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)

        approval = ClientApproval(
            content_id=content.id,
            client_id=content.client_id,
            approval_status="pending",
            access_token=token,
            token_expires_at=expires_at
        )
        db.add(approval)
        db.flush()

        AuditService.log(
            db=db,
            action="APPROVAL_LINK_GENERATE",
            entity_type="client_approval",
            entity_id=approval.id,
            user_id=created_by_id,
            new_data={"content_id": str(content.id), "token_expires_at": expires_at.isoformat()}
        )
        db.commit()
        db.refresh(approval)
        return approval

    @staticmethod
    def get_review(db: Session, token: str) -> PublicContentReviewOut:
        approval = db.query(ClientApproval).filter(ClientApproval.access_token == token).first()
        if not approval:
            raise NotFoundException("Approval Token", token)

        now = datetime.now(timezone.utc)
        token_expires = approval.token_expires_at
        if token_expires.tzinfo is None:
            token_expires = token_expires.replace(tzinfo=timezone.utc)

        if token_expires < now:
            raise AppException("TOKEN_EXPIRED", "This review link has expired.")

        content = db.query(ContentItem).filter(ContentItem.id == approval.content_id).first()
        if not content:
            raise NotFoundException("ContentItem", approval.content_id)

        return PublicContentReviewOut(
            content_id=content.id,
            file_name=content.file_name,
            display_name=content.display_name,
            client_name=content.workspace.client.business_name if content.workspace and content.workspace.client else "Client",
            target_month=content.target_month,
            approval_status=approval.approval_status,
            rejection_reason=approval.rejection_reason,
            preview_url=content.storage_path or f"/preview/{content.file_name}",
            token_valid=True
        )

    @staticmethod
    def process_decision(
        db: Session,
        token: str,
        data: ApprovalDecisionRequest
    ) -> ClientApproval:
        approval = db.query(ClientApproval).filter(ClientApproval.access_token == token).first()
        if not approval:
            raise NotFoundException("Approval Token", token)

        now = datetime.now(timezone.utc)
        token_expires = approval.token_expires_at
        if token_expires.tzinfo is None:
            token_expires = token_expires.replace(tzinfo=timezone.utc)

        if token_expires < now:
            raise AppException("TOKEN_EXPIRED", "This review link has expired.")

        decision = data.decision.lower().strip()
        if decision not in ["approved", "rejected"]:
            raise AppException("INVALID_DECISION", "Decision must be 'approved' or 'rejected'.")

        approval.approval_status = decision
        approval.approved_at = now
        approval.approved_by = data.approved_by_name

        if decision == "rejected":
            approval.rejection_reason = data.rejection_reason
            # Trigger transition action "Reject"
            WorkflowService.transition_content(
                db=db,
                content_id=approval.content_id,
                transition_req=ContentTransitionRequest(
                    action="Reject",
                    rejection_reason=data.rejection_reason,
                    notes=f"Rejected by client portal: {data.approved_by_name}"
                )
            )
        else:
            # Trigger transition action "Approve"
            WorkflowService.transition_content(
                db=db,
                content_id=approval.content_id,
                transition_req=ContentTransitionRequest(
                    action="Approve",
                    notes=f"Approved by client portal: {data.approved_by_name}"
                )
            )

        AuditService.log(
            db=db,
            action=f"CLIENT_{decision.upper()}",
            entity_type="client_approval",
            entity_id=approval.id,
            new_data={"decision": decision, "reason": data.rejection_reason, "by": data.approved_by_name}
        )
        db.commit()
        db.refresh(approval)
        return approval
