import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.core.exceptions import AppException, NotFoundException
from app.models.approval import ClientApproval
from app.models.content import ContentItem
from app.models.workflow import WorkflowTransition, WorkflowStage
from app.schemas.approval import ApprovalDecisionRequest, PublicContentReviewOut, PublicReviewDeliverable
from app.services.audit_service import AuditService
from app.services.workflow_service import WorkflowService
from app.schemas.content import ContentTransitionRequest


class ApprovalService:
    @staticmethod
    def generate_approval_link(
        db: Session,
        content_id: Optional[uuid.UUID] = None,
        client_id: Optional[uuid.UUID] = None,
        expires_days: int = 14,
        created_by_id: Optional[uuid.UUID] = None
    ) -> ClientApproval:
        now = datetime.now(timezone.utc)

        # Resolve target content item and client
        content = None
        if content_id:
            content = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.deleted_at.is_(None)).first()
            if not content:
                raise NotFoundException("ContentItem", content_id)
            client_id = content.client_id
        elif client_id:
            pending_stage = db.query(WorkflowStage).filter(WorkflowStage.code == "PENDING_APPROVAL").first()
            query = db.query(ContentItem).filter(ContentItem.client_id == client_id, ContentItem.deleted_at.is_(None))
            if pending_stage:
                content = query.filter(ContentItem.current_stage_id == pending_stage.id).first()
            if not content:
                content = query.first()

        if not content:
            raise AppException("CONTENT_REQUIRED", "No deliverable found for this client to generate an approval link.")

        # Check if an active unexpired pending token already exists for this client / content item
        existing = db.query(ClientApproval).filter(
            ClientApproval.client_id == client_id,
            ClientApproval.approval_status == "pending",
            ClientApproval.token_expires_at > now
        ).first()

        if existing:
            return existing

        token = secrets.token_urlsafe(32)
        expires_at = now + timedelta(days=expires_days)

        approval = ClientApproval(
            content_id=content.id,
            client_id=client_id,
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
            new_data={"content_id": str(content.id), "client_id": str(client_id), "token_expires_at": expires_at.isoformat()}
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

        # Client business name
        client_name = "Client"
        if content.workspace and content.workspace.client:
            client_name = content.workspace.client.business_name
        elif approval.client:
            client_name = approval.client.business_name

        # Query all deliverables currently awaiting approval for this client
        pending_stage = db.query(WorkflowStage).filter(WorkflowStage.code == "PENDING_APPROVAL").first()
        deliverables_list = []
        if pending_stage and approval.client_id:
            pending_items = db.query(ContentItem).filter(
                ContentItem.client_id == approval.client_id,
                ContentItem.current_stage_id == pending_stage.id,
                ContentItem.deleted_at.is_(None)
            ).order_by(ContentItem.sequence_number.asc(), ContentItem.created_at.desc()).all()

            for pi in pending_items:
                deliverables_list.append(PublicReviewDeliverable(
                    id=pi.id,
                    file_name=pi.file_name,
                    display_name=pi.display_name,
                    target_month=pi.target_month,
                    approval_status="pending",
                    preview_url=pi.image_url or pi.thumbnail_url or pi.storage_path or f"/preview/{pi.file_name}",
                    thumbnail_url=pi.thumbnail_url,
                    image_url=pi.image_url,
                    stage_name=pi.current_stage.name if pi.current_stage else "Pending Client Approval"
                ))

        if not deliverables_list:
            deliverables_list.append(PublicReviewDeliverable(
                id=content.id,
                file_name=content.file_name,
                display_name=content.display_name,
                target_month=content.target_month,
                approval_status=approval.approval_status,
                rejection_reason=approval.rejection_reason,
                preview_url=content.image_url or content.thumbnail_url or content.storage_path or f"/preview/{content.file_name}",
                thumbnail_url=content.thumbnail_url,
                image_url=content.image_url,
                stage_name=content.current_stage.name if content.current_stage else "Pending Client Approval"
            ))

        return PublicContentReviewOut(
            content_id=content.id,
            file_name=content.file_name,
            display_name=content.display_name,
            client_name=client_name,
            client_id=approval.client_id,
            target_month=content.target_month,
            approval_status=approval.approval_status,
            rejection_reason=approval.rejection_reason,
            preview_url=content.image_url or content.thumbnail_url or content.storage_path or f"/preview/{content.file_name}",
            token_valid=True,
            deliverables=deliverables_list
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

        target_content_id = data.content_id or approval.content_id

        approval.approval_status = decision
        approval.approved_at = now
        approval.approved_by = data.approved_by_name

        if decision == "rejected":
            approval.rejection_reason = data.rejection_reason
            # Trigger transition action "Reject" to send back to "Rejected - Needs Edit"
            WorkflowService.transition_content(
                db=db,
                content_id=target_content_id,
                transition_req=ContentTransitionRequest(
                    action="Reject",
                    rejection_reason=data.rejection_reason,
                    notes=f"Rejected by client portal: {data.approved_by_name}"
                )
            )
        else:
            # Trigger transition action "Approve" to advance to "Ready to Post"
            WorkflowService.transition_content(
                db=db,
                content_id=target_content_id,
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
            new_data={"decision": decision, "reason": data.rejection_reason, "by": data.approved_by_name, "content_id": str(target_content_id)}
        )
        db.commit()
        db.refresh(approval)
        return approval
