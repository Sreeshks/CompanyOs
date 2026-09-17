import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.core.exceptions import NotFoundException
from app.models.client import Client, ClientStaffAssignment
from app.models.user import User
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientOut,
    ClientStaffAssignmentCreate, ClientStaffAssignmentOut
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.client_service import ClientService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=ApiResponse[PaginatedResponse[ClientOut]], summary="List clients", dependencies=[Depends(require_permission("clients.view"))])
def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_id: Optional[uuid.UUID] = None,
    billing_company_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    clients, total = ClientService.list_clients(
        db=db, page=page, page_size=page_size, search=search,
        status_id=status_id, billing_company_id=billing_company_id
    )
    client_outs = []
    for c in clients:
        co = ClientOut.model_validate(c)
        co.status_name = c.status.name if c.status else None
        co.billing_company_name = c.billing_company.name if c.billing_company else None
        co.service_name = c.service.name if c.service else None
        co.package_name = c.package.name if c.package else None
        co.salesperson_name = c.salesperson.full_name if c.salesperson else None
        client_outs.append(co)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedResponse(items=client_outs, total=total, page=page, page_size=page_size, total_pages=total_pages)
    )


@router.post("", response_model=ApiResponse[ClientOut], summary="Create client", dependencies=[Depends(require_permission("clients.create"))])
def create_client(
    data: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client = ClientService.create_client(db=db, data=data, created_by_id=current_user.id)
    co = ClientOut.model_validate(client)
    co.status_name = client.status.name if client.status else None
    co.billing_company_name = client.billing_company.name if client.billing_company else None
    co.service_name = client.service.name if client.service else None
    co.package_name = client.package.name if client.package else None
    co.salesperson_name = client.salesperson.full_name if client.salesperson else None
    return ApiResponse(success=True, data=co, message="Client created successfully")


@router.get("/{client_id}", response_model=ApiResponse[ClientOut], summary="Get client details", dependencies=[Depends(require_permission("clients.view"))])
def get_client(client_id: uuid.UUID, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
    if not client:
        raise NotFoundException("Client", client_id)
    co = ClientOut.model_validate(client)
    co.status_name = client.status.name if client.status else None
    co.billing_company_name = client.billing_company.name if client.billing_company else None
    co.service_name = client.service.name if client.service else None
    co.package_name = client.package.name if client.package else None
    co.salesperson_name = client.salesperson.full_name if client.salesperson else None
    return ApiResponse(success=True, data=co)


@router.put("/{client_id}", response_model=ApiResponse[ClientOut], summary="Update client", dependencies=[Depends(require_permission("clients.edit"))])
def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client = ClientService.update_client(db=db, client_id=client_id, data=data, updated_by_id=current_user.id)
    co = ClientOut.model_validate(client)
    co.status_name = client.status.name if client.status else None
    return ApiResponse(success=True, data=co, message="Client updated")


@router.delete("/{client_id}", response_model=ApiResponse[bool], summary="Soft-delete / Archive client", dependencies=[Depends(require_permission("clients.archive"))])
def delete_client(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timezone
    client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
    if not client:
        raise NotFoundException("Client", client_id)

    client.deleted_at = datetime.now(timezone.utc)
    AuditService.log(
        db=db,
        action="CLIENT_ARCHIVE",
        entity_type="client",
        entity_id=client.id,
        user_id=current_user.id
    )
    db.commit()
    return ApiResponse(success=True, data=True, message="Client archived successfully")


@router.get("/{client_id}/staff-assignments", response_model=ApiResponse[List[ClientStaffAssignmentOut]], summary="Get staff roster for client", dependencies=[Depends(require_permission("clients.view"))])
def get_staff_assignments(client_id: uuid.UUID, db: Session = Depends(get_db)):
    assignments = db.query(ClientStaffAssignment).filter(ClientStaffAssignment.client_id == client_id).all()
    results = []
    for a in assignments:
        item = ClientStaffAssignmentOut.model_validate(a)
        item.task_type_name = a.task_type.name if a.task_type else None
        item.user_name = a.user.full_name if a.user else None
        results.append(item)
    return ApiResponse(success=True, data=results)


@router.post("/{client_id}/staff-assignments", response_model=ApiResponse[ClientStaffAssignmentOut], summary="Assign staff to client task type", dependencies=[Depends(require_permission("tasks.assign"))])
def assign_staff(
    client_id: uuid.UUID,
    data: ClientStaffAssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = ClientService.assign_staff(
        db=db,
        client_id=client_id,
        task_type_id=data.task_type_id,
        staff_user_id=data.user_id,
        assigned_by_id=current_user.id
    )
    item = ClientStaffAssignmentOut.model_validate(assignment)
    item.task_type_name = assignment.task_type.name if assignment.task_type else None
    item.user_name = assignment.user.full_name if assignment.user else None
    return ApiResponse(success=True, data=item, message="Staff assigned to client task type")


@router.delete("/{client_id}/staff-assignments/{assignment_id}", response_model=ApiResponse[bool], summary="Remove staff assignment from client", dependencies=[Depends(require_permission("tasks.assign"))])
def remove_staff_assignment(client_id: uuid.UUID, assignment_id: uuid.UUID, db: Session = Depends(get_db)):
    assignment = db.query(ClientStaffAssignment).filter(ClientStaffAssignment.id == assignment_id, ClientStaffAssignment.client_id == client_id).first()
    if not assignment:
        raise NotFoundException("ClientStaffAssignment", assignment_id)
    db.delete(assignment)
    db.commit()
    return ApiResponse(success=True, data=True, message="Staff assignment removed")

