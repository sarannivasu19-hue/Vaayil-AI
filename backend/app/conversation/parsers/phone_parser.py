"""
Universal Phone Number Parser, Extractor, and Normalization Engine for Tamil, Tanglish, and English.
Extracts, validates, and normalizes Indian 10-digit mobile numbers across:
- Spoken number words in English ("nine three four five...", "forty-five")
- Grouped number words in English ("twenty five", "forty five")
- Spoken numbers in Tamil script ("ஒன்பது மூன்று நான்கு ஐந்து...", "நாற்பத்தைந்து", "இருபத்தைந்து")
- Tanglish phonetic speech ("onbadhu moonu naalu anju...", "iruvathi anju", "naappaththu anju")
- Multipliers ("double zero", "triple zero", "double oh", "டபுள் ஜீரோ", "இரட்டை பூஜ்ஜியம்")
- Numeric & spaced formats ("9345000025", "93 45 double zero double zero 2 5", "9345 0000 25")
- Country code variations ("+91 9345000025", "91 9345000025", "0091 9345000025", "09345000025")
- Single-digit and targeted position corrections during voice confirmation
- Strict validation: exactly 10 digits starting with 6, 7, 8, or 9. Never invents or alters digits.
"""

import re
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Tuple


@dataclass
class PhoneAnalysis:
    is_valid: bool
    phone: Optional[str]
    raw_digits: str
    digit_count: int
    status: str  # "valid", "incomplete", "too_long", "invalid_prefix", "no_digits"
    message_en: str
    message_ta: str
    message_tanglish: str

    def to_dict(self) -> dict:
        return asdict(self)


# Single spoken digit mappings across English, Tamil script, and Tanglish
DIGIT_MAP: Dict[str, str] = {
    # 0
    "0": "0", "zero": "0", "oh": "0", "o": "0", "nil": "0", "nought": "0",
    "பூஜ்ஜியம்": "0", "சுழியம்": "0", "பூஜ்யம்": "0", "சைபர்": "0", "ஜீரோ": "0",
    "poojyam": "0", "suzhiyam": "0", "saibar": "0", "saiber": "0", "cypher": "0",
    "jeero": "0", "ziro": "0",

    # 1
    "1": "1", "one": "1", "ondru": "1", "onru": "1", "onnu": "1", "onndru": "1", "one-u": "1",
    "ஒன்று": "1", "ஒன்னு": "1", "ஒண்ணு": "1", "ஒரு": "1",

    # 2
    "2": "2", "two": "2", "irandu": "2", "rendu": "2", "erandu": "2",
    "இரண்டு": "2", "ரெண்டு": "2", "ரெண்டாவது": "2",

    # 3
    "3": "3", "three": "3", "moondru": "3", "moonu": "3", "mundru": "3",
    "மூன்று": "3", "மூணு": "3",

    # 4
    "4": "4", "four": "4", "naanku": "4", "naalu": "4", "nangu": "4", "naangu": "4",
    "நான்கு": "4", "நாலு": "4", "நாங்கு": "4",

    # 5
    "5": "5", "five": "5", "aindhu": "5", "ainthu": "5", "anju": "5", "anji": "5",
    "ஐந்து": "5", "அஞ்சு": "5",

    # 6
    "6": "6", "six": "6", "aaru": "6",
    "ஆறு": "6",

    # 7
    "7": "7", "seven": "7", "ezhu": "7", "yelu": "7",
    "ஏழு": "7",

    # 8
    "8": "8", "eight": "8", "ettu": "8", "yettu": "8",
    "எட்டு": "8",

    # 9
    "9": "9", "nine": "9", "onbadhu": "9", "ombodhu": "9", "onbathu": "9", "ombathu": "9", "ompathu": "9",
    "ஒன்பது": "9", "ஒம்போது": "9", "ஒம்பது": "9",
}

