"""
Date and time parser for Tamil, Tanglish, and English text.
Parses relative expressions (today, tomorrow, day after tomorrow), calendar dates,
and spoken time slots/clock times (morning, afternoon, evening, 5 manikku, 10:30 AM).
"""

import re
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Tuple


def get_reference_date() -> date:
    """Returns today's date in UTC/IST reference."""
    return datetime.now(timezone.utc).date()


# Relative date mappings
RELATIVE_DATE_MAP = {
    # Tamil script
    "இன்று": 0, "இன்னைக்கு": 0, "இன்றைக்கு": 0, "இந்த நாள்": 0,
    "நாளை": 1, "நாளைக்கு": 1,
    "நாளை மறுநாள்": 2, "நாளைமறுநாள்": 2, "மறுநாள்": 2,

    # Tanglish words
    "innikku": 0, "inaiku": 0, "indraikku": 0, "today": 0, "indha naal": 0,
    "naalaikku": 1, "nalaiku": 1, "naalai": 1, "tomorrow": 1, "next day": 1,
    "naala marunaal": 2, "marunaal": 2, "day after tomorrow": 2,
}

# Month names in Tamil script and English
MONTH_MAP = {
    "january": 1, "jan": 1, "ஜனவரி": 1,
    "february": 2, "feb": 2, "பிப்ரவரி": 2,
    "march": 3, "mar": 3, "மார்ச்": 3,
    "april": 4, "apr": 4, "ஏப்ரல்": 4,
    "may": 5, "மே": 5,
    "june": 6, "jun": 6, "ஜூன்": 6,
    "july": 7, "jul": 7, "ஜூலை": 7,
    "august": 8, "aug": 8, "ஆகஸ்ட்": 8,
    "september": 9, "sep": 9, "செப்டம்பர்": 9,
    "october": 10, "oct": 10, "அக்டோபர்": 10,
    "november": 11, "nov": 11, "நவம்பர்": 11,
    "december": 12, "dec": 12, "டிசம்பர்": 12,
}


def parse_date(text: str, base_date: Optional[date] = None) -> Optional[str]:
    """
    Extracts a date in YYYY-MM-DD format from Tamil, Tanglish, or English.
    Examples:
      - "நாளைக்கு வாங்க" -> tomorrow's YYYY-MM-DD
      - "naalaikku 5 manikku" -> tomorrow's YYYY-MM-DD
      - "15/11/2026", "2026-11-08", "8th November", "10 நவம்பர்"
    """
    if not text:
        return None
    cleaned = text.strip().lower()
    ref = base_date or get_reference_date()

    # 1. Check relative date keywords (today, tomorrow, day after tomorrow)
    # Check multi-word keys first
    for k in sorted(RELATIVE_DATE_MAP.keys(), key=lambda x: -len(x)):
        pattern = rf"(?:\b|^){re.escape(k)}(?:\b|$)" if k.isascii() else re.escape(k)
        if re.search(pattern, cleaned):
            days_offset = RELATIVE_DATE_MAP[k]
            target_date = ref + timedelta(days=days_offset)
            return target_date.strftime("%Y-%m-%d")

    # 2. ISO format YYYY-MM-DD
    iso_match = re.search(r"\b(202\d)-(0[1-9]|1[0-2])-([0-3]\d)\b", cleaned)
    if iso_match:
        return iso_match.group(0)

    # 3. Standard DD/MM/YYYY or DD-MM-YYYY
    dmy_match = re.search(r"\b([0-3]?\d)[/-]([0-1]?\d)[/-](202\d)\b", cleaned)
    if dmy_match:
        d, m, y = int(dmy_match.group(1)), int(dmy_match.group(2)), int(dmy_match.group(3))
        try:
            return date(y, m, d).strftime("%Y-%m-%d")
        except ValueError:
            pass

    # 4. Spoken day + month: "15th November", "10 நவம்பர்", "Nov 12"
    for month_name, m_num in MONTH_MAP.items():
        # e.g., "15 november", "15th nov", "15 நவம்பர்"
        pattern1 = rf"\b([0-3]?\d)(?:st|nd|rd|th)?\s+(?:the\s+)?{re.escape(month_name)}\b"
        match1 = re.search(pattern1, cleaned)
        if match1:
            day_val = int(match1.group(1))
            year_val = ref.year if (m_num >= ref.month) else ref.year + 1
            try:
                return date(year_val, m_num, day_val).strftime("%Y-%m-%d")
            except ValueError:
                pass

        # e.g., "november 15"
        pattern2 = rf"\b{re.escape(month_name)}\s+([0-3]?\d)(?:st|nd|rd|th)?\b"
        match2 = re.search(pattern2, cleaned)
        if match2:
            day_val = int(match2.group(1))
            year_val = ref.year if (m_num >= ref.month) else ref.year + 1
            try:
                return date(year_val, m_num, day_val).strftime("%Y-%m-%d")
            except ValueError:
                pass

    return None


