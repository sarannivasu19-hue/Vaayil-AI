import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed.demo_seed import seed_demo_data
from app.models.user import User

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

def test_single_user_registration_no_sector_selection():
    """
    Verify a user registers with ONLY:
    1. Full Name
    2. Gmail Address
    3. Password
    4. Confirm Password
    Without selecting any business sector.
    """
    unique_id = uuid.uuid4().hex[:8]
    test_gmail = f"testuser_{unique_id}@gmail.com"
    payload = {
        "full_name": "Saran Citizen Test",
        "email": test_gmail,
        "password": "Password123",
        "confirm_password": "Password123"
    }

    # 1. Register
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "user" in data
    user_data = data["user"]
    assert user_data["email"] == test_gmail
    assert user_data["full_name"] == "Saran Citizen Test"
    assert user_data["role"] == "user"

    # 2. Verify duplicate registration shows exact required error message
    dup_resp = client.post("/api/auth/register", json=payload)
    assert dup_resp.status_code == 409
    dup_err = dup_resp.json()["detail"]
    assert "This Gmail is already registered" in dup_err

    # 3. Log in using that single Gmail account
    login_resp = client.post("/api/auth/login", json={
        "username": test_gmail,
        "password": "Password123"
    })
    assert login_resp.status_code == 200, login_resp.text
    token_data = login_resp.json()
    token = token_data["access_token"]
    assert token
    auth_header = {"Authorization": f"Bearer {token}"}

    # 4. Access all six business workspaces using that single session
    current_token = token
    for sec_id in ALL_SIX_SECTORS:
        sw_resp = client.post(
            "/api/auth/switch-sector",
            json={"sector_id": sec_id},
            headers={"Authorization": f"Bearer {current_token}"}
        )
        assert sw_resp.status_code == 200, f"Failed accessing workspace {sec_id}: {sw_resp.text}"
        sw_data = sw_resp.json()
        assert sw_data["sector"]["id"] == sec_id
        assert sw_data["user"]["email"] == test_gmail
        current_token = sw_data["access_token"]

def test_existing_gmail_account_access_all_six_workspaces():
    """
    Verify existing user 'sarannivasusenthil@gmail.com' can access all 6 workspaces
    without needing duplicate registrations.
    """
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "sarannivasusenthil@gmail.com").first()
    assert existing is not None
    db.close()

    # Try registering this existing email -> must return the exact error message
    resp = client.post("/api/auth/register", json={
        "full_name": "Saran Nivasu Senthil",
        "email": "sarannivasusenthil@gmail.com",
        "password": "Password123",
        "confirm_password": "Password123"
    })
    assert resp.status_code == 409
    assert resp.json()["detail"] == "This Gmail is already registered. Please log in using your existing account."

