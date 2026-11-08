from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="restaurant",
    name="Saran Restaurant",
    display_name_ta="சரண் உணவகம்",
    display_name_en="Saran Restaurant",
    tagline_ta="மேஜை முன்பதிவு மற்றும் விஷேசங்களுக்கான மொத்த உணவு ஆர்டர்",
    tagline_en="Table dining reservations & bulk event catering orders",
    description="Voice-enabled restaurant reservation and catering order line for weddings, birthday banquets, and family dinners.",
    icon="UtensilsCrossed",
    accent_color="#f43f5e",
    secondary_color="#be123c",
    has_scheduling=True,
    schedule_date_key="event_date",
    schedule_time_key="event_time",
    demo_user={
        "username": "restaurant_admin",
        "email": "orders@saranrestaurant.com",
        "full_name": "Chef Sundaram Chettiar",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="customer_name",
            label_en="Customer Name",
            label_ta="வாடிக்கையாளர் பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், சரண் உணவகம்! உங்கள் பெயரை கூறுங்கள்?",
                tanglish="Vanakkam, Saran Restaurant! Unga peyar enna?",
                en="Welcome to Saran Restaurant! May I have your name?"
            ),
            description="Contact person name"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="உங்களின் அலைபேசி எண் என்ன?",
                tanglish="Unga mobile number sollunga?",
                en="What is your contact phone number?"
            ),
            description="Mobile number for reservation confirmation"
        ),
        SlotDefinition(
            name="service_type",
            label_en="Booking Type",
            label_ta="முன்பதிவு வகை",
            type="select",
            required=True,
            options=[
                "Table Dining Reservation (மேஜை முன்பதிவு)",
                "Bulk Event Catering (மொத்த உணவு ஆர்டர்)"
            ],
            prompts=SlotPrompt(
                ta="மேஜை முன்பதிவா அல்லது விஷேசங்களுக்கான மொத்த உணவு கேட்டரிங் ஆர்டரா?",
                tanglish="Table booking-a illana catering order-a?",
                en="Are you looking for a dining table reservation or bulk event catering?"
            ),
            description="Service format"
        ),
        SlotDefinition(
            name="headcount",
            label_en="Number of Guests / Meals",
            label_ta="நபர்கள் எண்ணிக்கை",
            type="number",
            required=True,
            prompts=SlotPrompt(
                ta="எத்தனை நபர்களுக்கு உணவு தேவை?",
                tanglish="Ethana perukku food arrange pannanum?",
                en="For how many people should we prepare?"
            ),
            description="Seat or meal quantity"
        ),
        SlotDefinition(
            name="event_date",
            label_en="Date",
            label_ta="தேதி",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் வர திட்டமிட்டுள்ளீர்கள்?",
                tanglish="Endha date-la plan panreenga?",
                en="Which date is this for?"
            ),
            description="Event or dining calendar date"
        ),
        SlotDefinition(
            name="event_time",
            label_en="Meal Time Slot",
            label_ta="உணவு நேரம்",
            type="select",
            required=True,
            options=[
                "12:30 PM (Lunch)", "01:30 PM (Lunch)",
                "07:30 PM (Dinner)", "08:30 PM (Dinner)", "09:00 PM (Dinner)"
            ],
            prompts=SlotPrompt(
                ta="மதிய உணவா அல்லது இரவு உணவா? எந்த நேரம்?",
                tanglish="Lunch-a illana dinner-a? Endha time?",
                en="Lunch or dinner? What time slot suits you?"
            ),
            description="Time slot"
        ),
        SlotDefinition(
            name="menu_notes",
            label_en="Special Menu Requests",
            label_ta="சிறப்பு உணவு குறிப்புகள்",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="குறிப்பிட்ட இனிப்பு, பாயாசம் அல்லது காரசார விருப்பங்கள் உள்ளதா?",
                tanglish="Sweet, payasam or specific dish requirement irukka?",
                en="Any special dietary preferences or specific dishes requested?"
            ),
            description="Menu notes or dietary restrictions"
        )
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="P. Balachandar",
            phone="9840192837",
            status="confirmed",
            details={
                "customer_name": "P. Balachandar",
                "phone": "9840192837",
                "service_type": "Table Dining Reservation (மேஜை முன்பதிவு)",
                "headcount": 6,
                "event_date": "2026-11-06",
                "event_time": "08:30 PM (Dinner)",
                "menu_notes": "AC dining section, 2 children.",
            },
            notes="[Synthetic Demo Data - Restaurant] Family dinner reservation."
        ),
        SampleBooking(
            customer_name="Dr. Jayanthi",
            phone="9841827364",
            status="confirmed",
            details={
                "customer_name": "Dr. Jayanthi",
                "phone": "9841827364",
                "service_type": "Bulk Event Catering (மொத்த உணவு ஆர்டர்)",
                "headcount": 80,
                "event_date": "2026-11-15",
                "event_time": "12:30 PM (Lunch)",
                "menu_notes": "Retirement function traditional plantain leaf banana feast with Elaneer Payasam.",
            },
            notes="[Synthetic Demo Data - Restaurant] Banana leaf lunch catering."
        )
    ]
)

