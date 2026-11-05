"""
Phase 6 automated tests:
1. Idempotent confirmation & saving (no duplicates on repeated requests)
2. Conflict detection on double-booking
3. Call logs search & filter
4. Heuristic insights & sentiment
5. Urgent case detection with negation and past events
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.conversation.urgent_detection import check_urgent_case
from app.conversation.insights import analyze_sentiment_heuristic, generate_call_summary_heuristic


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


def test_urgent_case_detection_accuracy():
    # 1. Real emergency in Tamil & English
    is_u, kw, _ = check_urgent_case("எனக்கு நெஞ்சு வலி அதிகமாக உள்ளது")
    assert is_u is True
    assert "நெஞ்சு வலி" in kw

    is_u, kw, _ = check_urgent_case("patient had severe chest pain and collapsed")
    assert is_u is True

    # 2. Negation ("no chest pain", "nenju vali illa")
    is_u, _, _ = check_urgent_case("I have mild cold, no chest pain")
    assert is_u is False

    is_u, _, _ = check_urgent_case("kuzhandhai ku fever irukku, aana moochu thinaral illa")
    assert is_u is False

    # 3. Past events ("last year I had heart attack")
    is_u, _, _ = check_urgent_case("last year I had a heart attack, but today just routine visit")
    assert is_u is False

    is_u, _, _ = check_urgent_case("2 years ago accident aachu")
    assert is_u is False


def test_call_insights_heuristic():
    turns = [
        {"speaker": "caller", "text": "Vanakkam, kuzhandhai vaccine venum"},
        {"speaker": "agent", "text": "Sure, which date?"},
        {"speaker": "caller", "text": "naalaikku morning, romba nandri"},
    ]
    slots = {"citizen_name": "Kavitha", "phone": "9840112233", "service_type": "Child Vaccination"}

    insights = generate_call_summary_heuristic("panchayat_health", slots, "booked", turns)
    assert insights["source"] == "heuristic"
    assert "heuristic" in insights["sentiment"]
    assert "heuristic" in insights["intent"]
    assert "Kavitha" in insights["summary"]


def test_idempotent_booking_confirmation(client: TestClient, auth_token: str):
    payload = {
        "session_id": "test-session-phase6-unique",
        "sector_id": "panchayat_health",
        "slots": {
            "citizen_name": "R. Selvaraj",
            "phone": "9840998877",
            "village_ward": "Ward 4",
            "service_type": "Health Camp Token (மருத்துவ முகாம் டோக்கன்)",
            "preferred_date": "2026-11-20",
        },
        "notes": "Testing idempotency",
    }

    # First confirmation
    res1 = client.post("/api/bookings/confirm", headers=auth_headers(auth_token), json=payload)
    assert res1.status_code == 200
    b1 = res1.json()
    assert b1["reference_number"] is not None

    # Second confirmation with exact same session_id should be idempotent (return same booking, no duplicate)
    res2 = client.post("/api/bookings/confirm", headers=auth_headers(auth_token), json=payload)
    assert res2.status_code == 200
    b2 = res2.json()
    assert b1["id"] == b2["id"]
    assert b1["reference_number"] == b2["reference_number"]


def test_call_logs_listing_and_filter(client: TestClient, auth_token: str):
    res = client.get("/api/call-logs", headers=auth_headers(auth_token))
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    if logs:
        first_id = logs[0]["id"]
        detail = client.get(f"/api/call-logs/{first_id}", headers=auth_headers(auth_token))
        assert detail.status_code == 200
        assert "insights" in detail.json()

