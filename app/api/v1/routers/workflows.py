import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.core.exceptions import AppException, NotFoundException
from app.models.workflow import Workflow, WorkflowStage, WorkflowTransition
from app.schemas.workflow import (
    WorkflowCreate, WorkflowOut, WorkflowStageCreate, WorkflowStageOut,
    WorkflowTransitionCreate, WorkflowTransitionOut
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.get("", response_model=ApiResponse[List[WorkflowOut]], summary="List all workflows")
def list_workflows(db: Session = Depends(get_db)):
    workflows = db.query(Workflow).filter(Workflow.active == True).all()
    results = []
    for w in workflows:
        wo = WorkflowOut.model_validate(w)
        results.append(wo)
    return ApiResponse(success=True, data=results)


@router.post("", response_model=ApiResponse[WorkflowOut], summary="Create workflow", dependencies=[Depends(require_permission("settings.manage"))])
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db)):
    if db.query(Workflow).filter((Workflow.name == data.name) | (Workflow.code == data.code)).first():
        raise AppException("WORKFLOW_EXISTS", f"Workflow '{data.name}' or code '{data.code}' exists.")
    wf = Workflow(**data.model_dump())
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return ApiResponse(success=True, data=WorkflowOut.model_validate(wf), message="Workflow created")


@router.get("/{workflow_id}", response_model=ApiResponse[WorkflowOut], summary="Get workflow by ID")
def get_workflow(workflow_id: uuid.UUID, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise NotFoundException("Workflow", workflow_id)
    return ApiResponse(success=True, data=WorkflowOut.model_validate(wf))


@router.post("/{workflow_id}/stages", response_model=ApiResponse[WorkflowStageOut], summary="Add stage to workflow", dependencies=[Depends(require_permission("settings.manage"))])
def add_workflow_stage(workflow_id: uuid.UUID, data: WorkflowStageCreate, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise NotFoundException("Workflow", workflow_id)

    stage = WorkflowStage(
        workflow_id=workflow_id,
        name=data.name,
        code=data.code,
        stage_type=data.stage_type,
        order_index=data.order_index,
        default_folder_name=data.default_folder_name
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return ApiResponse(success=True, data=WorkflowStageOut.model_validate(stage), message="Stage added")


@router.post("/{workflow_id}/transitions", response_model=ApiResponse[WorkflowTransitionOut], summary="Add transition to workflow", dependencies=[Depends(require_permission("settings.manage"))])
def add_workflow_transition(workflow_id: uuid.UUID, data: WorkflowTransitionCreate, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise NotFoundException("Workflow", workflow_id)

    trans = WorkflowTransition(
        workflow_id=workflow_id,
        from_stage_id=data.from_stage_id,
        to_stage_id=data.to_stage_id,
        action=data.action,
        required_permission=data.required_permission,
        required_fields=data.required_fields or [],
        auto_create_task_type_id=data.auto_create_task_type_id,
        assignment_mode=data.assignment_mode,
        active=data.active
    )
    db.add(trans)
    db.commit()
    db.refresh(trans)
    return ApiResponse(success=True, data=WorkflowTransitionOut.model_validate(trans), message="Transition added")