# Teens (10 - 19)
TEENS_MAP: Dict[str, str] = {
    # 10
    "10": "10", "ten": "10", "பத்து": "10", "pathu": "10", "paathu": "10",
    # 11
    "11": "11", "eleven": "11", "பதினொன்று": "11", "பதினொன்னு": "11", "பதினோரு": "11",
    "padhinondru": "11", "pathinonnu": "11", "padhinonnu": "11",
    # 12
    "12": "12", "twelve": "12", "பன்னிரண்டு": "12", "பன்னிரெண்டு": "12",
    "pannirendu": "12", "pannirandu": "12",
    # 13
    "13": "13", "thirteen": "13", "பதின்மூன்று": "13", "பதிமூன்று": "13", "பதிமூணு": "13",
    "padhimoondru": "13", "pathimoonu": "13", "padhimoonu": "13",
    # 14
    "14": "14", "fourteen": "14", "பதினான்கு": "14", "பதினாங்கு": "14", "பதினாலு": "14",
    "padhinaangu": "14", "pathinaalu": "14", "padhinaalu": "14",
    # 15
    "15": "15", "fifteen": "15", "பதினைந்து": "15", "பதினஞ்சு": "15",
    "padhinaindhu": "15", "pathinanju": "15", "padhinanju": "15",
    # 16
    "16": "16", "sixteen": "16", "பதினாறு": "16", "padhinaaru": "16", "pathinaaru": "16",
    # 17
    "17": "17", "seventeen": "17", "பதினேழு": "17", "padhinezhu": "17", "pathinezhu": "17",
    # 18
    "18": "18", "eighteen": "18", "பதினெட்டு": "18", "padhinettu": "18", "pathinettu": "18",
    # 19
    "19": "19", "nineteen": "19", "பத்தொன்பது": "19", "பத்தொம்பது": "19", "பத்தொம்போது": "19",
    "pathonbadhu": "19", "pathombadhu": "19", "pathombathu": "19",
}

# Tens base mapping (maps to leading digit '2' - '9' for 20 - 90)
TENS_BASE_MAP: Dict[str, str] = {
    # 20
    "twenty": "2", "இருபது": "2", "இருவது": "2", "இருபத்தி": "2", "இருவத்தி": "2",
    "இருபத்து": "2", "இருவத்து": "2", "iruvadhu": "2", "irubadhu": "2", "iruvathu": "2",
    "irubathu": "2", "iruvathi": "2", "irubathi": "2",
    # 30
    "thirty": "3", "முப்பது": "3", "முப்பத்தி": "3", "முப்பத்து": "3",
    "muppadhu": "3", "muppathu": "3", "muppathi": "3",
    # 40
    "forty": "4", "fourty": "4", "நாற்பது": "4", "நாப்பது": "4", "நாற்பத்தி": "4",
    "நாப்பத்தி": "4", "நாற்பத்து": "4", "நாப்பத்து": "4", "நாப்பத்த்து": "4",
    "naarpadhu": "4", "naappadhu": "4", "naarpathu": "4", "naapathu": "4",
    "naappathu": "4", "naarpathi": "4", "naappathi": "4", "naapathi": "4",
    "naappaththu": "4", "naapaththu": "4",
    # 50
    "fifty": "5", "ஐம்பது": "5", "அம்பது": "5", "ஐம்பத்தி": "5", "அம்பத்தி": "5",
    "ஐம்பத்து": "5", "அம்பத்து": "5", "aimbadhu": "5", "ambadhu": "5", "aimbathu": "5",
    "ambathu": "5", "aimbathi": "5", "ambathi": "5",
    # 60
    "sixty": "6", "அறுபது": "6", "அறுபத்தி": "6", "அறுபத்து": "6",
    "arupadhu": "6", "arubadhu": "6", "arupathu": "6", "arupathi": "6",
    # 70
    "seventy": "7", "எழுபது": "7", "எழுபத்தி": "7", "எழுபத்து": "7",
    "ezhubadhu": "7", "eluvadhu": "7", "ezhubathu": "7", "ezhubathi": "7",
    # 80
    "eighty": "8", "எண்பது": "8", "எம்பது": "8", "எண்பத்தி": "8", "எம்பத்தி": "8",
    "எண்பத்து": "8", "எம்பத்து": "8", "enbadhu": "8", "embadhu": "8", "enbathu": "8",
    "embathu": "8", "enbathi": "8", "embathi": "8",
    # 90
    "ninety": "9", "தொண்ணூறு": "9", "தொண்ணூற்றி": "9", "தொண்ணூத்தி": "9", "தொண்ணூத்து": "9",
    "thonnooru": "9", "thonnoor": "9", "thonnoothi": "9", "thonnootti": "9",
}

