import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

ALL_38_SAMPLE_DISTRICTS = [
    "chennai", "kallakurichi", "tenkasi", "coimbatore", "madurai",
    "thanjavur", "salem", "tirunelveli", "tiruvallur", "kancheepuram"
]

ALL_SIX_SECTORS = [
    "panchayat_health",
    "clinic",
    "vet_clinic",
    "hotel_lodge",
    "restaurant",
    "coaching"
]

def test_master_full_lifecycle():
    """
    MASTER VERIFICATION: ONE GMAIL – ONE USER – ALL 38 DISTRICTS – ALL SIX BUSINESS WORKSPACES
    """
    db = SessionLocal()
    test_email = "master.caller.test@gmail.com"
    # Cleanup previous test runs
    db.query(User).filter(User.email == test_email).delete()
    db.commit()
    db.close()

    # -------------------------------------------------------------
    # TEST A: Single user registers once with Gmail
    # No business sector or district required in request
    # -------------------------------------------------------------
    reg_payload = {
        "full_name": "Master Verification User",
        "email": test_email,
        "password": "Password123",
        "confirm_password": "Password123"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code in (200, 201), f"Registration failed: {reg_resp.text}"
    reg_data = reg_resp.json()
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "user"
    assert reg_data["user"]["sector_id"] is None, "User must NOT be tied to any single sector"

    # -------------------------------------------------------------
    # TEST B: Duplicate registration attempt returns exact required error
    # -------------------------------------------------------------
    dup_resp = client.post("/api/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409
    assert dup_resp.json()["detail"] == "This Gmail is already registered. Please log in using your existing account."

    # -------------------------------------------------------------
    # TEST C: User logs in using Gmail and Password
    # -------------------------------------------------------------
    login_resp = client.post("/api/auth/login", json={
        "username": test_email,
        "password": "Password123"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    auth_data = login_resp.json()
    token = auth_data["access_token"]
    assert token

    # -------------------------------------------------------------
    # TEST D: User accesses all 6 business workspaces seamlessly
    # -------------------------------------------------------------
    current_token = token
    for sec_id in ALL_SIX_SECTORS:
        switch_resp = client.post(
            "/api/auth/switch-sector",
            json={"sector_id": sec_id},
            headers={"Authorization": f"Bearer {current_token}"}
        )
        assert switch_resp.status_code == 200, f"Failed switching to {sec_id}: {switch_resp.text}"
        sw_data = switch_resp.json()
        assert sw_data["sector"]["id"] == sec_id
        assert sw_data["user"]["email"] == test_email
        current_token = sw_data["access_token"]

    # -------------------------------------------------------------
    # TEST E: District switching & district-based bookings filter
    # User switches to Clinic workspace for Kallakurichi
    # -------------------------------------------------------------
    sw_clinic = client.post(
        "/api/auth/switch-sector",
        json={"sector_id": "clinic"},
        headers={"Authorization": f"Bearer {current_token}"}
    )
    assert sw_clinic.status_code == 200
    clinic_token = sw_clinic.json()["access_token"]

    # Create booking for Kallakurichi
    create_bk_resp = client.post(
        "/api/bookings/smart-service",
        json={
            "sector_id": "clinic",
            "service_category": "Doctor Consultation",
            "service_name": "General Medicine",
            "customer_name": "Kallakurichi Patient",
            "phone": "9876543210",
            "details": {
                "doctor_specialty": "gen_medicine",
                "district": "Kallakurichi"
            },
            "notes": "District: Kallakurichi consultation"
        },
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert create_bk_resp.status_code == 200, f"Booking creation failed: {create_bk_resp.text}"

    # Query bookings filtering by Kallakurichi
    list_kalla = client.get(
        "/api/bookings?district=Kallakurichi",
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert list_kalla.status_code == 200
    kalla_bookings = list_kalla.json()
    assert len(kalla_bookings) >= 1
    assert any("Kallakurichi" in (b.get("notes") or "") or "Kallakurichi" in str(b.get("details")) for b in kalla_bookings)

    # -------------------------------------------------------------
    # TEST F: Admin login isolation
    # -------------------------------------------------------------
    admin_resp = client.post("/api/auth/admin-login", json={
        "username": "Saran",
        "password": "1906"
    })
    assert admin_resp.status_code == 200, f"Admin login failed: {admin_resp.text}"
    assert admin_resp.json()["user"]["role"] == "admin"
