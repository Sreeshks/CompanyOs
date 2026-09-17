import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission, get_current_user
from app.core.exceptions import AppException, NotFoundException
from app.models.department import Department
from app.models.designation import Designation
from app.models.billing_company import BillingCompany
from app.models.service import Service
from app.models.package import Package, PackageTask
from app.models.task_type import TaskType
from app.models.content import ContentType
from app.models.user import User
from app.schemas.master_data import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    DesignationCreate, DesignationUpdate, DesignationOut,
    BillingCompanyCreate, BillingCompanyUpdate, BillingCompanyOut,
    ServiceCreate, ServiceUpdate, ServiceOut,
    PackageCreate, PackageUpdate, PackageOut, PackageTaskCreate, PackageTaskOut,
    TaskTypeCreate, TaskTypeUpdate, TaskTypeOut,
    ContentTypeCreate, ContentTypeOut
)
from app.schemas.common import ApiResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Master Catalog & Organization"])


# --- DEPARTMENTS ---
@router.get("/departments", response_model=ApiResponse[List[DepartmentOut]], summary="List departments")
def list_departments(db: Session = Depends(get_db)):
    items = db.query(Department).order_by(Department.name.asc()).all()
    return ApiResponse(success=True, data=[DepartmentOut.model_validate(i) for i in items])


@router.post("/departments", response_model=ApiResponse[DepartmentOut], summary="Create department", dependencies=[Depends(require_permission("settings.manage"))])
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    if db.query(Department).filter((Department.name == data.name) | (Department.code == data.code)).first():
        raise AppException("DEPARTMENT_EXISTS", f"Department '{data.name}' or code '{data.code}' exists.")
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return ApiResponse(success=True, data=DepartmentOut.model_validate(dept), message="Department created")


# --- DESIGNATIONS ---
@router.get("/designations", response_model=ApiResponse[List[DesignationOut]], summary="List designations")
def list_designations(db: Session = Depends(get_db)):
    items = db.query(Designation).order_by(Designation.name.asc()).all()
    return ApiResponse(success=True, data=[DesignationOut.model_validate(i) for i in items])


@router.post("/designations", response_model=ApiResponse[DesignationOut], summary="Create designation", dependencies=[Depends(require_permission("settings.manage"))])
def create_designation(data: DesignationCreate, db: Session = Depends(get_db)):
    if db.query(Designation).filter((Designation.name == data.name) | (Designation.code == data.code)).first():
        raise AppException("DESIGNATION_EXISTS", f"Designation '{data.name}' or code '{data.code}' exists.")
    desig = Designation(**data.model_dump())
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return ApiResponse(success=True, data=DesignationOut.model_validate(desig), message="Designation created")


# --- BILLING COMPANIES ---
@router.get("/billing-companies", response_model=ApiResponse[List[BillingCompanyOut]], summary="List billing companies")
def list_billing_companies(db: Session = Depends(get_db)):
    items = db.query(BillingCompany).order_by(BillingCompany.name.asc()).all()
    return ApiResponse(success=True, data=[BillingCompanyOut.model_validate(i) for i in items])


