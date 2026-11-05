"""
Phone number parser for Tamil, Tanglish, and English text.
Extracts 10-digit mobile numbers from continuous digits, spaced digits,
or digit-by-digit spoken words (Tamil script & Tanglish).
"""

import re
from typing import Optional

# Single spoken digit mappings
DIGIT_MAP = {
    # Tamil script
    "பூஜ்ஜியம்": "0", "சுழியம்": "0", "பூஜ்யம்": "0", "சைபர்": "0",
    "ஒன்று": "1", "ஒன்னு": "1",
    "இரண்டு": "2", "ரெண்டு": "2",
    "மூன்று": "3", "மூணு": "3",
    "நான்கு": "4", "நாலு": "4",
    "ஐந்து": "5", "அஞ்சு": "5",
    "ஆறு": "6",
    "ஏழு": "7",
    "எட்டு": "8",
    "ஒன்பது": "9",

    # Tanglish words
    "zero": "0", "poojyam": "0", "saibar": "0", "cypher": "0",
    "one": "1", "onnu": "1", "ondru": "1",
    "two": "2", "rendu": "2", "irandu": "2",
    "three": "3", "moonu": "3", "moondru": "3",
    "four": "4", "naalu": "4", "naanku": "4",
    "five": "5", "anju": "5", "aindhu": "5",
    "six": "6", "aaru": "6",
    "seven": "7", "ezhu": "7",
    "eight": "8", "ettu": "8",
    "nine": "9", "onbadhu": "9", "ombodhu": "9",
}


def parse_phone(text: str) -> Optional[str]:
    """
    Finds and normalizes a 10-digit Indian phone number.
    Handles:
      - Continuous digits: "9840123456", "+91 9840123456", "09840123456"
      - Spaced / hyphenated digits: "98401 23456", "9840-123-456"
      - Digit-by-digit spoken words: "ஒன்பது எட்டு நான்கு பூஜ்ஜியம்..." or "nine eight four zero..."
    """
    if not text:
        return None
    cleaned = text.strip().lower()

    # 1. First, search for standard continuous or formatted digits
    # Remove separators between numbers: e.g. "98401-23456" -> "9840123456"
    raw_digits = re.sub(r"[^\d]", "", cleaned)

    # If it starts with 91 and has 12 digits (+91 9840123456)
    if len(raw_digits) == 12 and raw_digits.startswith("91") and raw_digits[2] in "6789":
        return raw_digits[2:]

    # If it starts with 0 and has 11 digits (STD format 09840123456)
    if len(raw_digits) == 11 and raw_digits.startswith("0") and raw_digits[1] in "6789":
        return raw_digits[1:]

    # Direct 10-digit sequence starting with 6, 7, 8, or 9
    ten_digit_match = re.search(r"\b([6-9]\d{9})\b", raw_digits)
    if ten_digit_match:
        return ten_digit_match.group(1)

    # 2. Spoken digit-by-digit words
    tokens = re.findall(r"[\w\u0B80-\u0BFF]+", cleaned)
    digit_stream = []
    for token in tokens:
        if token in DIGIT_MAP:
            digit_stream.append(DIGIT_MAP[token])
        elif token.isdigit():
            digit_stream.extend(list(token))

    joined_digits = "".join(digit_stream)
    if len(joined_digits) >= 10:
        # Check if contains a 10 digit sequence starting with 6-9
        seq_match = re.search(r"([6-9]\d{9})", joined_digits)
        if seq_match:
            return seq_match.group(1)

    return None

