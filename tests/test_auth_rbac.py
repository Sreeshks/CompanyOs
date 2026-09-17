import pytest
from fastapi.testclient import TestClient
from app.core.config import settings


def test_login_success(client: TestClient):
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        json={
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "password": settings.FIRST_SUPERUSER_PASSWORD
        }
    )
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
    assert "refresh_token" in json_data["data"]


def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/login",
        json={
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code == 401
    json_data = response.json()
    assert json_data["success"] is False
    assert json_data["error"]["code"] == "UNAUTHORIZED"


def test_get_me(client: TestClient, admin_token_headers: dict):
    response = client.get(
        f"{settings.API_V1_PREFIX}/auth/me",
        headers=admin_token_headers
    )
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["email"] == settings.FIRST_SUPERUSER_EMAIL


def test_unauthorized_access(client: TestClient):
    response = client.get(f"{settings.API_V1_PREFIX}/users")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
