from fastapi.testclient import TestClient
from app.core.config import settings
from tests.conftest import TestingSessionLocal
from app.models.content import ContentItem
from app.models.workflow import WorkflowStage
from app.models.rejection import Rejection


def test_public_client_approval_and_rejection_flow(client: TestClient):
    db = TestingSessionLocal()
    try:
        # Step 1: Admin Login
        login_res = client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={
                "email": settings.FIRST_SUPERUSER_EMAIL,
                "password": settings.FIRST_SUPERUSER_PASSWORD
            }
        )
        assert login_res.status_code == 200
        admin_token = login_res.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: Create Service, Package, and Client
        svc_res = client.post(
            f"{settings.API_V1_PREFIX}/services",
            json={"name": "Approval Service", "code": "APP_SVC", "type": "retainer", "recurring": True},
            headers=admin_headers
        )
        assert svc_res.status_code == 200
        service_id = svc_res.json()["data"]["id"]

        pkg_res = client.post(
            f"{settings.API_V1_PREFIX}/packages",
            json={
                "service_id": service_id,
                "name": "Approval Package",
                "price": 250.00,
                "duration": "monthly"
            },
            headers=admin_headers
        )
        assert pkg_res.status_code == 200
        package_id = pkg_res.json()["data"]["id"]

        client_res = client.post(
            f"{settings.API_V1_PREFIX}/clients",
            json={
                "business_name": "Sultan Al Rawahi Ent",
                "contact_person": "Sultan",
                "email": "sultan@rawahi.om",
                "phone": "+968 9333 4444",
                "service_id": service_id,
                "package_id": package_id
            },
            headers=admin_headers
        )
        assert client_res.status_code == 200
        client_id = client_res.json()["data"]["id"]

        # Step 3: Create Workspace & Deliverables
        ws_res = client.post(
            f"{settings.API_V1_PREFIX}/workspaces",
            json={"client_id": client_id, "name": "Sultan Media Workspace"},
            headers=admin_headers
        )
        assert ws_res.status_code == 200
        workspace_id = ws_res.json()["data"]["id"]

        ct_res = client.get(f"{settings.API_V1_PREFIX}/content-types", headers=admin_headers)
        photo_ct = ct_res.json()["data"][0]

        pending_stage = db.query(WorkflowStage).filter(WorkflowStage.name == "Pending Client Approval").first()
        ready_stage = db.query(WorkflowStage).filter(WorkflowStage.name == "Ready to Post").first()
        rejected_stage = db.query(WorkflowStage).filter(WorkflowStage.name == "Rejected - Needs Edit").first()
        assert pending_stage and ready_stage and rejected_stage

        # Create two deliverables in Pending Client Approval stage
        item1_res = client.post(
            f"{settings.API_V1_PREFIX}/content",
            json={
                "client_id": client_id,
                "workspace_id": workspace_id,
                "content_type_id": photo_ct["id"],
                "file_name": "photo_01_edited.jpg",
                "display_name": "Hero Product Edit 01",
                "target_month": "November 2026",
                "sequence_number": 1
            },
            headers=admin_headers
        )
        assert item1_res.status_code == 200
        item1_id = item1_res.json()["data"]["id"]

        item2_res = client.post(
            f"{settings.API_V1_PREFIX}/content",
            json={
                "client_id": client_id,
                "workspace_id": workspace_id,
                "content_type_id": photo_ct["id"],
                "file_name": "photo_02_edited.jpg",
                "display_name": "Lifestyle Photo Edit 02",
                "target_month": "November 2026",
                "sequence_number": 2
            },
            headers=admin_headers
        )
        assert item2_res.status_code == 200
        item2_id = item2_res.json()["data"]["id"]

        # Set stage to Pending Client Approval
        ci1 = db.query(ContentItem).filter(ContentItem.id == item1_id).first()
        ci2 = db.query(ContentItem).filter(ContentItem.id == item2_id).first()
        ci1.current_stage_id = pending_stage.id
        ci2.current_stage_id = pending_stage.id
        db.commit()

        # Step 4: Agency generates public approval review link for this client
        link_res = client.post(
            f"{settings.API_V1_PREFIX}/approvals/generate-link",
            headers=admin_headers,
            json={"client_id": client_id}
        )
        assert link_res.status_code == 200, f"Generate link failed: {link_res.text}"
        token = link_res.json()["data"]["access_token"]
        assert token, "Token must be generated"

        # Step 5: External Client accesses review portal WITHOUT ANY AUTH HEADERS
        public_res = client.get(f"{settings.API_V1_PREFIX}/approvals/review/{token}")
        assert public_res.status_code == 200, f"Public review failed: {public_res.text}"
        public_data = public_res.json()["data"]
        assert public_data["client_name"] == "Sultan Al Rawahi Ent"
        assert len(public_data["deliverables"]) >= 2

        # Step 6: Client Approves Item 1
        approve_res = client.post(
            f"{settings.API_V1_PREFIX}/approvals/review/{token}/decision",
            json={
                "decision": "approved",
                "content_id": item1_id,
                "approved_by_name": "Sultan Al Rawahi"
            }
        )
        assert approve_res.status_code == 200, f"Decision approval failed: {approve_res.text}"

        # Verify Item 1 transitioned to Ready to Post
        db.expire_all()
        ci1_updated = db.query(ContentItem).filter(ContentItem.id == item1_id).first()
        assert ci1_updated.current_stage_id == ready_stage.id

        # Step 7: Client Rejects / Requests Changes on Item 2 with Reason
        reject_res = client.post(
            f"{settings.API_V1_PREFIX}/approvals/review/{token}/decision",
            json={
                "decision": "rejected",
                "content_id": item2_id,
                "rejection_reason": "Tone is too dark, please brighten skin and smooth background",
                "approved_by_name": "Sultan Al Rawahi"
            }
        )
        assert reject_res.status_code == 200, f"Decision rejection failed: {reject_res.text}"

        # Verify Item 2 returned to Rejected - Needs Edit stage
        db.expire_all()
        ci2_updated = db.query(ContentItem).filter(ContentItem.id == item2_id).first()
        assert ci2_updated.current_stage_id == rejected_stage.id

        # Verify rejection record was logged
        rejection_entry = db.query(Rejection).filter(Rejection.content_id == item2_id).first()
        assert rejection_entry is not None
        assert "Tone is too dark" in rejection_entry.reason

    finally:
        db.close()