# Standalone exact compound words (21-99)
COMPOUND_MAP: Dict[str, str] = {
    # Tamil compounds
    "இருபத்தொன்று": "21", "இருவத்தொன்னு": "21", "இருபத்திரண்டு": "22", "இருவத்திரெண்டு": "22",
    "இருபத்திமூன்று": "23", "இருவத்திமூணு": "23", "இருபத்திநான்கு": "24", "இருவத்திநாலு": "24",
    "இருபத்தைந்து": "25", "இருவத்தஞ்சு": "25", "இருபத்தாறு": "26", "இருபத்தேழு": "27",
    "இருபத்தெட்டு": "28", "இருபத்தொன்பது": "29", "இருவத்தொம்பது": "29",

    "முப்பத்தொன்று": "31", "முப்பத்திரண்டு": "32", "முப்பத்திமூன்று": "33", "முப்பத்திநான்கு": "34",
    "முப்பத்தைந்து": "35", "முப்பத்தஞ்சு": "35", "முப்பத்தாறு": "36", "முப்பத்தேழு": "37",
    "முப்பத்தெட்டு": "38", "முப்பத்தொன்பது": "39",

    "நாற்பத்தொன்று": "41", "நாப்பத்தொன்னு": "41", "நாற்பத்திரண்டு": "42", "நாப்பத்திரெண்டு": "42",
    "நாற்பத்திமூன்று": "43", "நாப்பத்திமூணு": "43", "நாற்பத்திநான்கு": "44", "நாப்பத்திநாலு": "44",
    "நாற்பத்தைந்து": "45", "நாப்பத்தஞ்சு": "45", "நாற்பத்தாறு": "46", "நாற்பத்தேழு": "47",
    "நாற்பத்தெட்டு": "48", "நாற்பத்தொன்பது": "49",

    "ஐம்பத்தொன்று": "51", "அம்பத்தொன்னு": "51", "ஐம்பத்தைந்து": "55", "அம்பத்தஞ்சு": "55",
    "அறுபத்தைந்து": "65", "எழுபத்தைந்து": "75", "எண்பத்தைந்து": "85",
    "தொண்ணூற்றைந்து": "95", "தொண்ணூத்தஞ்சு": "95",

    # Tanglish compounds
    "iruvathianju": "25", "irubathianju": "25", "iruvathianji": "25", "irubathianji": "25",
    "naarpadhianju": "45", "naapathianju": "45", "naappaththuanju": "45", "naarpathianju": "45",
}

# Multiplier tokens (repeat the subsequent digit 2x or 3x)
DOUBLE_TOKENS = {
    "double", "dabal", "dabble", "dabool", "irattai", "இரட்டை", "ரெட்டை", "டபுள்", "டபிள்"
}

