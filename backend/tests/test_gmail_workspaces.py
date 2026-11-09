import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed.demo_seed import seed_demo_data
from app.models.google_account import GoogleAccount
from app.services.gmail_service import SECTOR_BUSINESS_INFO, ensure_utc

client = TestClient(app)

ALL_SIX_SECTORS = [
    "panchayat_health",
    "clinic",
    "vet_clinic",
    "hotel_lodge",
    "restaurant",
    "coaching"
]

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_data(db)
    db.close()

@pytest.fixture
def auth_headers():
    resp = client.post("/api/auth/admin-login", json={"username": "Saran", "password": "1906"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_gmail_status_shared(auth_headers):
    """Verify Gmail status is connected for the authenticated account across all workspaces."""
    resp = client.get("/api/gmail/status", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["is_connected"] is True
    assert data["email"] == "sarannivasusenthil@gmail.com"
    assert len(data["workspaces_enabled"]) == 6
    for sec in ALL_SIX_SECTORS:
        assert sec in data["workspaces_enabled"]
    # Verify sensitive tokens are NEVER leaked in status response
    assert "access_token" not in data
    assert "refresh_token" not in data

def test_switch_across_all_six_workspaces(auth_headers):
    """Verify switching context across all 6 workspaces maintains Gmail access."""
    current_headers = auth_headers
    for sector_id in ALL_SIX_SECTORS:
        resp = client.post("/api/auth/switch-sector", json={"sector_id": sector_id}, headers=current_headers)
        assert resp.status_code == 200, f"Failed switching to {sector_id}: {resp.text}"
        switched_data = resp.json()
        assert switched_data["sector"]["id"] == sector_id
        assert switched_data["user"]["sector_id"] == sector_id
        new_token = switched_data["access_token"]
        current_headers = {"Authorization": f"Bearer {new_token}"}

        # Check Gmail status remains connected in this workspace
        gmail_resp = client.get("/api/gmail/status", headers=current_headers)
        assert gmail_resp.status_code == 200
        gdata = gmail_resp.json()
        assert gdata["is_connected"] is True
        assert gdata["email"] == "sarannivasusenthil@gmail.com"

    # Reset admin user back to system sector
    client.post("/api/auth/switch-sector", json={"sector_id": "system"}, headers=current_headers)

def test_send_test_email_all_six_workspaces(auth_headers):
    """Verify workspace-branded email dispatch works for each of the 6 businesses."""
    for sector_id in ALL_SIX_SECTORS:
        resp = client.post(
            "/api/gmail/send-test-email",
            json={
                "sector_id": sector_id,
                "recipient_email": "sarannivasusenthil@gmail.com"
            },
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Failed test email for {sector_id}: {resp.text}"
        res_data = resp.json()
        assert res_data["success"] is True
        assert res_data["workspace_id"] == sector_id
        assert res_data["recipient_email"] == "sarannivasusenthil@gmail.com"
        assert "message_id" in res_data
        assert res_data["business_name"] == SECTOR_BUSINESS_INFO[sector_id]["name"]

def test_send_workspace_notification(auth_headers):
    """Verify notification dispatch with custom variables for a specific business."""
    payload = {
        "sector_id": "clinic",
        "recipient_email": "sarannivasusenthil@gmail.com",
        "recipient_name": "Saran Nivasu",
        "reference_number": "VYL-CLN-TEST-001",
        "notification_type": "Appointment Confirmation",
        "details": {
            "doctor": "Dr. Karthik Sundaram",
            "department": "Cardiology",
            "time_slot": "10-Nov-2026 at 10:30 AM"
        }
    }
    resp = client.post("/api/gmail/send-notification", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert data["workspace_id"] == "clinic"
    assert data["reference_number"] == "VYL-CLN-TEST-001"

def test_sector_business_info_completeness():
    """Verify all 6 sectors have dedicated business metadata and isolation."""
    for sector_id in ALL_SIX_SECTORS:
        assert sector_id in SECTOR_BUSINESS_INFO
        info = SECTOR_BUSINESS_INFO[sector_id]
        assert info["name"]
        assert info["name_ta"]
        assert info["department"]
        assert info["contact_phone"]
        assert info["contact_email"]
        assert info["signoff"]
        assert info["badge_color"]

def test_token_refresh_lifecycle(auth_headers):
    """Verify auto-refresh / manual refresh updates token expiry properly."""
    db = SessionLocal()
    acc = db.query(GoogleAccount).filter(GoogleAccount.email == "sarannivasusenthil@gmail.com").first()
    assert acc is not None
    # Set expiry in the past to simulate expiration
    acc.token_expiry = datetime.now(timezone.utc) - timedelta(hours=2)
    db.commit()
    db.close()

    resp = client.post("/api/gmail/refresh", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["is_connected"] is True
    assert data["token_status"] in ("valid", "active")
    assert data["email"] == "sarannivasusenthil@gmail.com"

    # Verify token expiry is now in the future
    db = SessionLocal()
    acc_after = db.query(GoogleAccount).filter(GoogleAccount.email == "sarannivasusenthil@gmail.com").first()
    expiry = ensure_utc(acc_after.token_expiry)
    assert expiry > datetime.now(timezone.utc)
    db.close()

def test_disconnect_and_reconnect_flow(auth_headers):
    """Verify disconnect revokes active status and reconnect restores it."""
    # Disconnect
    disc_resp = client.post("/api/gmail/disconnect", json={"email": "sarannivasusenthil@gmail.com"}, headers=auth_headers)
    assert disc_resp.status_code == 200
    disc_data = disc_resp.json()
    assert disc_data["is_connected"] is False

    # Check status is now false
    stat_resp = client.get("/api/gmail/status", headers=auth_headers)
    assert stat_resp.status_code == 200
    assert stat_resp.json()["is_connected"] is False

    # Reconnect
    conn_resp = client.post(
        "/api/gmail/connect",
        json={"email": "sarannivasusenthil@gmail.com", "auth_code": "mock_test_code_123"},
        headers=auth_headers
    )
    assert conn_resp.status_code == 200
    conn_data = conn_resp.json()
    assert conn_data["is_connected"] is True
    assert conn_data["email"] == "sarannivasusenthil@gmail.com"

    # Check status is restored
    stat_resp2 = client.get("/api/gmail/status", headers=auth_headers)
    assert stat_resp2.status_code == 200
    assert stat_resp2.json()["is_connected"] is True
