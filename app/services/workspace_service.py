import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import AppException, NotFoundException
from app.models.workspace import Workspace
from app.models.folder import Folder
from app.models.client import Client
from app.models.workflow import Workflow, WorkflowStage
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.schemas.folder import FolderCreate, FolderUpdate
from app.services.audit_service import AuditService


class WorkspaceService:
    @staticmethod
    def ensure_client_workspace(db: Session, client_id: uuid.UUID, created_by_id: Optional[uuid.UUID] = None) -> Workspace:
        client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", client_id)

        workspace = db.query(Workspace).filter(Workspace.client_id == client_id, Workspace.deleted_at.is_(None)).first()
        if not workspace:
            workspace = Workspace(
                client_id=client_id,
                name=f"{client.business_name} Workspace",
                status="active",
                created_by=created_by_id
            )
            db.add(workspace)
            db.flush()

        # Find workflow stages in order
        stages = db.query(WorkflowStage).join(Workflow).filter(
            Workflow.active == True
        ).order_by(WorkflowStage.order_index.asc()).all()

        if not stages:
            stages = db.query(WorkflowStage).order_by(WorkflowStage.order_index.asc()).all()

        for stage in stages:
            existing_folder = db.query(Folder).filter(
                Folder.workspace_id == workspace.id,
                Folder.workflow_stage_id == stage.id,
                Folder.deleted_at.is_(None)
            ).first()

            folder_name = stage.default_folder_name or stage.name
            if not existing_folder:
                existing_folder = db.query(Folder).filter(
                    Folder.workspace_id == workspace.id,
                    Folder.name == folder_name,
                    Folder.deleted_at.is_(None)
                ).first()

                if existing_folder:
                    existing_folder.workflow_stage_id = stage.id
                    existing_folder.folder_type = "workflow"
                else:
                    new_folder = Folder(
                        workspace_id=workspace.id,
                        name=folder_name,
                        folder_type="workflow",
                        workflow_stage_id=stage.id,
                        status="active",
                        created_by=created_by_id
                    )
                    db.add(new_folder)

        db.commit()
        db.refresh(workspace)
        return workspace

    @staticmethod
    def create_workspace(db: Session, data: WorkspaceCreate, created_by_id: Optional[uuid.UUID] = None) -> Workspace:
        client = db.query(Client).filter(Client.id == data.client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", data.client_id)

        workspace = Workspace(
            client_id=data.client_id,
            name=data.name,
            status=data.status,
            created_by=created_by_id
        )
        db.add(workspace)
        db.flush()

        AuditService.log(
            db=db,
            action="WORKSPACE_CREATE",
            entity_type="workspace",
            entity_id=workspace.id,
            user_id=created_by_id,
            new_data={"name": workspace.name, "client_id": str(workspace.client_id)}
        )
        db.commit()
        db.refresh(workspace)
        return workspace

    @staticmethod
    def create_folder(db: Session, data: FolderCreate, created_by_id: Optional[uuid.UUID] = None) -> Folder:
        workspace = db.query(Workspace).filter(Workspace.id == data.workspace_id, Workspace.deleted_at.is_(None)).first()
        if not workspace:
            raise NotFoundException("Workspace", data.workspace_id)

        if data.parent_folder_id:
            parent = db.query(Folder).filter(
                Folder.id == data.parent_folder_id,
                Folder.workspace_id == data.workspace_id,
                Folder.deleted_at.is_(None)
            ).first()
            if not parent:
                raise NotFoundException("Parent Folder", data.parent_folder_id)

        # Check duplicate folder name in same parent
        existing = db.query(Folder).filter(
            Folder.workspace_id == data.workspace_id,
            Folder.parent_folder_id == data.parent_folder_id,
            Folder.name == data.name,
            Folder.deleted_at.is_(None)
        ).first()
        if existing:
            raise AppException("DUPLICATE_FOLDER_NAME", f"Folder '{data.name}' already exists in this directory.")

        folder = Folder(
            workspace_id=data.workspace_id,
            parent_folder_id=data.parent_folder_id,
            name=data.name,
            folder_type=data.folder_type,
            workflow_stage_id=data.workflow_stage_id,
            status=data.status,
            created_by=created_by_id
        )
        db.add(folder)
        db.flush()

        AuditService.log(
            db=db,
            action="FOLDER_CREATE",
            entity_type="folder",
            entity_id=folder.id,
            user_id=created_by_id,
            new_data={"name": folder.name, "workspace_id": str(folder.workspace_id)}
        )
        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def move_folder(
        db: Session,
        folder_id: uuid.UUID,
        new_parent_folder_id: Optional[uuid.UUID],
        user_id: Optional[uuid.UUID] = None
    ) -> Folder:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.deleted_at.is_(None)).first()
        if not folder:
            raise NotFoundException("Folder", folder_id)

        if new_parent_folder_id:
            if new_parent_folder_id == folder_id:
                raise AppException("CIRCULAR_DEPENDENCY", "A folder cannot be its own parent.")
            
            # Check target parent exists in same workspace
            target_parent = db.query(Folder).filter(
                Folder.id == new_parent_folder_id,
                Folder.workspace_id == folder.workspace_id,
                Folder.deleted_at.is_(None)
            ).first()
            if not target_parent:
                raise NotFoundException("Target Parent Folder", new_parent_folder_id)

            # Prevent moving folder into its own descendants
            curr = target_parent
            while curr.parent_folder_id is not None:
                if curr.parent_folder_id == folder.id:
                    raise AppException("CIRCULAR_DEPENDENCY", "Cannot move a folder into one of its subfolders.")
                curr = db.query(Folder).filter(Folder.id == curr.parent_folder_id).first()
                if not curr:
                    break

        old_parent = str(folder.parent_folder_id) if folder.parent_folder_id else None
        folder.parent_folder_id = new_parent_folder_id

        AuditService.log(
            db=db,
            action="FOLDER_MOVE",
            entity_type="folder",
            entity_id=folder.id,
            user_id=user_id,
            old_data={"parent_folder_id": old_parent},
            new_data={"parent_folder_id": str(new_parent_folder_id) if new_parent_folder_id else None}
        )
        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def get_folder_tree(db: Session, workspace_id: uuid.UUID) -> List[Dict[str, Any]]:
        folders = db.query(Folder).filter(
            Folder.workspace_id == workspace_id,
            Folder.deleted_at.is_(None)
        ).all()

        folder_map: Dict[uuid.UUID, Dict[str, Any]] = {}
        for f in folders:
            folder_map[f.id] = {
                "id": f.id,
                "workspace_id": f.workspace_id,
                "parent_folder_id": f.parent_folder_id,
                "name": f.name,
                "folder_type": f.folder_type,
                "workflow_stage_id": f.workflow_stage_id,
                "stage_name": f.workflow_stage.name if f.workflow_stage else None,
                "stage_code": f.workflow_stage.code if f.workflow_stage else None,
                "status": f.status,
                "created_by": f.created_by,
                "created_at": f.created_at,
                "updated_at": f.updated_at,
                "subfolders": []
            }

        tree: List[Dict[str, Any]] = []
        for f in folders:
            node = folder_map[f.id]
            if f.parent_folder_id and f.parent_folder_id in folder_map:
                folder_map[f.parent_folder_id]["subfolders"].append(node)
            else:
                tree.append(node)

        return tree
