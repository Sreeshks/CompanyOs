import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.core.logging import logger
from app.models import (
    Permission, Role, RolePermission, User, Department, Designation,
    BillingCompany, TaskType, ContentType, DocumentType, ClientStatus,
    ClientStatusTransition, Service, Package, PackageTask,
    Workflow, WorkflowStage, WorkflowTransition
)
from app.seeds.seed_data import (
    PERMISSIONS, DEPARTMENTS, DESIGNATIONS, BILLING_COMPANIES,
    TASK_TYPES, CONTENT_TYPES, DOCUMENT_TYPES, CLIENT_STATUSES,
    PIPELINE_TRANSITIONS
)


def seed_database():
    """Idempotently seed the initial database configuration."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        logger.info("Seeding database...")

        # 1. Permissions
        perm_map = {}
        for p_data in PERMISSIONS:
            perm = db.query(Permission).filter(Permission.code == p_data["code"]).first()
            if not perm:
                perm = Permission(**p_data)
                db.add(perm)
                db.flush()
            perm_map[perm.code] = perm

        # 2. Super Admin Role
        admin_role = db.query(Role).filter(Role.code == "SUPER_ADMIN").first()
        if not admin_role:
            admin_role = Role(
                name="Super Administrator",
                code="SUPER_ADMIN",
                description="Unrestricted system administrator",
                is_system=True
            )
            db.add(admin_role)
            db.flush()

        # Link all permissions to super admin
        for p in perm_map.values():
            if not db.query(RolePermission).filter(
                RolePermission.role_id == admin_role.id,
                RolePermission.permission_id == p.id
            ).first():
                db.add(RolePermission(role_id=admin_role.id, permission_id=p.id))
        db.flush()

        # 3. Staff & Manager Roles
        manager_role = db.query(Role).filter(Role.code == "MANAGER").first()
        if not manager_role:
            manager_role = Role(name="Manager", code="MANAGER", description="Operations & Team Manager", is_system=False)
            db.add(manager_role)
            db.flush()

        manager_perms = [
            "users.view", "clients.view", "clients.create", "clients.edit",
            "pipeline.view", "pipeline.manage", "documents.view", "documents.create", "documents.generate",
            "workspace.view", "workspace.create", "workspace.edit", "content.view", "content.create",
            "content.edit", "content.move", "tasks.view", "tasks.create", "tasks.assign", "tasks.reassign",
            "tasks.complete", "approval.view", "approval.manage", "reports.view", "dashboard.view", "audit.view"
        ]
        for p_code in manager_perms:
            if p_code in perm_map:
                if not db.query(RolePermission).filter(
                    RolePermission.role_id == manager_role.id,
                    RolePermission.permission_id == perm_map[p_code].id
                ).first():
                    db.add(RolePermission(role_id=manager_role.id, permission_id=perm_map[p_code].id))

        staff_role = db.query(Role).filter(Role.code == "STAFF").first()
        if not staff_role:
            staff_role = Role(name="Staff Member", code="STAFF", description="Standard Staff User", is_system=False)
            db.add(staff_role)
            db.flush()

        staff_perms = [
            "tasks.view", "tasks.complete", "content.view", "content.create",
            "content.edit", "content.move", "workspace.view", "workspace.create", "workspace.edit"
        ]
        for p_code in staff_perms:
            if p_code in perm_map:
                if not db.query(RolePermission).filter(
                    RolePermission.role_id == staff_role.id,
                    RolePermission.permission_id == perm_map[p_code].id
                ).first():
                    db.add(RolePermission(role_id=staff_role.id, permission_id=perm_map[p_code].id))
        db.flush()

        # 4. Departments & Designations
        dept_map = {}
        for d in DEPARTMENTS:
            dept = db.query(Department).filter(Department.code == d["code"]).first()
            if not dept:
                dept = Department(**d)
                db.add(dept)
                db.flush()
            dept_map[dept.code] = dept

        desig_map = {}
        for ds in DESIGNATIONS:
            desig = db.query(Designation).filter(Designation.code == ds["code"]).first()
            if not desig:
                desig = Designation(**ds)
                db.add(desig)
                db.flush()
            desig_map[desig.code] = desig

        # 5. Super Admin User
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not admin_user:
            admin_user = User(
                employee_code="EMP-001",
                full_name=settings.FIRST_SUPERUSER_NAME,
                email=settings.FIRST_SUPERUSER_EMAIL,
                password_hash=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                role_id=admin_role.id,
                designation_id=desig_map.get("MD").id if "MD" in desig_map else None,
                department_id=dept_map.get("MGMT").id if "MGMT" in dept_map else None,
                employment_type="full_time",
                status="active"
            )
            db.add(admin_user)
            db.flush()
            logger.info(f"Created default Super Admin: {admin_user.email}")

        # 6. Billing Companies
        for c in BILLING_COMPANIES:
            if not db.query(BillingCompany).filter(BillingCompany.short_code == c["short_code"]).first():
                db.add(BillingCompany(**c))
        db.flush()

        # 7. Task Types
        task_type_map = {}
        for tt in TASK_TYPES:
            task_type = db.query(TaskType).filter(TaskType.code == tt["code"]).first()
            if not task_type:
                task_type = TaskType(**tt)
                db.add(task_type)
                db.flush()
            task_type_map[task_type.code] = task_type

        # 8. Content Types
        for ct in CONTENT_TYPES:
            if not db.query(ContentType).filter(ContentType.code == ct["code"]).first():
                db.add(ContentType(**ct))
        db.flush()

        # 9. Document Types
        for dt in DOCUMENT_TYPES:
            if not db.query(DocumentType).filter(DocumentType.code == dt["code"]).first():
                db.add(DocumentType(**dt))
        db.flush()

        # 10. Client Statuses & Transitions
        status_map = {}
        for cs in CLIENT_STATUSES:
            status = db.query(ClientStatus).filter(ClientStatus.code == cs["code"]).first()
            if not status:
                status = ClientStatus(**cs)
                db.add(status)
                db.flush()
            status_map[status.code] = status

        for tr in PIPELINE_TRANSITIONS:
            from_st = status_map.get(tr["from"])
            to_st = status_map.get(tr["to"])
            if from_st and to_st:
                existing = db.query(ClientStatusTransition).filter(
                    ClientStatusTransition.from_status_id == from_st.id,
                    ClientStatusTransition.action == tr["action"]
                ).first()
                if not existing:
                    db.add(ClientStatusTransition(
                        from_status_id=from_st.id,
                        to_status_id=to_st.id,
                        action=tr["action"],
                        required_permission="pipeline.manage"
                    ))
        db.flush()

        # 11. Services & Packages
        smm_service = db.query(Service).filter(Service.code == "SMM").first()
        if not smm_service:
            smm_service = Service(
                name="Social Media Management",
                code="SMM",
                type="retainer",
                description="Comprehensive multi-channel social media management",
                recurring=True,
                active=True
            )
            db.add(smm_service)
            db.flush()

            # Packages: Basic, Pro, Ultra
            packages_data = [
                {"name": "Basic", "price": Decimal("150.00"), "duration": "monthly", "tasks": ["PHOTO_TAKE", "EDITING"]},
                {"name": "Pro", "price": Decimal("300.00"), "duration": "monthly", "tasks": ["PHOTO_TAKE", "SELECTION", "EDITING", "POSTING"]},
                {"name": "Ultra", "price": Decimal("500.00"), "duration": "monthly", "tasks": ["PHOTO_TAKE", "SELECTION", "EDITING", "POSTER_CREATE", "POSTING", "MONTHLY_REP"]}
            ]
            for p_def in packages_data:
                pkg = Package(
                    service_id=smm_service.id,
                    name=p_def["name"],
                    price=p_def["price"],
                    duration=p_def["duration"],
                    description=f"{p_def['name']} Package for SMM"
                )
                db.add(pkg)
                db.flush()
                for seq, tt_code in enumerate(p_def["tasks"]):
                    tt = task_type_map.get(tt_code)
                    if tt:
                        db.add(PackageTask(package_id=pkg.id, task_type_id=tt.id, sequence=seq, is_required=True))

        # 12. Creative Photo & Poster Workflow
        wf = db.query(Workflow).filter(Workflow.code == "CREATIVE_WF").first()
        if not wf:
            wf = Workflow(
                name="Photo & Poster Production Workflow",
                code="CREATIVE_WF",
                description="Standard production pipeline from raw assets to client approval and posting",
                active=True
            )
            db.add(wf)
            db.flush()

            stages_def = [
                {"name": "Raw", "code": "RAW", "stage_type": "initial", "order_index": 1, "default_folder_name": "Raw"},
                {"name": "Selected", "code": "SELECTED", "stage_type": "standard", "order_index": 2, "default_folder_name": "Selected"},
                {"name": "Rejected - Not in Use", "code": "REJECTED_DISCARD", "stage_type": "terminal", "order_index": 3, "default_folder_name": "Rejected - Not in Use"},
                {"name": "Editing", "code": "EDITING", "stage_type": "standard", "order_index": 4, "default_folder_name": "Editing"},
                {"name": "Pending Client Approval", "code": "PENDING_APPROVAL", "stage_type": "approval", "order_index": 5, "default_folder_name": "Pending Client Approval"},
                {"name": "Rejected - Needs Edit", "code": "REJECTED_NEEDS_EDIT", "stage_type": "standard", "order_index": 6, "default_folder_name": "Rejected - Needs Edit"},
                {"name": "Ready to Post", "code": "READY_TO_POST", "stage_type": "standard", "order_index": 7, "default_folder_name": "Ready to Post"},
                {"name": "Posted", "code": "POSTED", "stage_type": "terminal", "order_index": 8, "default_folder_name": "Posted"},
            ]

            stage_objs = {}
            for s_def in stages_def:
                stage = WorkflowStage(workflow_id=wf.id, **s_def)
                db.add(stage)
                db.flush()
                stage_objs[stage.code] = stage

            # Define Transitions with Auto Task Triggers
            transitions_def = [
                # Raw -> Selected (creates Editing task)
                {
                    "from": "RAW", "to": "SELECTED", "action": "Select",
                    "auto_create_task_type_id": task_type_map["EDITING"].id if "EDITING" in task_type_map else None,
                    "assignment_mode": "automatic"
                },
                # Raw -> Rejected - Not in Use
                {"from": "RAW", "to": "REJECTED_DISCARD", "action": "Discard"},
                # Selected -> Editing
                {"from": "SELECTED", "to": "EDITING", "action": "Start Editing"},
                # Editing -> Pending Client Approval
                {"from": "EDITING", "to": "PENDING_APPROVAL", "action": "Submit for Approval"},
                # Pending Client Approval -> Ready to Post (creates Posting task)
                {
                    "from": "PENDING_APPROVAL", "to": "READY_TO_POST", "action": "Approve",
                    "auto_create_task_type_id": task_type_map["POSTING"].id if "POSTING" in task_type_map else None,
                    "assignment_mode": "automatic"
                },
                # Pending Client Approval -> Rejected - Needs Edit (requires rejection_reason, creates Re-editing task)
                {
                    "from": "PENDING_APPROVAL", "to": "REJECTED_NEEDS_EDIT", "action": "Reject",
                    "required_fields": ["rejection_reason"],
                    "auto_create_task_type_id": task_type_map["RE_EDITING"].id if "RE_EDITING" in task_type_map else None,
                    "assignment_mode": "automatic"
                },
                # Rejected - Needs Edit -> Editing
                {"from": "REJECTED_NEEDS_EDIT", "to": "EDITING", "action": "Restart Editing"},
                # Ready to Post -> Posted
                {"from": "READY_TO_POST", "to": "POSTED", "action": "Mark Posted"},
                # Reverse Transitions
                {"from": "EDITING", "to": "SELECTED", "action": "Return to Selected"},
                {"from": "SELECTED", "to": "RAW", "action": "Return to Raw"},
            ]

            for tr_def in transitions_def:
                from_s = stage_objs.get(tr_def["from"])
                to_s = stage_objs.get(tr_def["to"])
                if from_s and to_s:
                    db.add(WorkflowTransition(
                        workflow_id=wf.id,
                        from_stage_id=from_s.id,
                        to_stage_id=to_s.id,
                        action=tr_def["action"],
                        required_fields=tr_def.get("required_fields", []),
                        auto_create_task_type_id=tr_def.get("auto_create_task_type_id"),
                        assignment_mode=tr_def.get("assignment_mode", "automatic"),
                        active=True
                    ))

        db.commit()
        logger.info("Database seeding successfully completed!")
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
