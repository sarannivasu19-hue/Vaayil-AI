"""
Automated tests for Phase 4: Conversation Engine & /api/agent/turn route.
Tests multi-slot extraction, single missing question asking, unclear corrections,
and full conversations for Panchayat Health, Clinic, and Hotel sectors.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.sectors.registry import get_sector_package
from app.conversation.engine import ConversationEngine


@pytest.fixture(scope="module")
def client():
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture(scope="module")
def auth_token(client: TestClient) -> str:
    res = client.post("/api/auth/login", json={"username": "panchayat_admin", "password": "vaayil123"})
    assert res.status_code == 200
    return res.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_engine_panchayat_health_flow():
    pkg = get_sector_package("panchayat_health")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="tanglish")

    slots = {}
    state = "collecting"

    # Turn 1: User mentions name and phone
    res1 = engine.process_turn("sess1", "En peyar Meenakshi, mobile 9840123456", slots, state)
    assert res1.slots["citizen_name"] == "Meenakshi"
    assert res1.slots["phone"] == "9840123456"
    assert res1.state == "collecting"
    assert res1.next_slot == "village_ward"

    # Turn 2: User provides village ward
    res2 = engine.process_turn("sess1", "Kattur Ward 3", res1.slots, res1.state, res1.next_slot)
    assert res2.slots["village_ward"] == "Kattur Ward 3"
    assert res2.next_slot == "service_type"

    # Turn 3: User says service type and date together
    res3 = engine.process_turn("sess1", "kuzhandhai vaccine naalaikku", res2.slots, res2.state, res2.next_slot)
    assert "Child Vaccination" in res3.slots["service_type"]
    assert "preferred_date" in res3.slots
    # All required slots are filled!
    assert res3.state == "confirming"
    assert "confirm" in res3.agent_message.lower() or "உறுதி" in res3.agent_message or "confirm" in res3.agent_message

    # Turn 4: User confirms
    res4 = engine.process_turn("sess1", "aama, confirm pannunga", res3.slots, res3.state)
    assert res4.state == "completed"
    assert res4.is_complete is True


def test_engine_clinic_flow():
    pkg = get_sector_package("clinic")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="ta")

    # Turn 1: Patient gives name, phone, and symptoms
    res1 = engine.process_turn("sess2", "என் பெயர் சரவணன், எண் 9841029384, இருமல் உள்ளது", {}, "collecting")
    assert res1.slots["patient_name"] == "சரவணன்"
    assert res1.slots["phone"] == "9841029384"
    assert res1.state == "collecting"
    assert res1.next_slot == "doctor_specialty"

    # Turn 2: Specialty
    res2 = engine.process_turn("sess2", "பொது மருத்துவம்", res1.slots, res1.state, res1.next_slot)
    assert "General Medicine" in res2.slots["doctor_specialty"]
    assert res2.next_slot == "appointment_date"

    # Turn 3: Date and time together
    res3 = engine.process_turn("sess2", "நாளைக்கு 10:30 AM", res2.slots, res2.state, res2.next_slot)
    assert "appointment_date" in res3.slots
    assert res3.slots["appointment_time"] == "10:30 AM"
    assert res3.state == "confirming"


def test_engine_hotel_correction_flow():
    pkg = get_sector_package("hotel_lodge")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="tanglish")

    slots = {
        "guest_name": "Senthil Nathan",
        "phone": "9840918273",
        "room_type": "Standard AC Room (ஏசி அறை)",
        "checkin_date": "2026-11-08",
        "checkout_date": "2026-11-10",
        "guests_count": 2,
    }

    # User corrects number of guests: "illa, naalu per varom"
    res = engine.process_turn("sess3", "illa, naalu per varom", slots, "collecting")
    assert res.slots["guests_count"] == 4


def test_api_agent_turn_route(client: TestClient, auth_token: str):
    payload = {
        "sector_id": "clinic",
        "transcript_text": "En peyar Ramanathan, phone 9444019283, general doctor naalaikku 10:30 AM",
        "language_mode": "tanglish",
    }
    res = client.post("/api/agent/turn", headers=auth_headers(auth_token), json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] is not None
    assert data["slots"]["patient_name"] == "Ramanathan"
    assert data["slots"]["phone"] == "9444019283"
    assert "appointment_date" in data["slots"]
    assert data["slots"]["appointment_time"] == "10:30 AM"
    assert len(data["conversation_history"]) >= 2

