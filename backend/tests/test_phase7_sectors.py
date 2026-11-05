"""
Automated tests for Phase 7 remaining sectors:
- Veterinary Clinic (with urgent keywords)
- Restaurant / Bulk Catering
- Coaching Centre
"""

import os
import sys
import pytest
from app.sectors.registry import get_sector_package
from app.conversation.engine import ConversationEngine
from app.conversation.urgent_detection import check_urgent_case


def test_veterinary_clinic_full_flow():
    pkg = get_sector_package("vet_clinic")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="tanglish")

    slots = {}
    # Turn 1: Owner name & phone
    r1 = engine.process_turn("s_vet1", "En peyar Velusamy, phone 9842512345", slots, "collecting")
    assert r1.slots["owner_name"] == "Velusamy"
    assert r1.slots["phone"] == "9842512345"
    assert r1.next_slot == "animal_type"

    # Turn 2: Animal type (Cow) & Visit mode (Farm visit)
    r2 = engine.process_turn("s_vet1", "kadavai maadu, farm visit venum", r1.slots, r1.state, r1.next_slot)
    assert "Cow" in r2.slots["animal_type"]
    assert "Farm" in r2.slots["visit_mode"]
    assert r2.next_slot == "appointment_date"

    # Turn 3: Date and time
    r3 = engine.process_turn("s_vet1", "naalaikku 09:30 AM", r2.slots, r2.state, r2.next_slot)
    assert "appointment_date" in r3.slots
    assert r3.slots["appointment_time"] == "09:30 AM"
    assert r3.state == "confirming"


def test_veterinary_urgent_detection():
    pkg = get_sector_package("vet_clinic")
    assert pkg is not None

    # Urgent case in cattle/livestock: calving difficulty or bloat
    is_u, kw, _ = check_urgent_case("மாட்டுக்கு ஈற்று வலி அதிகமா இருக்கு, கன்று சிக்கியது", pkg.urgent_keywords)
    assert is_u is True
    assert "கன்று சிக்கியது" in kw or "ஈற்று வலி" in kw

    is_u2, _, _ = check_urgent_case("dog is healthy, no bloat", pkg.urgent_keywords)
    assert is_u2 is False  # Negated


def test_restaurant_catering_flow():
    pkg = get_sector_package("restaurant")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="tanglish")

    # Turn 1: Customer details & Bulk catering
    r1 = engine.process_turn("s_rest1", "En peyar Balachandar, phone 9840192837, bulk catering order", {}, "collecting")
    assert r1.slots["customer_name"] == "Balachandar"
    assert r1.slots["phone"] == "9840192837"
    assert "Catering" in r1.slots["service_type"]
    assert r1.next_slot == "headcount"

    # Turn 2: Headcount (50 persons) & Date
    r2 = engine.process_turn("s_rest1", "50 per, naalaikku 12:30 PM", r1.slots, r1.state, r1.next_slot)
    assert r2.slots["headcount"] == 50
    assert "event_date" in r2.slots
    assert "12:30 PM" in r2.slots["event_time"]
    assert r2.state == "confirming"


def test_coaching_academy_flow():
    pkg = get_sector_package("coaching")
    assert pkg is not None
    engine = ConversationEngine(package=pkg, language_mode="ta")

    # Turn 1: Student name & phone
    r1 = engine.process_turn("s_coach1", "என் பெயர் கோகுல்நாத், அலைபேசி 9840293847", {}, "collecting")
    assert r1.slots["student_name"] == "கோகுல்நாத்"
    assert r1.slots["phone"] == "9840293847"
    assert r1.next_slot == "target_exam"

    # Turn 2: Target exam (TNPSC Group 4) & Demo class
    r2 = engine.process_turn("s_coach1", "குரூப் 4 தேர்வு, இலவச மாதிரி வகுப்பு", r1.slots, r1.state, r1.next_slot)
    assert "Group 4" in r2.slots["target_exam"]
    assert "Demo" in r2.slots["enquiry_type"]
    assert r2.next_slot == "preferred_batch"

    # Turn 3: Batch and date
    r3 = engine.process_turn("s_coach1", "காலை வகுப்பு, நாளைக்கு வருகிறேன்", r2.slots, r2.state, r2.next_slot)
    assert "Morning" in r3.slots["preferred_batch"]
    assert "demo_date" in r3.slots
    assert r3.state == "confirming"

