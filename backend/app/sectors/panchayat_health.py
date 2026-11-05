from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="panchayat_health",
    name="Panchayat & Govt Health Desk",
    display_name_ta="ஊராட்சி & அரசு சுகாதார உதவி மையம்",
    display_name_en="Panchayat & Govt Health Help Desk",
    tagline_ta="தடுப்பூசி, சுகாதார முகாம் மற்றும் புகார் பதிவிற்கான அரசு குரல் உதவி",
    tagline_en="Village health camps, vaccination schedules, and civic complaints",
    description="Primary citizen service portal for village health camps, child immunization, epidemic alerts, and civic complaints with reference numbers.",
    icon="HeartPulse",
    accent_color="#06b6d4",
    secondary_color="#0e7490",
    has_scheduling=True,
    schedule_date_key="preferred_date",
    schedule_time_key="preferred_time",
    demo_user={
        "username": "panchayat_admin",
        "email": "health.desk@panchayat.tn.gov.in",
        "full_name": "Selvi Anitha (Village Health Nurse)",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="citizen_name",
            label_en="Citizen Name",
            label_ta="குடிமக்கள் பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், உங்கள் பெயரை தெளிவாக கூறுங்கள்?",
                tanglish="Vanakkam, unga peyara sollunga?",
                en="Welcome, could you please state your full name?"
            ),
            description="Full name of the resident or caller"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="உங்களை தொடர்பு கொள்ள அலைபேசி எண்ணை கூறுங்கள்?",
                tanglish="Ungala contact panna mobile number sollunga?",
                en="What is your 10-digit contact mobile number?"
            ),
            description="10-digit mobile number for SMS reference"
        ),
        SlotDefinition(
            name="village_ward",
            label_en="Village / Ward No.",
            label_ta="கிராமம் / வார்டு எண்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="உங்கள் கிராமம் அல்லது வார்டு எண்ணை குறிப்பிடுங்கள்?",
                tanglish="Unga gramam illana ward number sollunga?",
                en="Which village or ward number are you calling from?"
            ),
            description="Locality within the panchayat union"
        ),
        SlotDefinition(
            name="service_type",
            label_en="Service / Request Type",
            label_ta="சேவை வகை",
            type="select",
            required=True,
            options=[
                "Child Vaccination (தடுப்பூசி)",
                "VHN Nurse Home Visit (செவிலியர் வருகை)",
                "Health Camp Token (மருத்துவ முகாம் டோக்கன்)",
                "Drinking Water Sanitation (குடிநீர் & கழிவுநீர் புகார்)",
                "Dengue/Fever Alert (காய்ச்சல் தடுப்பு முகாம்)",
            ],
            prompts=SlotPrompt(
                ta="உங்களுக்கு என்ன சேவை தேவை? குழந்தை தடுப்பூசி, செவிலியர் சந்திப்பு அல்லது குடிநீர் புகாரா?",
                tanglish="Ungalukku enna service venum? Kuzhandhai vaccine, nurse meeting illana complaint-a?",
                en="Which service do you need? Child vaccination, nurse consultation, or civic sanitation complaint?"
            ),
            description="Primary category of the public desk inquiry"
        ),
        SlotDefinition(
            name="preferred_date",
            label_en="Preferred Date",
            label_ta="விருப்பமான தேதி",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் உங்களுக்கு உதவி அல்லது சந்திப்பு தேவை?",
                tanglish="Endha thedhila ungalukku service illana appointment thevai?",
                en="On which date do you prefer this service or camp visit?"
            ),
            description="Target service date"
        ),
        SlotDefinition(
            name="preferred_time",
            label_en="Preferred Time Slot",
            label_ta="விருப்பமான நேரம்",
            type="select",
            required=False,
            options=["Morning (09:00 AM - 01:00 PM)", "Afternoon (02:00 PM - 05:00 PM)"],
            prompts=SlotPrompt(
                ta="காலை நேரமா அல்லது மதிய நேரமா?",
                tanglish="Kaalai nerama illana madhya nerama?",
                en="Do you prefer morning (9 AM - 1 PM) or afternoon (2 PM - 5 PM)?"
            ),
            description="Preferred time window"
        ),
        SlotDefinition(
            name="details_note",
            label_en="Details / Complaint Notes",
            label_ta="விவரம் / புகாரின் குறிப்பு",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="உங்கள் கோரிக்கை அல்லது புகாரின் விவரங்களை சுருக்கமாக சொல்லுங்கள்?",
                tanglish="Unga request pathi konjam details sollunga?",
                en="Please provide any additional notes or details regarding your request."
            ),
            description="Citizen remarks or symptoms note"
        )
    ],
    urgent_keywords=[
        "நெஞ்சு வலி", "மாரடைப்பு", "மூச்சு திணறல்", "மயக்கம்", "பாம்பு கடி", "அதிக ரத்தப்போக்கு", "குழந்தை மூச்சு",
        "chest pain", "heart attack", "breathing issue", "breathless", "unconscious", "snake bite",
        "heavy bleeding", "seizure", "infant fever", "accident"
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="K. Meenakshi",
            phone="9840123456",
            status="confirmed",
            details={
                "citizen_name": "K. Meenakshi",
                "phone": "9840123456",
                "village_ward": "Kattur Ward 3",
                "service_type": "Child Vaccination (தடுப்பூசி)",
                "preferred_date": "2026-11-06",
                "preferred_time": "Morning (09:00 AM - 01:00 PM)",
                "details_note": "1.5 month booster vaccination token for infant.",
            },
            notes="[Synthetic Demo Data - Panchayat] Infant vaccination slot booked."
        ),
        SampleBooking(
            customer_name="R. Palanisamy",
            phone="9443211223",
            status="confirmed",
            details={
                "citizen_name": "R. Palanisamy",
                "phone": "9443211223",
                "village_ward": "North Street, Ward 1",
                "service_type": "Drinking Water Sanitation (குடிநீர் & கழிவுநீர் புகார்)",
                "preferred_date": "2026-11-05",
                "preferred_time": "Morning (09:00 AM - 01:00 PM)",
                "details_note": "Overhead tank pipe leakage near primary school.",
            },
            notes="[Synthetic Demo Data - Panchayat] Civic maintenance complaint logged."
        ),
        SampleBooking(
            customer_name="S. Vimala",
            phone="9789012345",
            status="pending",
            details={
                "citizen_name": "S. Vimala",
                "phone": "9789012345",
                "village_ward": "Ambedkar Nagar Ward 5",
                "service_type": "VHN Nurse Home Visit (செவிலியர் வருகை)",
                "preferred_date": "2026-11-07",
                "preferred_time": "Afternoon (02:00 PM - 05:00 PM)",
                "details_note": "Post-natal checkup request for village nurse Anitha.",
            },
            notes="[Synthetic Demo Data - Panchayat] Home visit requested."
        ),
        SampleBooking(
            customer_name="M. Arumugam",
            phone="9842109876",
            status="completed",
            details={
                "citizen_name": "M. Arumugam",
                "phone": "9842109876",
                "village_ward": "East Street, Ward 2",
                "service_type": "Health Camp Token (மருத்துவ முகாம் டோக்கன்)",
                "preferred_date": "2026-11-04",
                "preferred_time": "Morning (09:00 AM - 01:00 PM)",
                "details_note": "General geriatric sugar & BP checkup camp token #14.",
            },
            notes="[Synthetic Demo Data - Panchayat] Token issued and attended."
        )
    ]
)

