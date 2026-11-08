export interface ServiceOffering {
  id: string;
  nameEn: string;
  nameTa: string;
  slotField: string;
  description: string;
}

export interface BusinessRegistryEntry {
  sectorId: string;
  nameEn: string;
  nameTa: string;
  taglineEn: string;
  taglineTa: string;
  districts: string[]; // District IDs where this registered business operates
  phone: string;
  email: string;
  services: ServiceOffering[];
}

export const REGISTERED_BUSINESSES_AND_SERVICES: BusinessRegistryEntry[] = [
  {
    sectorId: 'panchayat_health',
    nameEn: 'Panchayat & Govt Health Help Desk',
    nameTa: 'ஊராட்சி & அரசு சுகாதார உதவி மையம்',
    taglineEn: 'Citizen public health triage, vaccination schedules, and civic complaints',
    taglineTa: 'பொது சுகாதார உதவி, தடுப்பூசி அட்டவணை மற்றும் புகார்கள்',
    // Covers rural primary healthcare across key delta and southern districts
    districts: ['thanjavur', 'madurai', 'tiruchirappalli', 'salem', 'tiruvarur', 'nagapattinam', 'pudukkottai', 'dindigul', 'chengalpattu'],
    phone: '+91 94441 23456',
    email: 'health.desk@panchayat.tn.gov.in',
    services: [
      { id: 'vaccination', nameEn: 'Child Vaccination', nameTa: 'தடுப்பூசி அட்டவணை', slotField: 'service_type', description: 'Schedule child immunization & maternal nutrition slots' },
      { id: 'vhn_nurse', nameEn: 'VHN Nurse Home Visit', nameTa: 'கிராம சுகாதார செவிலியர் வருகை', slotField: 'service_type', description: 'Request home healthcare checkup from local Village Health Nurse' },
      { id: 'health_camp', nameEn: 'Health Camp Token', nameTa: 'மருத்துவ முகாம் டோக்கன்', slotField: 'service_type', description: 'Pre-book queue tokens for general & eye screening medical camps' },
      { id: 'water_sanitation', nameEn: 'Drinking Water Sanitation', nameTa: 'குடிநீர் & சுகாதார புகார்', slotField: 'service_type', description: 'Log civic tickets for drinking water contamination and pipeline repair' },
      { id: 'fever_alert', nameEn: 'Dengue & Fever Alert Desk', nameTa: 'காய்ச்சல் தடுப்பு முகாம்', slotField: 'service_type', description: 'Report cluster fevers for rapid response medical intervention' },
    ],
  },
  {
    sectorId: 'clinic',
    nameEn: 'Saran Clinic',
    nameTa: 'சரண் குடும்ப நல மருத்துவமனை',
    taglineEn: 'Doctor appointment bookings, token scheduling & urgent triage',
    taglineTa: 'மருத்துவர் சந்திப்பு முன்பதிவு மற்றும் அவசர கவனிப்பு',
    // Healthcare hub operating across major urban/semi-urban healthcare zones
    districts: ['chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'vellore', 'tirunelveli', 'erode', 'kancheepuram'],
    phone: '+91 98409 12345',
    email: 'appointments@saranclinic.com',
    services: [
      { id: 'gen_medicine', nameEn: 'General Medicine', nameTa: 'பொது மருத்துவம்', slotField: 'doctor_specialty', description: 'Consultation with senior general physician for routine illnesses' },
      { id: 'pediatrics', nameEn: 'Pediatrics', nameTa: 'குழந்தைகள் நலம்', slotField: 'doctor_specialty', description: 'Child health examination, growth monitoring and baby care' },
      { id: 'diabetology_bp', nameEn: 'Diabetology & Hypertension (BP)', nameTa: 'சர்க்கரை & ரத்த அழுத்தம்', slotField: 'doctor_specialty', description: 'Chronic disease management, sugar level monitoring and prescription renewal' },
      { id: 'orthopedics', nameEn: 'Orthopedics & Joint Care', nameTa: 'எலும்பு & மூட்டு வலி', slotField: 'doctor_specialty', description: 'Joint pain, arthritis treatment and fracture follow-up' },
      { id: 'dermatology', nameEn: 'Dermatology & Skin Care', nameTa: 'தோல் நோய் சிகிச்சை', slotField: 'doctor_specialty', description: 'Allergy, dermatitis, psoriasis and skin infection consultations' },
    ],
  },
  {
    sectorId: 'vet_clinic',
    nameEn: 'Government Veterinary Medical Centre',
    nameTa: 'அரசு கால்நடை மருத்துவ மையம்',
    taglineEn: 'Livestock & pet care appointments, vaccinations and urgent care',
    taglineTa: 'ஆடு, மாடு, வீட்டு செல்லப் பிராணிகள் சிகிச்சை முன்பதிவு',
    // Operates in agricultural, dairy & livestock heartlands
    districts: ['salem', 'erode', 'tiruppur', 'namakkal', 'thanjavur', 'dindigul', 'dharmapuri', 'villupuram', 'tiruvannamalai'],
    phone: '+91 97890 12345',
    email: 'doctor@govtvetmedcentre.tn.gov.in',
    services: [
      { id: 'dairy_cattle', nameEn: 'Cow & Dairy Cattle Care', nameTa: 'கறவை மாடு பராமரிப்பு', slotField: 'animal_type', description: 'Milch cow health checkups, mastitis control and calving support' },
      { id: 'goat_sheep', nameEn: 'Goat & Sheep Herd Health', nameTa: 'ஆடு & செம்மறி ஆடு சிகிச்சை', slotField: 'animal_type', description: 'Deworming, contagious ecthyma treatment and flock health' },
      { id: 'dog_pet', nameEn: 'Dog & Domestic Pet Care', nameTa: 'வீட்டு நாய் & பூனை சிகிச்சை', slotField: 'animal_type', description: 'Canine rabies vaccination, parvo immunization and grooming' },
      { id: 'cat_pet', nameEn: 'Cat & Kitten Care', nameTa: 'பூனை சிகிச்சை & தடுப்பூசி', slotField: 'animal_type', description: 'Feline vaccination, neutering and parasite protection' },
      { id: 'buffalo', nameEn: 'Buffalo Management', nameTa: 'எருமை மாடு பராமரிப்பு', slotField: 'animal_type', description: 'Artificial insemination, heat detection and nutritional triage' },
      { id: 'poultry', nameEn: 'Poultry & Country Chicken', nameTa: 'நாட்டுக்கோழி பராமரிப்பு', slotField: 'animal_type', description: 'Flock immunization, Ranikhet disease prevention and egg health' },
      { id: 'clinic_visit', nameEn: 'Clinic Outpatient Visit', nameTa: 'மருத்துவமனைக்கு அழைத்து வருதல்', slotField: 'visit_mode', description: 'Direct visit to primary veterinary hospital with animal' },
      { id: 'farm_visit', nameEn: 'Farm Doctor Home Visit', nameTa: 'பண்ணை / வீட்டுக்கு மருத்துவர் வருகை', slotField: 'visit_mode', description: 'Emergency on-site veterinary surgeon ambulance dispatch' },
    ],
  },
  {
    sectorId: 'hotel_lodge',
    nameEn: 'Saran Hotel',
    nameTa: 'சரண் ஹெரிடேஜ் தங்கும் விடுதி',
    taglineEn: 'Room reservations, check-in schedules & guest assistance',
    taglineTa: 'அறைகள் முன்பதிவு, சோதனை நேரம் மற்றும் விருந்தினர் சேவை',
    // Tourism, heritage, temple, hill-station and transit districts
    districts: ['chennai', 'madurai', 'coimbatore', 'thanjavur', 'kanyakumari', 'tirunelveli', 'nilgiris', 'dindigul', 'ramanathapuram', 'tiruvannamalai'],
    phone: '+91 91234 56780',
    email: 'stay@saranhotel.com',
    services: [
      { id: 'std_ac', nameEn: 'Standard AC Room', nameTa: 'ஏசி அறை (Standard AC)', slotField: 'room_type', description: 'Well-appointed climate-controlled room with high-speed WiFi' },
      { id: 'deluxe_ac', nameEn: 'Deluxe Double AC', nameTa: 'டீலக்ஸ் இரட்டை ஏசி (Deluxe)', slotField: 'room_type', description: 'Spacious king-size bed room with city/temple vista' },
      { id: 'family_suite', nameEn: 'Family Suite (4-Bed)', nameTa: 'குடும்ப அறை (4 படுக்கைகள்)', slotField: 'room_type', description: 'Interconnected family suite designed for pilgrim and holiday groups' },
      { id: 'std_non_ac', nameEn: 'Standard Non-AC Room', nameTa: 'ஏசி இல்லாத பட்ஜெட் அறை', slotField: 'room_type', description: 'Economical, clean transit accommodation for budget travelers' },
    ],
  },
  {
    sectorId: 'restaurant',
    nameEn: 'Saran Restaurant',
    nameTa: 'சரண் உணவகம்',
    taglineEn: 'Table dining reservations & bulk event catering orders',
    taglineTa: 'மேஜை முன்பதிவு மற்றும் விஷேசங்களுக்கான மொத்த உணவு ஆர்டர்',
    // Authentic South Indian food epicenters and dining circuits
    districts: ['madurai', 'chennai', 'coimbatore', 'tiruchirappalli', 'dindigul', 'virudhunagar', 'theni', 'sivaganga'],
    phone: '+91 98765 43210',
    email: 'orders@saranrestaurant.com',
    services: [
      { id: 'dining_table', nameEn: 'Table Dining Reservation', nameTa: 'மேஜை முன்பதிவு (Table Booking)', slotField: 'service_type', description: 'Reserve priority dining table for family dinners and special meals' },
      { id: 'bulk_catering', nameEn: 'Bulk Event Catering', nameTa: 'விசேஷங்களுக்கான மொத்த உணவு ஆர்டர்', slotField: 'service_type', description: 'Traditional banana-leaf catering for weddings, betrothals and banquets' },
    ],
  },
  {
    sectorId: 'coaching',
    nameEn: 'Saran Coaching Centre',
    nameTa: 'சரண் போட்டித் தேர்வு பயிற்சி மையம்',
    taglineEn: 'Admissions, demo class booking & course fee inquiries',
    taglineTa: 'தேர்வு சேர்க்கை, கட்டண விவரங்கள் & இலவச மாதிரி வகுப்பு',
    // Education centers across competitive exam test-taking regions
    districts: ['chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'tirunelveli', 'vellore', 'erode', 'thanjavur'],
    phone: '+91 90123 45678',
    email: 'admissions@sarancoaching.com',
    services: [
      { id: 'tnpsc_grp12', nameEn: 'TNPSC Group 1 & 2 Coaching', nameTa: 'குரூப் 1 & 2 பயிற்சி', slotField: 'target_exam', description: 'Comprehensive GS, Tamil eligibility & interview mentorship' },
      { id: 'tnpsc_grp4', nameEn: 'TNPSC Group 4 & VAO', nameTa: 'குரூப் 4 & விஏஓ பயிற்சி', slotField: 'target_exam', description: 'Direct foundation batch with daily question paper workouts' },
      { id: 'neet_medical', nameEn: 'NEET Medical Entrance', nameTa: 'நீட் மருத்துவ நுழைவுத் தேர்வு', slotField: 'target_exam', description: 'NCERT biology, chemistry & physics intensive test series' },
      { id: 'bank_ssc', nameEn: 'Banking & SSC Exam Foundation', nameTa: 'வங்கி & மத்திய அரசு தேர்வுகள்', slotField: 'target_exam', description: 'Quantitative aptitude, reasoning speed drills and general awareness' },
      { id: 'police_si', nameEn: 'Police Constable & Sub-Inspector', nameTa: 'காவலர் & எஸ்ஐ தேர்வு', slotField: 'target_exam', description: 'Psychology, general knowledge and physical test guidance' },
      { id: 'demo_class', nameEn: 'Free Demo Class Booking', nameTa: 'இலவச மாதிரி வகுப்பு முன்பதிவு', slotField: 'enquiry_type', description: 'Attend a live trial lecture with senior faculty before enrollment' },
      { id: 'fee_installments', nameEn: 'Fee Structure & Scholarships', nameTa: 'கட்டண விவரம் & தவணை முறை', slotField: 'enquiry_type', description: 'Fee breakdown, merit scholarships and EMI installment guidance' },
      { id: 'direct_admission', nameEn: 'Direct Classroom Admission', nameTa: 'நேரடி சேர்க்கை முன்பதிவு', slotField: 'enquiry_type', description: 'Confirm seat registration with unique candidate ID' },
    ],
  },
];

