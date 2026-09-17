"""
Comprehensive Demo & Test Seeder for Company OS.
Populates realistic, production-like data across all business contexts:
- Multi-role staff with standard passwords
- Clients in every pipeline status
- Workspaces and recursive folder trees
- Content items in all workflow stages (Raw -> Posted)
- Client approval review tokens & rejection records
- Tasks across all states (Pending, In Progress, Overdue, Completed, Reassigned)
- Quotations, Agreements, and Invoices with line items & VAT
- In-app notifications
- Audit logs
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.core.logging import logger
from app.models import (
    User, UserSkill, Role, Department, Designation, BillingCompany,
    Service, Package, PackageTask, TaskType, ContentType, DocumentType,
    DocumentCounter, Document, DocumentItem, ClientStatus, ClientStatusTransition,
    Client, ClientStaffAssignment, Workspace, Folder, ContentItem,
    Workflow, WorkflowStage, WorkflowTransition, Task, TaskAssignmentHistory,
    TaskHistory, ClientApproval, Rejection, Notification, AuditLog
)
from app.seeds.runner import seed_database


def seed_comprehensive_data():
    # 1. Ensure base master data exists
    seed_database()

    db: Session = SessionLocal()
    try:
        logger.info("Starting comprehensive data population for all test cases...")

        # Common test password for staff
        DEFAULT_PASSWORD_HASH = get_password_hash("Password123!")

        # Retrieve roles
        admin_role = db.query(Role).filter(Role.code == "SUPER_ADMIN").first()
        manager_role = db.query(Role).filter(Role.code == "MANAGER").first()
        staff_role = db.query(Role).filter(Role.code == "STAFF").first()

        # Retrieve departments
        dept_mgmt = db.query(Department).filter(Department.code == "MGMT").first()
        dept_sales = db.query(Department).filter(Department.code == "SALES").first()
        dept_smm = db.query(Department).filter(Department.code == "SMM").first()
        dept_web = db.query(Department).filter(Department.code == "WEB_SEO").first()
        dept_photo = db.query(Department).filter(Department.code == "PHOTO_VIDEO").first()
        dept_all = db.query(Department).filter(Department.code == "ALL_ROUND").first()

        # Retrieve designations
        desig_md = db.query(Designation).filter(Designation.code == "MD").first()
        desig_om = db.query(Designation).filter(Designation.code == "OM").first()
        desig_ae = db.query(Designation).filter(Designation.code == "ACC_EXEC").first()
        desig_photo = db.query(Designation).filter(Designation.code == "SR_PHOTO").first()
        desig_editor = db.query(Designation).filter(Designation.code == "PHOTO_ED").first()
        desig_designer = db.query(Designation).filter(Designation.code == "GRAPHIC_DES").first()
        desig_seo = db.query(Designation).filter(Designation.code == "SEO_SPEC").first()

        # -------------------------------------------------------------
        # 1. USERS ACROSS ROLES & SPECIALTIES
        # -------------------------------------------------------------
        staff_defs = [
            {
                "employee_code": "EMP-002",
                "full_name": "Sarah Al Balushi",
                "email": "manager@companyos.com",
                "role_id": manager_role.id,
                "designation_id": desig_om.id,
                "department_id": dept_mgmt.id,
                "skills": ["Operations", "Project Management", "Client Relations"]
            },
            {
                "employee_code": "EMP-003",
                "full_name": "Salim Al Harthy",
                "email": "salesmgr@companyos.com",
                "role_id": manager_role.id,
                "designation_id": desig_ae.id,
                "department_id": dept_sales.id,
                "skills": ["B2B Sales", "Contract Negotiation", "Quotation Drafting"]
            },
            {
                "employee_code": "EMP-004",
                "full_name": "Vishal Kumar",
                "email": "vishal@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_photo.id,
                "department_id": dept_photo.id,
                "skills": ["Photography", "Lighting", "Product Shoot", "Drone"]
            },
            {
                "employee_code": "EMP-005",
                "full_name": "Shinoy Varghese",
                "email": "shinoy@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_editor.id,
                "department_id": dept_photo.id,
                "skills": ["Lightroom", "Photoshop", "Color Grading", "Retouching"]
            },
            {
                "employee_code": "EMP-006",
                "full_name": "Anjana Pillai",
                "email": "anjana@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_editor.id,
                "department_id": dept_all.id,
                "skills": ["Photoshop", "Selection", "Image Cleanup"]
            },
            {
                "employee_code": "EMP-007",
                "full_name": "Rahul Nair",
                "email": "rahul@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_designer.id,
                "department_id": dept_smm.id,
                "skills": ["Illustrator", "Canva", "Typography", "Poster Design"]
            },
            {
                "employee_code": "EMP-008",
                "full_name": "Fatima Al Lawati",
                "email": "fatima@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_ae.id,
                "department_id": dept_smm.id,
                "skills": ["Social Media Posting", "Copywriting", "Hashtag Strategy", "Scheduling"]
            },
            {
                "employee_code": "EMP-009",
                "full_name": "Tariq Al Zadjali",
                "email": "tariq@companyos.com",
                "role_id": staff_role.id,
                "designation_id": desig_seo.id,
                "department_id": dept_web.id,
                "skills": ["GBP Optimization", "Keyword Research", "Technical SEO"]
            }
        ]

        user_map = {}
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        user_map["admin"] = admin_user

        for s in staff_defs:
            user = db.query(User).filter(User.email == s["email"]).first()
            if not user:
                user = User(
                    employee_code=s["employee_code"],
                    full_name=s["full_name"],
                    email=s["email"],
                    password_hash=DEFAULT_PASSWORD_HASH,
                    role_id=s["role_id"],
                    designation_id=s["designation_id"],
                    department_id=s["department_id"],
                    employment_type="full_time",
                    status="active",
                    joining_date=date(2025, 1, 15)
                )
                db.add(user)
                db.flush()
                for skill in s["skills"]:
                    db.add(UserSkill(user_id=user.id, skill_name=skill))
                db.flush()
            user_map[s["email"]] = user

        # -------------------------------------------------------------
        # 2. BILLING COMPANIES & SERVICES
        # -------------------------------------------------------------
        adox_company = db.query(BillingCompany).filter(BillingCompany.short_code == "ADX").first()
        pixel_company = db.query(BillingCompany).filter(BillingCompany.short_code == "PXL").first()

        smm_service = db.query(Service).filter(Service.code == "SMM").first()
        photo_service = db.query(Service).filter(Service.code == "PHOTO_VIDEO").first()
        if not photo_service:
            photo_service = Service(
                name="Event Photography & Videography",
                code="PHOTO_VIDEO",
                type="one_time",
                description="Professional on-site photo and video coverage",
                recurring=False
            )
            db.add(photo_service)
            db.flush()

        web_service = db.query(Service).filter(Service.code == "WEB_SEO").first()
        if not web_service:
            web_service = Service(
                name="Website Development & SEO",
                code="WEB_SEO",
                type="retainer",
                description="Full-stack web maintenance and search engine optimization",
                recurring=True
            )
            db.add(web_service)
            db.flush()

        gbp_service = db.query(Service).filter(Service.code == "GBP").first()
        if not gbp_service:
            gbp_service = Service(
                name="GBP Monthly Optimization",
                code="GBP",
                type="retainer",
                description="Google Business Profile monthly posts, citations, and reviews",
                recurring=True
            )
            db.add(gbp_service)
            db.flush()

        # Packages
        smm_pro_pkg = db.query(Package).filter(Package.service_id == smm_service.id, Package.name == "Pro").first()
        smm_ultra_pkg = db.query(Package).filter(Package.service_id == smm_service.id, Package.name == "Ultra").first()
        smm_basic_pkg = db.query(Package).filter(Package.service_id == smm_service.id, Package.name == "Basic").first()

        # -------------------------------------------------------------
        # 3. TASK TYPES & WORKFLOW
        # -------------------------------------------------------------
        task_types = {tt.code: tt for tt in db.query(TaskType).all()}
        content_types = {ct.code: ct for ct in db.query(ContentType).all()}
        client_statuses = {cs.code: cs for cs in db.query(ClientStatus).all()}

        wf = db.query(Workflow).filter(Workflow.code == "CREATIVE_WF").first()
        stages = {s.code: s for s in wf.stages}

        # -------------------------------------------------------------
        # 4. CLIENTS ACROSS ALL 11 PIPELINE STATUSES
        # -------------------------------------------------------------
        client_defs = [
            {
                "code": "CLT-001",
                "name": "White Star Cargo LLC",
                "contact": "Tariq Al Zadjali",
                "email": "tariq@whitestar.om",
                "phone": "+968 9876 5432",
                "status": "PROJECT_ONGOING",
                "billing_company": adox_company,
                "service": smm_service,
                "package": smm_pro_pkg,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Monthly 30 Days Net",
                "start": date(2026, 1, 1),
                "end": date(2026, 12, 31),
                "notes": "Premium freight logistics client. Requires 12 photos + 4 posters per month."
            },
            {
                "code": "CLT-002",
                "name": "Muscat Grand Cafe & Lounge",
                "contact": "Khalid Al Hosni",
                "email": "khalid@muscatgrandcafe.com",
                "phone": "+968 9123 7890",
                "status": "PROJECT_ONGOING",
                "billing_company": pixel_company,
                "service": smm_service,
                "package": smm_ultra_pkg,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Monthly in advance",
                "start": date(2026, 3, 1),
                "end": date(2027, 2, 28),
                "notes": "High-end cafe in Al Mouj. Focus on specialty coffee photography and reels."
            },
            {
                "code": "CLT-003",
                "name": "Oman Oasis Eco Tourism",
                "contact": "Maya Al Kiyumi",
                "email": "maya@omanoasis.om",
                "phone": "+968 9234 5678",
                "status": "AGR_PENDING",
                "billing_company": adox_company,
                "service": photo_service,
                "package": None,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "50% Advance, 50% on Delivery",
                "start": date(2026, 10, 1),
                "end": date(2026, 10, 15),
                "notes": "Wahiba sands and Jabal Akhdar shoot."
            },
            {
                "code": "CLT-004",
                "name": "Al Fair Gourmet Supermarket",
                "contact": "Nasser Al Busaidi",
                "email": "nasser@alfair.om",
                "phone": "+968 9345 6789",
                "status": "INV_PENDING",
                "billing_company": adox_company,
                "service": smm_service,
                "package": smm_basic_pkg,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Net 15 Days",
                "start": date(2026, 9, 1),
                "end": date(2027, 8, 31),
                "notes": "Awaiting initial invoice payment to launch October shoot."
            },
            {
                "code": "CLT-005",
                "name": "Sohar Petrochemical Services",
                "contact": "Eng. Faisal Al Hinai",
                "email": "faisal@soharpetro.om",
                "phone": "+968 9456 7890",
                "status": "RENEWAL_DUE",
                "billing_company": adox_company,
                "service": web_service,
                "package": None,
                "salesperson": user_map["manager@companyos.com"],
                "terms": "Quarterly",
                "start": date(2025, 10, 1),
                "end": date(2026, 9, 30),
                "notes": "Contract expires at end of current month. Renewal proposal prepared."
            },
            {
                "code": "CLT-006",
                "name": "Nizwa Heritage Boutique Hotel",
                "contact": "Hamed Al Rawahi",
                "email": "hamed@nizwahotel.om",
                "phone": "+968 9567 8901",
                "status": "QUO_SENT",
                "billing_company": pixel_company,
                "service": smm_service,
                "package": smm_pro_pkg,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Net 30",
                "start": None,
                "end": None,
                "notes": "Sent Quotation QUO-PXL-2026-002. Client reviewing with board."
            },
            {
                "code": "CLT-007",
                "name": "Barka Automobile Spares",
                "contact": "Bader Al Maawali",
                "email": "bader@barkaauto.om",
                "phone": "+968 9678 9012",
                "status": "QUO_DRAFT",
                "billing_company": pixel_company,
                "service": gbp_service,
                "package": None,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Cash on Invoice",
                "start": None,
                "end": None,
                "notes": "Drafting proposal for GBP monthly ranking and review management."
            },
            {
                "code": "CLT-008",
                "name": "Sur Marine & Fisheries LLC",
                "contact": "Abdullah Al Farsi",
                "email": "abdullah@surmarine.om",
                "phone": "+968 9789 0123",
                "status": "LEAD",
                "billing_company": adox_company,
                "service": photo_service,
                "package": None,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "TBD",
                "start": None,
                "end": None,
                "notes": "Initial inquiry from Oman Maritime Expo."
            },
            {
                "code": "CLT-009",
                "name": "Dhofar Fresh Juices",
                "contact": "Muna Al Shanfari",
                "email": "muna@dhofarjuices.om",
                "phone": "+968 9890 1234",
                "status": "WON",
                "billing_company": adox_company,
                "service": smm_service,
                "package": smm_ultra_pkg,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Monthly",
                "start": date(2026, 10, 1),
                "end": date(2027, 9, 30),
                "notes": "Verbal agreement received. Moving to Agreement preparation."
            },
            {
                "code": "CLT-010",
                "name": "Ibra Construction Machinery",
                "contact": "Khamis Al Harthy",
                "email": "khamis@ibraconstruct.om",
                "phone": "+968 9901 2345",
                "status": "LOST",
                "billing_company": pixel_company,
                "service": web_service,
                "package": None,
                "salesperson": user_map["salesmgr@companyos.com"],
                "terms": "Net 30",
                "start": None,
                "end": None,
                "notes": "Lost to lower quote competitor."
            },
            {
                "code": "CLT-011",
                "name": "Salalah Frankincense Trading",
                "contact": "Said Al Kathiri",
                "email": "said@salalahfrankincense.om",
                "phone": "+968 9012 3456",
                "status": "COMPLETED",
                "billing_company": adox_company,
                "service": gbp_service,
                "package": None,
                "salesperson": user_map["manager@companyos.com"],
                "terms": "Paid in full",
                "start": date(2025, 9, 1),
                "end": date(2026, 8, 31),
                "notes": "1-Year GBP contract successfully delivered and completed."
            }
        ]

        client_map = {}
        for c_def in client_defs:
            client = db.query(Client).filter(Client.client_code == c_def["code"]).first()
            if not client:
                client = Client(
                    client_code=c_def["code"],
                    business_name=c_def["name"],
                    contact_person=c_def["contact"],
                    email=c_def["email"],
                    phone=c_def["phone"],
                    status_id=client_statuses[c_def["status"]].id,
                    billing_company_id=c_def["billing_company"].id if c_def["billing_company"] else None,
                    service_id=c_def["service"].id if c_def["service"] else None,
                    package_id=c_def["package"].id if c_def["package"] else None,
                    salesperson_id=c_def["salesperson"].id if c_def["salesperson"] else None,
                    payment_terms=c_def["terms"],
                    contract_start_date=c_def["start"],
                    contract_end_date=c_def["end"],
                    notes=c_def["notes"],
                    created_by=admin_user.id
                )
                db.add(client)
                db.flush()
            client_map[c_def["code"]] = client

        # -------------------------------------------------------------
        # 5. CLIENT STAFF ASSIGNMENTS (Default roster per client)
        # -------------------------------------------------------------
        # For White Star Cargo (CLT-001)
        clt_1 = client_map["CLT-001"]
        assignments_1 = [
            (task_types["SELECTION"].id, user_map["vishal@companyos.com"].id),
            (task_types["EDITING"].id, user_map["shinoy@companyos.com"].id),
            (task_types["POSTER_CREATE"].id, user_map["rahul@companyos.com"].id),
            (task_types["POSTING"].id, user_map["fatima@companyos.com"].id),
            (task_types["SEO"].id, user_map["tariq@companyos.com"].id)
        ]
        for tt_id, u_id in assignments_1:
            if not db.query(ClientStaffAssignment).filter(
                ClientStaffAssignment.client_id == clt_1.id,
                ClientStaffAssignment.task_type_id == tt_id
            ).first():
                db.add(ClientStaffAssignment(
                    client_id=clt_1.id,
                    task_type_id=tt_id,
                    user_id=u_id,
                    assigned_by=admin_user.id
                ))

        # For Muscat Grand Cafe (CLT-002)
        clt_2 = client_map["CLT-002"]
        assignments_2 = [
            (task_types["SELECTION"].id, user_map["vishal@companyos.com"].id),
            (task_types["EDITING"].id, user_map["anjana@companyos.com"].id),
            (task_types["POSTER_CREATE"].id, user_map["rahul@companyos.com"].id),
            (task_types["POSTING"].id, user_map["fatima@companyos.com"].id)
        ]
        for tt_id, u_id in assignments_2:
            if not db.query(ClientStaffAssignment).filter(
                ClientStaffAssignment.client_id == clt_2.id,
                ClientStaffAssignment.task_type_id == tt_id
            ).first():
                db.add(ClientStaffAssignment(
                    client_id=clt_2.id,
                    task_type_id=tt_id,
                    user_id=u_id,
                    assigned_by=admin_user.id
                ))
        db.flush()

        # -------------------------------------------------------------
        # 6. WORKSPACES & FOLDER TREES
        # -------------------------------------------------------------
        # White Star Workspace
        ws_1 = db.query(Workspace).filter(Workspace.client_id == clt_1.id).first()
        if not ws_1:
            ws_1 = Workspace(
                client_id=clt_1.id,
                name="White Star Cargo - Production Workspace",
                created_by=admin_user.id
            )
            db.add(ws_1)
            db.flush()

        # Folders for Workspace 1
        folder_map_1 = {}
        # Root Photos
        f_photos = db.query(Folder).filter(Folder.workspace_id == ws_1.id, Folder.name == "Photos").first()
        if not f_photos:
            f_photos = Folder(workspace_id=ws_1.id, name="Photos", folder_type="system", created_by=admin_user.id)
            db.add(f_photos)
            db.flush()

        # Stage subfolders under Photos
        stage_folders = [
            ("Raw", "RAW"),
            ("Selected", "SELECTED"),
            ("Editing", "EDITING"),
            ("Pending Client Approval", "PENDING_APPROVAL"),
            ("Rejected - Needs Edit", "REJECTED_NEEDS_EDIT"),
            ("Ready to Post", "READY_TO_POST"),
            ("Posted", "POSTED"),
            ("Rejected - Not in Use", "REJECTED_DISCARD")
        ]
        for f_name, s_code in stage_folders:
            subf = db.query(Folder).filter(
                Folder.workspace_id == ws_1.id,
                Folder.parent_folder_id == f_photos.id,
                Folder.name == f_name
            ).first()
            if not subf:
                subf = Folder(
                    workspace_id=ws_1.id,
                    parent_folder_id=f_photos.id,
                    name=f_name,
                    folder_type="workflow",
                    workflow_stage_id=stages[s_code].id,
                    created_by=admin_user.id
                )
                db.add(subf)
                db.flush()
            folder_map_1[s_code] = subf

        # Root Posters folder
        f_posters = db.query(Folder).filter(Folder.workspace_id == ws_1.id, Folder.name == "Posters").first()
        if not f_posters:
            f_posters = Folder(workspace_id=ws_1.id, name="Posters", folder_type="custom", created_by=admin_user.id)
            db.add(f_posters)
            db.flush()

        # -------------------------------------------------------------
        # 7. CONTENT ITEMS AT EVERY WORKFLOW STAGE
        # -------------------------------------------------------------
        content_items_def = [
            {
                "file_name": "photo_01_fleet.jpg",
                "display_name": "Main Fleet on Highway",
                "seq": 1,
                "stage": "POSTED",
                "type": "PHOTO",
                "assigned": user_map["fatima@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_02_warehouse.jpg",
                "display_name": "Logistics Hub & High-Bay Racks",
                "seq": 2,
                "stage": "READY_TO_POST",
                "type": "PHOTO",
                "assigned": user_map["fatima@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_03_port_terminal.jpg",
                "display_name": "Port Sultan Qaboos Container Loading",
                "seq": 3,
                "stage": "PENDING_APPROVAL",
                "type": "PHOTO",
                "assigned": user_map["shinoy@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_04_forklift.jpg",
                "display_name": "Forklift Operations in Bay 3",
                "seq": 4,
                "stage": "REJECTED_NEEDS_EDIT",
                "type": "PHOTO",
                "assigned": user_map["shinoy@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_05_cargo_ship.jpg",
                "display_name": "Cargo Vessel Berthing",
                "seq": 5,
                "stage": "EDITING",
                "type": "PHOTO",
                "assigned": user_map["shinoy@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_06_driver_team.jpg",
                "display_name": "Fleet Dispatchers & Drivers",
                "seq": 6,
                "stage": "SELECTED",
                "type": "PHOTO",
                "assigned": user_map["vishal@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_07_night_depot.jpg",
                "display_name": "Night Depot Operations",
                "seq": 7,
                "stage": "RAW",
                "type": "PHOTO",
                "assigned": user_map["vishal@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "photo_08_blurry_take.jpg",
                "display_name": "Out of Focus Yard Shot",
                "seq": 8,
                "stage": "REJECTED_DISCARD",
                "type": "PHOTO",
                "assigned": None,
                "target_month": "2026-09"
            },
            {
                "file_name": "poster_01_national_day.png",
                "display_name": "Oman National Day Promo",
                "seq": 9,
                "stage": "POSTED",
                "type": "POSTER",
                "assigned": user_map["rahul@companyos.com"],
                "target_month": "2026-09"
            },
            {
                "file_name": "poster_02_special_freight.png",
                "display_name": "Express GCC Freight Rates",
                "seq": 10,
                "stage": "READY_TO_POST",
                "type": "POSTER",
                "assigned": user_map["fatima@companyos.com"],
                "target_month": "2026-09"
            }
        ]

        content_item_map = {}
        for ci_def in content_items_def:
            stage_obj = stages[ci_def["stage"]]
            folder_obj = folder_map_1.get(ci_def["stage"], f_photos)
            item = db.query(ContentItem).filter(
                ContentItem.workspace_id == ws_1.id,
                ContentItem.file_name == ci_def["file_name"]
            ).first()
            if not item:
                item = ContentItem(
                    client_id=clt_1.id,
                    workspace_id=ws_1.id,
                    folder_id=folder_obj.id,
                    content_type_id=content_types[ci_def["type"]].id,
                    file_name=ci_def["file_name"],
                    display_name=ci_def["display_name"],
                    sequence_number=ci_def["seq"],
                    target_month=ci_def["target_month"],
                    current_stage_id=stage_obj.id,
                    assigned_user_id=ci_def["assigned"].id if ci_def["assigned"] else None,
                    storage_path=f"/uploads/{ci_def['file_name']}",
                    mime_type="image/jpeg" if ci_def["type"] == "PHOTO" else "image/png",
                    file_size_bytes=2450000,
                    item_metadata={"resolution": "4K", "camera": "Sony A7IV"},
                    created_by=admin_user.id
                )
                db.add(item)
                db.flush()
            content_item_map[ci_def["file_name"]] = item

        # -------------------------------------------------------------
        # 8. CLIENT APPROVALS & REJECTIONS (For testing portal review)
        # -------------------------------------------------------------
        # 8a. Active Approval awaiting client decision
        pending_item = content_item_map["photo_03_port_terminal.jpg"]
        demo_token = "demo-approval-token-whitestar"
        approval = db.query(ClientApproval).filter(ClientApproval.access_token == demo_token).first()
        if not approval:
            approval = ClientApproval(
                content_id=pending_item.id,
                client_id=clt_1.id,
                approval_status="pending",
                access_token=demo_token,
                token_expires_at=datetime.now(timezone.utc) + timedelta(days=14)
            )
            db.add(approval)
            db.flush()

        # 8b. Rejection record with mandatory rejection reason
        rejected_item = content_item_map["photo_04_forklift.jpg"]
        rejection = db.query(Rejection).filter(Rejection.content_id == rejected_item.id).first()
        if not rejection:
            rejection = Rejection(
                client_id=clt_1.id,
                content_id=rejected_item.id,
                content_type="Photo",
                reason="The background exposure is too dark and the company truck logo is shadowed. Please brighten exposure and increase sharpness by 15%.",
                rejected_by="Tariq Al Zadjali (Client Reviewer)",
                rejected_at=datetime.now(timezone.utc) - timedelta(days=1),
                resolution_status="open",
                notes="Assigned back to Shinoy for re-editing."
            )
            db.add(rejection)
            db.flush()

        # -------------------------------------------------------------
        # 9. TASKS COVERING ALL STATES: PENDING, IN-PROGRESS, OVERDUE, COMPLETED, REASSIGNED
        # -------------------------------------------------------------
        today = date.today()

        tasks_def = [
            # 1. Pending Task (Normal)
            {
                "code": "TSK-101",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["photo_05_cargo_ship.jpg"],
                "type": task_types["EDITING"],
                "stage": stages["EDITING"],
                "status": "pending",
                "priority": "high",
                "assignee": user_map["shinoy@companyos.com"],
                "target_date": today + timedelta(days=3),
                "notes": "Retouch color profile and remove glare on container edges."
            },
            # 2. Pending Urgent Task
            {
                "code": "TSK-102",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["poster_02_special_freight.png"],
                "type": task_types["POSTER_CREATE"],
                "stage": stages["READY_TO_POST"],
                "status": "pending",
                "priority": "urgent",
                "assignee": user_map["rahul@companyos.com"],
                "target_date": today + timedelta(days=1),
                "notes": "Urgent promotion for weekend shipping schedule."
            },
            # 3. In-Progress Task
            {
                "code": "TSK-103",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["photo_04_forklift.jpg"],
                "type": task_types["RE_EDITING"],
                "stage": stages["REJECTED_NEEDS_EDIT"],
                "status": "in_progress",
                "priority": "high",
                "assignee": user_map["shinoy@companyos.com"],
                "target_date": today + timedelta(days=2),
                "started_at": datetime.now(timezone.utc) - timedelta(hours=3),
                "notes": "Re-editing based on client rejection notes: brighten logo."
            },
            # 4. OVERDUE Task 1 (Target date in past!)
            {
                "code": "TSK-104",
                "client": client_map["CLT-005"],
                "workspace": None,
                "content_item": None,
                "type": task_types["SEO"],
                "stage": None,
                "status": "pending",
                "priority": "urgent",
                "assignee": user_map["tariq@companyos.com"],
                "target_date": today - timedelta(days=5),
                "notes": "OVERDUE: Monthly keyword & GBP local ranking report for Sohar Petrochemicals."
            },
            # 5. OVERDUE Task 2 (Target date in past!)
            {
                "code": "TSK-105",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["photo_06_driver_team.jpg"],
                "type": task_types["SELECTION"],
                "stage": stages["SELECTED"],
                "status": "in_progress",
                "priority": "high",
                "assignee": user_map["vishal@companyos.com"],
                "target_date": today - timedelta(days=3),
                "started_at": datetime.now(timezone.utc) - timedelta(days=4),
                "notes": "OVERDUE: Finalize shortlisting of driver team portrait shots."
            },
            # 6. Completed Task 1
            {
                "code": "TSK-106",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": None,
                "type": task_types["PHOTO_TAKE"],
                "stage": stages["RAW"],
                "status": "completed",
                "priority": "medium",
                "assignee": user_map["vishal@companyos.com"],
                "target_date": today - timedelta(days=7),
                "started_at": datetime.now(timezone.utc) - timedelta(days=8),
                "completed_at": datetime.now(timezone.utc) - timedelta(days=7),
                "notes": "On-site 4-hour shoot at Sohar logistics depot completed."
            },
            # 7. Completed Task 2
            {
                "code": "TSK-107",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["photo_01_fleet.jpg"],
                "type": task_types["EDITING"],
                "stage": stages["POSTED"],
                "status": "completed",
                "priority": "medium",
                "assignee": user_map["shinoy@companyos.com"],
                "target_date": today - timedelta(days=4),
                "started_at": datetime.now(timezone.utc) - timedelta(days=5),
                "completed_at": datetime.now(timezone.utc) - timedelta(days=4),
                "notes": "Retouched and color graded."
            },
            # 8. Completed Task 3
            {
                "code": "TSK-108",
                "client": clt_1,
                "workspace": ws_1,
                "content_item": content_item_map["photo_01_fleet.jpg"],
                "type": task_types["POSTING"],
                "stage": stages["POSTED"],
                "status": "completed",
                "priority": "medium",
                "assignee": user_map["fatima@companyos.com"],
                "target_date": today - timedelta(days=2),
                "started_at": datetime.now(timezone.utc) - timedelta(days=3),
                "completed_at": datetime.now(timezone.utc) - timedelta(days=2),
                "notes": "Published to Instagram and LinkedIn feed."
            },
            # 9. Reassigned Task (Shows full reassignment audit history)
            {
                "code": "TSK-109",
                "client": client_map["CLT-002"],
                "workspace": None,
                "content_item": None,
                "type": task_types["EDITING"],
                "stage": None,
                "status": "pending",
                "priority": "medium",
                "assignee": user_map["anjana@companyos.com"],
                "target_date": today + timedelta(days=4),
                "notes": "Reassigned from Vishal to Anjana because Vishal is travelling to Salalah."
            }
        ]

        for t_def in tasks_def:
            task = db.query(Task).filter(Task.task_code == t_def["code"]).first()
            if not task:
                task = Task(
                    task_code=t_def["code"],
                    client_id=t_def["client"].id,
                    workspace_id=t_def["workspace"].id if t_def["workspace"] else None,
                    content_item_id=t_def["content_item"].id if t_def["content_item"] else None,
                    task_type_id=t_def["type"].id,
                    workflow_stage_id=t_def["stage"].id if t_def["stage"] else None,
                    status=t_def["status"],
                    priority=t_def["priority"],
                    assigned_to=t_def["assignee"].id if t_def["assignee"] else None,
                    assigned_by=admin_user.id,
                    target_date=t_def["target_date"],
                    started_at=t_def.get("started_at"),
                    completed_at=t_def.get("completed_at"),
                    notes=t_def["notes"]
                )
                db.add(task)
                db.flush()

                # Add initial history
                db.add(TaskHistory(
                    task_id=task.id,
                    action="TASK_CREATED",
                    new_status=task.status,
                    new_assignee=task.assigned_to,
                    changed_by=admin_user.id,
                    notes=f"Initial seed task creation {task.task_code}"
                ))

                # Special history for TSK-109 (Reassigned)
                if t_def["code"] == "TSK-109":
                    db.add(TaskAssignmentHistory(
                        task_id=task.id,
                        previous_assignee_id=user_map["vishal@companyos.com"].id,
                        new_assignee_id=user_map["anjana@companyos.com"].id,
                        changed_by_id=user_map["manager@companyos.com"].id,
                        reason="Vishal deployed to on-site shoot in Dhofar region."
                    ))
                    db.add(TaskHistory(
                        task_id=task.id,
                        action="TASK_REASSIGNED",
                        previous_assignee=user_map["vishal@companyos.com"].id,
                        new_assignee=user_map["anjana@companyos.com"].id,
                        changed_by=user_map["manager@companyos.com"].id,
                        notes="Reassigned to Anjana"
                    ))

        # -------------------------------------------------------------
        # 10. DOCUMENTS: QUOTATIONS, AGREEMENTS & INVOICES WITH GAPLESS COUNTERS
        # -------------------------------------------------------------
        doc_types = {dt.code: dt for dt in db.query(DocumentType).all()}
        curr_year = today.year

        docs_def = [
            {
                "type": doc_types["QUO"],
                "number": f"QUO-ADX-{curr_year}-001",
                "client": clt_1,
                "company": adox_company,
                "issue_date": today - timedelta(days=30),
                "due_date": today - timedelta(days=15),
                "status": "sent",
                "currency": "OMR",
                "items": [
                    {"desc": "Monthly SMM Management (12 Photos + 4 Posters)", "qty": 1, "rate": 450.00}
                ]
            },
            {
                "type": doc_types["AGR"],
                "number": f"AGR-ADX-{curr_year}-001",
                "client": clt_1,
                "company": adox_company,
                "issue_date": today - timedelta(days=25),
                "due_date": None,
                "status": "sent",
                "currency": "OMR",
                "items": [
                    {"desc": "12-Month Retainer Service Agreement for Social Media", "qty": 1, "rate": 5400.00}
                ]
            },
            {
                "type": doc_types["INV"],
                "number": f"INV-ADX-{curr_year}-001",
                "client": clt_1,
                "company": adox_company,
                "issue_date": today - timedelta(days=10),
                "due_date": today + timedelta(days=20),
                "status": "paid",
                "currency": "OMR",
                "items": [
                    {"desc": "September 2026 Monthly Retainer Fee", "qty": 1, "rate": 450.00}
                ]
            },
            {
                "type": doc_types["QUO"],
                "number": f"QUO-PXL-{curr_year}-001",
                "client": client_map["CLT-002"],
                "company": pixel_company,
                "issue_date": today - timedelta(days=20),
                "due_date": today - timedelta(days=5),
                "status": "sent",
                "currency": "OMR",
                "items": [
                    {"desc": "Ultra SMM Retainer with Reels & Event Photography", "qty": 1, "rate": 500.00}
                ]
            },
            {
                "type": doc_types["INV"],
                "number": f"INV-PXL-{curr_year}-001",
                "client": client_map["CLT-002"],
                "company": pixel_company,
                "issue_date": today - timedelta(days=5),
                "due_date": today + timedelta(days=25),
                "status": "sent",
                "currency": "OMR",
                "items": [
                    {"desc": "September 2026 SMM Retainer", "qty": 1, "rate": 500.00}
                ]
            }
        ]

        for d_def in docs_def:
            doc = db.query(Document).filter(Document.document_number == d_def["number"]).first()
            if not doc:
                subtotal = Decimal("0.00")
                for itm in d_def["items"]:
                    subtotal += Decimal(str(itm["qty"])) * Decimal(str(itm["rate"]))

                tax_amount = Decimal("0.00")
                if d_def["company"].vat_applicable:
                    tax_amount = (subtotal * Decimal("0.05")).quantize(Decimal("0.001"))

                total_amount = subtotal + tax_amount

                doc = Document(
                    document_type_id=d_def["type"].id,
                    document_number=d_def["number"],
                    client_id=d_def["client"].id,
                    billing_company_id=d_def["company"].id,
                    issue_date=d_def["issue_date"],
                    due_date=d_def["due_date"],
                    status=d_def["status"],
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    total_amount=total_amount,
                    currency=d_def["currency"],
                    created_by=admin_user.id
                )
                db.add(doc)
                db.flush()

                for idx, itm in enumerate(d_def["items"]):
                    itm_total = Decimal(str(itm["qty"])) * Decimal(str(itm["rate"]))
                    db.add(DocumentItem(
                        document_id=doc.id,
                        description=itm["desc"],
                        quantity=Decimal(str(itm["qty"])),
                        unit_price=Decimal(str(itm["rate"])),
                        total_price=itm_total,
                        order_index=idx
                    ))

        # Synchronize document counters to ensure next numbers increment seamlessly
        adox_quo_cnt = db.query(DocumentCounter).filter(
            DocumentCounter.billing_company_id == adox_company.id,
            DocumentCounter.document_type_id == doc_types["QUO"].id,
            DocumentCounter.year == curr_year
        ).first()
        if not adox_quo_cnt:
            db.add(DocumentCounter(billing_company_id=adox_company.id, document_type_id=doc_types["QUO"].id, year=curr_year, current_sequence=1))
        else:
            if adox_quo_cnt.current_sequence < 1:
                adox_quo_cnt.current_sequence = 1

        adox_inv_cnt = db.query(DocumentCounter).filter(
            DocumentCounter.billing_company_id == adox_company.id,
            DocumentCounter.document_type_id == doc_types["INV"].id,
            DocumentCounter.year == curr_year
        ).first()
        if not adox_inv_cnt:
            db.add(DocumentCounter(billing_company_id=adox_company.id, document_type_id=doc_types["INV"].id, year=curr_year, current_sequence=1))
        else:
            if adox_inv_cnt.current_sequence < 1:
                adox_inv_cnt.current_sequence = 1

        pxl_quo_cnt = db.query(DocumentCounter).filter(
            DocumentCounter.billing_company_id == pixel_company.id,
            DocumentCounter.document_type_id == doc_types["QUO"].id,
            DocumentCounter.year == curr_year
        ).first()
        if not pxl_quo_cnt:
            db.add(DocumentCounter(billing_company_id=pixel_company.id, document_type_id=doc_types["QUO"].id, year=curr_year, current_sequence=1))
        else:
            if pxl_quo_cnt.current_sequence < 1:
                pxl_quo_cnt.current_sequence = 1

        # -------------------------------------------------------------
        # 11. IN-APP NOTIFICATIONS
        # -------------------------------------------------------------
        notifications_def = [
            {
                "user": user_map["shinoy@companyos.com"],
                "type": "task_assigned",
                "title": "New High Priority Task: TSK-101",
                "message": "You have been assigned to edit photo_05_cargo_ship.jpg.",
                "read": False
            },
            {
                "user": user_map["shinoy@companyos.com"],
                "type": "content_rejected",
                "title": "Content Rejection: photo_04_forklift.jpg",
                "message": "Client requested re-editing: Brighten vehicle exposure and logo.",
                "read": False
            },
            {
                "user": user_map["rahul@companyos.com"],
                "type": "task_assigned",
                "title": "Urgent Task: TSK-102 Poster Design",
                "message": "Poster for Express GCC Freight Rates requires immediate composition.",
                "read": False
            },
            {
                "user": user_map["vishal@companyos.com"],
                "type": "task_assigned",
                "title": "Overdue Notice: TSK-105 Selection",
                "message": "Selection task for White Star Cargo is past due date.",
                "read": True
            },
            {
                "user": user_map["fatima@companyos.com"],
                "type": "approval_received",
                "title": "Approval Received: photo_02_warehouse.jpg",
                "message": "White Star Cargo approved warehouse image. Ready for scheduling.",
                "read": False
            },
            {
                "user": user_map["manager@companyos.com"],
                "type": "client_onboarded",
                "title": "New Active Project: White Star Cargo LLC",
                "message": "Client has been moved to Project Ongoing stage.",
                "read": True
            }
        ]

        for n_def in notifications_def:
            if not db.query(Notification).filter(
                Notification.user_id == n_def["user"].id,
                Notification.title == n_def["title"]
            ).first():
                db.add(Notification(
                    user_id=n_def["user"].id,
                    type=n_def["type"],
                    title=n_def["title"],
                    message=n_def["message"],
                    read=n_def["read"],
                    created_at=datetime.now(timezone.utc) - timedelta(hours=2)
                ))

        # -------------------------------------------------------------
        # 12. IMMUTABLE AUDIT TRAIL
        # -------------------------------------------------------------
        audit_events = [
            ("USER_LOGIN", "user", admin_user.id, "Admin logged into management portal"),
            ("CLIENT_CREATE", "client", clt_1.id, "Created client White Star Cargo LLC"),
            ("PIPELINE_TRANSITION", "client", clt_1.id, "Transitioned White Star Cargo to Project Ongoing"),
            ("WORKSPACE_CREATE", "workspace", ws_1.id, "Created workspace White Star Production"),
            ("CONTENT_REGISTER", "content_item", pending_item.id, "Registered photo_03_port_terminal.jpg"),
            ("APPROVAL_LINK_GENERATE", "client_approval", approval.id, "Generated external client review token"),
            ("TASK_ASSIGN", "task", clt_1.id, "Assigned photo editing tasks to Shinoy Varghese")
        ]

        for act, ent_type, ent_id, desc in audit_events:
            if not db.query(AuditLog).filter(AuditLog.action == act, AuditLog.entity_id == ent_id).first():
                db.add(AuditLog(
                    user_id=admin_user.id,
                    action=act,
                    entity_type=ent_type,
                    entity_id=ent_id,
                    new_data={"description": desc},
                    ip_address="127.0.0.1",
                    user_agent="Company OS Automated Setup",
                    timestamp=datetime.now(timezone.utc) - timedelta(hours=5)
                ))

        db.commit()
        logger.info("Comprehensive database population finished successfully!")

    except Exception as e:
        db.rollback()
        logger.error(f"Comprehensive seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_comprehensive_data()
