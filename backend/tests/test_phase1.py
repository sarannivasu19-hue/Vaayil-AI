import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed.demo_seed import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database tables and seed data are populated for tests."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_data(db)
    db.close()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["version"] == "1.0.0"
    assert data["active_sectors_count"] == 6
    assert "gnani_stt_configured" in data
    assert "gnani_tts_configured" in data


def test_list_sectors():
    response = client.get("/api/sectors")
    assert response.status_code == 200
    sectors = response.json()
    assert len(sectors) == 6
    sector_ids = [s["id"] for s in sectors]
    assert "panchayat_health" in sector_ids
    assert "clinic" in sector_ids
    assert "vet_clinic" in sector_ids
    assert "hotel_lodge" in sector_ids
    assert "restaurant" in sector_ids
    assert "coaching" in sector_ids

    # Check localization and styling attributes
    panchayat = next(s for s in sectors if s["id"] == "panchayat_health")
    assert "ஊராட்சி" in panchayat["display_name_ta"]
    assert panchayat["accent_color"] == "#06b6d4"


def test_login_success():
    response = client.post(
        "/api/auth/login",
        json={"username": "panchayat_admin", "password": "vaayil123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "panchayat_admin"
    assert data["user"]["sector_id"] == "panchayat_health"
    assert data["sector"]["id"] == "panchayat_health"


def test_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        json={"username": "panchayat_admin", "password": "wrong_password"}
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_auth_me_authenticated():
    # First login to get token
    login_res = client.post(
        "/api/auth/login",
        json={"username": "clinic_admin", "password": "vaayil123"}
    )
    token = login_res.json()["access_token"]

    # Call /api/auth/me with Bearer token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["user"]["username"] == "clinic_admin"
    assert data["sector"]["id"] == "clinic"


def test_auth_me_unauthorized():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

