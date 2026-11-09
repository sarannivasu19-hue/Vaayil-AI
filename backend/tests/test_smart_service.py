import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    # Login as admin to get valid token
    resp = client.post("/api/auth/admin-login", json={"username": "Saran", "password": "1906"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_panchayat_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "panchayat_health",
        "service_category": "Drinking Water Problems",
        "service_name": "No water supply",
        "customer_name": "Saran Nivasu",
        "phone": "9345000025",
        "email": "saran@example.com",
        "details": {
            "sub_problem": "No water supply",
            "district": "Madurai",
            "village_ward": "Ward 4, Melur Panchayat",
            "street": "Anna Nagar 2nd Street",
            "landmark": "Near Pillayar Kovil",
            "description": "Drinking water pipe broken since yesterday morning",
            "urgency": "High"
        },
        "notes": "Urgent attention required",
        "submission_mode": "hybrid",
        "language": "english"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-PAN-" in data["reference_number"]
    assert data["customer_name"] == "Saran Nivasu"
    assert data["phone"] == "9345000025"
    assert "Thank you, Saran Nivasu" in data["confirmation_speech_text"]
    assert data["reference_number"] in data["confirmation_speech_text"]


def test_clinic_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "clinic",
        "service_category": "General Consultation",
        "service_name": "Fever & Cold",
        "customer_name": "Karthik Raj",
        "phone": "9876543210",
        "details": {
            "age": "28",
            "consultation_type": "In-person",
            "main_concern": "High fever with chills for 2 days",
            "preferred_doctor": "Dr. Saran MBBS",
            "appointment_date": "2026-11-12",
            "appointment_time": "10:30 AM"
        },
        "submission_mode": "manual",
        "language": "english"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-CLN-" in data["reference_number"]
    assert "Saran Clinic" in data["confirmation_message"]
    assert "2026-11-12" in data["confirmation_speech_text"]


def test_restaurant_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "restaurant",
        "service_category": "Lunch",
        "service_name": "South Indian Meals",
        "customer_name": "Meenakshi Sundaram",
        "phone": "9443322110",
        "details": {
            "order_type": "Takeaway",
            "items": [
                {"name": "South Indian Special Meals", "qty": 2, "price": 140},
                {"name": "Filter Coffee", "qty": 2, "price": 30}
            ],
            "total_amount": 340,
            "pickup_time": "01:00 PM"
        },
        "submission_mode": "manual",
        "language": "tanglish"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-RST-" in data["reference_number"]
    assert "Saran Restaurant" in data["confirmation_message"]


def test_hotel_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "hotel_lodge",
        "service_category": "AC Room",
        "service_name": "Deluxe AC Room",
        "customer_name": "Ravi Kumar",
        "phone": "9123456789",
        "details": {
            "room_type": "Deluxe AC Room",
            "checkin_date": "2026-11-15",
            "checkout_date": "2026-11-17",
            "num_guests": 2,
            "num_rooms": 1,
            "total_amount": 4400
        },
        "submission_mode": "manual",
        "language": "english"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-HTL-" in data["reference_number"]
    assert "Saran Hotel" in data["confirmation_message"]


def test_vet_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "vet_clinic",
        "service_category": "Cattle / Cow Healthcare",
        "service_name": "Cattle / Cow Healthcare",
        "customer_name": "Murugan G",
        "phone": "9554433221",
        "details": {
            "animal_type": "Cow",
            "animal_name": "Lakshmi",
            "animal_age": "4 years",
            "symptoms": "Low milk yield, loss of appetite for 3 days",
            "appointment_date": "2026-11-14",
            "appointment_time": "09:00 AM"
        },
        "submission_mode": "hybrid",
        "language": "tamil"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-VET-" in data["reference_number"]
    assert "அரசு கால்நடை மருத்துவ மையத்தில்" in data["confirmation_message"]


def test_coaching_smart_service_submission(auth_headers):
    payload = {
        "sector_id": "coaching",
        "service_category": "TNPSC Group 4",
        "service_name": "TNPSC Group 4 Comprehensive Batch",
        "customer_name": "Abinaya S",
        "phone": "9778899001",
        "details": {
            "course_name": "TNPSC Group 4",
            "qualification": "B.Com Degree",
            "preferred_batch": "Morning (7 AM - 9 AM)",
            "learning_mode": "Classroom Offline",
            "needs_books": True
        },
        "submission_mode": "manual",
        "language": "english"
    }

    resp = client.post("/api/bookings/smart-service", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "VYL-CCH-" in data["reference_number"]
    assert "Saran Coaching Centre" in data["confirmation_message"]


def test_tracking_endpoint(auth_headers):
    # Track by phone
    resp = client.get("/api/bookings/track?query=9345000025")
    assert resp.status_code == 200, resp.text
    items = resp.json()
    assert len(items) >= 1
    assert items[0]["customer_name"] == "Saran Nivasu"

