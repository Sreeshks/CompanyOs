import uuid
from datetime import date
from fastapi.testclient import TestClient
from app.core.config import settings


def test_user_creation_and_listing(client: TestClient, admin_token_headers: dict):
    # 1. Fetch roles
    roles_res = client.get(f"{settings.API_V1_PREFIX}/roles", headers=admin_token_headers)
    assert roles_res.status_code == 200
    roles = roles_res.json()["data"]
    staff_role = next(r for r in roles if r["code"] == "STAFF")

    # 2. Create user
    user_payload = {
        "employee_code": "EMP-TEST-01",
        "full_name": "Test Staff",
        "email": "teststaff@companyos.com",
        "password": "Password123!",
        "role_id": staff_role["id"],
        "employment_type": "full_time",
        "skills": ["Photography", "Photoshop"]
    }
    create_res = client.post(f"{settings.API_V1_PREFIX}/users", json=user_payload, headers=admin_token_headers)
    assert create_res.status_code == 200
    user_data = create_res.json()["data"]
    assert user_data["email"] == "teststaff@companyos.com"
    assert len(user_data["skills"]) == 2


def test_client_creation_and_code_generation(client: TestClient, admin_token_headers: dict):
    # Fetch billing company
    bc_res = client.get(f"{settings.API_V1_PREFIX}/billing-companies", headers=admin_token_headers)
    assert bc_res.status_code == 200
    companies = bc_res.json()["data"]
    adox_co = next(c for c in companies if c["short_code"] == "ADX")

    client_payload = {
        "business_name": "Al Maha Logistics",
        "contact_person": "Ahmed Al Balushi",
        "email": "contact@almaha.om",
        "phone": "+968 9123 4567",
        "billing_company_id": adox_co["id"]
    }
    res = client.post(f"{settings.API_V1_PREFIX}/clients", json=client_payload, headers=admin_token_headers)
    assert res.status_code == 200
    client_data = res.json()["data"]
    assert client_data["client_code"].startswith("CLT-")
    assert client_data["business_name"] == "Al Maha Logistics"


def test_folder_hierarchy_and_circular_prevention(client: TestClient, admin_token_headers: dict):
    # 1. Create client
    client_res = client.post(
        f"{settings.API_V1_PREFIX}/clients",
        json={
            "business_name": "Folder Test Client",
            "contact_person": "Said",
            "email": "said@client.com"
        },
        headers=admin_token_headers
    )
    client_id = client_res.json()["data"]["id"]

    # 2. Create workspace
    ws_res = client.post(
        f"{settings.API_V1_PREFIX}/workspaces",
        json={"client_id": client_id, "name": "Production Workspace"},
        headers=admin_token_headers
    )
    assert ws_res.status_code == 200
    ws_id = ws_res.json()["data"]["id"]

    # 3. Create parent folder
    f1_res = client.post(
        f"{settings.API_V1_PREFIX}/folders",
        json={"workspace_id": ws_id, "name": "Media"},
        headers=admin_token_headers
    )
    assert f1_res.status_code == 200
    f1_id = f1_res.json()["data"]["id"]

    # 4. Create child folder
    f2_res = client.post(
        f"{settings.API_V1_PREFIX}/folders",
        json={"workspace_id": ws_id, "parent_folder_id": f1_id, "name": "Photos"},
        headers=admin_token_headers
    )
    assert f2_res.status_code == 200
    f2_id = f2_res.json()["data"]["id"]

    # 5. Attempt circular move: move parent f1 into child f2 -> Must Fail
    move_res = client.post(
        f"{settings.API_V1_PREFIX}/folders/{f1_id}/move",
        json={"new_parent_folder_id": f2_id},
        headers=admin_token_headers
    )
    assert move_res.status_code == 400
    assert move_res.json()["error"]["code"] == "CIRCULAR_DEPENDENCY"


def test_document_sequential_numbering(client: TestClient, admin_token_headers: dict):
    # 1. Get document type "Quotation"
    dt_res = client.get(f"{settings.API_V1_PREFIX}/document-types", headers=admin_token_headers)
    doc_types = dt_res.json()["data"]
    quo_type = next(t for t in doc_types if t["code"] == "QUO")

    # 2. Get billing company
    bc_res = client.get(f"{settings.API_V1_PREFIX}/billing-companies", headers=admin_token_headers)
    companies = bc_res.json()["data"]
    adox_co = next(c for c in companies if c["short_code"] == "ADX")

    # 3. Get client
    cl_res = client.get(f"{settings.API_V1_PREFIX}/clients", headers=admin_token_headers)
    target_client = cl_res.json()["data"]["items"][0]

    # 4. Create first quotation
    year = date.today().year
    doc1_res = client.post(
        f"{settings.API_V1_PREFIX}/documents",
        json={
            "document_type_id": quo_type["id"],
            "client_id": target_client["id"],
            "billing_company_id": adox_co["id"],
            "issue_date": str(date.today()),
            "items": [{"description": "SMM Management", "quantity": 1, "unit_price": 300.00}]
        },
        headers=admin_token_headers
    )
    assert doc1_res.status_code == 200
    doc1_num = doc1_res.json()["data"]["document_number"]
    assert doc1_num == f"QUO-ADX-{year}-001"

    # 5. Create second quotation -> Must be sequential
    doc2_res = client.post(
        f"{settings.API_V1_PREFIX}/documents",
        json={
            "document_type_id": quo_type["id"],
            "client_id": target_client["id"],
            "billing_company_id": adox_co["id"],
            "issue_date": str(date.today()),
            "items": [{"description": "SEO Audit", "quantity": 1, "unit_price": 150.00}]
        },
        headers=admin_token_headers
    )
    assert doc2_res.status_code == 200
    doc2_num = doc2_res.json()["data"]["document_number"]
    assert doc2_num == f"QUO-ADX-{year}-002"