# Time period words in Tamil / Tanglish / English
TIME_PERIODS = {
    "morning": "Morning (09:00 AM - 01:00 PM)",
    "kaalai": "Morning (09:00 AM - 01:00 PM)",
    "kalai": "Morning (09:00 AM - 01:00 PM)",
    "காலை": "Morning (09:00 AM - 01:00 PM)",

    "afternoon": "Afternoon (02:00 PM - 05:00 PM)",
    "madhiyam": "Afternoon (02:00 PM - 05:00 PM)",
    "mathiyam": "Afternoon (02:00 PM - 05:00 PM)",
    "மதியம்": "Afternoon (02:00 PM - 05:00 PM)",
    "மத்தியானம்": "Afternoon (02:00 PM - 05:00 PM)",

    "evening": "05:00 PM",
    "maalai": "05:00 PM",
    "malai": "05:00 PM",
    "மாலை": "05:00 PM",
    "sayanthram": "05:00 PM",
    "சாயந்தரம்": "05:00 PM",
    "night": "07:00 PM",
    "iravu": "07:00 PM",
    "இரவு": "07:00 PM",
}


def parse_time(text: str) -> Optional[str]:
    """
    Extracts time or time-slot string from Tamil, Tanglish, or English.
    Handles:
      - Clock times: "10:30 AM", "5 PM", "5:30 pm", "11 மணி", "5 manikku", "5 mani"
      - Broad time windows: "காலை நேரம்", "kaalai", "madhiyam", "afternoon", "மாலை"
    """
    if not text:
        return None
    cleaned = text.strip().lower()

    # 1. Standard explicit 12h format e.g. "10:30 am", "05:00 pm", "6:30pm"
    explicit_match = re.search(r"\b(0?[1-9]|1[0-2]):([0-5]\d)\s*(am|pm)\b", cleaned)
    if explicit_match:
        h = int(explicit_match.group(1))
        m = explicit_match.group(2)
        meridiem = explicit_match.group(3).upper()
        return f"{h:02d}:{m} {meridiem}"

    # 2. Standard hour + AM/PM: "5 pm", "10 am", "11 am"
    hour_meridiem_match = re.search(r"\b(0?[1-9]|1[0-2])\s*(am|pm)\b", cleaned)
    if hour_meridiem_match:
        h = int(hour_meridiem_match.group(1))
        meridiem = hour_meridiem_match.group(2).upper()
        return f"{h:02d}:00 {meridiem}"

    # 3. Tamil / Tanglish "mani" / "manikku" pattern:
    # e.g., "5 manikku", "11 mani", "10:30 manikku", "காலை 10 மணிக்கு", "sayanthram 6 mani"
    mani_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(?:மணி|manikku|mani)", cleaned)
    if mani_match:
        h = int(mani_match.group(1))
        m = mani_match.group(2) or "00"
        # Determine AM / PM context from surrounding text
        is_pm = any(kw in cleaned for kw in ["மாலை", "மதியம்", "சாயந்தரம்", "இரவு", "maalai", "sayanthram", "madhiyam", "night", "pm", "evening"])
        is_am = any(kw in cleaned for kw in ["காலை", "kaalai", "kalai", "morning", "am"])
        if is_pm and h < 12:
            meridiem = "PM"
        elif is_am or h >= 8 and h <= 11:
            meridiem = "AM"
        elif h >= 1 and h <= 7:
            # Default typical clinic/business hours for 1-7 is afternoon/evening PM
            meridiem = "PM"
        else:
            meridiem = "AM"
        return f"{h:02d}:{m} {meridiem}"

    # 4. General window / session slots (Panchayat / general preference)
    for kw, label in TIME_PERIODS.items():
        if kw in cleaned:
            return label

    return None

