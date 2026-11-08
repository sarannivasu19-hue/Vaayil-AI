from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="coaching",
    name="Saran Coaching Centre",
    display_name_ta="சரண் போட்டித் தேர்வு பயிற்சி மையம்",
    display_name_en="Saran Coaching Centre",
    tagline_ta="தேர்வு சேர்க்கை, கட்டண விவரங்கள் & இலவச மாதிரி வகுப்பு",
    tagline_en="Admissions, demo class booking & course fee inquiries",
    description="Student voice desk answering batch timings, scholarship eligibility, and scheduling free demo classroom seats.",
    icon="GraduationCap",
    accent_color="#3b82f6",
    secondary_color="#1d4ed8",
    has_scheduling=True,
    schedule_date_key="demo_date",
    schedule_time_key="preferred_batch",
    demo_user={
        "username": "coaching_admin",
        "email": "admissions@sarancoaching.com",
        "full_name": "Prof. Vigneshwaran K (Academic Director)",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="student_name",
            label_en="Student Name",
            label_ta="மாணவர் பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், சரண் பயிற்சி மையம்! மாணவரின் பெயரை கூறுங்கள்?",
                tanglish="Vanakkam, Saran Coaching Centre! Student peyar enna?",
                en="Welcome to Saran Coaching Centre! What is the student's name?"
            ),
            description="Name of the aspiring student"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="தொடர்பு கொள்ள அலைபேசி எண் என்ன?",
                tanglish="Contact panna mobile number sollunga?",
                en="Please provide your contact phone number."
            ),
            description="Contact number for SMS demo hall pass and syllabus"
        ),
        SlotDefinition(
            name="target_exam",
            label_en="Target Competitive Exam",
            label_ta="பயிற்சி பெற விரும்பும் தேர்வு",
            type="select",
            required=True,
            options=[
                "TNPSC Group 1 & 2 (குரூப் 1 & 2)",
                "TNPSC Group 4 & VAO (குரூப் 4 & விஏஓ)",
                "NEET Medical Entrance (நீட் தேர்வு)",
                "Banking & SSC (வங்கி தேர்வுகள்)",
                "Police & SI Exam (காவலர் தேர்வு)"
            ],
            prompts=SlotPrompt(
                ta="எந்த தேர்வுக்கு பயிற்சி பெற விரும்புகிறீர்கள்? டிஎன்பிஎஸ்சி, நீட் அல்லது வங்கி தேர்வா?",
                tanglish="Endha exam-ku coaching venum? TNPSC, NEET, or Bank exam?",
                en="Which competitive exam are you preparing for?"
            ),
            description="Course track"
        ),
        SlotDefinition(
            name="enquiry_type",
            label_en="Enquiry Objective",
            label_ta="விசாரணை நோக்கம்",
            type="select",
            required=True,
            options=[
                "Free Demo Class Booking (இலவச மாதிரி வகுப்பு)",
                "Fee Structure & Installments (கட்டண விவரம்)",
                "Direct Admission (நேரடி சேர்க்கை)"
            ],
            prompts=SlotPrompt(
                ta="இலவச மாதிரி வகுப்பு முன்பதிவா அல்லது கட்டண விவரங்கள் தேவையா?",
                tanglish="Free demo class book panreengala illana fee details venuma?",
                en="Are you booking a free demo seat or inquiring about the fee structure?"
            ),
            description="Primary purpose of call"
        ),
        SlotDefinition(
            name="preferred_batch",
            label_en="Preferred Batch Timing",
            label_ta="பயிற்சி நேரம்",
            type="select",
            required=True,
            options=[
                "Regular Weekday Morning (09:00 AM - 01:00 PM)",
                "Regular Weekday Evening (05:30 PM - 08:30 PM)",
                "Weekend Special Batch (Sat & Sun)"
            ],
            prompts=SlotPrompt(
                ta="காலை, மாலை அல்லது வார இறுதி வகுப்பா?",
                tanglish="Morning, evening illana weekend batch-a?",
                en="Do you prefer morning, evening, or weekend classes?"
            ),
            description="Timing schedule"
        ),
        SlotDefinition(
            name="demo_date",
            label_en="Demo Class / Visit Date",
            label_ta="மாதிரி வகுப்பு தேதி",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் மாதிரி வகுப்பில் கலந்து கொள்ள விரும்புகிறீர்கள்?",
                tanglish="Endha date-la demo class attend panna virumbureenga?",
                en="What date would you like to attend the demo classroom session?"
            ),
            description="Target visit date"
        ),
        SlotDefinition(
            name="academic_notes",
            label_en="Educational Background / Notes",
            label_ta="கல்வி தகுதி குறிப்புகள்",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="உங்கள் தற்போதைய கல்வி தகுதி அல்லது ஏதேனும் கேள்விகள் உள்ளதா?",
                tanglish="Unga qualification pathi solla virumbureengala?",
                en="What is your current educational background (Degree/12th)?"
            ),
            description="Candidate qualification notes"
        )
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="K. Gokulnath",
            phone="9840293847",
            status="confirmed",
            details={
                "student_name": "K. Gokulnath",
                "phone": "9840293847",
                "target_exam": "TNPSC Group 4 & VAO (குரூப் 4 & விஏஓ)",
                "enquiry_type": "Free Demo Class Booking (இலவச மாதிரி வகுப்பு)",
                "preferred_batch": "Regular Weekday Morning (09:00 AM - 01:00 PM)",
                "demo_date": "2026-11-09",
                "academic_notes": "B.Com graduate, first-time aspirant.",
            },
            notes="[Synthetic Demo Data - Coaching] Demo hall pass issued for batch B."
        ),
        SampleBooking(
            customer_name="A. Sangeetha",
            phone="9789182736",
            status="confirmed",
            details={
                "student_name": "A. Sangeetha",
                "phone": "9789182736",
                "target_exam": "NEET Medical Entrance (நீட் தேர்வு)",
                "enquiry_type": "Direct Admission (நேரடி சேர்க்கை)",
                "preferred_batch": "Regular Weekday Morning (09:00 AM - 01:00 PM)",
                "demo_date": "2026-11-06",
                "academic_notes": "12th standard Bio-Maths student, looking for 1-year crash course.",
            },
            notes="[Synthetic Demo Data - Coaching] Admission counseling token."
        )
    ]
)

