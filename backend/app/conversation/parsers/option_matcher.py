"""
Sector-specific option and keyword matcher.
Matches spoken user answers to known package options (e.g., room types, doctor specialties, service types).
"""

from typing import List, Optional


def match_option(text: str, options: List[str]) -> Optional[str]:
    """
    Matches text against a list of predefined slot options using keyword heuristics in Tamil & English.
    """
    if not text or not options:
        return None
    lower = text.lower()

    # 1. Exact or containment match
    for opt in options:
        opt_clean = opt.split("(")[0].strip().lower()
        if opt.lower() in lower or lower in opt.lower() or opt_clean in lower:
            return opt

    # 2. Sector specific keyword heuristics
    # Health Help Desk Service Types
    if any(k in lower for k in ["vaccin", "தடுப்பூசி", "kuzhandhai vaccine", "child"]):
        for opt in options:
            if "Vaccination" in opt:
                return opt
    if any(k in lower for k in ["nurse", "vhn", "செவிலியர்", "home visit", "nurse visit"]):
        for opt in options:
            if "Nurse" in opt:
                return opt
    if any(k in lower for k in ["camp", "token", "டோக்கன்", "முகாம்"]):
        for opt in options:
            if "Camp" in opt:
                return opt
    if any(k in lower for k in ["water", "குடிநீர்", "சாக்கடை", "sanitation", "complaint", "கழிவுநீர்", "leak"]):
        for opt in options:
            if "Sanitation" in opt:
                return opt
    if any(k in lower for k in ["fever", "dengue", "காய்ச்சல்"]):
        for opt in options:
            if "Dengue" in opt:
                return opt

    # Clinic Specialties
    if any(k in lower for k in ["general", "பொது மருத்துவம்", "fever", "cough", "regular", "casualty"]):
        for opt in options:
            if "General Medicine" in opt:
                return opt
    if any(k in lower for k in ["pediatric", "child", "baby", "குழந்தை"]):
        for opt in options:
            if "Pediatrics" in opt:
                return opt
    if any(k in lower for k in ["sugar", "diabetes", "diabetology", "bp", "pressure", "சர்க்கரை", "இரத்த அழுத்தம்"]):
        for opt in options:
            if "Diabetology" in opt:
                return opt
    if any(k in lower for k in ["ortho", "bone", "joint", "எலும்பு", "மூட்டு"]):
        for opt in options:
            if "Orthopedics" in opt:
                return opt
    if any(k in lower for k in ["skin", "derma", "தோல்"]):
        for opt in options:
            if "Dermatology" in opt:
                return opt

    # Veterinary Clinic Options
    if any(k in lower for k in ["cow", "மாடு", "maadu", "cattle", "dairy", "karavai"]):
        for opt in options:
            if "Cow" in opt:
                return opt
    if any(k in lower for k in ["goat", "ஆடு", "aadu", "sheep"]):
        for opt in options:
            if "Goat" in opt:
                return opt
    if any(k in lower for k in ["dog", "நாய்", "naai", "puppy", "நாய்க்குட்டி"]):
        for opt in options:
            if "Dog" in opt:
                return opt
    if any(k in lower for k in ["cat", "பூனை", "poonai", "kitten"]):
        for opt in options:
            if "Cat" in opt:
                return opt
    if any(k in lower for k in ["farm", "home visit", "பண்ணை", "வீட்டுக்கு"]):
        for opt in options:
            if "Farm" in opt:
                return opt
    if any(k in lower for k in ["clinic", "மருத்துவமனை", "நேரில்"]):
        for opt in options:
            if "Clinic Visit" in opt:
                return opt

    # Restaurant / Catering Options
    if any(k in lower for k in ["catering", "bulk", "கேட்டரிங்", "மொத்த உணவு", "விஷேசம்"]):
        for opt in options:
            if "Catering" in opt:
                return opt
    if any(k in lower for k in ["table", "dining", "மேஜை"]):
        for opt in options:
            if "Table" in opt:
                return opt
    if any(k in lower for k in ["lunch", "மதியம்"]):
        for opt in options:
            if "Lunch" in opt:
                return opt
    if any(k in lower for k in ["dinner", "இரவு", "night"]):
        for opt in options:
            if "Dinner" in opt:
                return opt

    # Coaching Centre Options
    if any(k in lower for k in ["tnpsc group 1", "group 1", "குரூப் 1", "group 2"]):
        for opt in options:
            if "Group 1 & 2" in opt:
                return opt
    if any(k in lower for k in ["group 4", "vao", "விஏஓ", "குரூப் 4"]):
        for opt in options:
            if "Group 4 & VAO" in opt:
                return opt
    if any(k in lower for k in ["neet", "நீட்", "medical"]):
        for opt in options:
            if "NEET" in opt:
                return opt
    if any(k in lower for k in ["bank", "banking", "ssc", "வங்கி"]):
        for opt in options:
            if "Banking" in opt:
                return opt
    if any(k in lower for k in ["police", "காவலர்", "si"]):
        for opt in options:
            if "Police" in opt:
                return opt
    if any(k in lower for k in ["demo", "free demo", "மாதிரி வகுப்பு"]):
        for opt in options:
            if "Demo" in opt:
                return opt
    if any(k in lower for k in ["fee", "fees", "கட்டணம்"]):
        for opt in options:
            if "Fee" in opt:
                return opt
    if any(k in lower for k in ["admission", "சேர்க்கை"]):
        for opt in options:
            if "Admission" in opt:
                return opt
    if any(k in lower for k in ["morning", "காலை"]):
        for opt in options:
            if "Morning" in opt:
                return opt
    if any(k in lower for k in ["evening", "மாலை"]):
        for opt in options:
            if "Evening" in opt:
                return opt
    if any(k in lower for k in ["weekend", "வார இறுதி"]):
        for opt in options:
            if "Weekend" in opt:
                return opt

    # Hotel Room Types
    if any(k in lower for k in ["family", "குடும்ப", "4 bed", "suite"]):
        for opt in options:
            if "Family Suite" in opt:
                return opt
    if any(k in lower for k in ["deluxe", "டீலக்ஸ்"]):
        for opt in options:
            if "Deluxe" in opt:
                return opt
    if any(k in lower for k in ["non ac", "non-ac", "nonac", "ஏசி இல்லாத"]):
        for opt in options:
            if "Standard Non-AC" in opt:
                return opt
    if any(k in lower for k in ["ac", "standard", "ஏசி அறை", "standard ac"]):
        for opt in options:
            if "Standard AC" in opt:
                return opt

    return None