@router.post("/billing-companies", response_model=ApiResponse[BillingCompanyOut], summary="Create billing company", dependencies=[Depends(require_permission("settings.manage"))])
def create_billing_company(data: BillingCompanyCreate, db: Session = Depends(get_db)):
    if db.query(BillingCompany).filter((BillingCompany.name == data.name) | (BillingCompany.short_code == data.short_code)).first():
        raise AppException("COMPANY_EXISTS", f"Billing company '{data.name}' or code '{data.short_code}' exists.")
    company = BillingCompany(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return ApiResponse(success=True, data=BillingCompanyOut.model_validate(company), message="Billing company created")


# --- SERVICES ---
@router.get("/services", response_model=ApiResponse[List[ServiceOut]], summary="List services")
def list_services(db: Session = Depends(get_db)):
    items = db.query(Service).order_by(Service.name.asc()).all()
    return ApiResponse(success=True, data=[ServiceOut.model_validate(i) for i in items])


@router.post("/services", response_model=ApiResponse[ServiceOut], summary="Create service", dependencies=[Depends(require_permission("settings.manage"))])
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    if db.query(Service).filter((Service.name == data.name) | (Service.code == data.code)).first():
        raise AppException("SERVICE_EXISTS", f"Service '{data.name}' or code '{data.code}' exists.")
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return ApiResponse(success=True, data=ServiceOut.model_validate(service), message="Service created")


# --- PACKAGES ---
@router.get("/packages", response_model=ApiResponse[List[PackageOut]], summary="List packages")
def list_packages(service_id: Optional[uuid.UUID] = None, db: Session = Depends(get_db)):
    query = db.query(Package)
    if service_id:
        query = query.filter(Package.service_id == service_id)
    items = query.order_by(Package.name.asc()).all()
    return ApiResponse(success=True, data=[PackageOut.model_validate(i) for i in items])


@router.post("/packages", response_model=ApiResponse[PackageOut], summary="Create package", dependencies=[Depends(require_permission("settings.manage"))])
def create_package(data: PackageCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise NotFoundException("Service", data.service_id)

    pkg_dict = data.model_dump(exclude={"tasks"})
    pkg = Package(**pkg_dict)
    db.add(pkg)
    db.flush()

    if data.tasks:
        for t in data.tasks:
            db.add(PackageTask(
                package_id=pkg.id,
                task_type_id=t.task_type_id,
                sequence=t.sequence,
                is_required=t.is_required
            ))

    db.commit()
    db.refresh(pkg)
    return ApiResponse(success=True, data=PackageOut.model_validate(pkg), message="Package created")


# --- TASK TYPES ---
@router.get("/task-types", response_model=ApiResponse[List[TaskTypeOut]], summary="List task types")
def list_task_types(db: Session = Depends(get_db)):
    items = db.query(TaskType).order_by(TaskType.name.asc()).all()
    return ApiResponse(success=True, data=[TaskTypeOut.model_validate(i) for i in items])


@router.post("/task-types", response_model=ApiResponse[TaskTypeOut], summary="Create task type", dependencies=[Depends(require_permission("settings.manage"))])
def create_task_type(data: TaskTypeCreate, db: Session = Depends(get_db)):
    if db.query(TaskType).filter((TaskType.name == data.name) | (TaskType.code == data.code)).first():
        raise AppException("TASK_TYPE_EXISTS", f"Task type '{data.name}' or code '{data.code}' exists.")
    task_type = TaskType(**data.model_dump())
    db.add(task_type)
    db.commit()
    db.refresh(task_type)
    return ApiResponse(success=True, data=TaskTypeOut.model_validate(task_type), message="Task type created")


# --- CONTENT TYPES ---
@router.get("/content-types", response_model=ApiResponse[List[ContentTypeOut]], summary="List content types")
def list_content_types(db: Session = Depends(get_db)):
    items = db.query(ContentType).order_by(ContentType.name.asc()).all()
    return ApiResponse(success=True, data=[ContentTypeOut.model_validate(i) for i in items])


@router.post("/content-types", response_model=ApiResponse[ContentTypeOut], summary="Create content type", dependencies=[Depends(require_permission("settings.manage"))])
def create_content_type(data: ContentTypeCreate, db: Session = Depends(get_db)):
    if db.query(ContentType).filter((ContentType.name == data.name) | (ContentType.code == data.code)).first():
        raise AppException("CONTENT_TYPE_EXISTS", f"Content type '{data.name}' or code '{data.code}' exists.")
    ct = ContentType(**data.model_dump())
    db.add(ct)
    db.commit()
    db.refresh(ct)
    return ApiResponse(success=True, data=ContentTypeOut.model_validate(ct), message="Content type created")
