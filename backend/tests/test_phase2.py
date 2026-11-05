import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.booking import Booking
from app.seed.demo_seed import seed_demo_data
from app.sectors.registry import get_all_sector_packages, get_sector_package

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database tables and initial packages are populated."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_data(db)
    # Clean up test bookings before running
    db.query(Booking).delete()
    db.commit()
    db.close()


def get_token(username: str, password: str = "vaayil123") -> str:
    """Helper to authenticate and fetch JWT token."""
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


def test_packages_registry_discovery():
    """Verify all 6 sector packages are dynamically discovered with valid slots."""
    packages = get_all_sector_packages()
    assert len(packages) >= 6
    pkg_ids = [p.id for p in packages]
    expected_ids = ["panchayat_health", "clinic", "vet_clinic", "hotel_lodge", "restaurant", "coaching"]
    for expected in expected_ids:
        assert expected in pkg_ids

    panchayat = get_sector_package("panchayat_health")
    assert panchayat is not None
    assert len(panchayat.slots) >= 5
    assert len(panchayat.sample_bookings) >= 2


def test_sector_detail_slots():
    """Verify GET /api/sectors/{sector_id} returns slots and prompts."""
    res = client.get("/api/sectors/panchayat_health")
    assert res.status_code == 200
    data = res.json()
    assert "slots" in data
    assert len(data["slots"]) > 0
    citizen_slot = next(s for s in data["slots"] if s["name"] == "citizen_name")
    assert citizen_slot["label_en"] == "Citizen Name"
    assert "வணக்கம்" in citizen_slot["prompts"]["ta"]
    assert "Vanakkam" in citizen_slot["prompts"]["tanglish"]


def test_demo_load_bookings():
    """Verify POST /api/demo/load creates clearly labelled synthetic bookings."""
    token = get_token("panchayat_admin")
    res = client.post(
        "/api/demo/load",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    bookings = res.json()
    assert len(bookings) >= 2
    for b in bookings:
        assert b["sector_id"] == "panchayat_health"
        assert "[Synthetic Demo Data" in (b["notes"] or "")


def test_sector_data_isolation():
    """
    CRITICAL: Verify user of Clinic cannot view, edit, or cancel bookings
    belonging to the Panchayat Health Help Desk.
    """
    panchayat_token = get_token("panchayat_admin")
    clinic_token = get_token("clinic_admin")

    # Fetch Panchayat bookings
    res_panchayat = client.get(
        "/api/bookings",
        headers={"Authorization": f"Bearer {panchayat_token}"}
    )
    assert res_panchayat.status_code == 200
    panchayat_bookings = res_panchayat.json()
    assert len(panchayat_bookings) > 0
    panchayat_booking_id = panchayat_bookings[0]["id"]

    # Clinic user lists bookings -> should NOT see Panchayat bookings
    res_clinic = client.get(
        "/api/bookings",
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert res_clinic.status_code == 200
    clinic_bookings = res_clinic.json()
    for b in clinic_bookings:
        assert b["sector_id"] == "clinic"
        assert b["id"] != panchayat_booking_id

    # Clinic user attempts to directly GET Panchayat booking -> 403 Forbidden
    res_forbidden_get = client.get(
        f"/api/bookings/{panchayat_booking_id}",
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert res_forbidden_get.status_code == 403

    # Clinic user attempts to UPDATE Panchayat booking -> 403 Forbidden
    res_forbidden_put = client.put(
        f"/api/bookings/{panchayat_booking_id}",
        json={"notes": "Hacked from clinic"},
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert res_forbidden_put.status_code == 403

    # Clinic user attempts to CANCEL Panchayat booking -> 403 Forbidden
    res_forbidden_del = client.delete(
        f"/api/bookings/{panchayat_booking_id}",
        headers={"Authorization": f"Bearer {clinic_token}"}
    )
    assert res_forbidden_del.status_code == 403


def test_bookings_crud_workflow():
    """Test full CRUD cycle: create, list, filter, search, update, cancel."""
    token = get_token("clinic_admin")

    # 1. CREATE
    payload = {
        "customer_name": "R. Vignesh",
        "phone": "9840192830",
        "details": {
            "patient_name": "R. Vignesh",
            "phone": "9840192830",
            "doctor_specialty": "General Medicine (பொது மருத்துவம்)",
            "appointment_date": "2026-11-20",
            "appointment_time": "10:00 AM",
            "symptoms_note": "Seasonal throat ache.",
        },
        "notes": "Booked via front desk"
    }
    create_res = client.post(
        "/api/bookings",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 201
    booking = create_res.json()
    booking_id = booking["id"]
    assert booking["reference_number"].startswith("VYL-CLN-")
    assert booking["customer_name"] == "R. Vignesh"
    assert booking["status"] == "confirmed"

    # 2. LIST with search
    search_res = client.get(
        "/api/bookings?search=Vignesh",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert search_res.status_code == 200
    results = search_res.json()
    assert any(b["id"] == booking_id for b in results)

    # 3. UPDATE
    update_res = client.put(
        f"/api/bookings/{booking_id}",
        json={"notes": "Updated note: patient confirmed arrival"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_res.status_code == 200
    assert "patient confirmed arrival" in update_res.json()["notes"]

    # 4. CANCEL
    cancel_res = client.delete(
        f"/api/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert cancel_res.status_code == 200

    # Verify status is now cancelled
    get_res = client.get(
        f"/api/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "cancelled"


def test_conflict_detection():
    """Verify double-booking conflict returns HTTP 409 Conflict."""
    token = get_token("clinic_admin")

    slot_date = "2026-12-15"
    slot_time = "11:00 AM"

    # First booking succeeds
    res1 = client.post(
        "/api/bookings",
        json={
            "customer_name": "First Patient",
            "phone": "9999911111",
            "details": {
                "patient_name": "First Patient",
                "phone": "9999911111",
                "doctor_specialty": "Pediatrics (குழந்தைகள் நலம்)",
                "appointment_date": slot_date,
                "appointment_time": slot_time,
            }
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res1.status_code == 201

    # Second booking at exact same slot fails with 409 Conflict
    res2 = client.post(
        "/api/bookings",
        json={
            "customer_name": "Second Patient",
            "phone": "9999922222",
            "details": {
                "patient_name": "Second Patient",
                "phone": "9999922222",
                "doctor_specialty": "Pediatrics (குழந்தைகள் நலம்)",
                "appointment_date": slot_date,
                "appointment_time": slot_time,
            }
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res2.status_code == 409
    assert "Time slot conflict" in res2.json()["detail"]


def test_missing_required_slots_validation():
    """Verify missing required slot raises HTTP 422 with missing field description."""
    token = get_token("clinic_admin")

    res = client.post(
        "/api/bookings",
        json={
            "customer_name": "Incomplete Patient",
            "phone": "9999933333",
            "details": {
                # Missing appointment_date and appointment_time
                "patient_name": "Incomplete Patient",
                "phone": "9999933333",
                "doctor_specialty": "General Medicine",
            }
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422
    assert "Missing required details" in res.json()["detail"]

