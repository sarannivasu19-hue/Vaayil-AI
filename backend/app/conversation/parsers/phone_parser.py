"""
Universal Phone Number Parser and Normalization Engine for Tamil, Tanglish, and English.
Extracts, validates, and normalizes 10-digit Indian mobile numbers spoken across:
- Spoken number words in English ("nine three four five...")
- Multipliers ("double zero", "triple five", "டபுள் ஜீரோ")
- Pure digits ("9345000025", "9 3 4 5 0 0 0 0 2 5")
- Tamil script words ("ஒன்பது மூன்று நான்கு ஐந்து...")
- Tanglish phonetic words ("onbadhu moonu naalu...")
- Country code variations ("+91 9345000025", "09345000025")
"""

import re
from typing import Optional, List, Dict

# Single spoken digit mappings across English, Tamil script, and Tanglish
DIGIT_MAP: Dict[str, str] = {
    # 0
    "0": "0", "zero": "0", "oh": "0", "o": "0", "nil": "0", "nought": "0",
    "பூஜ்ஜியம்": "0", "சுழியம்": "0", "பூஜ்யம்": "0", "சைபர்": "0", "ஜீரோ": "0",
    "poojyam": "0", "suzhiyam": "0", "saibar": "0", "cypher": "0", "jeero": "0",

    # 1
    "1": "1", "one": "1", "ondru": "1", "onru": "1", "onnu": "1", "one-u": "1",
    "ஒன்று": "1", "ஒன்னு": "1", "ஒண்ணு": "1", "ஒரு": "1",

    # 2
    "2": "2", "two": "2", "irandu": "2", "rendu": "2",
    "இரண்டு": "2", "ரெண்டு": "2", "ரெண்டாவது": "2",

    # 3
    "3": "3", "three": "3", "moondru": "3", "moonu": "3",
    "மூன்று": "3", "மூணு": "3",

    # 4
    "4": "4", "four": "4", "naanku": "4", "naalu": "4",
    "நான்கு": "4", "நாலு": "4",

    # 5
    "5": "5", "five": "5", "aindhu": "5", "anju": "5",
    "ஐந்து": "5", "அஞ்சு": "5",

    # 6
    "6": "6", "six": "6", "aaru": "6",
    "ஆறு": "6",

    # 7
    "7": "7", "seven": "7", "ezhu": "7",
    "ஏழு": "7",

    # 8
    "8": "8", "eight": "8", "ettu": "8",
    "எட்டு": "8",

    # 9
    "9": "9", "nine": "9", "onbadhu": "9", "ombodhu": "9", "onbathu": "9",
    "ஒன்பது": "9", "ஒம்போது": "9",
}

# Multiplier tokens (repeat the subsequent digit 2x or 3x)
DOUBLE_TOKENS = {
    "double", "dabal", "dabble", "dabool", "irattai", "இரட்டை", "ரெட்டை", "டபுள்", "டபிள்"
}

TRIPLE_TOKENS = {
    "triple", "thriple", "டிரிபிள்", "ட்ரிபிள்", "முப்படை"
}

TAMIL_SPEECH_DIGITS = {
    "0": "பூஜ்ஜியம்", "1": "ஒன்று", "2": "இரண்டு", "3": "மூன்று", "4": "நான்கு",
    "5": "ஐந்து", "6": "ஆறு", "7": "ஏழு", "8": "எட்டு", "9": "ஒன்பது"
}

ENGLISH_SPEECH_DIGITS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine"
}


def mask_phone(phone: str) -> str:
    """Masks phone number for secure, privacy-compliant diagnostic logging."""
    if not phone:
        return ""
    clean = re.sub(r"\D", "", phone)
    if len(clean) == 12 and clean.startswith("91"):
        clean = clean[2:]
    elif len(clean) == 11 and clean.startswith("0"):
        clean = clean[1:]
    if len(clean) >= 10:
        return f"{clean[:2]}******{clean[-2:]}"
    return "****"


def format_phone_for_speech(phone: str, language: str = "ta") -> str:
    """
    Formats a 10-digit phone number as comma-separated spoken digits
    so that TTS speaks each digit slowly and individually with natural pauses.
    """
    clean = re.sub(r"\D", "", phone)
    if len(clean) != 10:
        return phone

    lang = language.lower()
    if "tam" in lang or lang == "ta":
        return ", ".join(TAMIL_SPEECH_DIGITS.get(d, d) for d in clean)
    elif "eng" in lang or lang == "en":
        return ", ".join(ENGLISH_SPEECH_DIGITS.get(d, d) for d in clean)
    else:
        # Tanglish: comma-separated digits for slow, clear pronunciation
        return ", ".join(clean)