TRIPLE_TOKENS = {
    "triple", "thriple", "டிரிபிள்", "ட்ரிபிள்", "முப்படை", "மும்முறை"
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
    """Masks phone number for secure, privacy-compliant diagnostic logging (e.g. 93******25)."""
    if not phone:
        return ""
    clean = re.sub(r"\D", "", phone)
    if len(clean) == 14 and clean.startswith("0091"):
        clean = clean[4:]
    elif len(clean) == 12 and clean.startswith("91"):
        clean = clean[2:]
    elif len(clean) == 11 and clean.startswith("0"):
        clean = clean[1:]
    if len(clean) >= 10:
        return f"{clean[:2]}******{clean[-2:]}"
    return "****"


def format_phone_for_speech(phone: str, language: str = "ta") -> str:
    """
    Formats a 10-digit phone number as comma-separated spoken digits
    so that TTS (Gnani Timbre) speaks each digit slowly and individually with natural pauses.
    """
    clean = re.sub(r"\D", "", phone)
    if len(clean) == 14 and clean.startswith("0091"):
        clean = clean[4:]
    elif len(clean) == 12 and clean.startswith("91"):
        clean = clean[2:]
    elif len(clean) == 11 and clean.startswith("0"):
        clean = clean[1:]

    if len(clean) != 10:
        return phone

    lang = (language or "").lower()
    if "tam" in lang or lang == "ta":
        return ", ".join(TAMIL_SPEECH_DIGITS.get(d, d) for d in clean)
    elif "eng" in lang or lang == "en":
        return ", ".join(ENGLISH_SPEECH_DIGITS.get(d, d) for d in clean)
    else:
        # Tanglish: comma-separated digits for slow, clear pronunciation
        return ", ".join(clean)


def extract_digit_stream(text: str) -> str:
    """
    Converts spoken words, compound numbers, multipliers, and digits into a contiguous digit string.
    Properly understands:
    - Multipliers: "double zero" -> "00", "triple five" -> "555"
    - Compound words: "forty-five" -> "45", "நாற்பத்தைந்து" -> "45"
    - Two-word groups: "forty" + "five" -> "45", "twenty" + "five" -> "25"
    - Teens: "fourteen" -> "14", "பதினான்கு" -> "14"
    - Spaced & grouped digits: "9345", "93", "25"
    - Filler words are safely skipped without generating spurious digits.
    """
    cleaned = text.strip().lower()
    # Replace common punctuation and separators with space
    cleaned = re.sub(r"[\-\_\,\.\;\:\(\)\/\+]+", " ", cleaned)

    # Tokenize words, Tamil Unicode words, and numeric strings
    raw_tokens = re.findall(r"[\w\u0B80-\u0BFF]+", cleaned)

    digits: List[str] = []
    i = 0
    n = len(raw_tokens)

    while i < n:
        token = raw_tokens[i]

        # 1. Multipliers: "double zero", "triple zero", "டபுள் ஜீரோ"
        if token in DOUBLE_TOKENS and (i + 1) < n:
            next_t = raw_tokens[i + 1]
            if next_t in DIGIT_MAP:
                d = DIGIT_MAP[next_t]
                digits.extend([d, d])
                i += 2
                continue
            elif next_t.isdigit() and len(next_t) == 1:
                digits.extend([next_t, next_t])
                i += 2
                continue

        if token in TRIPLE_TOKENS and (i + 1) < n:
            next_t = raw_tokens[i + 1]
            if next_t in DIGIT_MAP:
                d = DIGIT_MAP[next_t]
                digits.extend([d, d, d])
                i += 2
                continue
            elif next_t.isdigit() and len(next_t) == 1:
                digits.extend([next_t, next_t, next_t])
                i += 2
                continue

        # 2. Exact compound words (e.g. "நாற்பத்தைந்து", "iruvathianju")
        if token in COMPOUND_MAP:
            digits.extend(list(COMPOUND_MAP[token]))
            i += 1
            continue

        # 3. Teens (e.g. "fourteen", "பதினைந்து", "pathinonnu")
        if token in TEENS_MAP:
            digits.extend(list(TEENS_MAP[token]))
            i += 1
            continue

        # 4. Tens Base with Lookahead (e.g. "forty" + "five" -> "45", "twenty" + "five" -> "25")
        if token in TENS_BASE_MAP:
            base_digit = TENS_BASE_MAP[token]
            if (i + 1) < n:
                next_t = raw_tokens[i + 1]
                if next_t in DIGIT_MAP and DIGIT_MAP[next_t] != "0":
                    unit_digit = DIGIT_MAP[next_t]
                    digits.extend([base_digit, unit_digit])
                    i += 2
                    continue
                elif next_t.isdigit() and len(next_t) == 1 and next_t != "0":
                    digits.extend([base_digit, next_t])
                    i += 2
                    continue
            # Standalone tens (e.g. "twenty" alone -> "20")
            digits.extend([base_digit, "0"])
            i += 1
            continue

        # 5. Single digit words
        if token in DIGIT_MAP:
            digits.append(DIGIT_MAP[token])
            i += 1
            continue

        # 6. Raw digits (e.g. "9345", "25", "9")
        if token.isdigit():
            digits.extend(list(token))
            i += 1
            continue

        # Ignored filler word
        i += 1

    return "".join(digits)


def validate_indian_mobile(digits: str) -> Optional[str]:
    """
    Validates that a digit stream represents a valid 10-digit Indian mobile number.
    Rules:
    - Strips 0091 international prefix (14 digits total)
    - Strips +91 / 91 country code prefix (12 digits total)
    - Strips leading 0 trunk prefix (11 digits total)
    - Must be EXACTLY 10 digits starting with 6, 7, 8, or 9
    - Never silently truncates or pads digits
    """
    if not digits:
        return None

    # Handle 0091 prefix
    if digits.startswith("0091") and len(digits) == 14:
        digits = digits[4:]
    # Handle 91 prefix
    elif digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    # Handle leading 0 trunk prefix
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    # Must be exactly 10 digits starting with 6, 7, 8, 9
    if len(digits) == 10 and digits[0] in "6789":
        return digits

    return None


def analyze_phone(text: str) -> PhoneAnalysis:
    """
    Performs full diagnostic analysis of a spoken or typed text for phone number extraction.
    Categorizes results into 'valid', 'incomplete', 'too_long', 'invalid_prefix', or 'no_digits'.
    Generates tailored, helpful messages in Tamil, English, and Tanglish.
    """
    if not text or not text.strip():
        return PhoneAnalysis(
            is_valid=False,
            phone=None,
            raw_digits="",
            digit_count=0,
            status="no_digits",
            message_en="No phone number detected. Please provide your 10-digit mobile number.",
            message_ta="மொபைல் எண் கண்டறியப்படவில்லை. தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணை கூறுங்கள்.",
            message_tanglish="Mobile number theriyala. Unga 10-digit mobile number-a sollunga.",
        )

    # 1. Direct numeric match check first
    direct = re.search(
        r"(?:(?:\+?91[\s\-]*)|\b0091[\s\-]*|\b0)?\b([6-9]\d{4}[\s\-]*\d{5}|[6-9]\d{9})\b",
        text
    )
    if direct:
        cleaned_num = re.sub(r"\D", "", direct.group(1))
        if len(cleaned_num) == 10 and cleaned_num[0] in "6789":
            return PhoneAnalysis(
                is_valid=True,
                phone=cleaned_num,
                raw_digits=cleaned_num,
                digit_count=10,
                status="valid",
                message_en=f"Mobile number {cleaned_num} detected.",
                message_ta=f"மொபைல் எண் {cleaned_num} கண்டறியப்பட்டது.",
                message_tanglish=f"Mobile number {cleaned_num} kidaichirukku.",
            )

    # 2. Extract full digit stream through NLP tokenization
    stream = extract_digit_stream(text)

    # Strip recognized country / trunk code prefixes
    core = stream
    if core.startswith("0091") and len(core) >= 14:
        core = core[4:]
    elif core.startswith("91") and len(core) >= 12:
        core = core[2:]
    elif core.startswith("0") and len(core) >= 11:
        core = core[1:]

    digit_count = len(core)

    if digit_count == 0:
        return PhoneAnalysis(
            is_valid=False,
            phone=None,
            raw_digits="",
            digit_count=0,
            status="no_digits",
            message_en="No phone number detected. Please provide your 10-digit mobile number.",
            message_ta="மொபைல் எண் கண்டறியப்படவில்லை. தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணை கூறுங்கள்.",
            message_tanglish="Mobile number theriyala. Unga 10-digit mobile number-a sollunga.",
        )

    if digit_count < 10:
        missing = 10 - digit_count
        return PhoneAnalysis(
            is_valid=False,
            phone=None,
            raw_digits=core,
            digit_count=digit_count,
            status="incomplete",
            message_en=f"I detected only {digit_count} digits ({core}). Please provide the complete 10-digit mobile number.",
            message_ta=f"{digit_count} இலக்கங்கள் மட்டுமே உள்ளன ({core}). தயவுசெய்து 10 இலக்க மொபைல் எண்ணை முழுமையாக கூறுங்கள்.",
            message_tanglish=f"{digit_count} digits dhaan irukku ({core}). 10-digit mobile number-a muzhusa sollunga.",
        )

    if digit_count > 10:
        return PhoneAnalysis(
            is_valid=False,
            phone=None,
            raw_digits=core,
            digit_count=digit_count,
            status="too_long",
            message_en=f"More than 10 digits detected ({digit_count} digits). Please speak only your 10-digit mobile number.",
            message_ta=f"10 இலக்கங்களுக்கு மேல் ({digit_count} இலக்கங்கள்) உள்ளன. தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணை மட்டும் கூறுங்கள்.",
            message_tanglish=f"10 digits-ku mela irukku ({digit_count} digits). Unga 10-digit mobile number mattum sollunga.",
        )

    # Exactly 10 digits
    first_digit = core[0]
    if first_digit not in "6789":
        return PhoneAnalysis(
            is_valid=False,
            phone=None,
            raw_digits=core,
            digit_count=10,
            status="invalid_prefix",
            message_en=f"Indian mobile numbers must start with 6, 7, 8, or 9 (starts with {first_digit}). Please repeat.",
            message_ta=f"இந்திய மொபைல் எண்கள் 6, 7, 8 அல்லது 9 இல் தொடங்க வேண்டும் ({first_digit} இல் தொடங்குகிறது). தயவுசெய்து மீண்டும் கூறுங்கள்.",
            message_tanglish=f"Indian mobile numbers 6, 7, 8 or 9-la dhaan start aaganum ({first_digit}-la start aagudhu). Marubadiyum sollunga.",
        )

    return PhoneAnalysis(
        is_valid=True,
        phone=core,
        raw_digits=core,
        digit_count=10,
        status="valid",
        message_en=f"Mobile number {core} detected.",
        message_ta=f"மொபைல் எண் {core} கண்டறியப்பட்டது.",
        message_tanglish=f"Mobile number {core} kidaichirukku.",
    )


def parse_phone(text: str) -> Optional[str]:
    """
    Universal Phone Number Parser & Normalization Engine.
    Accurately extracts a valid 10-digit Indian mobile number from English, Tamil, Tanglish,
    or mixed speech, handling double/triple words, grouped numbers, and country codes.
    Returns 10-digit string if valid, else None.
    """
    analysis = analyze_phone(text)
    return analysis.phone if analysis.is_valid else None


def apply_phone_correction(current_phone: str, text: str) -> Optional[str]:
    """
    Applies targeted single-digit or position corrections when a customer corrects a pending phone number.
    Supports:
    - "last digit is 6" / "last number 8" / "ending with 0" / "கடைசி எண் ஆறு" / "kadaisi number 8"
    - "first digit is 8" / "starting with 9" / "முதல் எண் எட்டு" / "modhal number 9"
    - Ordinals: "second digit is 4", "third digit is 5", "2nd number is 4", "இரண்டாவது எண் நான்கு"
    - Last two digits: "last two digits are 25", "ending with 25"
    """
    if not current_phone or len(current_phone) != 10:
        return None

    t = text.lower().strip()

    # 1. Did the caller speak a full replacement 10-digit number?
    full_new = parse_phone(t)
    if full_new and full_new != current_phone:
        return full_new

    # 2. Last two digits correction (e.g. "last two digits 25", "ending with 25")
    last_two_match = re.search(
        r"(?:last\s*two|ending\s*with|kadaisi\s*rendu)\s*(?:digits|numbers|num|எண்கள்)?\s*(?:is|nu|are)?\s*(\d{2})",
        t
    )
    if last_two_match:
        digits_str = last_two_match.group(1)
        return current_phone[:8] + digits_str

    # 3. Last digit / ending digit correction
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

    # 4. First digit / starting digit correction
    first_digit_match = re.search(
        r"(?:first|starting|start|modhal|முதல்)\s*(?:digit|number|num|எண்)?\s*(?:is|nu|la)?\s*([\w\u0B80-\u0BFF]+)",
        t
    )
    if first_digit_match:
        digit_token = first_digit_match.group(1)
        d = DIGIT_MAP.get(digit_token) if not digit_token.isdigit() else (digit_token if len(digit_token) == 1 else None)
        if d and d in "6789":
            return d + current_phone[1:]

    # 5. Positional / Ordinal digit correction
    # English ordinals: second (1), third (2), fourth (3), fifth (4), sixth (5), seventh (6), eighth (7), ninth (8), tenth (9)
    # Tamil ordinals: இரண்டாவது (1), மூன்றாவது (2), நான்காவது (3), ஐந்தாவது (4), ஆறாவது (5), ஏழாவது (6), எட்டாவது (7), ஒன்பதாவது (8), பத்தாவது (9)
    ordinal_map = {
        "first": 0, "1st": 0, "முதல்": 0, "modhal": 0,
        "second": 1, "2nd": 1, "இரண்டாவது": 1, "ரெண்டாவது": 1, "rendavadhu": 1,
        "third": 2, "3rd": 2, "மூன்றாவது": 2, "moonavadhu": 2,
        "fourth": 3, "4th": 3, "நான்காவது": 3, "நாலாவது": 3, "naalavadhu": 3,
        "fifth": 4, "5th": 4, "ஐந்தாவது": 4, "அஞ்சாவது": 4, "anjavadhu": 4,
        "sixth": 5, "6th": 5, "ஆறாவது": 5, "aaravadhu": 5,
        "seventh": 6, "7th": 6, "ஏழாவது": 6, "ezhavadhu": 6,
        "eighth": 7, "8th": 7, "எட்டாவது": 7, "ettavadhu": 7,
        "ninth": 8, "9th": 8, "ஒன்பதாவது": 8, "onbadhavadhu": 8,
        "tenth": 9, "10th": 9, "பத்தாவது": 9, "pathavadhu": 9,
    }

    for ord_token, idx in ordinal_map.items():
        pattern = rf"\b{ord_token}\s*(?:digit|number|num|எண்)?\s*(?:is|nu|la|=)?\s*([\w\u0B80-\u0BFF]+)"
        m = re.search(pattern, t)
        if m:
            val_token = m.group(1)
            d = DIGIT_MAP.get(val_token) if not val_token.isdigit() else (val_token if len(val_token) == 1 else None)
            if d:
                # If first digit, must be 6-9
                if idx == 0 and d not in "6789":
                    continue
                phone_chars = list(current_phone)
                phone_chars[idx] = d
                return "".join(phone_chars)

    return None
