import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.exceptions import AppException, NotFoundException, InvalidWorkflowTransitionException
from app.models.client import Client, ClientStatus, ClientStatusTransition, ClientStaffAssignment
from app.models.user import User
from app.models.billing_company import BillingCompany
from app.models.service import Service
from app.models.package import Package
from app.models.task_type import TaskType
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.audit_service import AuditService
from app.services.workspace_service import WorkspaceService


class ClientService:
    @staticmethod
    def _generate_client_code(db: Session) -> str:
        """Atomically generate the next sequential client code, e.g., CLT-001, CLT-002."""
        # Query highest existing sequence
        clients = db.query(Client.client_code).all()
        max_seq = 0
        for (code,) in clients:
            if code and code.startswith("CLT-"):
                try:
                    num = int(code.split("-")[1])
                    if num > max_seq:
                        max_seq = num
                except (IndexError, ValueError):
                    continue
        return f"CLT-{(max_seq + 1):03d}"

    @staticmethod
    def create_client(db: Session, data: ClientCreate, created_by_id: Optional[uuid.UUID] = None) -> Client:
        # Determine initial status: use provided status_id or find first ordered status (e.g. Lead)
        if data.status_id:
            status = db.query(ClientStatus).filter(ClientStatus.id == data.status_id).first()
            if not status:
                raise NotFoundException("ClientStatus", data.status_id)
            status_id = data.status_id
        else:
            first_status = db.query(ClientStatus).order_by(ClientStatus.order_index.asc()).first()
            if not first_status:
                raise AppException("NO_CLIENT_STATUS", "No client status configured in database.")
            status_id = first_status.id

        # Validate foreign keys if provided
        if data.billing_company_id and not db.query(BillingCompany).filter(BillingCompany.id == data.billing_company_id).first():
            raise NotFoundException("BillingCompany", data.billing_company_id)
        if data.service_id and not db.query(Service).filter(Service.id == data.service_id).first():
            raise NotFoundException("Service", data.service_id)
        if data.package_id and not db.query(Package).filter(Package.id == data.package_id).first():
            raise NotFoundException("Package", data.package_id)
        if data.salesperson_id and not db.query(User).filter(User.id == data.salesperson_id).first():
            raise NotFoundException("User (Salesperson)", data.salesperson_id)

        client_code = ClientService._generate_client_code(db)

        client = Client(
            client_code=client_code,
            business_name=data.business_name,
            contact_person=data.contact_person,
            email=data.email,
            phone=data.phone,
            whatsapp=data.whatsapp,
            address=data.address,
            billing_company_id=data.billing_company_id,
            service_id=data.service_id,
            package_id=data.package_id,
            payment_terms=data.payment_terms,
            contract_start_date=data.contract_start_date,
            contract_end_date=data.contract_end_date,
            salesperson_id=data.salesperson_id,
            status_id=status_id,
            notes=data.notes,
            created_by=created_by_id
        )
        db.add(client)
        db.flush()

        AuditService.log(
            db=db,
            action="CLIENT_CREATE",
            entity_type="client",
            entity_id=client.id,
            user_id=created_by_id,
            new_data={"client_code": client.client_code, "business_name": client.business_name}
        )
        db.commit()
        db.refresh(client)

        # Auto-provision client workspace and workflow folders (Raw, Selected, Editing, etc.)
        try:
            WorkspaceService.ensure_client_workspace(db=db, client_id=client.id, created_by_id=created_by_id)
        except Exception:
            pass

        return client

    @staticmethod
    def update_client(db: Session, client_id: uuid.UUID, data: ClientUpdate, updated_by_id: Optional[uuid.UUID] = None) -> Client:
        client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", client_id)

        old_data = {"business_name": client.business_name, "email": client.email}
        update_dict = data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            setattr(client, field, value)

        AuditService.log(
            db=db,
            action="CLIENT_UPDATE",
            entity_type="client",
            entity_id=client.id,
            user_id=updated_by_id,
            old_data=old_data,
            new_data=update_dict
        )
        db.commit()
        db.refresh(client)
        return client

    @staticmethod
    def transition_pipeline(
        db: Session,
        client_id: uuid.UUID,
        action: Optional[str] = None,
        to_status_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None
    ) -> Client:
        from app.core.exceptions import InvalidWorkflowTransitionException
        client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
        if not client:
            raise NotFoundException("Client", client_id)

        current_status = db.query(ClientStatus).filter(ClientStatus.id == client.status_id).first()
        if not current_status:
            raise AppException("CORRUPT_STATE", "Client status record not found.")

        # 1. Match transition by action if provided
        transition = None
        if action:
            transition = db.query(ClientStatusTransition).filter(
                ClientStatusTransition.from_status_id == client.status_id,
                func.lower(ClientStatusTransition.action) == action.lower().strip()
            ).first()

        # 2. Match transition by destination status if provided
        if not transition and to_status_id:
            transition = db.query(ClientStatusTransition).filter(
                ClientStatusTransition.from_status_id == client.status_id,
                ClientStatusTransition.to_status_id == to_status_id
            ).first()

        # 3. If transition record found in DB
        if transition:
            old_status_name = current_status.name
            new_status = db.query(ClientStatus).filter(ClientStatus.id == transition.to_status_id).first()
            client.status_id = new_status.id
            action_label = action or transition.action
            if notes:
                client.notes = (client.notes or "") + f"\n[Status Transition] {action_label}: {notes}"

            AuditService.log(
                db=db,
                action="CLIENT_PIPELINE_TRANSITION",
                entity_type="client",
                entity_id=client.id,
                user_id=user_id,
                old_data={"status": old_status_name},
                new_data={"status": new_status.name, "action": action_label, "notes": notes}
            )
            db.commit()
            db.refresh(client)
            return client

        # 4. Direct status move fallback if to_status_id provided
        if to_status_id:
            new_status = db.query(ClientStatus).filter(ClientStatus.id == to_status_id).first()
            if new_status:
                old_status_name = current_status.name
                client.status_id = new_status.id
                action_label = action or f"Move to {new_status.name}"
                if notes:
                    client.notes = (client.notes or "") + f"\n[Status Transition] {action_label}: {notes}"

                AuditService.log(
                    db=db,
                    action="CLIENT_PIPELINE_TRANSITION",
                    entity_type="client",
                    entity_id=client.id,
                    user_id=user_id,
                    old_data={"status": old_status_name},
                    new_data={"status": new_status.name, "action": action_label, "notes": notes}
                )
                db.commit()
                db.refresh(client)
                return client

        raise InvalidWorkflowTransitionException(
            f"Action '{action or 'move'}' is not a valid transition from status '{current_status.name}'."
        )

    @staticmethod
    def assign_staff(
        db: Session,
        client_id: uuid.UUID,
        task_type_id: uuid.UUID,
        staff_user_id: uuid.UUID,
        assigned_by_id: Optional[uuid.UUID] = None
    ) -> ClientStaffAssignment:
        # Validate existence
        if not db.query(Client).filter(Client.id == client_id).first():
            raise NotFoundException("Client", client_id)
        if not db.query(TaskType).filter(TaskType.id == task_type_id).first():
            raise NotFoundException("TaskType", task_type_id)
        if not db.query(User).filter(User.id == staff_user_id).first():
            raise NotFoundException("User", staff_user_id)

        assignment = db.query(ClientStaffAssignment).filter(
            ClientStaffAssignment.client_id == client_id,
            ClientStaffAssignment.task_type_id == task_type_id
        ).first()

        if assignment:
            assignment.user_id = staff_user_id
            assignment.assigned_by = assigned_by_id
        else:
            assignment = ClientStaffAssignment(
                client_id=client_id,
                task_type_id=task_type_id,
                user_id=staff_user_id,
                assigned_by=assigned_by_id
            )
            db.add(assignment)

        AuditService.log(
            db=db,
            action="CLIENT_STAFF_ASSIGNMENT",
            entity_type="client",
            entity_id=client_id,
            user_id=assigned_by_id,
            new_data={"task_type_id": str(task_type_id), "staff_user_id": str(staff_user_id)}
        )
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def list_clients(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status_id: Optional[uuid.UUID] = None,
        billing_company_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[Client], int]:
        query = db.query(Client).filter(Client.deleted_at.is_(None))

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Client.business_name.ilike(search_pattern),
                    Client.client_code.ilike(search_pattern),
                    Client.email.ilike(search_pattern),
                    Client.contact_person.ilike(search_pattern)
                )
            )
        if status_id:
            query = query.filter(Client.status_id == status_id)
        if billing_company_id:
            query = query.filter(Client.billing_company_id == billing_company_id)

        total = query.count()
        items = query.order_by(Client.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
