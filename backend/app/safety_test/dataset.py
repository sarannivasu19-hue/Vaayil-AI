"""
dataset.py — Labelled Ground-Truth Benchmark Dataset for Safety & Urgent-Case Detection.

Contains ~60 carefully annotated sentences each for:
1. Panchayat Health Help Desk (`panchayat_health`)
2. Clinic (`clinic`)
3. Veterinary Clinic (`vet_clinic`)

Total: ~180 labelled benchmark utterances across Tamil script, Tanglish, and English.
Categories covered per sector:
- `urgent_true`: Acute real-world emergencies that must trigger immediate safety escalation.
- `normal_call`: Standard appointments, inquiries, and routine administrative requests.
- `negated`: Utterances containing emergency words preceded or succeeded by explicit negations ("no chest pain", "nenju vali illa"). Must NOT trigger an alert.
- `past_event`: Utterances discussing prior historical episodes ("last year I had a heart attack"). Must NOT trigger an alert.
- `spelling_variant`: Transliteration variants and phonetic differences.
- `transcript_error`: Typical speech-to-text acoustic transcription distortions.
"""

from typing import List, Dict, Any


SAFETY_BENCHMARK_DATASET: List[Dict[str, Any]] = [
    # =========================================================================
    # SECTOR 1: PANCHAYAT HEALTH HELP DESK (`panchayat_health`) (~60 items)
    # =========================================================================
    # --- Urgent Cases (Expected: True) ---
    {
        "id": "PH-01",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "ஐயா என் கணவருக்கு கடுமையான நெஞ்சு வலி உள்ளது, உடனே உதவி வேண்டும்.",
        "expected_urgent": True,
        "expected_keyword": "நெஞ்சு வலி",
        "notes": "Acute chest pain in Tamil script."
    },
    {
        "id": "PH-02",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Appa-ku nenju vali romba athigama irukku, moochu vida mudila.",
        "expected_urgent": True,
        "expected_keyword": "nenju vali",
        "notes": "Tanglish chest pain and breathing distress."
    },
    {
        "id": "PH-03",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "Emergency! My father has severe chest pain and is sweating.",
        "expected_urgent": True,
        "expected_keyword": "chest pain",
        "notes": "English acute cardiac symptom."
    },
    {
        "id": "PH-04",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "தோட்டத்தில் வேலை செய்த போது என் தம்பியை பாம்பு கடி கடித்துவிட்டது.",
        "expected_urgent": True,
        "expected_keyword": "பாம்பு கடி",
        "notes": "Snake bite in rural farm."
    },
    {
        "id": "PH-05",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Thottam-la velai seiyum bothu paambu kadi aayiduchu, sekkram vanga.",
        "expected_urgent": True,
        "expected_keyword": "paambu kadi",
        "notes": "Tanglish snake bite incident."
    },
    {
        "id": "PH-06",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "Need ambulance immediately, person got snake bite in field.",
        "expected_urgent": True,
        "expected_keyword": "snake bite",
        "notes": "English snake bite."
    },
    {
        "id": "PH-07",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "குழந்தைக்கு மூச்சு திணறல் ஏற்பட்டு முகம் நீலமாக மாறுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "மூச்சு திணறல்",
        "notes": "Infant dyspnea and cyanosis in Tamil."
    },
    {
        "id": "PH-08",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Kuzhanthaiku moochu thinaral romba kashtama irukku.",
        "expected_urgent": True,
        "expected_keyword": "moochu thinaral",
        "notes": "Tanglish respiratory distress."
    },
    {
        "id": "PH-09",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "The patient is having acute breathing problem and cannot talk.",
        "expected_urgent": True,
        "expected_keyword": "breathing problem",
        "notes": "English respiratory failure."
    },
    {
        "id": "PH-10",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "சாலையில் இருசக்கர வாகனம் மோதி பெரிய விபத்து, அதிக ரத்தப்போக்கு.",
        "expected_urgent": True,
        "expected_keyword": "அதிக ரத்தப்போக்கு",
        "notes": "Road accident with major hemorrhage."
    },
    {
        "id": "PH-11",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Main road-la vibathu aachu, thalai-la rathapokku nirkala.",
        "expected_urgent": True,
        "expected_keyword": "rathapokku",
        "notes": "Tanglish head trauma hemorrhage."
    },
    {
        "id": "PH-12",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "Two people injured in bike accident, bleeding profusely right now.",
        "expected_urgent": True,
        "expected_keyword": "bleeding profusely",
        "notes": "English severe bleeding."
    },
    {
        "id": "PH-13",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "தாத்தா திடீரென கீழே விழுந்து மயக்கம் அடைந்துவிட்டார், கண் திறக்கவில்லை.",
        "expected_urgent": True,
        "expected_keyword": "மயக்கம்",
        "notes": "Elderly syncope / loss of consciousness."
    },
    {
        "id": "PH-14",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Thatha keezha vizhunthu unconscious aayitaaru, mayakkam thelila.",
        "expected_urgent": True,
        "expected_keyword": "mayakkam",
        "notes": "Tanglish unconsciousness."
    },
    {
        "id": "PH-15",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "A man collapsed in the panchayat office, completely unconscious.",
        "expected_urgent": True,
        "expected_keyword": "unconscious",
        "notes": "English collapse / unconscious."
    },
    {
        "id": "PH-16",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "என் மகனுக்கு கடுமையான வலிப்பு வந்து கை கால்கள் உதறுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "வலிப்பு",
        "notes": "Tamil pediatric seizure."
    },
    {
        "id": "PH-17",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Paiyanuku valippu vanthurukku, kai kaal aaduraan.",
        "expected_urgent": True,
        "expected_keyword": "valippu",
        "notes": "Tanglish convulsion."
    },
    {
        "id": "PH-18",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "Child is having an acute seizure and fitting continuously.",
        "expected_urgent": True,
        "expected_keyword": "seizure",
        "notes": "English status epilepticus / seizure."
    },

    # --- Normal Calls (Expected: False) ---
    {
        "id": "PH-19",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "normal_call",
        "text": "நாளைக்கு ஆரம்ப சுகாதார நிலையத்தில் குழந்தை தடுப்பூசி போடுவார்களா?",
        "expected_urgent": False,
        "notes": "Routine child immunization inquiry."
    },
    {
        "id": "PH-20",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Naalaikku PHC-la Polio drops tharuvangala?",
        "expected_urgent": False,
        "notes": "Tanglish polio drop schedule inquiry."
    },
    {
        "id": "PH-21",
        "sector": "panchayat_health",
        "language": "english",
        "category": "normal_call",
        "text": "What is the timing for mother and child health checkup this Wednesday?",
        "expected_urgent": False,
        "notes": "English maternal health inquiry."
    },
    {
        "id": "PH-22",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "normal_call",
        "text": "எங்கள் வார்டில் கொசு மருந்து தெளிக்க மனு கொடுக்க வேண்டும்.",
        "expected_urgent": False,
        "notes": "Mosquito fogging complaint."
    },
    {
        "id": "PH-23",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Kudineer tank clean panna application poda vandhen.",
        "expected_urgent": False,
        "notes": "Drinking water sanitation request."
    },
    {
        "id": "PH-24",
        "sector": "panchayat_health",
        "language": "english",
        "category": "normal_call",
        "text": "I want to apply for a birth certificate for my newborn baby.",
        "expected_urgent": False,
        "notes": "Civil registration request."
    },
    {
        "id": "PH-25",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "normal_call",
        "text": "முதியோர் உதவித்தொகை மருத்துவ பரிசோதனை சான்றிதழ் வாங்க வேண்டும்.",
        "expected_urgent": False,
        "notes": "Elderly pension health verification."
    },
    {
        "id": "PH-26",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Doctor eppo varuvaaru, regular sugar BP tablet vaanga venum.",
        "expected_urgent": False,
        "notes": "Routine diabetic medication refill."
    },
    {
        "id": "PH-27",
        "sector": "panchayat_health",
        "language": "english",
        "category": "normal_call",
        "text": "Can I get an appointment for regular health card renewal next Monday?",
        "expected_urgent": False,
        "notes": "Health card renewal."
    },
    {
        "id": "PH-28",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "normal_call",
        "text": "கிராம சுகாதார செவிலியர் அக்கா இன்று வருவார்களா?",
        "expected_urgent": False,
        "notes": "Village health nurse routine visit inquiry."
    },
    {
        "id": "PH-29",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Sanitary inspector phone number kedaikuma?",
        "expected_urgent": False,
        "notes": "Contact directory inquiry."
    },
    {
        "id": "PH-30",
        "sector": "panchayat_health",
        "language": "english",
        "category": "normal_call",
        "text": "Please register a complaint regarding garbage collection near temple street.",
        "expected_urgent": False,
        "notes": "Sanitation complaint."
    },

    # --- Negated Cases (Expected: False) ---
    {
        "id": "PH-31",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "negated",
        "text": "சாதாரண சளி தான், நெஞ்சு வலி இல்லை, இருமல் மட்டும் உள்ளது.",
        "expected_urgent": False,
        "notes": "Tamil negation: நெஞ்சு வலி இல்லை."
    },
    {
        "id": "PH-32",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "negated",
        "text": "Normal fever thaan, nenju vali illa, bayapada theva illa.",
        "expected_urgent": False,
        "notes": "Tanglish negation: nenju vali illa."
    },
    {
        "id": "PH-33",
        "sector": "panchayat_health",
        "language": "english",
        "category": "negated",
        "text": "I have mild sore throat, no chest pain or fever at all.",
        "expected_urgent": False,
        "notes": "English negation: no chest pain."
    },
    {
        "id": "PH-34",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "negated",
        "text": "பூச்சி தான் கடித்தது, பாம்பு கடி இல்லை, பயம் வேண்டாம்.",
        "expected_urgent": False,
        "notes": "Tamil negation: பாம்பு கடி இல்லை."
    },
    {
        "id": "PH-35",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "negated",
        "text": "Normal poochi kadi thaan sir, paambu kadi illai.",
        "expected_urgent": False,
        "notes": "Tanglish negation: paambu kadi illai."
    },
    {
        "id": "PH-36",
        "sector": "panchayat_health",
        "language": "english",
        "category": "negated",
        "text": "It was just an ant bite, definitely no snake bite.",
        "expected_urgent": False,
        "notes": "English negation: no snake bite."
    },
    {
        "id": "PH-37",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "negated",
        "text": "மூச்சு திணறல் இல்லை, மூக்கடைப்பு மட்டும் உள்ளது.",
        "expected_urgent": False,
        "notes": "Tamil negation: மூச்சு திணறல் இல்லை."
    },
    {
        "id": "PH-38",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "negated",
        "text": "Moochu thinaral illa, just dry cough for two days.",
        "expected_urgent": False,
        "notes": "Tanglish negation: moochu thinaral illa."
    },
    {
        "id": "PH-39",
        "sector": "panchayat_health",
        "language": "english",
        "category": "negated",
        "text": "He has a runny nose, no breathing problem.",
        "expected_urgent": False,
        "notes": "English negation: no breathing problem."
    },
    {
        "id": "PH-40",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "negated",
        "text": "சிறு கீறல் காயம், அதிக ரத்தப்போக்கு இல்லை, மருந்து போட்டால் போதும்.",
        "expected_urgent": False,
        "notes": "Tamil negation: அதிக ரத்தப்போக்கு இல்லை."
    },
    {
        "id": "PH-41",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "negated",
        "text": "Small scratch sir, rathapokku illa.",
        "expected_urgent": False,
        "notes": "Tanglish negation: rathapokku illa."
    },
    {
        "id": "PH-42",
        "sector": "panchayat_health",
        "language": "english",
        "category": "negated",
        "text": "Patient has minor bruise, not having heavy bleeding.",
        "expected_urgent": False,
        "notes": "English negation: not having heavy bleeding."
    },

    # --- Past Events (Expected: False) ---
    {
        "id": "PH-43",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "past_event",
        "text": "கடந்த ஆண்டு என் கணவருக்கு நெஞ்சு வலி வந்து சிகிச்சை எடுத்தோம்.",
        "expected_urgent": False,
        "notes": "Tamil historical past event: கடந்த ஆண்டு."
    },
    {
        "id": "PH-44",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "past_event",
        "text": "Last year appa-ku heart attack vanthathu, ippo routine checkup mattum thaan.",
        "expected_urgent": False,
        "notes": "Tanglish past event: last year."
    },
    {
        "id": "PH-45",
        "sector": "panchayat_health",
        "language": "english",
        "category": "past_event",
        "text": "Last year I had a heart attack and stent was placed, now calling for routine camp.",
        "expected_urgent": False,
        "notes": "English past event: last year."
    },
    {
        "id": "PH-46",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "past_event",
        "text": "முன்னாடி ஒரு முறை வலிப்பு வந்தது, இப்போது நலமாக உள்ளார்.",
        "expected_urgent": False,
        "notes": "Tamil past history: முன்னாடி."
    },
    {
        "id": "PH-47",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "past_event",
        "text": "Munnadi oru thadava mayakkam vanthuchu, ippo nalla irukaaru.",
        "expected_urgent": False,
        "notes": "Tanglish past syncope: munnadi."
    },
    {
        "id": "PH-48",
        "sector": "panchayat_health",
        "language": "english",
        "category": "past_event",
        "text": "Two years ago he had an accident and was hospitalized, calling for old discharge summary.",
        "expected_urgent": False,
        "notes": "English past event: two years ago."
    },

    # --- Spelling Variants & Transcript Noise (Expected: depends on content) ---
    {
        "id": "PH-49",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "spelling_variant",
        "text": "Nenjuvali romba jaasthi aayiduchu aiyya emergency.",
        "expected_urgent": True,
        "expected_keyword": "nenjuvali",
        "notes": "Spelling variant: 'nenjuvali' without space."
    },
    {
        "id": "PH-50",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "spelling_variant",
        "text": "Thideer nu mayakkam pottutaanga, eluppa mudila.",
        "expected_urgent": True,
        "expected_keyword": "mayakkam",
        "notes": "Phonetic collapse description."
    },
    {
        "id": "PH-51",
        "sector": "panchayat_health",
        "language": "english",
        "category": "transcript_error",
        "text": "Caller says chest pain severe call ambulance.",
        "expected_urgent": True,
        "expected_keyword": "chest pain",
        "notes": "Transcript without punctuation."
    },
    {
        "id": "PH-52",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "transcript_error",
        "text": "Road la accidant aachu sir rathapokku.",
        "expected_urgent": True,
        "expected_keyword": "rathapokku",
        "notes": "STT typo 'accidant' with genuine hemorrhage."
    },
    {
        "id": "PH-53",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "urgent_true",
        "text": "மாரடைப்பு போல் உள்ளது, மூச்சு விட மிகவும் சிரமப்படுகிறார்.",
        "expected_urgent": True,
        "expected_keyword": "மாரடைப்பு",
        "notes": "Tamil cardiac arrest / infarction."
    },
    {
        "id": "PH-54",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Maradaippu symptoms thonuthu, edhuvum pesa mudila.",
        "expected_urgent": True,
        "expected_keyword": "maradaippu",
        "notes": "Tanglish myocardial infarction."
    },
    {
        "id": "PH-55",
        "sector": "panchayat_health",
        "language": "english",
        "category": "urgent_true",
        "text": "Patient is in shock and heavy bleeding after fall from terrace.",
        "expected_urgent": True,
        "expected_keyword": "heavy bleeding",
        "notes": "English acute trauma."
    },
    {
        "id": "PH-56",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "normal_call",
        "text": "நாளை மறுநாள் ரத்த அழுத்த பரிசோதனைக்கு வர விரும்புகிறேன்.",
        "expected_urgent": False,
        "notes": "Routine BP screening inquiry."
    },
    {
        "id": "PH-57",
        "sector": "panchayat_health",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Kuzhanthaiku 10 maasam aachu, measles thaduppoosi podalama?",
        "expected_urgent": False,
        "notes": "Measles vaccination schedule."
    },
    {
        "id": "PH-58",
        "sector": "panchayat_health",
        "language": "english",
        "category": "normal_call",
        "text": "Is the PHC lab open today for regular urine test?",
        "expected_urgent": False,
        "notes": "Routine diagnostic lab inquiry."
    },
    {
        "id": "PH-59",
        "sector": "panchayat_health",
        "language": "tamil",
        "category": "negated",
        "text": "சர்க்கரை நோய் மாத்திரை வாங்க வந்தேன், மயக்கம் எதுவும் இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: மயக்கம் இல்லை."
    },
    {
        "id": "PH-60",
        "sector": "panchayat_health",
        "language": "english",
        "category": "past_event",
        "text": "Last month my mother had breathing issue, now she is completely cured and needs tonic.",
        "expected_urgent": False,
        "notes": "English past event: last month."
    },

    # =========================================================================
    # SECTOR 2: CLINIC (`clinic`) (~60 items)
    # =========================================================================
    # --- Urgent Cases (Expected: True) ---
    {
        "id": "CL-01",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "டாக்டர் அய்யா, தாத்தாவுக்கு கடுமையான நெஞ்சு வலி வந்து வியர்த்து கொட்டுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "நெஞ்சு வலி",
        "notes": "Acute cardiac presentation in clinic."
    },
    {
        "id": "CL-02",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Doctor, patient-ku severe chest pain and left arm pain irukku.",
        "expected_urgent": True,
        "expected_keyword": "chest pain",
        "notes": "Classic angina radiation symptoms."
    },
    {
        "id": "CL-03",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "My father is having crushing chest pain radiating to jaw, please send doctor.",
        "expected_urgent": True,
        "expected_keyword": "chest pain",
        "notes": "Acute coronary syndrome."
    },
    {
        "id": "CL-04",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "திடீரென முகம் கோணி பேச்சு குழறி பக்கவாதம் stroke போல் தெரிகிறது.",
        "expected_urgent": True,
        "expected_keyword": "stroke",
        "notes": "Acute ischemic stroke / FAST warning signs."
    },
    {
        "id": "CL-05",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Amma ku sudden-ah pechu varala, stroke aayirukumo nu bayama irukku.",
        "expected_urgent": True,
        "expected_keyword": "stroke",
        "notes": "Tanglish stroke presentation."
    },
    {
        "id": "CL-06",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Acute stroke suspected, facial droop and right side weakness observed.",
        "expected_urgent": True,
        "expected_keyword": "stroke",
        "notes": "English acute stroke presentation."
    },
    {
        "id": "CL-07",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "ஆஸ்துமா நோயாளிக்கு மூச்சு திணறல் உச்சகட்டமாக உள்ளது, இன்ஹேலர் வேலை செய்யவில்லை.",
        "expected_urgent": True,
        "expected_keyword": "மூச்சு திணறல்",
        "notes": "Status asthmaticus."
    },
    {
        "id": "CL-08",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Severe asthma attack vanthurukku, inhaler eduthum moochu vida mudila.",
        "expected_urgent": True,
        "expected_keyword": "severe asthma",
        "notes": "Acute asthma non-responsive to bronchodilators."
    },
    {
        "id": "CL-09",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Patient has acute breathlessness and cannot complete a full sentence.",
        "expected_urgent": True,
        "expected_keyword": "breathlessness",
        "notes": "English severe respiratory failure."
    },
    {
        "id": "CL-10",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "கண்ணாடி கிழித்து கையில் அதிக ரத்தப்போக்கு நிற்காமல் வெளியேறுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "அதிக ரத்தப்போக்கு",
        "notes": "Arterial laceration hemorrhage."
    },
    {
        "id": "CL-11",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Kathi patu kai-la heavy bleeding aaguthu, bandage potum nirkala.",
        "expected_urgent": True,
        "expected_keyword": "heavy bleeding",
        "notes": "Tanglish uncontrolled bleeding."
    },
    {
        "id": "CL-12",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Deep wound with heavy bleeding, patient becoming pale and dizzy.",
        "expected_urgent": True,
        "expected_keyword": "heavy bleeding",
        "notes": "English hemorrhagic shock."
    },
    {
        "id": "CL-13",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "நோயாளி மயக்கம் அடைந்து நாடித்துடிப்பு மிகவும் குறைந்துவிட்டது.",
        "expected_urgent": True,
        "expected_keyword": "மயக்கம்",
        "notes": "Tamil bradycardia syncope."
    },
    {
        "id": "CL-14",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Clinic vasal-la oruthar collapsed and unconscious aayitaaru.",
        "expected_urgent": True,
        "expected_keyword": "unconscious",
        "notes": "Tanglish collapse."
    },
    {
        "id": "CL-15",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Elderly patient is unconscious and unresponsive to stimuli.",
        "expected_urgent": True,
        "expected_keyword": "unconscious",
        "notes": "English coma / unresponsiveness."
    },
    {
        "id": "CL-16",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "விவசாய தோட்டத்தில் வேலை செய்த போது பாம்பு கடி பட்டு மயங்கிவிட்டார்.",
        "expected_urgent": True,
        "expected_keyword": "பாம்பு கடி",
        "notes": "Venomous snake bite with envenomation."
    },
    {
        "id": "CL-17",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Thottam-la paambu kadi patutu doctor kitta odi varom.",
        "expected_urgent": True,
        "expected_keyword": "paambu kadi",
        "notes": "Tanglish snake bite transit."
    },
    {
        "id": "CL-18",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Emergency consult needed, suspected heart attack in clinic waiting hall.",
        "expected_urgent": True,
        "expected_keyword": "heart attack",
        "notes": "English heart attack in clinic."
    },

    # --- Normal Calls (Expected: False) ---
    {
        "id": "CL-19",
        "sector": "clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "டாக்டர் அன்பழகன் அவர்களை சந்திக்க மாலை 5 மணிக்கு அப்பாயின்மென்ட் வேண்டும்.",
        "expected_urgent": False,
        "notes": "Doctor appointment booking."
    },
    {
        "id": "CL-20",
        "sector": "clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "General medicine doctor eppo irupaaru, cold and mild fever irukku.",
        "expected_urgent": False,
        "notes": "Tanglish general consultation query."
    },
    {
        "id": "CL-21",
        "sector": "clinic",
        "language": "english",
        "category": "normal_call",
        "text": "I would like to book a slot for routine blood glucose and HbA1c test.",
        "expected_urgent": False,
        "notes": "Routine diabetes lab appointment."
    },
    {
        "id": "CL-22",
        "sector": "clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "என் மகளுக்கு பல் பரிசோதனை செய்ய டென்டிஸ்ட் நேரம் கிடைக்குமா?",
        "expected_urgent": False,
        "notes": "Dental checkup."
    },
    {
        "id": "CL-23",
        "sector": "clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Paediatrician doctor time slot naalaikku 10:30 AM confirm pannunga.",
        "expected_urgent": False,
        "notes": "Pediatric booking."
    },
    {
        "id": "CL-24",
        "sector": "clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Looking for dermatologist appointment for skin allergy review.",
        "expected_urgent": False,
        "notes": "Dermatology outpatient inquiry."
    },
    {
        "id": "CL-25",
        "sector": "clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "கண் பார்வை பரிசோதனை மற்றும் கண்ணாடி அளவு எடுக்க வர வேண்டும்.",
        "expected_urgent": False,
        "notes": "Ophthalmology refraction inquiry."
    },
    {
        "id": "CL-26",
        "sector": "clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Routine full body checkup package price evalo aagum sir?",
        "expected_urgent": False,
        "notes": "Routine checkup pricing."
    },
    {
        "id": "CL-27",
        "sector": "clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Can I reschedule my orthopedic follow-up to this Friday morning?",
        "expected_urgent": False,
        "notes": "Reschedule appointment."
    },
    {
        "id": "CL-28",
        "sector": "clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "தைராய்டு மாத்திரை அளவு மாற்ற டாக்டரை பார்க்க வேண்டும்.",
        "expected_urgent": False,
        "notes": "Thyroid routine titration."
    },
    {
        "id": "CL-29",
        "sector": "clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Doctor prescription renewal panna direct-ah varanuma?",
        "expected_urgent": False,
        "notes": "Prescription renewal."
    },
    {
        "id": "CL-30",
        "sector": "clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Please confirm if Dr. Meena is available tomorrow for ENT consultation.",
        "expected_urgent": False,
        "notes": "ENT consultation confirmation."
    },

    # --- Negated Cases (Expected: False) ---
    {
        "id": "CL-31",
        "sector": "clinic",
        "language": "tamil",
        "category": "negated",
        "text": "வயிற்று வலி தான் உள்ளது, நெஞ்சு வலி இல்லை டாக்டர்.",
        "expected_urgent": False,
        "notes": "Tamil negation: நெஞ்சு வலி இல்லை."
    },
    {
        "id": "CL-32",
        "sector": "clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Just gastric problem thaan, nenju vali illa doctor.",
        "expected_urgent": False,
        "notes": "Tanglish negation: nenju vali illa."
    },
    {
        "id": "CL-33",
        "sector": "clinic",
        "language": "english",
        "category": "negated",
        "text": "I have gas trouble and acid reflux, but no chest pain.",
        "expected_urgent": False,
        "notes": "English negation: no chest pain."
    },
    {
        "id": "CL-34",
        "sector": "clinic",
        "language": "tamil",
        "category": "negated",
        "text": "இரத்த அழுத்தம் சற்று அதிகம், மயக்கம் எதுவும் இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: மயக்கம் இல்லை."
    },
    {
        "id": "CL-35",
        "sector": "clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "BP konjam high but mayakkam illai, routine checkup thaan.",
        "expected_urgent": False,
        "notes": "Tanglish negation: mayakkam illai."
    },
    {
        "id": "CL-36",
        "sector": "clinic",
        "language": "english",
        "category": "negated",
        "text": "The patient feels anxious, but is conscious and without unconsciousness.",
        "expected_urgent": False,
        "notes": "English negation: conscious."
    },
    {
        "id": "CL-37",
        "sector": "clinic",
        "language": "tamil",
        "category": "negated",
        "text": "மூச்சு திணறல் இல்லை, மூக்கில் நீர் வடிகிறது.",
        "expected_urgent": False,
        "notes": "Tamil negation: மூச்சு திணறல் இல்லை."
    },
    {
        "id": "CL-38",
        "sector": "clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Moochu thinaral illa doctor, just throat pain and dry cough.",
        "expected_urgent": False,
        "notes": "Tanglish negation: moochu thinaral illa."
    },
    {
        "id": "CL-39",
        "sector": "clinic",
        "language": "english",
        "category": "negated",
        "text": "Mild seasonal flu, without breathlessness or respiratory struggle.",
        "expected_urgent": False,
        "notes": "English negation: without breathlessness."
    },
    {
        "id": "CL-40",
        "sector": "clinic",
        "language": "tamil",
        "category": "negated",
        "text": "சிறிய காயம் மட்டுமே, அதிக ரத்தப்போக்கு இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: அதிக ரத்தப்போக்கு இல்லை."
    },
    {
        "id": "CL-41",
        "sector": "clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Small finger cut, heavy bleeding illa, dressing panna venum.",
        "expected_urgent": False,
        "notes": "Tanglish negation: heavy bleeding illa."
    },
    {
        "id": "CL-42",
        "sector": "clinic",
        "language": "english",
        "category": "negated",
        "text": "It is a minor paper cut, not bleeding profusely.",
        "expected_urgent": False,
        "notes": "English negation: not bleeding profusely."
    },

    # --- Past Events (Expected: False) ---
    {
        "id": "CL-43",
        "sector": "clinic",
        "language": "tamil",
        "category": "past_event",
        "text": "கடந்த ஆண்டு மாரடைப்பு வந்து ஆஞ்சியோபிளாஸ்டி செய்யப்பட்டது, இப்போது வருடாந்திர பரிசோதனைக்கு வர விரும்புகிறேன்.",
        "expected_urgent": False,
        "notes": "Tamil past history: கடந்த ஆண்டு."
    },
    {
        "id": "CL-44",
        "sector": "clinic",
        "language": "tanglish",
        "category": "past_event",
        "text": "Last year heart attack vanthathu, ippo Dr. Anbazhagan kitta annual review pannanum.",
        "expected_urgent": False,
        "notes": "Tanglish past event: last year."
    },
    {
        "id": "CL-45",
        "sector": "clinic",
        "language": "english",
        "category": "past_event",
        "text": "Patient had a stroke 2 years ago, coming today only for physiotherapy exercise evaluation.",
        "expected_urgent": False,
        "notes": "English past event: 2 years ago."
    },
    {
        "id": "CL-46",
        "sector": "clinic",
        "language": "tamil",
        "category": "past_event",
        "text": "முன்பு ஒரு முறை நெஞ்சு வலி வந்தது, மருந்து சாப்பிட்ட பின் சரியாகிவிட்டது.",
        "expected_urgent": False,
        "notes": "Tamil past event: முன்பு."
    },
    {
        "id": "CL-47",
        "sector": "clinic",
        "language": "tanglish",
        "category": "past_event",
        "text": "Munnadi nenju vali irundhudhu ippo seriyaayiduchu, sugar test mattum podhuma?",
        "expected_urgent": False,
        "notes": "Tanglish past event: munnadi."
    },
    {
        "id": "CL-48",
        "sector": "clinic",
        "language": "english",
        "category": "past_event",
        "text": "Years ago my father suffered from a severe seizure, but currently he is stable.",
        "expected_urgent": False,
        "notes": "English past history: years ago."
    },

    # --- Spelling Variants & STT Errors ---
    {
        "id": "CL-49",
        "sector": "clinic",
        "language": "tanglish",
        "category": "spelling_variant",
        "text": "Nenjovaly romba pain doctor hospital polama?",
        "expected_urgent": True,
        "expected_keyword": "nenjuvali",
        "notes": "Phonetic misspelling 'nenjovaly' - test detector robustness."
    },
    {
        "id": "CL-50",
        "sector": "clinic",
        "language": "english",
        "category": "spelling_variant",
        "text": "He has acute chset pain radiating down left arm.",
        "expected_urgent": True,
        "expected_keyword": "chest pain",
        "notes": "Spelling typo 'chset pain'."
    },
    {
        "id": "CL-51",
        "sector": "clinic",
        "language": "tanglish",
        "category": "transcript_error",
        "text": "Patient is having breathlessness and chest heaviness.",
        "expected_urgent": True,
        "expected_keyword": "breathlessness",
        "notes": "Dual keyword clinical emergency."
    },
    {
        "id": "CL-52",
        "sector": "clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "மாரடைப்பு அறிகுறிகள் தெரிகிறது, உடனே அவசர சிகிச்சை தேவை.",
        "expected_urgent": True,
        "expected_keyword": "மாரடைப்பு",
        "notes": "Tamil acute myocardial infarction."
    },
    {
        "id": "CL-53",
        "sector": "clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Doctor sudden-ah stroke symptoms, vaai oru pakkam pochu.",
        "expected_urgent": True,
        "expected_keyword": "stroke",
        "notes": "Tanglish acute stroke facial palsy."
    },
    {
        "id": "CL-54",
        "sector": "clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Severe asthma exacerbation, oxygen saturation dropping rapidly.",
        "expected_urgent": True,
        "expected_keyword": "severe asthma",
        "notes": "English acute asthma crisis."
    },
    {
        "id": "CL-55",
        "sector": "clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "குழந்தைக்கு சளி பிடித்துள்ளது, சிரப் எழுதி தருமாறு கேட்டுக்கொள்கிறேன்.",
        "expected_urgent": False,
        "notes": "Routine pediatric cold."
    },
    {
        "id": "CL-56",
        "sector": "clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Eye doctor-kitta time slot irukka naalaikku 4 PM?",
        "expected_urgent": False,
        "notes": "Ophthalmologist appointment slot."
    },
    {
        "id": "CL-57",
        "sector": "clinic",
        "language": "english",
        "category": "normal_call",
        "text": "I want to collect my master health checkup lab reports tomorrow.",
        "expected_urgent": False,
        "notes": "Report collection inquiry."
    },
    {
        "id": "CL-58",
        "sector": "clinic",
        "language": "tamil",
        "category": "negated",
        "text": "மூச்சு திணறல் எதுவும் இல்லை, லேசான தொண்டை வலி தான்.",
        "expected_urgent": False,
        "notes": "Tamil negation: மூச்சு திணறல் இல்லை."
    },
    {
        "id": "CL-59",
        "sector": "clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "No chest pain sir, just back ache after long travel.",
        "expected_urgent": False,
        "notes": "Tanglish negation: no chest pain."
    },
    {
        "id": "CL-60",
        "sector": "clinic",
        "language": "english",
        "category": "past_event",
        "text": "Last month my brother had a mild seizure, now he is completely fine and driving.",
        "expected_urgent": False,
        "notes": "English past event: last month."
    },

    # =========================================================================
    # SECTOR 3: VETERINARY CLINIC (`vet_clinic`) (~60 items)
    # =========================================================================
    # --- Urgent Cases (Expected: True) ---
    {
        "id": "VT-01",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "டாக்டர் அய்யா, கறவை மாட்டுக்கு பிரசவ வலி வந்து கன்று சிக்கியது, உடனே வாருங்கள்.",
        "expected_urgent": True,
        "expected_keyword": "கன்று சிக்கியது",
        "notes": "Dystocia / calf obstructed in delivery canal."
    },
    {
        "id": "VT-02",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Doctor maadu calving difficulty la irukku, kandru sikkikichu sekkram vanga.",
        "expected_urgent": True,
        "expected_keyword": "calving difficulty",
        "notes": "Tanglish livestock calving emergency."
    },
    {
        "id": "VT-03",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Emergency! High yielding cow has acute calving difficulty and distress.",
        "expected_urgent": True,
        "expected_keyword": "calving difficulty",
        "notes": "English cattle dystocia."
    },
    {
        "id": "VT-04",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "மாடு அதிக தானியம் தின்று வயிறு உப்புசம் ஆகி மூச்சு திணறுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "வயிறு உப்புசம்",
        "notes": "Acute ruminal tympany / bloat."
    },
    {
        "id": "VT-05",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Maatuku vayiru uppusam aayiduchu, paduka mudiyama thinaruthu.",
        "expected_urgent": True,
        "expected_keyword": "bloat",
        "notes": "Tanglish bloat condition."
    },
    {
        "id": "VT-06",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Acute bloat in Holstein Friesian cow, rumen distended severely.",
        "expected_urgent": True,
        "expected_keyword": "bloat",
        "notes": "English acute ruminal bloat."
    },
    {
        "id": "VT-07",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "தோட்டத்தில் பூச்சி மருந்து தெளித்த புல்லை தின்று மாட்டுக்கு விஷம் ஏறி நுரை தள்ளுகிறது.",
        "expected_urgent": True,
        "expected_keyword": "விஷம்",
        "notes": "Pesticide poisoning / organophosphate toxicity."
    },
    {
        "id": "VT-08",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Aadu poochi marunthu saapitu severe poisoning, vaai-la nurai thalluthu.",
        "expected_urgent": True,
        "expected_keyword": "severe poisoning",
        "notes": "Tanglish caprine poisoning."
    },
    {
        "id": "VT-09",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Suspected severe poisoning, dog ingested rodenticide rat poison.",
        "expected_urgent": True,
        "expected_keyword": "severe poisoning",
        "notes": "English canine toxicity."
    },
    {
        "id": "VT-10",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "ஈன்று முடித்த பின் மாட்டுக்கு நஞ்சு கொடி விழாமல் அழுகி காய்ச்சல் வந்துவிட்டது.",
        "expected_urgent": True,
        "expected_keyword": "நஞ்சு கொடி",
        "notes": "Retained placenta / uterine infection."
    },
    {
        "id": "VT-11",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Kanru pottu 12 hours aachu doctor, nanju kodi vizhala.",
        "expected_urgent": True,
        "expected_keyword": "nanju kodi",
        "notes": "Tanglish retained fetal membranes."
    },
    {
        "id": "VT-12",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Retained placenta for over 18 hours, cow running high temperature.",
        "expected_urgent": True,
        "expected_keyword": "retained placenta",
        "notes": "English veterinary emergency."
    },
    {
        "id": "VT-13",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "வேலி கம்பி கிழித்து கன்றின் கழுத்தில் அதிக ரத்தப்போக்கு நிற்கவில்லை.",
        "expected_urgent": True,
        "expected_keyword": "அதிக ரத்தப்போக்கு",
        "notes": "Jugular / arterial laceration in livestock."
    },
    {
        "id": "VT-14",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Dog bite aagi aatu kuttiku heavy bleeding aaguthu.",
        "expected_urgent": True,
        "expected_keyword": "heavy bleeding",
        "notes": "Tanglish predator trauma hemorrhage."
    },
    {
        "id": "VT-15",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Cattle unconscious and unresponsive after electric fence accidental contact.",
        "expected_urgent": True,
        "expected_keyword": "cattle unconscious",
        "notes": "English electrocution / collapse."
    },
    {
        "id": "VT-16",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "மாட்டுக்கு கடுமையான ஈற்று வலி வந்து இரண்டு மணி நேரமாக தவிக்கிறது.",
        "expected_urgent": True,
        "expected_keyword": "ஈற்று வலி",
        "notes": "Tamil prolonged calving labor."
    },
    {
        "id": "VT-17",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Prasava vali vanthu maadu romba thinaruthu doctor.",
        "expected_urgent": True,
        "expected_keyword": "prasava vali",
        "notes": "Tanglish acute labor distress."
    },
    {
        "id": "VT-18",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Emergency home visit required, cattle unconscious after sunstroke.",
        "expected_urgent": True,
        "expected_keyword": "cattle unconscious",
        "notes": "English livestock collapse."
    },

    # --- Normal Calls (Expected: False) ---
    {
        "id": "VT-19",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "எங்கள் பத்து கறவை மாடுகளுக்கு கோமாரி நோய் தடுப்பூசி போட வேண்டும்.",
        "expected_urgent": False,
        "notes": "Routine Foot and Mouth Disease vaccination."
    },
    {
        "id": "VT-20",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Naalaikku farm-ku vanthu 5 maadu-ku FMD vaccination poda mudiyuma?",
        "expected_urgent": False,
        "notes": "Tanglish routine vaccination visit."
    },
    {
        "id": "VT-21",
        "sector": "vet_clinic",
        "language": "english",
        "category": "normal_call",
        "text": "I want to schedule routine annual rabies booster for my Labrador retriever.",
        "expected_urgent": False,
        "notes": "Pet rabies booster appointment."
    },
    {
        "id": "VT-22",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "ஆடுகளுக்கு குடற்புழு நீக்கம் மருந்து கொடுக்க டாக்டர் எப்போது வருவார்?",
        "expected_urgent": False,
        "notes": "Goat deworming camp query."
    },
    {
        "id": "VT-23",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Aadu-ku deworming tonic eppo kudukanum doctor?",
        "expected_urgent": False,
        "notes": "Caprine deworming regimen query."
    },
    {
        "id": "VT-24",
        "sector": "vet_clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Can the veterinary doctor visit our dairy farm for routine pregnancy diagnosis?",
        "expected_urgent": False,
        "notes": "Routine PD / pregnancy check."
    },
    {
        "id": "VT-25",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "கறவை மாட்டுக்கு பால் கறவை குறைந்துள்ளது, தாது உப்பு கலவை வாங்க வேண்டும்.",
        "expected_urgent": False,
        "notes": "Mineral mixture nutritional consult."
    },
    {
        "id": "VT-26",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Poocha kadi-ku skin lotion vanga clinic open-la irukka?",
        "expected_urgent": False,
        "notes": "Canine flea lotion purchase."
    },
    {
        "id": "VT-27",
        "sector": "vet_clinic",
        "language": "english",
        "category": "normal_call",
        "text": "We need health certificate for moving 8 heifers to neighboring district.",
        "expected_urgent": False,
        "notes": "Livestock transit certificate."
    },
    {
        "id": "VT-28",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "செல்ல நாய் குட்டிக்கு நகம் வெட்டி குளிப்பாட்ட அப்பாயின்மென்ட் எடுக்க வேண்டும்.",
        "expected_urgent": False,
        "notes": "Pet grooming appointment."
    },
    {
        "id": "VT-29",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Cow artificial insemination (AI) seiyurathukku timing eppo sir?",
        "expected_urgent": False,
        "notes": "Artificial insemination schedule."
    },
    {
        "id": "VT-30",
        "sector": "vet_clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Please book an appointment for dental scaling for our senior German Shepherd.",
        "expected_urgent": False,
        "notes": "Canine dental cleaning."
    },

    # --- Negated Cases (Expected: False) ---
    {
        "id": "VT-31",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "negated",
        "text": "தீவனம் சரியாக திங்கவில்லை, வயிறு உப்புசம் இல்லை, சாதாரணமாக நிற்கிறது.",
        "expected_urgent": False,
        "notes": "Tamil negation: வயிறு உப்புசம் இல்லை."
    },
    {
        "id": "VT-32",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Theevanam konjam kammi thaan, vayiru uppusam illa.",
        "expected_urgent": False,
        "notes": "Tanglish negation: vayiru uppusam illa."
    },
    {
        "id": "VT-33",
        "sector": "vet_clinic",
        "language": "english",
        "category": "negated",
        "text": "The cow is eating slowly, but definitely no bloat or digestive emergency.",
        "expected_urgent": False,
        "notes": "English negation: no bloat."
    },
    {
        "id": "VT-34",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "negated",
        "text": "சாதாரண புல் சாப்பிட்டது, விஷம் எதுவும் இல்லை, காய்ச்சல் மட்டும் உள்ளது.",
        "expected_urgent": False,
        "notes": "Tamil negation: விஷம் இல்லை."
    },
    {
        "id": "VT-35",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "No poisoning sir, just mild digestive upset after new feed.",
        "expected_urgent": False,
        "notes": "Tanglish negation: no poisoning."
    },
    {
        "id": "VT-36",
        "sector": "vet_clinic",
        "language": "english",
        "category": "negated",
        "text": "The dog vomited once, but there is no poisoning suspected.",
        "expected_urgent": False,
        "notes": "English negation: no poisoning."
    },
    {
        "id": "VT-37",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "negated",
        "text": "சுலபமாக கன்று போட்டுவிட்டது, கன்று சிக்கியது போன்ற எந்த பிரச்சனையும் இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: கன்று சிக்கியது இல்லை."
    },
    {
        "id": "VT-38",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Normal delivery aachu doctor, kandru sikkala, nanju kodi vizhunthuruchu.",
        "expected_urgent": False,
        "notes": "Tanglish negation: kandru sikkala."
    },
    {
        "id": "VT-39",
        "sector": "vet_clinic",
        "language": "english",
        "category": "negated",
        "text": "Calf delivered smoothly without calving difficulty.",
        "expected_urgent": False,
        "notes": "English negation: without calving difficulty."
    },
    {
        "id": "VT-40",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "negated",
        "text": "வால் பகுதியில் சிறு கீறல், அதிக ரத்தப்போக்கு இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: அதிக ரத்தப்போக்கு இல்லை."
    },
    {
        "id": "VT-41",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "negated",
        "text": "Small abrasion on ear, heavy bleeding illa, ointment podalama?",
        "expected_urgent": False,
        "notes": "Tanglish negation: heavy bleeding illa."
    },
    {
        "id": "VT-42",
        "sector": "vet_clinic",
        "language": "english",
        "category": "negated",
        "text": "Minor paw scratch on gravel, not bleeding profusely.",
        "expected_urgent": False,
        "notes": "English negation: not bleeding profusely."
    },

    # --- Past Events (Expected: False) ---
    {
        "id": "VT-43",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "past_event",
        "text": "கடந்த ஆண்டு இந்த மாட்டுக்கு கன்று சிக்கியது, இப்போது புதிய சினையாக உள்ளது.",
        "expected_urgent": False,
        "notes": "Tamil past obstetrics history: கடந்த ஆண்டு."
    },
    {
        "id": "VT-44",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "past_event",
        "text": "Last year calving difficulty aachu doctor, ippo regular checkup kaga call pandren.",
        "expected_urgent": False,
        "notes": "Tanglish past event: last year."
    },
    {
        "id": "VT-45",
        "sector": "vet_clinic",
        "language": "english",
        "category": "past_event",
        "text": "Two years ago our farm had a severe poisoning outbreak from contaminated water, calling today for routine tests.",
        "expected_urgent": False,
        "notes": "English past event: two years ago."
    },
    {
        "id": "VT-46",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "past_event",
        "text": "முன்னாடி ஒரு முறை ஆட்டுக்கு வயிறு உப்புசம் வந்தது, ஆயில் குடித்த பின் சரியானது.",
        "expected_urgent": False,
        "notes": "Tamil past condition: முன்னாடி."
    },
    {
        "id": "VT-47",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "past_event",
        "text": "Munnadi oru thadava snake bite aachu, treatment mudinjuruchu, ippo vaccine venum.",
        "expected_urgent": False,
        "notes": "Tanglish past snake bite: munnadi."
    },
    {
        "id": "VT-48",
        "sector": "vet_clinic",
        "language": "english",
        "category": "past_event",
        "text": "Last month the cow was treated for retained placenta and recovered, calling for milk booster advice.",
        "expected_urgent": False,
        "notes": "English past event: last month."
    },

    # --- Spelling Variants & STT Errors ---
    {
        "id": "VT-49",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "spelling_variant",
        "text": "Vayiru uppusam romba over aayirukku sekkram doctor anupunga.",
        "expected_urgent": True,
        "expected_keyword": "bloat",
        "notes": "Phonetic Tanglish bloat description."
    },
    {
        "id": "VT-50",
        "sector": "vet_clinic",
        "language": "english",
        "category": "spelling_variant",
        "text": "Cow is suffering from acute bloat in farm shed.",
        "expected_urgent": True,
        "expected_keyword": "bloat",
        "notes": "English acute veterinary emergency."
    },
    {
        "id": "VT-51",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "transcript_error",
        "text": "விஷம் குடித்த ஆடு வாயில் நுரை வந்து விழுந்துவிட்டது.",
        "expected_urgent": True,
        "expected_keyword": "விஷம்",
        "notes": "Caprine pesticide poisoning."
    },
    {
        "id": "VT-52",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "transcript_error",
        "text": "Kandru sikkikichu delivery varala ambulance or vet doctor thevai.",
        "expected_urgent": True,
        "expected_keyword": "calving difficulty",
        "notes": "Tanglish dystocia transcript."
    },
    {
        "id": "VT-53",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "urgent_true",
        "text": "கறவை மாடு திடீரென கீழே விழுந்து மயக்கம் அடைந்து எழுந்திருக்க முடியவில்லை.",
        "expected_urgent": True,
        "expected_keyword": "மயக்கம்",
        "notes": "Milk fever / hypocalcemia collapse."
    },
    {
        "id": "VT-54",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "urgent_true",
        "text": "Cattle unconscious aagi ground la kidakuthu, milk fever pola irukku.",
        "expected_urgent": True,
        "expected_keyword": "cattle unconscious",
        "notes": "Acute downer cow milk fever."
    },
    {
        "id": "VT-55",
        "sector": "vet_clinic",
        "language": "english",
        "category": "urgent_true",
        "text": "Emergency! Heavy bleeding from arterial horn injury in breeding bull.",
        "expected_urgent": True,
        "expected_keyword": "heavy bleeding",
        "notes": "Bovine dehorning arterial hemorrhage."
    },
    {
        "id": "VT-56",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "normal_call",
        "text": "நாளை மதியம் நாட்டுக்கோழி பண்ணைக்கு தடுப்பூசி போட ஆள் வருவார்களா?",
        "expected_urgent": False,
        "notes": "Poultry vaccination inquiry."
    },
    {
        "id": "VT-57",
        "sector": "vet_clinic",
        "language": "tanglish",
        "category": "normal_call",
        "text": "Dog food and calcium supplement clinic-la irukka sir?",
        "expected_urgent": False,
        "notes": "Pet feed purchase inquiry."
    },
    {
        "id": "VT-58",
        "sector": "vet_clinic",
        "language": "english",
        "category": "normal_call",
        "text": "Inquiring about microchipping fees for pedigree dog registration.",
        "expected_urgent": False,
        "notes": "Pet microchipping."
    },
    {
        "id": "VT-59",
        "sector": "vet_clinic",
        "language": "tamil",
        "category": "negated",
        "text": "கன்று நலமாக உள்ளது, நஞ்சு கொடி தானாக விழுந்துவிட்டது, பிரச்சனை இல்லை.",
        "expected_urgent": False,
        "notes": "Tamil negation: பிரச்சனை இல்லை."
    },
    {
        "id": "VT-60",
        "sector": "vet_clinic",
        "language": "english",
        "category": "past_event",
        "text": "Last year my dog had a severe fracture and recovered after surgery, calling for fitness check.",
        "expected_urgent": False,
        "notes": "English past event: last year."
    },
]

