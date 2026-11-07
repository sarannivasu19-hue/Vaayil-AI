import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.sector import Sector
from app.models.user import User
from app.models.alert import Alert
from app.models.call_log import CallLog
from app.auth.security import hash_password
from app.sectors.registry import get_all_sector_packages

DEMO_PASSWORD_RAW = "vaayil123"
ADMIN_PASSWORD_RAW = "admin@vaayil123"


def seed_demo_data(db: Session) -> None:
    """
    Seeds initial sectors, synthetic demo users, system administrator,
    and development sample urgent alerts based on dynamically discovered Sector Packages.
    Safe, idempotent, and updates branding or metadata automatically.
    """
    demo_hashed_password = hash_password(DEMO_PASSWORD_RAW)
    admin_hashed_password = hash_password(ADMIN_PASSWORD_RAW)
    packages = get_all_sector_packages()

    # 1. Seed Sectors & Sector Demo Users
    for pkg in packages:
        existing_sector = db.query(Sector).filter(Sector.id == pkg.id).first()
        if not existing_sector:
            sector = Sector(
                id=pkg.id,
                name=pkg.name,
                display_name_ta=pkg.display_name_ta,
                display_name_en=pkg.display_name_en,
                tagline_ta=pkg.tagline_ta,
                tagline_en=pkg.tagline_en,
                description=pkg.description,
                icon=pkg.icon,
                accent_color=pkg.accent_color,
                secondary_color=pkg.secondary_color,
                is_active=True
            )
            db.add(sector)
            db.flush()
        else:
            existing_sector.name = pkg.name
            existing_sector.display_name_ta = pkg.display_name_ta
            existing_sector.display_name_en = pkg.display_name_en
            existing_sector.tagline_ta = pkg.tagline_ta
            existing_sector.tagline_en = pkg.tagline_en
            existing_sector.description = pkg.description
            existing_sector.icon = pkg.icon
            existing_sector.accent_color = pkg.accent_color
            existing_sector.secondary_color = pkg.secondary_color

        user_info = pkg.demo_user
        existing_user = db.query(User).filter(User.username == user_info["username"]).first()
        if not existing_user:
            user = User(
                username=user_info["username"],
                email=user_info["email"],
                full_name=user_info["full_name"],
                phone="+91 98409 12345",
                hashed_password=demo_hashed_password,
                role=user_info.get("role", "owner"),
                sector_id=pkg.id,
                is_active=True
            )
            db.add(user)
        else:
            if not existing_user.phone:
                existing_user.phone = "+91 98409 12345"
            existing_user.is_active = True

    # 2. Seed System Sector & System Administrator
    system_sector = db.query(Sector).filter(Sector.id == "system").first()
    if not system_sector:
        system_sector = Sector(
            id="system",
            name="Vaayil AI System Platform",
            display_name_ta="மத்திய நிர்வாக மையம்",
            display_name_en="Central System Admin",
            tagline_ta="அனைத்து துறைகளின் நிர்வாகக் கட்டுப்பாடு.",
            tagline_en="Enterprise administration & platform oversight for all six sectors.",
            description="System administration and cross-sector telemetry hub.",
            icon="ShieldCheck",
            accent_color="#8065FF",
            secondary_color="#32D8E8",
            is_active=True
        )
        db.add(system_sector)
        db.flush()

    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@vaayil.ai",
            full_name="Vaayil System Administrator",
            phone="+91 98400 99999",
            hashed_password=admin_hashed_password,
            role="admin",
            sector_id="system",
            is_active=True
        )
        db.add(admin_user)
    else:
        admin_user.role = "admin"
        admin_user.is_active = True
        admin_user.email = "admin@vaayil.ai"
        admin_user.sector_id = "system"

    # 3. Seed Clearly Labelled Development Sample Urgent Alerts & Linked Call Logs
    sample_alerts_data = [
        {
            "sector_id": "panchayat_health",
            "phone": "+91 98401 23456",
            "reason": "Severe cardiopulmonary distress reported in rural ward 4",
            "matched_keyword": "நெஞ்சு வலி",
            "snippet": "அய்யா வணக்கம், எங்க தாத்தாவுக்கு திடீர்னு நெஞ்சு வலிக்குது, மூச்சு திணறுது…",
            "severity": "critical",
            "status": "new",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "வணக்கம், ஊராட்சி சுகாதார உதவி மையம். என்ன அவசர உதவி வேண்டும்?"},
                {"speaker": "caller", "text": "அய்யா வணக்கம், எங்க தாத்தாவுக்கு திடீர்னு நெஞ்சு வலிக்குது, மூச்சு திணறுது, வேர்த்து கொட்டுது."},
                {"speaker": "agent", "text": "பயப்படாதீர்கள். அவசர மருத்துவ உதவிக்கு 108 ஆம்புலன்ஸுக்கு உடனடியாக தகவல் அளிக்கப்படுகிறது. அவரை படுக்க வைக்காமல் சாய்வாக அமர வைக்கவும்."},
                {"speaker": "caller", "text": "சரிங்க அய்யா, நாங்க வார்டு 4 அரசமரத்தடி தெருவில இருக்கோம்."},
                {"speaker": "agent", "text": "விபரம் பதிவாகிவிட்டது. கிராம சுகாதார செவிலியர் செல்வமணி உடனடி தொடர்பு கொள்வார்."}
            ]
        },
        {
            "sector_id": "clinic",
            "phone": "+91 94441 98765",
            "reason": "Febrile convulsion & high fever reported in pediatric patient",
            "matched_keyword": "வலிப்பு",
            "snippet": "டாக்டர், 3 வயது குழந்தைக்கு 104 காய்ச்சல், திடீர்னு வலிப்பு வந்துடுச்சு!",
            "severity": "critical",
            "status": "under_review",
            "reviewed_by": "Dr. Karthik Sundaram",
            "review_notes": "Emergency triage notified. Advised caller to turn child to lateral recovery position and rush to clinic casualty.",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "வணக்கம், அருள் மருத்துவமனை. உங்கள் அவசரத்தை கூறுங்கள்."},
                {"speaker": "caller", "text": "டாக்டர், 3 வயது குழந்தைக்கு 104 காய்ச்சல், திடீர்னு வலிப்பு வந்துடுச்சு! வாய் வழியா நுரை வருது."},
                {"speaker": "agent", "text": "உடனடியாக குழந்தையை ஒருபக்கமாக திருப்பி படுக்க வையுங்கள். வாயில் எதுவும் வைக்க வேண்டாம். அவசர சிகிச்சைப் பிரிவு தயாராக உள்ளது, உடனே கிளினிக் கொண்டு வாருங்கள்."},
                {"speaker": "caller", "text": "இப்போதே ஆட்டோவில் கிளம்பிட்டோம் டாக்டர்."}
            ]
        },
        {
            "sector_id": "vet_clinic",
            "phone": "+91 97890 12345",
            "reason": "Acute organophosphate toxicosis suspected in milking cow",
            "matched_keyword": "பூச்சி மருந்து",
            "snippet": "மருத்துவர் ஐயா, கறவை மாடு பூச்சி மருந்து அடிச்ச பருத்தி இலை தின்னுட்டு மயங்கி கிடக்கு…",
            "severity": "critical",
            "status": "confirmed",
            "reviewed_by": "Dr. Murugan Velu",
            "review_notes": "Confirmed organophosphate poisoning. Dispatched mobile veterinary ambulance with Atropine sulfate and 2-PAM.",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "வணக்கம், திருவள்ளுவர் கால்நடை மருத்துவமனை. என்ன பிரச்சனை?"},
                {"speaker": "caller", "text": "மருத்துவர் ஐயா, கறவை மாடு பூச்சி மருந்து அடிச்ச பருத்தி இலை தின்னுட்டு மயங்கி கிடக்கு, வாயில நுரை தள்ளுது."},
                {"speaker": "agent", "text": "உடனடியாக தண்ணீர் அதிகம் கொடுக்க வேண்டாம். கால்நடை அவசர ஊர்தி புறப்பட்டுவிட்டது, 15 நிமிடத்தில் பண்ணைக்கு வந்துவிடும்."},
                {"speaker": "caller", "text": "சீக்கிரம் வாங்க ஐயா, மாடு ரொம்ப தவிக்குது."}
            ]
        },
        {
            "sector_id": "hotel_lodge",
            "phone": "+91 91234 56780",
            "reason": "Traumatic fall and head laceration in room 204",
            "matched_keyword": "bleeding",
            "snippet": "Front desk emergency: Guest in room 204 slipped in bathroom, bleeding from forehead…",
            "severity": "high",
            "status": "resolved",
            "reviewed_by": "R. Senthil Nathan",
            "review_notes": "First aid administered by hotel staff. Cleaned with antiseptic, guest escorted to nearby clinic for 2 sutures. Now stable.",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "Saran Hotel Front Desk AI. How can I help?"},
                {"speaker": "caller", "text": "Front desk emergency: Guest in room 204 slipped in bathroom, bleeding from forehead and disoriented."},
                {"speaker": "agent", "text": "First aid kit and night supervisor are en route to Room 204 immediately. Local clinic emergency cab has been alerted."},
                {"speaker": "caller", "text": "Thank you, supervisor is already at the door."}
            ]
        },
        {
            "sector_id": "restaurant",
            "phone": "+91 98765 43210",
            "reason": "Severe nut allergen inquiry for banquet order",
            "matched_keyword": "அலர்ஜி",
            "snippet": "நாளைக்கு 50 பேர் மதிய விருந்துல என் மகனுக்கு முந்திரி பருப்பு மிக கடுமையான அலர்ஜி…",
            "severity": "medium",
            "status": "false_alarm",
            "reviewed_by": "Chef Sundaram Chettiar",
            "review_notes": "Checked kitchen protocol. Vegetarian banquet menu confirmed 100% peanut and tree-nut free with separate prep counter. Not an active medical emergency.",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "வணக்கம், மீனாட்சி பவன் கேட்டரிங். என்ன உதவி வேண்டும்?"},
                {"speaker": "caller", "text": "நாளைக்கு 50 பேர் மதிய விருந்துல என் மகனுக்கு முந்திரி பருப்பு மிக கடுமையான அலர்ஜி. சாம்பார், பாயாசத்துல முந்திரி இல்லாம செய்ய முடியுமா?"},
                {"speaker": "agent", "text": "நிச்சயமாக. அலர்ஜி குறிப்பு தலைமை சமையல் கலைஞரிடம் பதிவு செய்யப்பட்டது. முந்திரி சேர்க்காமல் தனியாக தயார் செய்யப்படும்."},
                {"speaker": "caller", "text": "ரொம்ப நன்றி, நிம்மதியா இருக்கு."}
            ]
        },
        {
            "sector_id": "coaching",
            "phone": "+91 90123 45678",
            "reason": "Acute syncope episode reported in test hall B",
            "matched_keyword": "மயங்கி",
            "snippet": "சார், நீட் தேர்வு மாதிரித் தேர்வில் மாணவர் ஒருவர் மயங்கி விழுந்துவிட்டார்…",
            "severity": "high",
            "status": "new",
            "is_dev_sample": True,
            "turns": [
                {"speaker": "agent", "text": "வணக்கம், வெற்றி ஐ.ஏ.எஸ் & நீட் அகாடமி ஹெல்ப் டெஸ்க்."},
                {"speaker": "caller", "text": "சார், நீட் மாதிரித் தேர்வு ஹால் B-ல் மாணவர் ஒருவர் மயங்கி விழுந்துவிட்டார், சுயநினைவு குறைவாக உள்ளது."},
                {"speaker": "agent", "text": "அவருக்கு காற்றோட்டம் ஏற்படுத்தி முகத்தில் குளிர்ந்த நீர் தெளிக்கவும். வளாக முதலுதவி செவிலியர் அறை B-க்கு விரைந்துள்ளார்."},
                {"speaker": "caller", "text": "சரிங்க சார், மாணவரின் பெற்றோருக்கும் தகவல் கொடுத்துவிட்டோம்."}
            ]
        }
    ]

    for item in sample_alerts_data:
        existing_alert = db.query(Alert).filter(
            Alert.sector_id == item["sector_id"],
            Alert.matched_keyword == item["matched_keyword"]
        ).first()

        if not existing_alert:
            # Create a corresponding call log
            now = datetime.now(timezone.utc)
            call_log = CallLog(
                sector_id=item["sector_id"],
                caller_phone=item["phone"],
                start_time=now - timedelta(minutes=15),
                end_time=now - timedelta(minutes=12),
                duration_seconds=180,
                outcome="urgent",
                transcript_turns_json=json.dumps(item["turns"], ensure_ascii=False),
                extracted_details_json=json.dumps({
                    "intent": "emergency_assistance",
                    "sentiment": "urgent",
                    "matched_keyword": item["matched_keyword"],
                    "summary": item["reason"]
                }, ensure_ascii=False),
                sentiment="negative",
                urgent_flag=True,
                created_at=now - timedelta(minutes=15)
            )
            db.add(call_log)
            db.flush()

            alert = Alert(
                sector_id=item["sector_id"],
                call_id=call_log.id,
                phone=item["phone"],
                reason=item["reason"],
                matched_keyword=item["matched_keyword"],
                snippet=item["snippet"],
                severity=item["severity"],
                status=item["status"],
                reviewed_by=item.get("reviewed_by"),
                reviewed_at=now - timedelta(minutes=5) if item.get("reviewed_by") else None,
                review_notes=item.get("review_notes"),
                is_dev_sample=True,
                created_at=now - timedelta(minutes=15)
            )
            db.add(alert)

    db.commit()