def normalize_spoken_tokens(text: str) -> List[str]:
    """
    Tokenizes spoken input preserving Tamil Unicode characters, Latin words, and digits.
    Expands multipliers like 'double' and 'triple'.
    """
    cleaned = text.strip().lower()
    # Replace common separators with spaces
    cleaned = re.sub(r"[\-\_\,\.\;\:]+", " ", cleaned)

    # Tokenize words and digit clusters
    raw_tokens = re.findall(r"[\w\u0B80-\u0BFF]+", cleaned)

    expanded_tokens: List[str] = []
    i = 0
    while i < len(raw_tokens):
        token = raw_tokens[i]

        # Check for multiplier + digit/word (e.g. "double zero", "டபுள் ஜீரோ", "double 0")
        if token in DOUBLE_TOKENS and (i + 1) < len(raw_tokens):
            next_token = raw_tokens[i + 1]
            if next_token in DIGIT_MAP or next_token.isdigit():
                expanded_tokens.append(next_token)
                expanded_tokens.append(next_token)
                i += 2
                continue

        if token in TRIPLE_TOKENS and (i + 1) < len(raw_tokens):
            next_token = raw_tokens[i + 1]
            if next_token in DIGIT_MAP or next_token.isdigit():
                expanded_tokens.append(next_token)
                expanded_tokens.append(next_token)
                expanded_tokens.append(next_token)
                i += 2
                continue

        expanded_tokens.append(token)
        i += 1

    return expanded_tokens


def extract_digit_stream(tokens: List[str]) -> str:
    """Converts a token sequence into a contiguous string of digits."""
    digits = []
    for t in tokens:
        if t in DIGIT_MAP:
            digits.append(DIGIT_MAP[t])
        elif t.isdigit():
            digits.extend(list(t))
    return "".join(digits)


def validate_indian_mobile(digits: str) -> Optional[str]:
    """
    Validates and normalizes an Indian mobile number.
    Rules:
    - Exactly 10 digits starting with 6, 7, 8, 9
    - Handles +91 / 91 country code (12 digits)
    - Handles leading 0 trunk prefix (11 digits)
    - Searches embedded 10-digit mobile sequence starting with 6-9
    """
    if not digits:
        return None

    # Exact 10-digit number
    if len(digits) == 10 and digits[0] in "6789":
        return digits

    # Handle +91 / 91 prefix
    if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return digits[2:]

    # Handle leading 0 prefix
    if len(digits) == 11 and digits.startswith("0") and digits[1] in "6789":
        return digits[1:]

    # If stream contains embedded 10-digit mobile number starting with 6-9
    match = re.search(r"(?:(?:\+?91)|0)?([6-9]\d{9})", digits)
    if match:
        return match.group(1)

    return None


def apply_phone_correction(current_phone: str, text: str) -> Optional[str]:
    """
    If the customer corrects one or more digits of a pending 10-digit number.
    e.g. 'last digit is 6', 'last number 8', 'kadaisi number 6', 'ending with 6'.
    """
    if not current_phone or len(current_phone) != 10:
        return None

    t = text.lower()
    # Check for "last digit / ending / kadaisi"
    last_digit_match = re.search(
        r"(?:last|ending|end|kadaisi|கடைசி)\s*(?:digit|number|num|எண்)?\s*(?:is|nu|la|with|in)?\s*([\w\u0B80-\u0BFF]+)",
        t
    )
    if last_digit_match:
        digit_token = last_digit_match.group(1)
        if digit_token in DIGIT_MAP:
            d = DIGIT_MAP[digit_token]
            return current_phone[:9] + d
        elif digit_token.isdigit() and len(digit_token) == 1:
            return current_phone[:9] + digit_token

    # Check for "first digit / starting / modhal"
    first_digit_match = re.search(
        r"(?:first|starting|start|modhal|முதல்)\s*(?:digit|number|num|எண்)?\s*(?:is|nu|la)?\s*([\w\u0B80-\u0BFF]+)",
        t
    )
    if first_digit_match:
        digit_token = first_digit_match.group(1)
        d = DIGIT_MAP.get(digit_token) if not digit_token.isdigit() else (digit_token if len(digit_token) == 1 else None)
        if d and d in "6789":
            return d + current_phone[1:]

    return None


def parse_phone(text: str) -> Optional[str]:
    """
    Universal Phone Number Parser & Normalization Engine.
    Accurately extracts a valid 10-digit Indian mobile number from English, Tamil, Tanglish,
    or mixed speech, handling double/triple words, spaced numbers, and country codes.
    """
    if not text:
        return None

    # 1. First check for direct numeric 10-digit phone pattern in text (with optional +91 or 0 prefix)
    direct_match = re.search(r"(?:(?:\+?91[\s\-]*)|\b0)?([6-9]\d{4}[\s\-]*\d{5}|[6-9]\d{9})\b", text)
    if direct_match:
        extracted = re.sub(r"\D", "", direct_match.group(1))
        if len(extracted) == 10 and extracted[0] in "6789":
            return extracted

    # 2. Tokenize and expand spoken number words (including double/triple and Tamil script)
    tokens = normalize_spoken_tokens(text)
    digit_stream = extract_digit_stream(tokens)

    # 3. Validate extracted digit stream
    normalized = validate_indian_mobile(digit_stream)
    return normalized


