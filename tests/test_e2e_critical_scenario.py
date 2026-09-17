from datetime import date
from fastapi.testclient import TestClient
from app.core.config import settings


def test_complete_company_os_e2e_workflow(client: TestClient):
    """
    Critical End-to-End Test Scenario covering the full lifecycle (Steps 1 to 27).
    """

    # -------------------------------------------------------------
    # Step 1: Admin logs in.
    # -------------------------------------------------------------
    login_res = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        json={
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "password": settings.FIRST_SUPERUSER_PASSWORD
        }
    )
    assert login_res.status_code == 200, "Step 1 Failed: Admin login"
    admin_token = login_res.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch staff role for creating team members
    roles_res = client.get(f"{settings.API_V1_PREFIX}/roles", headers=admin_headers)
    roles = roles_res.json()["data"]
    staff_role_id = next(r["id"] for r in roles if r["code"] == "STAFF")

    # -------------------------------------------------------------
    # Step 2: Admin creates users (User A for Selection, User B for Editing, User C for Posting).
    # -------------------------------------------------------------
    def create_staff(code, name, email):
        res = client.post(
            f"{settings.API_V1_PREFIX}/users",
            json={
                "employee_code": code,
                "full_name": name,
                "email": email,
                "password": "Password123!",
                "role_id": staff_role_id
            },
            headers=admin_headers
        )
        assert res.status_code == 200, f"Step 2 Failed: Creating {name}"
        return res.json()["data"]

    user_a = create_staff("EMP-SEL-01", "User A (Selector)", "usera@companyos.com")
    user_b = create_staff("EMP-EDT-01", "User B (Editor)", "userb@companyos.com")
    user_c = create_staff("EMP-PST-01", "User C (Poster)", "userc@companyos.com")

    # Helper function for staff tokens
    def get_token(email):
        res = client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={"email": email, "password": "Password123!"}
        )
        return {"Authorization": f"Bearer {res.json()['data']['access_token']}"}

    user_a_headers = get_token("usera@companyos.com")
    user_b_headers = get_token("userb@companyos.com")
    user_c_headers = get_token("userc@companyos.com")

    # -------------------------------------------------------------
    # Step 3: Admin creates service.
    # -------------------------------------------------------------
    service_res = client.post(
        f"{settings.API_V1_PREFIX}/services",
        json={
            "name": "E2E Premium Media Service",
            "code": "E2E_MEDIA",
            "type": "retainer",
            "recurring": True
        },
        headers=admin_headers
    )
    assert service_res.status_code == 200, "Step 3 Failed: Creating service"
    service_id = service_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 4: Admin creates package.
    # -------------------------------------------------------------
    pkg_res = client.post(
        f"{settings.API_V1_PREFIX}/packages",
        json={
            "service_id": service_id,
            "name": "E2E Pro Package",
            "price": 450.00,
            "duration": "monthly"
        },
        headers=admin_headers
    )
    assert pkg_res.status_code == 200, "Step 4 Failed: Creating package"
    package_id = pkg_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 5 & 6: Admin creates client and receives CLT ID.
    # -------------------------------------------------------------
    client_res = client.post(
        f"{settings.API_V1_PREFIX}/clients",
        json={
            "business_name": "White Star Cargo LLC",
            "contact_person": "Tariq Al Zadjali",
            "email": "tariq@whitestar.om",
            "phone": "+968 9876 5432",
            "service_id": service_id,
            "package_id": package_id
        },
        headers=admin_headers
    )
    assert client_res.status_code == 200, "Step 5 Failed: Creating client"
    client_data = client_res.json()["data"]
    client_id = client_data["id"]
    client_code = client_data["client_code"]
    assert client_code.startswith("CLT-"), "Step 6 Failed: Client code format"

    # Configure staff assignments for the client
    task_types_res = client.get(f"{settings.API_V1_PREFIX}/task-types", headers=admin_headers)
    task_types = task_types_res.json()["data"]
    selection_tt = next(t for t in task_types if t["code"] == "SELECTION")
    editing_tt = next(t for t in task_types if t["code"] == "EDITING")
    posting_tt = next(t for t in task_types if t["code"] == "POSTING")

    client.post(
        f"{settings.API_V1_PREFIX}/clients/{client_id}/staff-assignments",
        json={"task_type_id": selection_tt["id"], "user_id": user_a["id"]},
        headers=admin_headers
    )
    client.post(
        f"{settings.API_V1_PREFIX}/clients/{client_id}/staff-assignments",
        json={"task_type_id": editing_tt["id"], "user_id": user_b["id"]},
        headers=admin_headers
    )
    client.post(
        f"{settings.API_V1_PREFIX}/clients/{client_id}/staff-assignments",
        json={"task_type_id": posting_tt["id"], "user_id": user_c["id"]},
        headers=admin_headers
    )

    # -------------------------------------------------------------
    # Step 7: Authorized user creates client workspace.
    # -------------------------------------------------------------
    ws_res = client.post(
        f"{settings.API_V1_PREFIX}/workspaces",
        json={"client_id": client_id, "name": "White Star Workspace"},
        headers=admin_headers
    )
    assert ws_res.status_code == 200, "Step 7 Failed: Workspace creation"
    workspace_id = ws_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 8: User creates Photos folder.
    # -------------------------------------------------------------
    photos_f_res = client.post(
        f"{settings.API_V1_PREFIX}/folders",
        json={"workspace_id": workspace_id, "name": "Photos"},
        headers=admin_headers
    )
    assert photos_f_res.status_code == 200, "Step 8 Failed: Photos folder creation"
    photos_folder_id = photos_f_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 9: User creates Raw folder.
    # -------------------------------------------------------------
    raw_f_res = client.post(
        f"{settings.API_V1_PREFIX}/folders",
        json={"workspace_id": workspace_id, "parent_folder_id": photos_folder_id, "name": "Raw"},
        headers=admin_headers
    )
    assert raw_f_res.status_code == 200, "Step 9 Failed: Raw folder creation"
    raw_folder_id = raw_f_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 10: User registers photo items.
    # -------------------------------------------------------------
    content_types_res = client.get(f"{settings.API_V1_PREFIX}/content-types", headers=admin_headers)
    photo_ct = next(ct for ct in content_types_res.json()["data"] if ct["code"] == "PHOTO")

    item_res = client.post(
        f"{settings.API_V1_PREFIX}/content",
        json={
            "client_id": client_id,
            "workspace_id": workspace_id,
            "folder_id": raw_folder_id,
            "content_type_id": photo_ct["id"],
            "file_name": "01.jpg",
            "display_name": "White Star Truck Fleet",
            "sequence_number": 1,
            "target_month": "2026-09"
        },
        headers=admin_headers
    )
    assert item_res.status_code == 200, "Step 10 Failed: Content item registration"
    content_item = item_res.json()["data"]
    content_id = content_item["id"]

    # -------------------------------------------------------------
    # Step 11 & 12: Selection task is created and assigned to User A.
    # -------------------------------------------------------------
    sel_task_res = client.post(
        f"{settings.API_V1_PREFIX}/tasks",
        json={
            "client_id": client_id,
            "workspace_id": workspace_id,
            "content_item_id": content_id,
            "task_type_id": selection_tt["id"],
            "assigned_to": user_a["id"],
            "target_date": str(date.today()),
            "notes": "Select best angles for fleet"
        },
        headers=admin_headers
    )
    assert sel_task_res.status_code == 200, "Step 11 & 12 Failed: Selection task creation"
    sel_task_id = sel_task_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Step 13: User A sees task in My Work.
    # -------------------------------------------------------------
    my_work_a = client.get(f"{settings.API_V1_PREFIX}/my-work/pending", headers=user_a_headers)
    assert my_work_a.status_code == 200, "Step 13 Failed: User A My Work"
    user_a_tasks = my_work_a.json()["data"]["items"]
    assert any(t["id"] == sel_task_id for t in user_a_tasks), "User A task not in My Work"

    # -------------------------------------------------------------
    # Step 14: User A completes selection.
    # -------------------------------------------------------------
    complete_sel = client.post(
        f"{settings.API_V1_PREFIX}/tasks/{sel_task_id}/complete",
        json={"notes": "Selected 01.jpg"},
        headers=user_a_headers
    )
    assert complete_sel.status_code == 200, "Step 14 Failed: User A completing selection"

    # -------------------------------------------------------------
    # Step 15 & 16: Editing task is created and assigned to User B (via workflow transition 'Select').
    # -------------------------------------------------------------
    trans_select = client.post(
        f"{settings.API_V1_PREFIX}/content/{content_id}/transition",
        json={"action": "Select"},
        headers=admin_headers
    )
    assert trans_select.status_code == 200, "Step 15 Failed: Content transition 'Select'"
    assert trans_select.json()["data"]["stage_code"] == "SELECTED"

    # Advance to Editing
    trans_edit = client.post(
        f"{settings.API_V1_PREFIX}/content/{content_id}/transition",
        json={"action": "Start Editing"},
        headers=admin_headers
    )
    assert trans_edit.status_code == 200
    assert trans_edit.json()["data"]["stage_code"] == "EDITING"

    # -------------------------------------------------------------
    # Step 17: User B sees editing task in My Work.
    # -------------------------------------------------------------
    my_work_b = client.get(f"{settings.API_V1_PREFIX}/my-work/pending", headers=user_b_headers)
    assert my_work_b.status_code == 200, "Step 17 Failed: User B My Work"
    user_b_tasks = my_work_b.json()["data"]["items"]
    assert len(user_b_tasks) >= 1, "User B should have at least 1 task"
    edit_task = next(t for t in user_b_tasks if t["content_item_id"] == content_id)

    # -------------------------------------------------------------
    # Step 18: User B completes editing.
    # -------------------------------------------------------------
    complete_edit = client.post(
        f"{settings.API_V1_PREFIX}/tasks/{edit_task['id']}/complete",
        json={"notes": "Color retouched and balanced"},
        headers=user_b_headers
    )
    assert complete_edit.status_code == 200, "Step 18 Failed: User B completing editing"

    # -------------------------------------------------------------
    # Step 19: Content moves to Pending Client Approval.
    # -------------------------------------------------------------
    trans_approval = client.post(
        f"{settings.API_V1_PREFIX}/content/{content_id}/transition",
        json={"action": "Submit for Approval"},
        headers=admin_headers
    )
    assert trans_approval.status_code == 200, "Step 19 Failed: Submit for approval"
    assert trans_approval.json()["data"]["stage_code"] == "PENDING_APPROVAL"

    # -------------------------------------------------------------
    # Step 20: Client approves (using isolated portal review link).
    # -------------------------------------------------------------
    approval_link_res = client.post(
        f"{settings.API_V1_PREFIX}/approvals/generate-link",
        json={"content_id": content_id},
        headers=admin_headers
    )
    assert approval_link_res.status_code == 200
    token = approval_link_res.json()["data"]["access_token"]

    # Public client review portal decision
    decision_res = client.post(
        f"{settings.API_V1_PREFIX}/approvals/review/{token}/decision",
        json={"decision": "approved", "approved_by_name": "Tariq Al Zadjali"}
    )
    assert decision_res.status_code == 200, "Step 20 Failed: Client approval"

    # -------------------------------------------------------------
    # Step 21 & 22: Posting task is created and assigned to User C.
    # -------------------------------------------------------------
    # Approval automatically transitioned content to READY_TO_POST and triggered Posting task for User C
    content_after_approve = client.get(f"{settings.API_V1_PREFIX}/content/{content_id}", headers=admin_headers).json()["data"]
    assert content_after_approve["stage_code"] == "READY_TO_POST"

    # -------------------------------------------------------------
    # Step 23: User C sees posting in My Work.
    # -------------------------------------------------------------
    my_work_c = client.get(f"{settings.API_V1_PREFIX}/my-work/pending", headers=user_c_headers)
    assert my_work_c.status_code == 200, "Step 23 Failed: User C My Work"
    user_c_tasks = my_work_c.json()["data"]["items"]
    assert len(user_c_tasks) >= 1, "User C should have posting task"
    post_task = next(t for t in user_c_tasks if t["content_item_id"] == content_id)

    # -------------------------------------------------------------
    # Step 24 & 25: User C completes posting and Content becomes Posted.
    # -------------------------------------------------------------
    complete_post = client.post(
        f"{settings.API_V1_PREFIX}/tasks/{post_task['id']}/complete",
        json={"notes": "Posted to Instagram and LinkedIn"},
        headers=user_c_headers
    )
    assert complete_post.status_code == 200, "Step 24 Failed: User C completing posting"

    trans_posted = client.post(
        f"{settings.API_V1_PREFIX}/content/{content_id}/transition",
        json={"action": "Mark Posted"},
        headers=admin_headers
    )
    assert trans_posted.status_code == 200, "Step 25 Failed: Content marked posted"
    assert trans_posted.json()["data"]["stage_code"] == "POSTED"

    # -------------------------------------------------------------
    # Step 26: Audit history contains every important action.
    # -------------------------------------------------------------
    audit_res = client.get(
        f"{settings.API_V1_PREFIX}/audit-logs?page_size=100",
        headers=admin_headers
    )
    assert audit_res.status_code == 200, "Step 26 Failed: Audit logs"
    audit_items = audit_res.json()["data"]["items"]
    actions = [a["action"] for a in audit_items]
    assert "USER_CREATE" in actions
    assert "CLIENT_CREATE" in actions
    assert "WORKSPACE_CREATE" in actions
    assert "FOLDER_CREATE" in actions
    assert "CONTENT_CREATE" in actions
    assert "TASK_COMPLETE" in actions
    assert "CLIENT_APPROVED" in actions

    # -------------------------------------------------------------
    # Step 27: Dashboard reflects completed work.
    # -------------------------------------------------------------
    dashboard_res = client.get(f"{settings.API_V1_PREFIX}/dashboard/company-overview", headers=admin_headers)
    assert dashboard_res.status_code == 200, "Step 27 Failed: Dashboard overview"
    dash_data = dashboard_res.json()["data"]
    assert dash_data["active_clients"] >= 1
    assert dash_data["completed_tasks"] >= 3
    assert dash_data["completion_percentage"] > 0.0

    print("\n>>> CRITICAL E2E TEST: ALL 27 STEPS COMPLETED AND VERIFIED SUCCESSFULLY! <<<")
