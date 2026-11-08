from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="vet_clinic",
    name="Government Veterinary Medical Centre",
    display_name_ta="அரசு கால்நடை மருத்துவ மையம்",
    display_name_en="Government Veterinary Medical Centre",
    tagline_ta="ஆடு, மாடு, வீட்டு செல்லப் பிராணிகள் சிகிச்சை முன்பதிவு",
    tagline_en="Livestock & pet care appointments, vaccinations and urgent care",
    description="Rural veterinary care voice assistant for cattle vaccination, emergency calving calls, and pet health visits.",
    icon="PawPrint",
    accent_color="#f59e0b",
    secondary_color="#b45309",
    has_scheduling=True,
    schedule_date_key="appointment_date",
    schedule_time_key="appointment_time",
    demo_user={
        "username": "vet_admin",
        "email": "doctor@govtvetmedcentre.tn.gov.in",
        "full_name": "Dr. Murugan Velu (B.V.Sc)",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="owner_name",
            label_en="Owner Name",
            label_ta="உரிமையாளர் பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், அரசு கால்நடை மருத்துவ மையம். உங்கள் பெயரை கூறுங்கள்?",
                tanglish="Vanakkam, Govt Vet Medical Centre. Unga peyara sollunga?",
                en="Welcome to Government Veterinary Medical Centre. What is the owner's name?"
            ),
            description="Name of the livestock owner or pet parent"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="தொடர்பு கொள்ள உங்கள் அலைபேசி எண் என்ன?",
                tanglish="Unga mobile number sollunga?",
                en="What is your contact phone number?"
            ),
            description="Mobile number for veterinarian dispatch or confirmation"
        ),
        SlotDefinition(
            name="animal_type",
            label_en="Animal / Livestock Type",
            label_ta="விலங்கு வகை",
            type="select",
            required=True,
            options=[
                "Cow / Dairy Cattle (கறவை மாடு)",
                "Goat / Sheep (ஆடு)",
                "Dog / Pet (நாய்)",
                "Cat (பூனை)",
                "Buffalo (எருமை)",
                "Poultry (கோழி)"
            ],
            prompts=SlotPrompt(
                ta="எந்த விலங்குக்கு சிகிச்சை தேவை? மாடு, ஆடு அல்லது செல்ல பிராணியா?",
                tanglish="Endha animal-ku treatment venum? Maadu, aadu or pet-a?",
                en="Which animal needs care? Cow, goat, dog, or other pet?"
            ),
            description="Type of animal"
        ),
        SlotDefinition(
            name="visit_mode",
            label_en="Visit Mode",
            label_ta="பார்வை முறை",
            type="select",
            required=True,
            options=[
                "Clinic Visit (மருத்துவமனைக்கு அழைத்து வருதல்)",
                "Farm / Home Doctor Visit (பண்ணை/வீட்டுக்கு மருத்துவர் வருகை)"
            ],
            prompts=SlotPrompt(
                ta="மருத்துவமனைக்கு அழைத்து வருகிறீர்களா அல்லது மருத்துவர் உங்கள் பண்ணைக்கு வர வேண்டுமா?",
                tanglish="Clinic-ku kootitu varingala illana farm-ku doctor varanuma?",
                en="Will you bring the animal to the clinic, or do you need a farm visit?"
            ),
            description="Consultation setting"
        ),
        SlotDefinition(
            name="appointment_date",
            label_en="Appointment Date",
            label_ta="சந்திப்பு தேதி",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் பார்க்க வேண்டும்?",
                tanglish="Endha date-la appointment venum?",
                en="What date would you like to schedule?"
            ),
            description="Date for consultation"
        ),
        SlotDefinition(
            name="appointment_time",
            label_en="Time Slot",
            label_ta="நேரம்",
            type="select",
            required=True,
            options=["08:30 AM", "09:30 AM", "10:30 AM", "03:00 PM", "04:00 PM", "05:00 PM"],
            prompts=SlotPrompt(
                ta="எந்த நேரம் உங்களுக்கு வசதி?",
                tanglish="Endha time slot venum?",
                en="Which time slot suits you best?"
            ),
            description="Scheduled hour"
        ),
        SlotDefinition(
            name="health_concern",
            label_en="Health Issue / Symptoms",
            label_ta="பிரச்சனை விவரம்",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="விலங்குக்கு என்ன பிரச்சனை? சுருக்கமாக கூறுங்கள்?",
                tanglish="Animal-ku enna issue nu sollunga?",
                en="Please describe the health problem or symptoms."
            ),
            description="Symptoms or vaccination required"
        )
    ],
    urgent_keywords=[
        "ஈற்று வலி", "பிரசவ வலி", "வயிறு உப்புசம்", "நஞ்சு கொடி", "விஷம்", "கன்று சிக்கியது",
        "calving difficulty", "bloat", "severe poisoning", "cattle unconscious", "heavy bleeding"
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="K. Velusamy",
            phone="9842512345",
            status="confirmed",
            details={
                "owner_name": "K. Velusamy",
                "phone": "9842512345",
                "animal_type": "Cow / Dairy Cattle (கறவை மாடு)",
                "visit_mode": "Farm / Home Doctor Visit (பண்ணை/வீட்டுக்கு மருத்துவர் வருகை)",
                "appointment_date": "2026-11-05",
                "appointment_time": "09:30 AM",
                "health_concern": "Jersey cow reduced milk yield and sluggish feeding.",
            },
            notes="[Synthetic Demo Data - Vet] Field visit booked for Semmedu village."
        ),
        SampleBooking(
            customer_name="M. Priyadarshini",
            phone="9789123890",
            status="confirmed",
            details={
                "owner_name": "M. Priyadarshini",
                "phone": "9789123890",
                "animal_type": "Dog / Pet (நாய்)",
                "visit_mode": "Clinic Visit (மருத்துவமனைக்கு அழைத்து வருதல்)",
                "appointment_date": "2026-11-06",
                "appointment_time": "04:00 PM",
                "health_concern": "Annual anti-rabies vaccination and deworming.",
            },
            notes="[Synthetic Demo Data - Vet] Pet vaccination slot."
        )
    ]
)

