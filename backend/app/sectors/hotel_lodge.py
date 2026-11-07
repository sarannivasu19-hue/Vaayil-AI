from app.sectors.base import SectorPackage, SlotDefinition, SlotPrompt, SampleBooking

PACKAGE = SectorPackage(
    id="hotel_lodge",
    name="Saran Hotel",
    display_name_ta="சரண் ஹெரிடேஜ் தங்கும் விடுதி",
    display_name_en="Saran Hotel",
    tagline_ta="அறைகள் முன்பதிவு, சோதனை நேரம் மற்றும் விருந்தினர் சேவை",
    tagline_en="Room reservations, check-in schedules & guest assistance",
    description="Front desk voice receptionist handling AC/Non-AC room inquiries, family suites, and temple pilgrimage bookings.",
    icon="Hotel",
    accent_color="#8b5cf6",
    secondary_color="#6d28d9",
    has_scheduling=True,
    schedule_date_key="checkin_date",
    schedule_time_key="room_type",
    demo_user={
        "username": "hotel_admin",
        "email": "reservations@saranhotel.com",
        "full_name": "R. Senthil Nathan (Front Desk Manager)",
        "role": "owner",
    },
    slots=[
        SlotDefinition(
            name="guest_name",
            label_en="Guest Name",
            label_ta="விருந்தினர் பெயர்",
            type="text",
            required=True,
            prompts=SlotPrompt(
                ta="வணக்கம், சரண் ஹோட்டலுக்கு வரவேற்கிறோம். உங்கள் பெயரை கூறுங்கள்?",
                tanglish="Vanakkam, Saran Hotel-ku welcome. Unga peyar enna?",
                en="Welcome to Saran Hotel. May I have your name for the reservation?"
            ),
            description="Primary guest name"
        ),
        SlotDefinition(
            name="phone",
            label_en="Contact Phone",
            label_ta="அலைபேசி எண்",
            type="phone",
            required=True,
            prompts=SlotPrompt(
                ta="முன்பதிவு உறுதிப்படுத்த உங்கள் அலைபேசி எண் என்ன?",
                tanglish="Booking confirm panna unga mobile number sollunga?",
                en="What is your contact phone number for confirmation?"
            ),
            description="Mobile number for SMS booking voucher"
        ),
        SlotDefinition(
            name="room_type",
            label_en="Room Category",
            label_ta="அறை வகை",
            type="select",
            required=True,
            options=[
                "Standard AC Room (ஏசி அறை)",
                "Deluxe Double AC (டீலக்ஸ் ஏசி)",
                "Family Suite 4-Bed (குடும்ப அறை)",
                "Standard Non-AC (ஏசி இல்லாத அறை)"
            ],
            prompts=SlotPrompt(
                ta="எந்த வகை அறை வேண்டும்? ஸ்டாண்டர்ட் ஏசி, டீலக்ஸ் அல்லது குடும்ப அறையா?",
                tanglish="Endha room type venum? Standard AC, Deluxe or Family Suite?",
                en="Which room category would you prefer? Standard AC, Deluxe, or Family Suite?"
            ),
            description="Room classification"
        ),
        SlotDefinition(
            name="checkin_date",
            label_en="Check-in Date",
            label_ta="வருகை தேதி (Check-in)",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் வர திட்டமிட்டுள்ளீர்கள்?",
                tanglish="Check-in thedhi endha thedhi?",
                en="What is your check-in date?"
            ),
            description="Arrival calendar date"
        ),
        SlotDefinition(
            name="checkout_date",
            label_en="Check-out Date",
            label_ta="வெளியேறும் தேதி (Check-out)",
            type="date",
            required=True,
            prompts=SlotPrompt(
                ta="எந்த தேதியில் அறையை காலி செய்வீர்கள்?",
                tanglish="Check-out endha thedhi?",
                en="What is your planned check-out date?"
            ),
            description="Departure calendar date"
        ),
        SlotDefinition(
            name="guests_count",
            label_en="Number of Guests",
            label_ta="விருந்தினர்கள் எண்ணிக்கை",
            type="number",
            required=True,
            prompts=SlotPrompt(
                ta="மொத்தம் எத்தனை பேர் வருகிறீர்கள்?",
                tanglish="Moththam ethana per varinga?",
                en="How many guests will be staying?"
            ),
            description="Total adult and child headcount"
        ),
        SlotDefinition(
            name="special_requests",
            label_en="Special Requests",
            label_ta="சிறப்பு தேவைகள்",
            type="text",
            required=False,
            prompts=SlotPrompt(
                ta="முன்கூட்டியே செக்-இன் அல்லது கோவில் தரிசன கார் போன்ற தேவைகள் உள்ளதா?",
                tanglish="Early check-in illana edhavadhu special request irukka?",
                en="Do you have any special requirements such as early check-in or extra bed?"
            ),
            description="Custom guest notes"
        )
    ],
    sample_bookings=[
        SampleBooking(
            customer_name="N. Sivasankaran",
            phone="9840918273",
            status="confirmed",
            details={
                "guest_name": "N. Sivasankaran",
                "phone": "9840918273",
                "room_type": "Deluxe Double AC (டீலக்ஸ் ஏசி)",
                "checkin_date": "2026-11-08",
                "checkout_date": "2026-11-10",
                "guests_count": 2,
                "special_requests": "Upper floor room with temple tower view.",
            },
            notes="[Synthetic Demo Data - Hotel] 2-night temple trip stay."
        ),
        SampleBooking(
            customer_name="R. Soundararajan",
            phone="9790182736",
            status="confirmed",
            details={
                "guest_name": "R. Soundararajan",
                "phone": "9790182736",
                "room_type": "Family Suite 4-Bed (குடும்ப அறை)",
                "checkin_date": "2026-11-07",
                "checkout_date": "2026-11-09",
                "guests_count": 4,
                "special_requests": "Late arrival at 9 PM.",
            },
            notes="[Synthetic Demo Data - Hotel] Family weekend getaway."
        )
    ]
)

