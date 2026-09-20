from fastapi.testclient import TestClient
from app.core.config import settings
from tests.conftest import TestingSessionLocal
from app.models.task import Task
from app.models.workflow import WorkflowStage


def test_return_to_selected_cancels_tasks_and_resets_stage(client: TestClient):
    db = TestingSessionLocal()
    try:
        # Step 1: Login admin
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

        # Step 2: Create service and package
        svc_res = client.post(
            f"{settings.API_V1_PREFIX}/services",
            json={"name": "Revert Test Service", "code": "REVERT_MEDIA", "type": "retainer", "recurring": True},
            headers=admin_headers
        )
        assert svc_res.status_code == 200
        service_id = svc_res.json()["data"]["id"]

        pkg_res = client.post(
            f"{settings.API_V1_PREFIX}/packages",
            json={
                "service_id": service_id,
                "name": "Revert Test Package",
                "price": 100.00,
                "duration": "monthly"
            },
            headers=admin_headers
        )
        assert pkg_res.status_code == 200
        package_id = pkg_res.json()["data"]["id"]

        # Step 3: Create Client
        client_res = client.post(
            f"{settings.API_V1_PREFIX}/clients",
            json={
                "business_name": "Revert Flow Testing Client",
                "contact_person": "Revert Manager",
                "email": "revert@test.om",
                "phone": "+968 9111 2222",
                "service_id": service_id,
                "package_id": package_id
            },
            headers=admin_headers
        )
        assert client_res.status_code == 200
        client_id = client_res.json()["data"]["id"]

        # Step 4: Create Workspace & Folders
        ws_res = client.post(
            f"{settings.API_V1_PREFIX}/workspaces",
            json={"client_id": client_id, "name": "Revert Workspace"},
            headers=admin_headers
        )
        assert ws_res.status_code == 200
        workspace_id = ws_res.json()["data"]["id"]

        # Step 5: Get photo content type and Selected/Editing stages
        ct_res = client.get(f"{settings.API_V1_PREFIX}/content-types", headers=admin_headers)
        photo_ct = ct_res.json()["data"][0]

        selected_stage = db.query(WorkflowStage).filter(WorkflowStage.name == "Selected").first()
        editing_stage = db.query(WorkflowStage).filter(WorkflowStage.name == "Editing").first()
        assert selected_stage and editing_stage

        # Create deliverable directly in Selected stage
        item_res = client.post(
            f"{settings.API_V1_PREFIX}/content",
            json={
                "client_id": client_id,
                "workspace_id": workspace_id,
                "content_type_id": photo_ct["id"],
                "file_name": "revert_test.jpg",
                "display_name": "Revert Test Photo",
                "target_month": "October 2026",
                "sequence_number": 1
            },
            headers=admin_headers
        )
        assert item_res.status_code == 200
        item_id = item_res.json()["data"]["id"]

        # Ensure item is in Selected stage
        item_obj = db.query(Task).first() # ping
        from app.models.content import ContentItem
        ci = db.query(ContentItem).filter(ContentItem.id == item_id).first()
        ci.current_stage_id = selected_stage.id
        db.commit()

        from app.models.user import User
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()

        # Step 6: Transition forward to Editing (creates editing task)
        trans_res = client.post(
            f"{settings.API_V1_PREFIX}/content/{item_id}/transition",
            headers=admin_headers,
            json={"action": "Start Editing", "days_allotted": 2, "assigned_user_id": str(admin_user.id)}
        )
        assert trans_res.status_code == 200, f"Transition failed: {trans_res.text}"
        assert trans_res.json()["data"]["current_stage_id"] == str(editing_stage.id)

        # Verify an editing task is created and active
        active_task = db.query(Task).filter(
            Task.content_item_id == item_id,
            Task.status.in_(["pending", "in_progress"])
        ).first()
        assert active_task is not None, "Editing task should have been created"
        task_id = active_task.id

        # Step 7: REVERT back to Selected using "Return to Selected"
        revert_res = client.post(
            f"{settings.API_V1_PREFIX}/content/{item_id}/transition",
            headers=admin_headers,
            json={"action": "Return to Selected"}
        )
        assert revert_res.status_code == 200, f"Revert failed: {revert_res.text}"
        revert_data = revert_res.json()["data"]

        # Step 8: Verify deliverable is back in Selected stage and assigned user is cleared
        assert revert_data["current_stage_id"] == str(selected_stage.id)
        assert revert_data.get("assigned_user_id") is None

        # Step 9: Verify task is cancelled with descriptive cancellation note
        db.expire_all()
        task = db.query(Task).filter(Task.id == task_id).first()
        assert task.status == "cancelled"
        assert "[Cancelled — Deliverable returned to Selected]" in (task.notes or "")

    finally:
        db.close()
