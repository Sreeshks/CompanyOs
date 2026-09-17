import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import AppException, NotFoundException, InvalidWorkflowTransitionException
from app.models.content import ContentItem, ContentType
from app.models.workflow import Workflow, WorkflowStage, WorkflowTransition
from app.models.folder import Folder
from app.models.client import Client, ClientStaffAssignment
from app.models.workspace import Workspace
from app.models.rejection import Rejection
from app.models.approval import ClientApproval
from app.schemas.content import ContentItemCreate, ContentItemUpdate, ContentTransitionRequest
from app.services.audit_service import AuditService
from app.services.task_service import TaskService


class WorkflowService:
    @staticmethod
    def create_content_item(
        db: Session,
        data: ContentItemCreate,
        created_by_id: Optional[uuid.UUID] = None
    ) -> ContentItem:
        # Validate client
        client = db.query(Client).filter(Client.id == data.client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", data.client_id)

        workspace = None
        if data.workspace_id:
            workspace = db.query(Workspace).filter(Workspace.id == data.workspace_id, Workspace.deleted_at.is_(None)).first()
        if not workspace:
            workspace = db.query(Workspace).filter(Workspace.client_id == data.client_id, Workspace.deleted_at.is_(None)).first()
            if not workspace:
                workspace = Workspace(client_id=data.client_id, name=f"{client.business_name} Workspace", status="active", created_by=created_by_id)
                db.add(workspace)
                db.flush()

        folder = None
        if data.folder_id:
            folder = db.query(Folder).filter(Folder.id == data.folder_id, Folder.deleted_at.is_(None)).first()
        if not folder:
            folder = db.query(Folder).filter(Folder.workspace_id == workspace.id, Folder.deleted_at.is_(None)).first()
            if not folder:
                folder = Folder(workspace_id=workspace.id, name="Deliverables", folder_type="general", created_by=created_by_id)
                db.add(folder)
                db.flush()

        content_type = db.query(ContentType).filter(ContentType.id == data.content_type_id).first()
        if not content_type:
            raise NotFoundException("ContentType", data.content_type_id)

        # Determine stage: use folder's workflow_stage if folder provided, or supplied stage, or initial stage of first workflow
        stage_id = data.current_stage_id
        if folder and folder.workflow_stage_id:
            stage_id = folder.workflow_stage_id
        elif not stage_id:
            first_stage = db.query(WorkflowStage).order_by(WorkflowStage.order_index.asc()).first()
            if not first_stage:
                raise AppException("NO_WORKFLOW_STAGE", "No workflow stages configured.")
            stage_id = first_stage.id

        # If folder was not explicitly specified but stage is known, pick the folder matching this stage
        if not data.folder_id and stage_id:
            matching_folder = db.query(Folder).filter(
                Folder.workspace_id == workspace.id,
                Folder.workflow_stage_id == stage_id,
                Folder.deleted_at.is_(None)
            ).first()
            if matching_folder:
                folder = matching_folder

        content = ContentItem(
            client_id=data.client_id,
            workspace_id=workspace.id,
            folder_id=folder.id,
            content_type_id=data.content_type_id,
            file_name=data.file_name,
            display_name=data.display_name,
            sequence_number=data.sequence_number,
            target_month=data.target_month,
            current_stage_id=stage_id,
            assigned_user_id=data.assigned_user_id,
            storage_path=data.storage_path,
            mime_type=data.mime_type,
            file_size_bytes=data.file_size_bytes,
            thumbnail_url=data.thumbnail_url,
            image_url=data.image_url,
            item_metadata=data.item_metadata or {},
            created_by=created_by_id
        )
        db.add(content)
        db.flush()

        AuditService.log(
            db=db,
            action="CONTENT_CREATE",
            entity_type="content_item",
            entity_id=content.id,
            user_id=created_by_id,
            new_data={"file_name": content.file_name, "stage_id": str(content.current_stage_id)}
        )
        db.commit()
        db.refresh(content)
        return content

    @staticmethod
    def transition_content(
        db: Session,
        content_id: uuid.UUID,
        transition_req: ContentTransitionRequest,
        user_id: Optional[uuid.UUID] = None
    ) -> ContentItem:
        content = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.deleted_at.is_(None)).first()
        if not content:
            raise NotFoundException("ContentItem", content_id)

        current_stage = db.query(WorkflowStage).filter(WorkflowStage.id == content.current_stage_id).first()
        if not current_stage:
            raise AppException("CORRUPT_STAGE", "Content item stage record missing.")

        # Find matching transition from database
        action_clean = transition_req.action.strip()
        transition = db.query(WorkflowTransition).filter(
            WorkflowTransition.from_stage_id == content.current_stage_id,
            func.lower(WorkflowTransition.action) == action_clean.lower(),
            WorkflowTransition.active == True
        ).first()

        # If not matched by exact action name, support generic advance/next progression
        if not transition and action_clean.lower() in ["advance", "next", "move", "advance stage"]:
            candidates = db.query(WorkflowTransition).filter(
                WorkflowTransition.from_stage_id == content.current_stage_id,
                WorkflowTransition.active == True
            ).all()
            for cand in candidates:
                cand_to = db.query(WorkflowStage).filter(WorkflowStage.id == cand.to_stage_id).first()
                if (
                    cand_to
                    and cand_to.order_index > current_stage.order_index
                    and "reject" not in cand_to.name.lower()
                    and "discard" not in cand.action.lower()
                ):
                    transition = cand
                    break
            if not transition and candidates:
                transition = candidates[0]

        if not transition:
            raise InvalidWorkflowTransitionException(
                f"Action '{action_clean}' is not a valid transition from stage '{current_stage.name}'."
            )

        # Validate required fields
        if transition.required_fields:
            for req_field in transition.required_fields:
                if req_field == "rejection_reason":
                    if not transition_req.rejection_reason or not transition_req.rejection_reason.strip():
                        raise AppException("REJECTION_REASON_REQUIRED", "A rejection reason is mandatory for this transition.")

        target_stage = db.query(WorkflowStage).filter(WorkflowStage.id == transition.to_stage_id).first()
        old_stage_name = current_stage.name

        # If transitioning to a new stage, check if an appropriate folder exists in the workspace
        target_folder = db.query(Folder).filter(
            Folder.workspace_id == content.workspace_id,
            Folder.workflow_stage_id == target_stage.id,
            Folder.deleted_at.is_(None)
        ).first()

        if not target_folder and target_stage.default_folder_name:
            target_folder = db.query(Folder).filter(
                Folder.workspace_id == content.workspace_id,
                func.lower(Folder.name) == target_stage.default_folder_name.lower(),
                Folder.deleted_at.is_(None)
            ).first()

        if not target_folder:
            # Auto-create the stage folder in this workspace so deliverables always have their folder
            target_folder = Folder(
                workspace_id=content.workspace_id,
                name=target_stage.default_folder_name or target_stage.name,
                folder_type="workflow",
                workflow_stage_id=target_stage.id,
                status="active",
                created_by=user_id
            )
            db.add(target_folder)
            db.flush()

        content.folder_id = target_folder.id
        content.current_stage_id = target_stage.id

        # Record rejection if this was a reject action
        if transition_req.rejection_reason:
            rejection = Rejection(
                client_id=content.client_id,
                content_id=content.id,
                content_type=content.content_type.name if content.content_type else "Content",
                reason=transition_req.rejection_reason,
                rejected_by=str(user_id) if user_id else "User",
                resolution_status="open",
                notes=transition_req.notes
            )
            db.add(rejection)

        # Trigger automatic task creation if defined on the transition
        if transition.auto_create_task_type_id:
            assigned_staff_id = None
            if transition.assignment_mode == "automatic":
                # Look up client staff assignment for this task type
                staff_assign = db.query(ClientStaffAssignment).filter(
                    ClientStaffAssignment.client_id == content.client_id,
                    ClientStaffAssignment.task_type_id == transition.auto_create_task_type_id
                ).first()
                if staff_assign:
                    assigned_staff_id = staff_assign.user_id

            # Create the task inside the same transaction
            TaskService.create_task(
                db=db,
                client_id=content.client_id,
                workspace_id=content.workspace_id,
                content_item_id=content.id,
                task_type_id=transition.auto_create_task_type_id,
                workflow_stage_id=target_stage.id,
                assigned_to=assigned_staff_id,
                assigned_by=user_id,
                notes=f"Auto-generated on workflow transition: {action_clean}"
            )

        AuditService.log(
            db=db,
            action="CONTENT_TRANSITION",
            entity_type="content_item",
            entity_id=content.id,
            user_id=user_id,
            old_data={"stage": old_stage_name},
            new_data={
                "stage": target_stage.name,
                "action": action_clean,
                "rejection_reason": transition_req.rejection_reason
            }
        )
        db.commit()
        db.refresh(content)
        return content

    @staticmethod
    def batch_transition_content(
        db: Session,
        item_ids: List[uuid.UUID],
        action: str,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None
    ) -> List[ContentItem]:
        results = []
        req = ContentTransitionRequest(action=action, rejection_reason=rejection_reason, notes=notes)
        for item_id in item_ids:
            item = WorkflowService.transition_content(
                db=db,
                content_id=item_id,
                transition_req=req,
                user_id=user_id
            )
            results.append(item)
        return results

    @staticmethod
    def move_folder(
        db: Session,
        content_id: uuid.UUID,
        new_folder_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None
    ) -> ContentItem:
        content = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.deleted_at.is_(None)).first()
        if not content:
            raise NotFoundException("ContentItem", content_id)

        target_folder = db.query(Folder).filter(
            Folder.id == new_folder_id,
            Folder.workspace_id == content.workspace_id,
            Folder.deleted_at.is_(None)
        ).first()
        if not target_folder:
            raise NotFoundException("Target Folder in Workspace", new_folder_id)

        old_folder_id = str(content.folder_id)
        content.folder_id = new_folder_id

        AuditService.log(
            db=db,
            action="CONTENT_MOVE_FOLDER",
            entity_type="content_item",
            entity_id=content.id,
            user_id=user_id,
            old_data={"folder_id": old_folder_id},
            new_data={"folder_id": str(new_folder_id)}
        )
        db.commit()
        db.refresh(content)
        return content
