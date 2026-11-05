"""
Number parser for Tamil, Tanglish, and English text.
Converts spoken words (Tamil script & Latin Tanglish), word forms, and digits into integers.
"""

import re
from typing import Optional

# Tamil digit words in script
TAMIL_SCRIPT_NUMBERS = {
    "பூஜ்ஜியம்": 0, "சுழியம்": 0, "பூஜ்யம்": 0,
    "ஒன்று": 1, "ஒன்னு": 1, "ஒரு": 1,
    "இரண்டு": 2, "ரெண்டு": 2, "இரு": 2,
    "மூன்று": 3, "மூணு": 3,
    "நான்கு": 4, "நாலு": 4,
    "ஐந்து": 5, "அஞ்சு": 5,
    "ஆறு": 6,
    "ஏழு": 7,
    "எட்டு": 8,
    "ஒன்பது": 9,
    "பத்து": 10,
    "பதினொன்று": 11, "பதினோரு": 11, "பதினொன்னு": 11,
    "பன்னிரண்டு": 12, "பன்னிரண்டு": 12, "பனிரெண்டு": 12,
    "பதின்மூன்று": 13, "பதின்மூணு": 13,
    "பதினான்கு": 14, "பதினாலு": 14,
    "பதினைந்து": 15, "பதினஞ்சு": 15,
    "பதினாறு": 16,
    "பதினேழு": 17,
    "பதினெட்டு": 18,
    "பத்தொன்பது": 19,
    "இருபது": 20,
    "முப்பது": 30,
    "நாற்பது": 40,
    "ஐம்பது": 50,
    "அறுபது": 60,
    "எழுபது": 70,
    "எண்பது": 80,
    "தொண்ணூறு": 90,
    "நூறு": 100,
}

# Tanglish (Romanized Tamil) words
TANGLISH_NUMBERS = {
    "poojyam": 0, "zero": 0, "suliya": 0,
    "onnu": 1, "oru": 1, "ondru": 1, "one": 1,
    "rendu": 2, "erandu": 2, "irandu": 2, "two": 2,
    "moonu": 3, "moondru": 3, "three": 3,
    "naalu": 4, "naanku": 4, "four": 4,
    "anju": 5, "aindhu": 5, "five": 5,
    "aaru": 6, "six": 6,
    "ezhu": 7, "seven": 7,
    "ettu": 8, "eight": 8,
    "onbadhu": 9, "ombodhu": 9, "nine": 9,
    "pathu": 10, "ten": 10,
    "padhinonnu": 11, "padhinondru": 11, "eleven": 11,
    "pannirendu": 12, "panirendu": 12, "twelve": 12,
    "padhimoondru": 13, "padhimoonu": 13, "thirteen": 13,
    "padhinaalu": 14, "fourteen": 14,
    "padhinanju": 15, "fifteen": 15,
    "padhinaaru": 16, "sixteen": 16,
    "padhinezhu": 17, "seventeen": 17,
    "padhinettu": 18, "eighteen": 18,
    "patthonbadhu": 19, "nineteen": 19,
    "irubadhu": 20, "twenty": 20,
    "muppadhu": 30, "thirty": 30,
    "naarpadhu": 40, "forty": 40,
    "aimbadhu": 50, "fifty": 50,
    "nooru": 100, "hundred": 100,
}


def parse_number(text: str) -> Optional[int]:
    """
    Extracts the most prominent integer from a Tamil, Tanglish, or English string.
    Returns None if no integer is found or if the digit is part of a phone number.
    Examples:
      - "ரெண்டு பேர்" -> 2
      - "naalu guests" -> 4
      - "3 persons" -> 3
      - "anju room" -> 5
      - "12" -> 12
    """
    if not text:
        return None
    cleaned = text.strip().lower()

    # Avoid matching 10-digit phone numbers as simple counts
    # Strip any 10-digit phone numbers first before searching for headcounts/numbers
    phone_clean = re.sub(r"\b[6-9]\d{9}\b", "", cleaned)

    # 1. Direct standard digits (e.g. "3", "3 பேர்", "4 guests")
    digit_match = re.search(r"\b(\d{1,4})\b", phone_clean)
    if digit_match:
        try:
            return int(digit_match.group(1))
        except ValueError:
            pass

    # 2. Check compound / standalone word matches in Tamil Script
    words = re.findall(r"[\w\u0B80-\u0BFF]+", phone_clean)
    for word in words:
        if word in TAMIL_SCRIPT_NUMBERS:
            return TAMIL_SCRIPT_NUMBERS[word]
        if word in TANGLISH_NUMBERS:
            return TANGLISH_NUMBERS[word]

    # 3. Check substring presence for phrases like "ரெண்டுபேர்" or "3per" or "onnu"
    for k, v in sorted(TAMIL_SCRIPT_NUMBERS.items(), key=lambda x: -len(x[0])):
        if k in cleaned:
            return v

    for k, v in sorted(TANGLISH_NUMBERS.items(), key=lambda x: -len(x[0])):
        # match as full token or word boundary in latin text
        pattern = rf"\b{re.escape(k)}\b"
        if re.search(pattern, cleaned):
            return v

    return None

