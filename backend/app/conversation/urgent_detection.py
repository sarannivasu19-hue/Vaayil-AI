"""
Urgent-Case Triage and Safety Detection Engine.

Rule-based keywords in Tamil, Tanglish, and English with strict negation
and past-event handling so legitimate queries are not falsely triggered.
The agent NEVER diagnoses; it only alerts staff and provides 108/112 emergency advice.
"""

import re
from typing import List, Dict, Any, Tuple, Optional

# Core emergency symptom keywords
EMERGENCY_KEYWORDS = [
    # Tamil Script
    "நெஞ்சு வலி", "மாரடைப்பு", "மூச்சு திணறல்", "மயக்கம்", "பாம்பு கடி",
    "அதிக ரத்தப்போக்கு", "ரத்தப்போக்கு", "குழந்தை மூச்சு", "விபத்து", "வலிப்பு",

    # Tanglish
    "nenju vali", "nenjuvali", "maradaippu", "moochu thinare", "moochu thinaral",
    "mayakkam", "paambu kadi", "rathapokku", "valippu", "vibathu", "accidant",

    # English
    "chest pain", "heart attack", "breathing problem", "breathless", "unconscious",
    "snake bite", "heavy bleeding", "bleeding profusely", "accident", "seizure",
    "stroke", "collapsed", "severe burn"
]

# Negation patterns in English, Tanglish, and Tamil
NEGATION_PATTERNS = [
    r"\bno\s+([a-zA-Z\s]+)",
    r"\bnot\s+having\s+([a-zA-Z\s]+)",
    r"\bdon'?t\s+have\s+([a-zA-Z\s]+)",
    r"\bwithout\s+([a-zA-Z\s]+)",
    r"([a-zA-Z\s]+)\s+illa\b",
    r"([a-zA-Z\s]+)\s+illai\b",
    r"([a-zA-Z\s]+)\s+ille\b",
    r"([a-zA-Z\u0B80-\u0BFF\s]+)\s+இல்லை\b",
    r"([a-zA-Z\u0B80-\u0BFF\s]+)\s+இல்ல\b",
]

# Past-event patterns (events that happened in the past and are not immediate emergencies)
PAST_EVENT_PATTERNS = [
    r"\blast\s+year\b",
    r"\blast\s+month\b",
    r"\b2\s+years\s+ago\b",
    r"\byears\s+ago\b",
    r"\bmunnadi\b",
    r"\bpalaya\b",
    r"\bமுன்பு\b",
    r"\bகடந்த\s+ஆண்டு\b",
    r"\bமுன்னாடி\b",
]


def check_urgent_case(
    text: str,
    custom_sector_keywords: Optional[List[str]] = None
) -> Tuple[bool, Optional[str], str]:
    """
    Evaluates whether the caller utterance indicates an acute emergency.
    Returns: (is_urgent, matched_keyword, guidance_message)
    """
    if not text:
        return False, None, ""

    cleaned = text.strip().lower()
    keywords = list(EMERGENCY_KEYWORDS)
    if custom_sector_keywords:
        keywords.extend([k.lower() for k in custom_sector_keywords])

    # 1. First, check if a past-event indicator is present (e.g. "last year I had chest pain")
    for past_pat in PAST_EVENT_PATTERNS:
        if re.search(past_pat, cleaned):
            return False, None, ""

    # 2. Check for emergency keywords
    for kw in keywords:
        kw_clean = kw.strip().lower()
        if not kw_clean:
            continue

        # Check if keyword is in the text
        if kw_clean in cleaned:
            # 3. Check if this keyword is directly negated (e.g. "no chest pain", "nenju vali illa")
            is_negated = False
            for neg_pat in NEGATION_PATTERNS:
                matches = re.finditer(neg_pat, cleaned)
                for m in matches:
                    negated_phrase = m.group(0)
                    if kw_clean in negated_phrase:
                        is_negated = True
                        break
                if is_negated:
                    break

            if not is_negated:
                guidance = (
                    "Possible urgent condition detected. Please immediately dial 108 (Ambulance) "
                    "or 112 (Emergency Services), or visit the nearest government hospital emergency casualty."
                )
                return True, kw_clean, guidance

    return False, None, ""

