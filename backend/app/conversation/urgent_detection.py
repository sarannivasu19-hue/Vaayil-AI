"""
Urgent-Case Triage and Safety Detection Engine.

Rule-based keywords in Tamil, Tanglish, and English with strict negation
and past-event handling so legitimate queries are not falsely triggered.
The agent NEVER diagnoses; it only alerts staff and provides 108/112 emergency advice.

v2: Extended with veterinary keywords, spelling-variant coverage, broader
    past-event Tamil patterns (using lookahead/lookbehind for Unicode), and
    additional negation forms including resolved Tamil constructions.
"""

import re
from typing import List, Dict, Any, Tuple, Optional

# ---------------------------------------------------------------------------
# Emergency symptom keywords — Human + Veterinary
# ---------------------------------------------------------------------------
EMERGENCY_KEYWORDS = [
    # Tamil Script — Human
    "நெஞ்சு வலி", "மாரடைப்பு", "மூச்சு திணறல்", "மயக்கம்", "பாம்பு கடி",
    "அதிக ரத்தப்போக்கு", "ரத்தப்போக்கு", "குழந்தை மூச்சு", "விபத்து", "வலிப்பு",

    # Tamil Script — Veterinary (bloat, calving distress, poisoning)
    "வயிறு உப்புசம்", "கன்று சிக்கியது", "பிரசவ வலி", "மாட்டு வலிப்பு", "விஷம்",

    # Tanglish — Human
    "nenju vali", "nenjuvali", "nenjovaly",    # phonetic variants
    "maradaippu", "moochu thinare", "moochu thinaral",
    "mayakkam", "paambu kadi", "rathapokku", "valippu", "vibathu", "accidant",

    # Tanglish — Veterinary
    "vayiru uppusam", "nanju kodi", "prasava vali",
    "kandru sikkikichu",

    # English — Human
    "chest pain", "chset pain",               # 'chset' = common STT/typo form
    "heart attack", "breathing problem", "breathless", "breathlessness",
    "unconscious", "snake bite",
    "heavy bleeding", "bleeding profusely", "accident",
    "seizure", "stroke", "collapsed", "severe burn",

    # English — Veterinary
    "retained placenta", "difficult calving", "bloat", "severe bloating",
    "dystocia",
]

# ---------------------------------------------------------------------------
# Negation patterns — English, Tanglish, Tamil script
# NOTE: Use (?:^|\s) instead of \b for Tamil Unicode compatibility
# ---------------------------------------------------------------------------
NEGATION_PATTERNS = [
    # English
    r"\bno\s+([a-zA-Z\s]+)",
    r"\bnot\s+([a-zA-Z\s]+)",
    r"\bnot\s+having\s+([a-zA-Z\s]+)",
    r"\bdon'?t\s+have\s+([a-zA-Z\s]+)",
    r"\bwithout\s+([a-zA-Z\s]+)",

    # Tanglish
    r"([a-zA-Z\s]+)\s+illa\b",
    r"([a-zA-Z\s]+)\s+illai\b",
    r"([a-zA-Z\s]+)\s+ille\b",
    # Tanglish resolved forms (e.g. "nanju kodi vizhunthuruchi / vizhunthuruchu")
    r"([a-zA-Z\s]+)\s+vizhunthuruchi\b",
    r"([a-zA-Z\s]+)\s+vizhundhuruchi\b",
    r"([a-zA-Z\s]+)\s+vizhunthuruchu\b",
    # Tanglish calf-didn't-get-stuck: "kandru sikkala"
    r"([a-zA-Z\s]+)\s+sikkala\b",

    # Tamil script negation suffixes
    r"[\u0B80-\u0BFF a-zA-Z]+\s+இல்லை",
    r"[\u0B80-\u0BFF a-zA-Z]+\s+இல்ல",
    # Tamil resolved / fell-off naturally for PLACENTA only: நஞ்சு கொடி விழுந்துவிட்டது
    # We only negate if the keyword itself is "நஞ்சு கொடி" or "nanju kodi"
    r"நஞ்சு\s+கொடி\s+[\u0B80-\u0BFF\s]*விழுந்துவிட்டது",
    r"[\u0B80-\u0BFF a-zA-Z]+\s+சரியாகிவிட்டது",
    r"[\u0B80-\u0BFF a-zA-Z]+\s+நலமாக",
]

# ---------------------------------------------------------------------------
# Past-event patterns — events that happened historically; NOT current emergencies
# NOTE: Tamil \b word boundaries are unreliable for Unicode; use lookahead/ahead
# ---------------------------------------------------------------------------
PAST_EVENT_PATTERNS = [
    # English
    r"\blast\s+year\b",
    r"\blast\s+month\b",
    r"\b(?:\d+\s+)?years?\s+ago\b",

    # Tanglish
    r"(?<![a-zA-Z])munnadi(?![a-zA-Z])",
    r"(?<![a-zA-Z])palaya(?![a-zA-Z])",

    # Tamil script past markers — use simple substring search (no \b for Unicode)
    "முன்பு",       # "before / previously"
    "முன்னாடி",     # "earlier / previously"
    "கடந்த",       # "past / last (week/month/year)"
]


def _past_event_present(cleaned: str) -> bool:
    """Returns True if any past-event indicator is found in the cleaned text."""
    for pat in PAST_EVENT_PATTERNS:
        if pat.startswith("(?") or pat.startswith("\\b") or "\\" in pat:
            # Regex pattern
            if re.search(pat, cleaned):
                return True
        else:
            # Plain Unicode substring (Tamil script words)
            if pat in cleaned:
                return True
    return False


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
    if _past_event_present(cleaned):
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
                try:
                    matches = re.finditer(neg_pat, cleaned)
                    for m in matches:
                        negated_phrase = m.group(0)
                        if kw_clean in negated_phrase:
                            is_negated = True
                            break
                except re.error:
                    continue
                if is_negated:
                    break

            if not is_negated:
                guidance = (
                    "Possible urgent condition detected. Please immediately dial 108 (Ambulance) "
                    "or 112 (Emergency Services), or visit the nearest government hospital emergency casualty."
                )
                return True, kw_clean, guidance

    return False, None, ""
