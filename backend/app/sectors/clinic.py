from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="clinic",
    name="Saran Clinic",
    display_name_ta="சரண் குடும்ப நல மருத்துவமனை",
    display_name_en="Saran Clinic",
    tagline_ta="மருத்துவர் சந்திப்பு முன்பதிவு மற்றும் அவசர கவனிப்பு",
    tagline_en="Doctor appointment bookings, token scheduling & urgent triage",
    description="Outpatient clinic automated reception for consultations, routine checkups, and emergency triage guidance.",
    icon="Stethoscope",
    accent_color="#10b981",
    secondary_color="#047857",
    has_scheduling=True,
    schedule_date_key="appointment_date",
    schedule_time_key="appointment_time",
    demo_user={
        "username": "clinic_admin",
        "email": "appointments@saranclinic.com",
        "full_name": "Dr. Karthik Sundaram (M.B.B.S.)",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="patient_name",
            label_en="Patient Name",
            label_ta="நோயாளி பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், சரண் கிளினிக். நோயாளியின் பெயரை கூறுங்கள்?",
                tanglish="Vanakkam, Saran Clinic. Patient peyar enna?",
                en="Welcome to Saran Clinic. What is the patient's full name?"
            ),
            description="Name of person seeking consultation"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="உங்களின் அலைபேசி எண்ணை சொல்லுங்கள்?",
                tanglish="Unga mobile number sollunga?",
                en="Please provide your 10-digit contact phone number."
            ),
            description="Contact number for SMS appointment token"
        ),
        SlotDefinition(
            name="doctor_specialty",
            label_en="Doctor / Specialty",
            label_ta="மருத்துவ பிரிவு",
            type="select",
            required=True,
            options=[
                "General Medicine (பொது மருத்துவம்)",
                "Pediatrics (குழந்தைகள் நலம்)",
                "Diabetology & BP (சர்க்கரை & ரத்த அழுத்தம்)",
                "Orthopedics (எலும்பு & மூட்டு வலி)",
                "Dermatology (தோல் நோய்)"
            ],
            prompts=SlotPrompt(
                ta="எந்த மருத்துவரை பார்க்க வேண்டும்? பொது மருத்துவம், குழந்தைகள் மருத்துவர் அல்லது சர்க்கரை நோயா?",
                tanglish="Endha doctor paakanum? General, child specialist, or sugar specialist?",
                en="Which doctor or specialty would you like to consult?"
            ),
            description="Medical department"
        ),
        SlotDefinition(
            name="appointment_date",
            label_en="Appointment Date",
            label_ta="சந்திப்பு தேதி",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் மருத்துவரை சந்திக்க விரும்புகிறீர்கள்?",
                tanglish="Endha date-la doctor-a paakanum?",
                en="Which date would you like to schedule your appointment for?"
            ),
            description="Calendar date of appointment"
        ),
        SlotDefinition(
            name="appointment_time",
            label_en="Time Slot",
            label_ta="சந்திப்பு நேரம்",
            type="select",
            required=True,
            options=[
                "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
                "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"
            ],
            prompts=SlotPrompt(
                ta="எந்த நேரம் உங்களுக்கு வசதியாக இருக்கும்?",
                tanglish="Endha time ungalukku convenient-a irukkum?",
                en="Which time slot do you prefer?"
            ),
            description="Appointment consultation slot"
        ),
        SlotDefinition(
            name="symptoms_note",
            label_en="Symptoms / Health Concern",
            label_ta="அறிகுறிகள் / பிரச்சனை",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="உங்களுக்கு என்ன பிரச்சனை அல்லது அறிகுறிகள் உள்ளன?",
                tanglish="Unga symptoms enna nu sollunga?",
                en="Could you briefly state the symptoms or reason for the visit?"
            ),
            description="Brief description of ailment for doctor reference"
        )
    ],
    urgent_keywords=[
        "நெஞ்சு வலி", "மாரடைப்பு", "மூச்சு திணறல்", "மயக்கம்", "பாம்பு கடி", "அதிக ரத்தப்போக்கு", "stroke",
        "chest pain", "heart attack", "unconscious", "heavy bleeding", "severe asthma", "breathlessness"
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="S. Saravanan",
            phone="9841029384",
            status="confirmed",
            details={
                "patient_name": "S. Saravanan",
                "phone": "9841029384",
                "doctor_specialty": "General Medicine (பொது மருத்துவம்)",
                "appointment_date": "2026-11-05",
                "appointment_time": "10:30 AM",
                "symptoms_note": "Mild fever and throat irritation for 2 days.",
            },
            notes="[Synthetic Demo Data - Clinic] Routine consultation scheduled."
        ),
        SampleBooking(
            customer_name="B. Divya",
            phone="9940182736",
            status="confirmed",
            details={
                "patient_name": "B. Divya",
                "phone": "9940182736",
                "doctor_specialty": "Pediatrics (குழந்தைகள் நலம்)",
                "appointment_date": "2026-11-05",
                "appointment_time": "11:00 AM",
                "symptoms_note": "Child routine checkup and growth chart review.",
            },
            notes="[Synthetic Demo Data - Clinic] Pediatric token #4."
        ),
        SampleBooking(
            customer_name="T. Ramanathan",
            phone="9444019283",
            status="confirmed",
            details={
                "patient_name": "T. Ramanathan",
                "phone": "9444019283",
                "doctor_specialty": "Diabetology & BP (சர்க்கரை & ரத்த அழுத்தம்)",
                "appointment_date": "2026-11-06",
                "appointment_time": "05:30 PM",
                "symptoms_note": "Quarterly fasting blood sugar and BP review.",
            },
            notes="[Synthetic Demo Data - Clinic] Follow-up visit."
        )
    ]
)

