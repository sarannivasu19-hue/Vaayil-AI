"""
Name and free-text extractor for Tamil, Tanglish, and English text.
Extracts caller/patient/guest names and free-form notes from utterances.
"""

import re
from typing import Optional

# Prefixes used when introducing names
NAME_PREFIXES_REGEX = re.compile(
    r"(?:en\s+peyar|yen\s+peyar|enna\s+peyar|ennoda\s+peyar|peyar|peru|en\s+peru|en\s+name|my\s+name\s+is|this\s+is|i\s+am|"
    r"என்\s+பெயர்|பெயர்|என்\s+பேர்|நான்)\s*[:=]?\s*([a-zA-Z\u0B80-\u0BFF\.\s]{2,40})",
    re.IGNORECASE
)

# Filler words to strip out from names
STOP_WORDS = {
    "nga", "dha", "dhaan", "thaan", "pa", "appo", "nu", "solranga", "endru", "sir", "madam", "dr", "doctor",
    "please", "booking", "venum", "thevai", "irukku"
}


def parse_name(text: str) -> Optional[str]:
    """
    Extracts a human name from Tamil, Tanglish, or English.
    Handles:
      - "En peyar Saravanan" -> "Saravanan"
      - "என் பெயர் க. மீனாட்சி" -> "க. மீனாட்சி"
      - "My name is John Doe" -> "John Doe"
      - "This is Rajesh" -> "Rajesh"
      - Direct short name answer when prompted: "Senthil Nathan", "அருமுகம்"
    """
    if not text:
        return None
    cleaned = text.strip()

    # 1. Match with prefix
    prefix_match = NAME_PREFIXES_REGEX.search(cleaned)
    if prefix_match:
        extracted = prefix_match.group(1).strip()
        # Clean trailing connectors
        extracted_tokens = [t for t in extracted.split() if t.lower() not in STOP_WORDS]
        if extracted_tokens:
            return " ".join(extracted_tokens[:4])

    # 2. If the user answered simply with their name (1 to 3 words, no numbers, not a greeting)
    # Exclude common greetings/intents
    lower = cleaned.lower()
    non_names = ["vanakkam", "வணக்கம்", "hello", "hi", "yes", "no", "illa", "seri", "ok", "booking"]
    if any(lower == nn for nn in non_names):
        return None

    # Check if string consists purely of alphabet / Tamil characters / dots / spaces and is 1-3 words
    if re.fullmatch(r"^[a-zA-Z\u0B80-\u0BFF\.\s]{2,35}$", cleaned):
        words = [w for w in cleaned.split() if w.lower() not in STOP_WORDS]
        if 1 <= len(words) <= 4:
            return " ".join(words)

    return None


def clean_free_text(text: str) -> Optional[str]:
    """
    Cleans and returns free-text descriptions or remarks.
    """
    if not text or len(text.strip()) < 2:
        return None
    cleaned = text.strip()
    return cleaned[:300]

