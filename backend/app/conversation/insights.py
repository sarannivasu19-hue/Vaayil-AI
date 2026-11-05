"""
Rule-based Call Insights Engine (Intent, Summary, Key Details, Sentiment).
All outputs are clearly labeled '(heuristic)' per user instruction.
"""

import re
from typing import List, Dict, Any


def analyze_sentiment_heuristic(turns: List[Dict[str, str]]) -> str:
    """
    Heuristic sentiment classifier based on caller turns in Tamil, Tanglish, and English.
    Returns: 'positive' | 'neutral' | 'negative'
    """
    caller_text = " ".join([t.get("text", "") for t in turns if t.get("speaker") == "caller"]).lower()

    positive_keywords = [
        "nandri", "romba nandri", "thanks", "thank you", "super", "seri", "good", "great",
        "நன்றி", "மிக்க நன்றி", "சரி", "மகிழ்ச்சி", "excellent"
    ]
    negative_keywords = [
        "thappu", "illa", "bad", "worst", "slow", "kovam", "irritat", "problem", "complaint",
        "தவறு", "இல்லை", "மோசம்", "தாமதம்", "கோபம்", "புகார்"
    ]

    pos_score = sum(1 for kw in positive_keywords if kw in caller_text)
    neg_score = sum(1 for kw in negative_keywords if kw in caller_text)

    if pos_score > neg_score and pos_score >= 1:
        return "positive"
    elif neg_score > pos_score and neg_score >= 1:
        return "negative"
    return "neutral"


def generate_call_summary_heuristic(
    sector_id: str,
    slots: Dict[str, Any],
    outcome: str,
    turns: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Generates rule-based heuristic call insights:
    - Intent
    - Short Summary
    - Key Details
    - Sentiment (labeled heuristic)
    """
    caller_turns = [t.get("text", "") for t in turns if t.get("speaker") == "caller"]
    total_caller_text = " ".join(caller_turns)

    # 1. Determine Intent
    intent = "General Inquiry"
    if sector_id == "panchayat_health":
        service = slots.get("service_type", "")
        if "Vaccination" in service:
            intent = "Child Immunization Request"
        elif "Nurse" in service:
            intent = "VHN Nurse Home Visit Consultation"
        elif "Water" in service or "Sanitation" in service:
            intent = "Civic Water / Sanitation Complaint"
        elif "Camp" in service:
            intent = "Health Camp Token Booking"
        else:
            intent = "Public Health Desk Inquiry"

    elif sector_id == "clinic":
        spec = slots.get("doctor_specialty", "Doctor")
        intent = f"Doctor Appointment ({spec})"

    elif sector_id == "hotel_lodge":
        room = slots.get("room_type", "Room")
        intent = f"Room Reservation ({room})"

    # 2. Key Details string
    key_details = {k: v for k, v in slots.items() if v}

    # 3. Short Summary
    customer = slots.get("citizen_name") or slots.get("patient_name") or slots.get("guest_name") or "Caller"
    phone = slots.get("phone", "Unknown phone")

    if outcome == "booked":
        summary = f"Confirmed booking for {customer} ({phone}) under {intent}. All required sector slots captured."
    elif outcome == "urgent":
        summary = f"Urgent safety alert flagged during call with {customer}. Emergency guidance provided."
    elif outcome == "cancelled":
        summary = f"Call interaction with {customer} concluded without saving reservation (User Cancelled)."
    else:
        summary = f"Call completed with {len(turns)} dialogue turns. Extracted: {', '.join(slots.keys()) or 'None'}."

    sentiment = analyze_sentiment_heuristic(turns)

    return {
        "source": "heuristic",
        "intent": f"{intent} (heuristic)",
        "summary": summary,
        "key_details": key_details,
        "sentiment": f"{sentiment} (heuristic)",
        "turns_count": len(turns),
    }

