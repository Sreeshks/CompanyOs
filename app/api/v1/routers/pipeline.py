import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_permission
from app.models.client import ClientStatus, ClientStatusTransition
from app.models.user import User
from app.schemas.client import (
    ClientStatusOut, ClientStatusTransitionOut, ClientOut, PipelineTransitionRequest
)
from app.schemas.common import ApiResponse
from app.services.client_service import ClientService

router = APIRouter(prefix="/pipeline", tags=["Client Pipeline"])


@router.get("/statuses", response_model=ApiResponse[List[ClientStatusOut]], summary="List all pipeline statuses")
def list_pipeline_statuses(db: Session = Depends(get_db)):
    statuses = db.query(ClientStatus).order_by(ClientStatus.order_index.asc()).all()
    return ApiResponse(success=True, data=[ClientStatusOut.model_validate(s) for s in statuses])


@router.get("/transitions", response_model=ApiResponse[List[ClientStatusTransitionOut]], summary="List all pipeline status transitions")
def list_pipeline_transitions(db: Session = Depends(get_db)):
    transitions = db.query(ClientStatusTransition).all()
    results = []
    for t in transitions:
        item = ClientStatusTransitionOut.model_validate(t)
        item.from_status_name = t.from_status.name if t.from_status else None
        item.to_status_name = t.to_status.name if t.to_status else None
        results.append(item)
    return ApiResponse(success=True, data=results)


@router.post("/{client_id}/transition", response_model=ApiResponse[ClientOut], summary="Execute pipeline transition", dependencies=[Depends(require_permission("pipeline.manage"))])
def execute_pipeline_transition(
    client_id: uuid.UUID,
    req: PipelineTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client = ClientService.transition_pipeline(
        db=db,
        client_id=client_id,
        action=req.action,
        to_status_id=req.to_status_id,
        user_id=current_user.id,
        notes=req.notes
    )
    co = ClientOut.model_validate(client)
    co.status_name = client.status.name if client.status else None
    return ApiResponse(success=True, data=co, message="Client transitioned successfully")
