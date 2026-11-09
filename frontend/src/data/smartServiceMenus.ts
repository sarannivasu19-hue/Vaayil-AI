export interface ServiceItem {
  id: string;
  nameEn: string;
  nameTa: string;
  nameTanglish: string;
  category: string;
  descriptionEn: string;
  descriptionTa: string;
  descriptionTanglish: string;
  icon: string;
  price?: number;
  isVeg?: boolean;
  subOptions?: string[];
  badge?: string;
  available?: boolean;
  facilities?: string[];
  capacity?: number;
  duration?: string;
  syllabus?: string[];
  batchTimings?: string[];
}

export interface ServiceCategoryDef {
  id: string;
  nameEn: string;
  nameTa: string;
  nameTanglish: string;
  icon: string;
  color: string;
  descriptionEn: string;
  descriptionTa: string;
}

// ---------------------------------------------------------------------------
// 1. PANCHAYAT / PUBLIC SERVICES (10 Categories)
// ---------------------------------------------------------------------------
export const PANCHAYAT_CATEGORIES: ServiceCategoryDef[] = [
  {
    id: 'ward_street',
    nameEn: 'Ward / Street Problems',
    nameTa: 'வார்டு / தெரு சார்ந்த பிரச்சனைகள்',
    nameTanglish: 'Ward / Street Problems',
    icon: '🛣️',
    color: '#06b6d4',
    descriptionEn: 'Damaged roads, potholes, streetlights, drainage & garbage collection issues.',
    descriptionTa: 'சேதமடைந்த சாலைகள், குழிகள், தெருவிளக்கு, சாக்கடை மற்றும் குப்பை சேகரிப்பு புகார்கள்.',
  },
  {
    id: 'drinking_water',
    nameEn: 'Drinking Water Problems',
    nameTa: 'குடிநீர் விநியோக பிரச்சனைகள்',
    nameTanglish: 'Drinking Water Problems',
    icon: '🚰',
    color: '#38bdf8',
    descriptionEn: 'No supply, low pressure, leakage, water contamination, irregular supply.',
    descriptionTa: 'தண்ணீர் வரவில்லை, குறைந்த அழுத்தம், குழாய் கசிவு, அசுத்த நீர், சீரற்ற விநியோகம்.',
  },
  {
    id: 'road_infra',
    nameEn: 'Road & Infrastructure',
    nameTa: 'சாலை & உட்கட்டமைப்பு',
    nameTanglish: 'Road & Infrastructure',
    icon: '🚧',
    color: '#f59e0b',
    descriptionEn: 'Road damage, broken culverts, pathway blocks & damaged public property.',
    descriptionTa: 'சாலை சேதம், உடைந்த சிறுபாலங்கள், நடைபாதை தடைகள், பொது சொத்து சேதங்கள்.',
  },
  {
    id: 'sanitation_waste',
    nameEn: 'Sanitation & Waste Management',
    nameTa: 'சுகாதாரம் & கழிவு மேலாண்மை',
    nameTanglish: 'Sanitation & Waste Management',
    icon: '🧹',
    color: '#10b981',
    descriptionEn: 'Uncollected garbage, open drains, sewage overflow & mosquito breeding hotspots.',
    descriptionTa: 'தேங்கிய குப்பை, அடைபட்ட கால்வாய், சாக்கடை வழிதல், கொசு உற்பத்தியாகும் இடங்கள்.',
  },
  {
    id: 'public_health',
    nameEn: 'Public Health & Vaccination',
    nameTa: 'பொது சுகாதாரம் & தடுப்பூசி',
    nameTanglish: 'Public Health & Vaccination',
    icon: '💉',
    color: '#ec4899',
    descriptionEn: 'Vaccine schedules, mobile health camp info, maternal & child care tokens.',
    descriptionTa: 'தடுப்பூசி விவரம், மருத்துவ முகாம் தகவல், தாய்-சேய் நல உதவி டோக்கன்.',
  },
  {
    id: 'streetlight_electricity',
    nameEn: 'Streetlight & Electricity Complaints',
    nameTa: 'தெருவிளக்கு & மின்சார புகார்கள்',
    nameTanglish: 'Streetlight & Electricity Complaints',
    icon: '💡',
    color: '#eab308',
    descriptionEn: 'Streetlights not glowing, multiple light failures, snapped wires / electrical hazard.',
    descriptionTa: 'தெருவிளக்கு எரியவில்லை, கம்பம் சாய்ந்தது, அறுந்து கிடக்கும் மின்கம்பிகள்.',
  },
  {
    id: 'certificates',
    nameEn: 'Birth & Death Certificate Assistance',
    nameTa: 'பிறப்பு & இறப்பு சான்றிதழ் வழிகாட்டல்',
    nameTanglish: 'Birth & Death Certificate Assistance',
    icon: '📜',
    color: '#8b5cf6',
    descriptionEn: 'Application guidance, status enquiry, document check & name correction.',
    descriptionTa: 'சான்றிதழ் விண்ணப்ப வழிகாட்டல், நிலவரம் அறிதல், பெயர் திருத்த உதவி.',
  },
  {
    id: 'schemes_welfare',
    nameEn: 'Government Schemes & Welfare',
    nameTa: 'அரசு நலத்திட்டங்கள் & உதவிகள்',
    nameTanglish: 'Government Schemes & Welfare',
    icon: '🏛️',
    color: '#6366f1',
    descriptionEn: 'Kalaignar Magalir Urimai, PM-Kisan, housing welfare & pension eligibility.',
    descriptionTa: 'மகளிர் உரிமைத் தொகை, முதியோர் ஓய்வூதியம், அரசு நலத்திட்ட வழிகாட்டல்.',
  },
  {
    id: 'community_facilities',
    nameEn: 'Public Facilities & Community Issues',
    nameTa: 'பொது வசதிகள் & சமூக நல புகார்கள்',
    nameTanglish: 'Public Facilities & Community Issues',
    icon: '🏞️',
    color: '#14b8a6',
    descriptionEn: 'Public toilets, community halls, OHT water tanks, public parks & fencing.',
    descriptionTa: 'பொது கழிப்பறை, சமுதாய கூடம், மேல்நிலை நீர்த்தேக்க தொட்டி, பூங்கா பராமரிப்பு.',
  },
  {
    id: 'general_complaint',
    nameEn: 'Other / General Complaint',
    nameTa: 'இதர / பொதுவான கோரிக்கைகள்',
    nameTanglish: 'Other / General Complaint',
    icon: '📝',
    color: '#64748b',
    descriptionEn: 'Voice or text complaint on any other village civic or citizen issue.',
    descriptionTa: 'குரல் அல்லது உரை மூலம் உங்கள் பிற கிராம தேவைகள் மற்றும் புகார்களைப் பதிவு செய்யுங்கள்.',
  },
];

export const PANCHAYAT_SERVICES: Record<string, string[]> = {
  ward_street: [
    'Damaged roads (சேதமடைந்த தார் / சிமெண்ட் சாலை)',
    'Potholes & craters (ஆபத்தான சாலை குழிகள்)',
    'Streetlight not working (தெருவிளக்கு எரியவில்லை)',
    'Drainage overflow in street (தெருவில் சாக்கடை நீர் வழிதல்)',
    'Garbage collection issues (குப்பை அள்ளப்படாமல் தேங்குதல்)',
  ],
  drinking_water: [
    'No water supply for several days (பல நாட்களாக குடிநீர் வரவில்லை)',
    'Low water pressure (குறைந்த அழுத்தத்தில் நீர் வருதல்)',
    'Main pipe water leakage (பிரதான குழாயில் நீர் கசிவு)',
    'Contaminated or foul water quality (அசுத்தமான / துர்நாற்ற குடிநீர்)',
    'Irregular water distribution timing (சீரற்ற விநியோக நேரம்)',
  ],
  road_infra: [
    'Severe road damage & erosion (மழை நீர் அரிப்பால் உடைந்த சாலை)',
    'Broken road culvert / bridge (உடைந்த சிறுபாலம் / கல்வெர்ட்)',
    'Public pathway obstruction (பொது வழித்தடத்தில் ஆக்கிரமிப்பு / தடை)',
    'Fallen tree / roadside debris (சாலையோர முறிந்து விழுந்த மரம்)',
    'Damaged public bus shelter (சேதமடைந்த பேருந்து நிழற்குடை)',
  ],
  sanitation_waste: [
    'Garbage not collected from bins (குப்பைத் தொட்டி நிரம்பி வழிதல்)',
    'Public place cleanliness complaint (பொது இடத்தில் அசுத்தம்)',
    'Underground drain blockage (பாதாள சாக்கடை அடைப்பு)',
    'Open sewage stagnation (சாக்கடை தேங்கி துர்நாற்றம் வீசுதல்)',
    'Mosquito breeding stagnant water (கொசு உற்பத்தியாகும் தேங்கு நீர்)',
  ],
  public_health: [
    'Child vaccination schedule inquiry (குழந்தை தடுப்பூசி நாள் விவரம்)',
    'Vaccination appointment request (தடுப்பூசி டோக்கன் முன்பதிவு)',
    'Public health camp information (அரசு மருத்துவ முகாம் தகவல்)',
    'Fever & dengue prevention drive (காய்ச்சல் தடுப்பு மருந்து தெளித்தல்)',
    'Sanitation health emergency (சுகாதார சீர்கேடு அவசர புகார்)',
  ],
  streetlight_electricity: [
    'Single streetlight not working (ஒரு தெருவிளக்கு எரியவில்லை)',
    'Entire street lights out (முழு தெருவும் இருளில் மூழ்கியுள்ளது)',
    'Damaged public electrical pole (சேதமடைந்த மின் கம்பம்)',
    'Exposed wires / electrical danger (ஆபத்தான அறுந்த மின்கம்பிகள் - அவசரம்)',
  ],
  certificates: [
    'Birth certificate application guidance (பிறப்பு சான்றிதழ் விண்ணப்பம்)',
    'Death certificate application guidance (இறப்பு சான்றிதழ் விண்ணப்பம்)',
    'Certificate correction assistance (சான்றிதழில் திருத்தம் செய்ய உதவி)',
    'Application status enquiry (விண்ணப்பத்தின் தற்போதைய நிலை)',
  ],
  schemes_welfare: [
    'Kalaignar Magalir Urimai Thogai enquiry (மகளிர் உரிமைத் தொகை விவரம்)',
    'Old Age Pension (OAP) eligibility check (முதியோர் உதவித்தொகை வழிகாட்டல்)',
    'PM-Kisan Farmer welfare scheme (விவசாயி உதவித்தொகை விவரம்)',
    'PMAY Rural housing scheme assistance (பிரதம மந்திரி ஆவாஸ் யோஜனா வீடு)',
  ],
  community_facilities: [
    'Public toilet maintenance complaint (பொது கழிப்பறை சுத்தம் செய்யப்படாமை)',
    'Community hall booking enquiry (சமுதாய கூடம் முன்பதிவு விவரம்)',
    'Overhead water tank cleaning request (மேல்நிலை நீர்த்தேக்க தொட்டி சுத்தம்)',
    'Public park & playground maintenance (பொது பூங்கா / விளையாட்டு திடல்)',
  ],
  general_complaint: [
    'General Civic Complaint (பொதுவான கிராம ஊராட்சி கோரிக்கை)',
    'Special Request to Panchayat President / Ward Member (தலைவர் / உறுப்பினர் கவனத்திற்கு)',
  ],
};

// ---------------------------------------------------------------------------
// 2. HEALTHCARE / CLINIC — SARAN CLINIC (10 Categories)
// ---------------------------------------------------------------------------
export const CLINIC_CATEGORIES: ServiceCategoryDef[] = [
  {
    id: 'general_consultation',
    nameEn: 'General Consultation',
    nameTa: 'பொது மருத்துவ ஆலோசனை',
    nameTanglish: 'General Consultation',
    icon: '🩺',
    color: '#06b6d4',
    descriptionEn: 'Routine health check-up, general fatigue, BP check & preventive wellness.',
    descriptionTa: 'வழக்கமான உடல் பரிசோதனை, உடல் சோர்வு, ரத்த அழுத்த பரிசோதனை.',
  },
  {
    id: 'fever_cold',
    nameEn: 'Fever & Cold',
    nameTa: 'காய்ச்சல் & சளி சிகிச்சை',
    nameTanglish: 'Fever & Cold',
    icon: '🌡️',
    color: '#f97316',
    descriptionEn: 'High fever, body chills, viral infection symptoms & seasonal flu triage.',
    descriptionTa: 'காய்ச்சல், உடல் நடுக்கம், வைரஸ் காய்ச்சல் அறிகுறிகள் மற்றும் சிகிச்சை.',
  },
  {
    id: 'cough_respiratory',
    nameEn: 'Cough & Respiratory Symptoms',
    nameTa: 'இருமல் & சுவாசக் கோளாறு',
    nameTanglish: 'Cough & Respiratory Symptoms',
    icon: '🫁',
    color: '#38bdf8',
    descriptionEn: 'Persistent dry or wet cough, chest congestion, throat pain & breathing issues.',
    descriptionTa: 'தொடர் இருமல், நெஞ்சு சளி, தொண்டை வலி, மூச்சு விடுவதில் சிரமம்.',
  },
  {
    id: 'headache_pain',
    nameEn: 'Headache & Body Pain',
    nameTa: 'தலைவலி & உடல் வலி',
    nameTanglish: 'Headache & Body Pain',
    icon: '💆',
    color: '#a855f7',
    descriptionEn: 'Severe migraine, neck pain, joint stiffness & muscular soreness evaluation.',
    descriptionTa: 'ஒற்றைத் தலைவலி, கழுத்து வலி, மூட்டு வலி மற்றும் தசைப்பிடிப்பு பரிசோதனை.',
  },
  {
    id: 'diabetes_bp',
    nameEn: 'Diabetes / Blood Pressure Follow-up',
    nameTa: 'சர்க்கரை நோய் / ரத்த அழுத்த தொடர் சிகிச்சை',
    nameTanglish: 'Diabetes / BP Follow-up',
    icon: '🩸',
    color: '#ef4444',
    descriptionEn: 'Fasting blood sugar review, HbA1c monitor, medication refill & BP checks.',
    descriptionTa: 'சர்க்கரை அளவு பரிசோதனை, ரத்த அழுத்த கண்காணிப்பு மற்றும் மாத்திரை மறுஆய்வு.',
  },
  {
    id: 'child_healthcare',
    nameEn: 'Child Healthcare',
    nameTa: 'குழந்தைகள் நலம் (பீடியாட்ரிக்ஸ்)',
    nameTanglish: 'Child Healthcare',
    icon: '👶',
    color: '#ec4899',
    descriptionEn: 'Infant fever, appetite loss, pediatric growth check, tummy upset & allergies.',
    descriptionTa: 'குழந்தை காய்ச்சல், பசியின்மை, வளர்ச்சி கண்காணிப்பு மற்றும் வயிற்று உபாதைகள்.',
  },
  {
    id: 'vaccination_info',
    nameEn: 'Vaccination Information / Appointment',
    nameTa: 'தடுப்பூசி முன்பதிவு & தகவல்',
    nameTanglish: 'Vaccination Info / Appointment',
    icon: '💉',
    color: '#10b981',
    descriptionEn: 'Hepatitis, MMR, Flu vaccine, Tetanus, Typhoid and booster dosage slots.',
    descriptionTa: 'ஹெபடைடிஸ், டெட்டனஸ், டைபாய்டு மற்றும் பருவக்கால காய்ச்சல் தடுப்பூசி.',
  },
  {
    id: 'lab_test',
    nameEn: 'Laboratory Test Booking',
    nameTa: 'ஆய்வக ரத்தப் பரிசோதனை முன்பதிவு',
    nameTanglish: 'Laboratory Test Booking',
    icon: '🔬',
    color: '#6366f1',
    descriptionEn: 'CBC, Lipid profile, Thyroid panel, Urine routine & Liver function test.',
    descriptionTa: 'முழு ரத்தப் பரிசோதனை, கொழுப்பு பரிசோதனை, தைராய்டு மற்றும் சிறுநீர் ஆய்வு.',
  },
  {
    id: 'doctor_appointment',
    nameEn: 'Doctor Appointment',
    nameTa: 'மருத்துவர் நேரடி சந்திப்பு',
    nameTanglish: 'Doctor Appointment',
    icon: '👨‍⚕️',
    color: '#14b8a6',
    descriptionEn: 'Direct appointment with Chief Physician Dr. Saran MBBS or specialist panel.',
    descriptionTa: 'தலைமை மருத்துவர் டாக்டர் சரண் MBBS அல்லது சிறப்பு மருத்துவருடன் சந்திப்பு.',
  },
  {
    id: 'other_health',
    nameEn: 'Other Health Concerns',
    nameTa: 'இதர உடல்நலப் பிரச்சனைகள்',
    nameTanglish: 'Other Health Concerns',
    icon: '📋',
    color: '#64748b',
    descriptionEn: 'Skin rash, digestive disorder, post-op consultation & second opinions.',
    descriptionTa: 'தோல் பிரச்சனை, செரிமானக் கோளாறு மற்றும் பிற உடல்நலக் குறைகள்.',
  },
];

export const CLINIC_DOCTORS = [
  { id: 'dr_saran', name: 'Dr. Saran MBBS, MD (General Medicine)', specialty: 'Chief Physician · 14 yrs exp', timing: '9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM' },
  { id: 'dr_priya', name: 'Dr. Priya Sundaram DNB (Pediatrics)', specialty: 'Child Specialist · 10 yrs exp', timing: '10:00 AM - 1:00 PM' },
  { id: 'dr_duty', name: 'Duty Medical Officer', specialty: 'Outpatient Triage & Emergency Stabilization', timing: '24 Hours On-Call' },
];

// ---------------------------------------------------------------------------
// 3. RESTAURANT / FOOD ORDERING — SARAN RESTAURANT
// ---------------------------------------------------------------------------
export const RESTAURANT_CATEGORIES: ServiceCategoryDef[] = [
  { id: 'breakfast', nameEn: 'Breakfast', nameTa: 'காலை சிற்றுண்டி', nameTanglish: 'Breakfast', icon: '🥞', color: '#f59e0b', descriptionEn: 'Crispy hot dosas, steamed idlis, traditional pongal & vada.', descriptionTa: 'மொறுமொறு தோசை, மல்லிகைப் பூ இட்லி, நெய் பொங்கல், மெது வடை.' },
  { id: 'lunch', nameEn: 'Lunch', nameTa: 'மதிய சாப்பாடு', nameTanglish: 'Lunch', icon: '🍛', color: '#10b981', descriptionEn: 'Authentic South Indian banana leaf meals & Chettinad dum biryani.', descriptionTa: 'வாழை இலை சாப்பாடு, செட்டிநாடு பிரியாணி, சாம்பார் சாதம்.' },
  { id: 'dinner', nameEn: 'Dinner', nameTa: 'இரவு உணவு', nameTanglish: 'Dinner', icon: '🫓', color: '#6366f1', descriptionEn: 'Hot bun parotta, chalna, chapatis, idiyappam & varieties.', descriptionTa: 'சூடான பன் பரோட்டா, சால்னா, சப்பாத்தி, இடியாப்பம்.' },
  { id: 'snacks', nameEn: 'Snacks', nameTa: 'மாலை பலகாரங்கள்', nameTanglish: 'Snacks', icon: '🥟', color: '#f97316', descriptionEn: 'Crispy onion samosas, vazhaipoo vadai, bhajji platter.', descriptionTa: 'வெங்காய சமோசா, வாழைப்பூ வடை, சூடான பஜ்ஜி வகைகள்.' },
  { id: 'beverages', nameEn: 'Beverages', nameTa: 'பானங்கள்', nameTanglish: 'Beverages', icon: '☕', color: '#8b5cf6', descriptionEn: 'Kumbakonam degree filter coffee, masala tea & fresh juices.', descriptionTa: 'கும்பகோணம் டிகிரி ஃபில்டர் காபி, மசாலா டீ, இளநீர் பாயாசம்.' },
  { id: 'veg', nameEn: 'Vegetarian Specials', nameTa: 'சைவ உணவுகள்', nameTanglish: 'Vegetarian Specials', icon: '🥗', color: '#22c55e', descriptionEn: 'Paneer butter masala, mushroom chukka, veg meals.', descriptionTa: 'பன்னீர் பட்டர் மசாலா, காளான் சுக்கா, ஸ்பெஷல் சைவ சாப்பாடு.' },
  { id: 'non_veg', nameEn: 'Non-Vegetarian', nameTa: 'அசைவ உணவுகள்', nameTanglish: 'Non-Vegetarian', icon: '🍗', color: '#ef4444', descriptionEn: 'Chettinad chicken fry, mutton chukka, nattu kozhi kulambu.', descriptionTa: 'செட்டிநாடு சிக்கன் வறுவல், மட்டன் சுக்கா, நாட்டுக்கோழி குழம்பு.' },
  { id: 'specials', nameEn: 'Madurai Specials', nameTa: 'மதுரை ஸ்பெஷல்', nameTanglish: 'Madurai Specials', icon: '🌟', color: '#ec4899', descriptionEn: 'Famous Madurai kari dosa, bun parotta & cold jigarthanda.', descriptionTa: 'புகழ்பெற்ற மதுரை கறி தோசை, பன் பரோட்டா, ஜிகர்தண்டா.' },
];

export const RESTAURANT_MENU_ITEMS: ServiceItem[] = [
  // Breakfast
  { id: 'rst_idli', nameEn: 'Ghee Podi Idli (4 pcs)', nameTa: 'நெய் பொடி இட்லி (4 எண்ணம்)', nameTanglish: 'Ghee Podi Idli (4 pcs)', category: 'breakfast', descriptionEn: 'Soft steamed rice cakes tossed in aromatic gunpowder and pure cow ghee.', descriptionTa: 'மணமணக்கும் இட்லிப் பொடி மற்றும் தூய நெய்யில் பிரட்டப்பட்ட மிருதுவான இட்லி.', descriptionTanglish: 'Nalla soft idli tossed in ghee and gun powder.', icon: '⚪', price: 90, isVeg: true, available: true },
  { id: 'rst_dosa', nameEn: 'Special Masala Dosa', nameTa: 'ஸ்பெஷல் மசாலா தோசை', nameTanglish: 'Special Masala Dosa', category: 'breakfast', descriptionEn: 'Crispy golden crepe filled with spiced potato masala, served with 3 chutneys & sambar.', descriptionTa: 'உருளைக்கிழங்கு மசாலா நிரப்பப்பட்ட மொறுமொறுப்பான தோசை மற்றும் சாம்பார், சட்னி.', descriptionTanglish: 'Crispy dosa with potato masala and fresh chutney.', icon: '🥞', price: 110, isVeg: true, available: true },
  { id: 'rst_pongal', nameEn: 'Ven Pongal with Medu Vada', nameTa: 'வெண் பொங்கல் & மெது வடை', nameTanglish: 'Ven Pongal with Medu Vada', category: 'breakfast', descriptionEn: 'Hot ghee-laden cumin-pepper rice-lentil mash with a crisp urad dal fritter.', descriptionTa: 'நெய் மிளகு சீரகம் தாளித்த சூடான வெண் பொங்கல் மற்றும் மொறுமொறு மெது வடை.', descriptionTanglish: 'Hot ghee pongal with crispy vadai.', icon: '🥣', price: 100, isVeg: true, available: true },
  { id: 'rst_poori', nameEn: 'Poori Masala (3 pcs)', nameTa: 'பூரி மசாலா (3 எண்ணம்)', nameTanglish: 'Poori Masala (3 pcs)', category: 'breakfast', descriptionEn: 'Fluffy whole wheat fried pooris served with authentic potato kurma.', descriptionTa: 'சூடான உப்பிய பூரி மற்றும் சுவையான உருளைக்கிழங்கு மசாலா.', descriptionTanglish: 'Hot fluffy pooris with potato subji.', icon: '🫓', price: 95, isVeg: true, available: true },

  // Lunch
  { id: 'rst_meals_veg', nameEn: 'Saran Special South Indian Meals', nameTa: 'சரண் ஸ்பெஷல் சைவ சாப்பாடு', nameTanglish: 'Saran Special Veg Meals', category: 'lunch', descriptionEn: 'Unlimited ponni rice, sambar, vatha kulambu, rasam, kootu, poriyal, appalam & payasam.', descriptionTa: 'சுவையான பொன்னி அரிசி சாதம், சாம்பார், வத்தக்குழம்பு, ரசம், கூட்டு, பொரியல், அப்பளம், பாயாசம்.', descriptionTanglish: 'Complete unlimited South Indian thali meal.', icon: '🍱', price: 160, isVeg: true, available: true },
  { id: 'rst_biryani_chicken', nameEn: 'Chettinad Chicken Dum Biryani', nameTa: 'செட்டிநாடு சிக்கன் தம் பிரியாணி', nameTanglish: 'Chettinad Chicken Biryani', category: 'lunch', descriptionEn: 'Fragrant seeraga samba rice cooked with tender chicken pieces & ground spice blend.', descriptionTa: 'சீரக சம்பா அரிசியில் செட்டிநாடு பாணியில் தயாரான சுவையான சிக்கன் பிரியாணி.', descriptionTanglish: 'Seeraga samba chicken biryani with onion raita and salna.', icon: '🍗', price: 240, isVeg: false, available: true },
  { id: 'rst_sambar_rice', nameEn: 'Ghee Sambar Rice with Potato Fry', nameTa: 'நெய் சாம்பார் சாதம் & உருளை வறுவல்', nameTanglish: 'Sambar Rice with Potato Fry', category: 'lunch', descriptionEn: 'Homestyle shallot sambar rice cooked with ghee, paired with spicy roast potatoes.', descriptionTa: 'சின்ன வெங்காயம் சேர்த்த நெய் சாம்பார் சாதம் மற்றும் காரசாரமான உருளை வறுவல்.', descriptionTanglish: 'Traditional sambar rice with spicy potato roast.', icon: '🍛', price: 120, isVeg: true, available: true },

  // Dinner
  { id: 'rst_bun_parotta', nameEn: 'Madurai Bun Parotta (2 pcs)', nameTa: 'மதுரை பன் பரோட்டா (2 எண்ணம்)', nameTanglish: 'Madurai Bun Parotta (2 pcs)', category: 'dinner', descriptionEn: 'Layered fluffy thick parotta with crisp exterior, served with rich chicken or veg salna.', descriptionTa: 'மொறுமொறுப்பான வெளிப்புறமும் மென்மையான உள்பகுதியும் கொண்ட பன் பரோட்டா.', descriptionTanglish: 'Authentic Madurai style bun parotta with aromatic salna.', icon: '🫓', price: 110, isVeg: false, available: true },
  { id: 'rst_chapati', nameEn: 'Phulka Chapati with Paneer Kurma', nameTa: 'புல்கா சப்பாத்தி & பன்னீர் குருமா', nameTanglish: 'Chapati with Paneer Kurma', category: 'dinner', descriptionEn: 'Oil-free soft wheat rotis paired with creamy mild cottage cheese gravy.', descriptionTa: 'மென்மையான கோதுமை சப்பாத்தி மற்றும் சுவையான பன்னீர் மசாலா குருமா.', descriptionTanglish: 'Soft chapatis served with rich paneer kurma.', icon: '🍞', price: 120, isVeg: true, available: true },

  // Snacks & Beverages
  { id: 'rst_samosa', nameEn: 'Spicy Onion Samosa (3 pcs)', nameTa: 'கார வெங்காய சமோசா (3 எண்ணம்)', nameTanglish: 'Spicy Onion Samosa (3 pcs)', category: 'snacks', descriptionEn: 'Crunchy triangle pastries stuffed with tempered onions, mint & green chillies.', descriptionTa: 'மொறுமொறுப்பான கார வெங்காய சமோசா மற்றும் புதினா சட்னி.', descriptionTanglish: 'Hot crunchy onion samosas.', icon: '🥟', price: 50, isVeg: true, available: true },
  { id: 'rst_coffee', nameEn: 'Kumbakonam Degree Filter Coffee', nameTa: 'கும்பகோணம் டிகிரி காபி', nameTanglish: 'Degree Filter Coffee', category: 'beverages', descriptionEn: 'Freshly decocted chicory blend brewed with thick pure cow milk.', descriptionTa: 'முதல் தரம் காய்ச்சிய ஃபில்டர் டிகாஷன் மற்றும் கெட்டிப்பால் காபி.', descriptionTanglish: 'Traditional foaming brass cup filter coffee.', icon: '☕', price: 35, isVeg: true, available: true },
  { id: 'rst_jigarthanda', nameEn: 'Special Madurai Famous Jigarthanda', nameTa: 'ஸ்பெஷல் மதுரை ஜிகர்தண்டா', nameTanglish: 'Madurai Special Jigarthanda', category: 'specials', descriptionEn: 'Chilled almond gum, reduced condensed milk, nannari syrup & rich ice cream scoop.', descriptionTa: 'பாதாம் பிசின், பால்கட்டி, நன்னாரி மற்றும் ஐஸ்கிரீம் கலந்த புகழ்பெற்ற ஜிகர்தண்டா.', descriptionTanglish: 'Madurai famous royal cold dessert drink.', icon: '🍨', price: 90, isVeg: true, available: true },
];

// ---------------------------------------------------------------------------
// 4. HOTEL / ACCOMMODATION — SARAN HOTEL
// ---------------------------------------------------------------------------
export const HOTEL_ROOM_TYPES: ServiceItem[] = [
  {
    id: 'room_standard',
    nameEn: 'Standard Room',
    nameTa: 'ஸ்டாண்டர்ட் அறை',
    nameTanglish: 'Standard Room',
    category: 'standard',
    descriptionEn: 'Cozy and clean room with double bed, attached bathroom, TV & high-speed Wi-Fi.',
    descriptionTa: 'இருவர் தங்கக்கூடிய வசதியான அறை, தொலைக்காட்சி, கட்டணமில்லா வைஃபை வசதி.',
    descriptionTanglish: 'Budget-friendly clean room with double bed and attached bath.',
    icon: '🛏️',
    price: 1200,
    capacity: 2,
    facilities: ['Free Wi-Fi', 'Attached Bathroom', 'LED TV', 'Hot Water 24/7', 'Room Service'],
    available: true,
  },
  {
    id: 'room_deluxe',
    nameEn: 'Deluxe Room',
    nameTa: 'டீலக்ஸ் அறை',
    nameTanglish: 'Deluxe Room',
    category: 'deluxe',
    descriptionEn: 'Spacious air-conditioned room with king-size bed, city view balcony & premium toiletries.',
    descriptionTa: 'ஏசி வசதி, கிங் சைஸ் படுக்கை, பால்கனி மற்றும் பிரீமியம் குளியலறை வசதி.',
    descriptionTanglish: 'Spacious AC room with king bed and city view.',
    icon: '🏨',
    price: 2200,
    capacity: 3,
    facilities: ['Split AC', 'King Size Bed', 'Balcony View', 'Electric Kettle', '24/7 Hot Water', 'Daily Housekeeping'],
    available: true,
  },
  {
    id: 'room_double_bed',
    nameEn: 'Double Bed Room',
    nameTa: 'இரட்டை படுக்கை அறை',
    nameTanglish: 'Double Bed Room',
    category: 'double',
    descriptionEn: 'Comfortable twin single beds or queen bed for colleagues or friends traveling together.',
    descriptionTa: 'நண்பர்கள் அல்லது வணிகப் பயணிகளுக்கு உகந்த இரட்டை படுக்கை அறை.',
    descriptionTanglish: 'Two single beds or queen bed with work desk.',
    icon: '🛌',
    price: 1800,
    capacity: 2,
    facilities: ['Split AC / Fan', 'Work Desk', 'Free Wi-Fi', 'Hot Water', 'Coffee Maker'],
    available: true,
  },
  {
    id: 'room_family',
    nameEn: 'Family Suite',
    nameTa: 'குடும்ப தொகுப்பு அறை (சூட்)',
    nameTanglish: 'Family Suite',
    category: 'family',
    descriptionEn: 'Grand two-bedroom interconnecting suite accommodating up to 5 guests with sitting lounge.',
    descriptionTa: 'குடும்பத்தினருடன் வசதியாக தங்கக்கூடிய இரண்டு படுக்கை அறை மற்றும் வரவேற்பு கூடம்.',
    descriptionTanglish: 'Large family suite with two interconnected rooms for up to 5 people.',
    icon: '🛋️',
    price: 3500,
    capacity: 5,
    facilities: ['2 Bedrooms', 'Living Room', 'Mini Fridge', 'Smart TV', '2 Bathrooms', 'Complimentary Breakfast'],
    available: true,
  },
  {
    id: 'room_ac',
    nameEn: 'Executive AC Room',
    nameTa: 'எக்ஸிகியூட்டிவ் ஏசி அறை',
    nameTanglish: 'Executive AC Room',
    category: 'ac',
    descriptionEn: 'Chilled climate-controlled room with modern interiors, study desk & power backup.',
    descriptionTa: 'நவீன ஏசி வசதி, படிக்கும் மேசை மற்றும் தடையற்ற மின்சார வசதி கொண்ட அறை.',
    descriptionTanglish: 'Modern cool AC room with uninterrupted power backup.',
    icon: '❄️',
    price: 2000,
    capacity: 2,
    facilities: ['Continuous AC', 'Queen Bed', '100% Power Backup', 'Room Service', 'Mineral Water'],
    available: true,
  },
  {
    id: 'room_non_ac',
    nameEn: 'Budget Non-AC Room',
    nameTa: 'சிக்கன சாதாரண அறை (நான்-ஏசி)',
    nameTanglish: 'Budget Non-AC Room',
    category: 'non_ac',
    descriptionEn: 'Economical, airy room with high-speed ceiling fan, clean linen & attached bath.',
    descriptionTa: 'குறைந்த கட்டணத்தில் தூய்மையான படுக்கை மற்றும் மின்விசிறி வசதியுடன் கூடிய அறை.',
    descriptionTanglish: 'Affordable clean non-AC room with ceiling fan.',
    icon: '🚪',
    price: 1000,
    capacity: 2,
    facilities: ['Ceiling Fan', 'Attached Bath', 'Free Wi-Fi', '24/7 Water Supply'],
    available: true,
  },
];

// ---------------------------------------------------------------------------
// 5. VETERINARY SERVICES — GOVT VETERINARY MEDICAL CENTRE (10 Categories)
// ---------------------------------------------------------------------------
export const VET_CATEGORIES: ServiceCategoryDef[] = [
  { id: 'general_vet', nameEn: 'General Animal Consultation', nameTa: 'பொது கால்நடை மருத்துவ ஆலோசனை', nameTanglish: 'General Animal Consultation', icon: '🐾', color: '#f97316', descriptionEn: 'Routine physical checkup, deworming, vitamin deficiencies & health fitness certificates.', descriptionTa: 'வழக்கமான உடல் பரிசோதனை, குடற்புழு நீக்கம், ஊட்டச்சத்து குறைபாடு பரிசோதனை.' },
  { id: 'dog_health', nameEn: 'Dog Healthcare', nameTa: 'நாய்கள் நலம் & சிகிச்சை', nameTanglish: 'Dog Healthcare', icon: '🐕', color: '#38bdf8', descriptionEn: 'Canine parvovirus triage, tick fever, skin infection, anti-rabies & digestion issues.', descriptionTa: 'நாய்களுக்கான தடுப்பூசி, உண்ணி காய்ச்சல், தோல் நோய் மற்றும் வயிறு சிகிச்சை.' },
  { id: 'cat_health', nameEn: 'Cat Healthcare', nameTa: 'பூனைகள் நலம் & சிகிச்சை', nameTanglish: 'Cat Healthcare', icon: '🐈', color: '#a855f7', descriptionEn: 'Feline vaccinations, respiratory infection, ear mites, dietary advice & neutering info.', descriptionTa: 'பூனைகளுக்கான தடுப்பூசி, சுவாசக் கோளாறு, காது அரிப்பு மற்றும் சிகிச்சை.' },
  { id: 'cattle_cow', nameEn: 'Cattle / Cow Healthcare', nameTa: 'பசு & மாடுகள் சிகிச்சை', nameTanglish: 'Cattle / Cow Healthcare', icon: '🐄', color: '#10b981', descriptionEn: 'Mastitis, milk yield drop, foot & mouth disease (FMD), pregnancy diagnosis & calving.', descriptionTa: 'மடிநோய், பால் குறைவு, கோமாரி நோய் தடுப்பூசி, சினை பரிசோதனை மற்றும் கன்று ஈனும் உதவி.' },
  { id: 'goat_sheep', nameEn: 'Goat & Sheep Healthcare', nameTa: 'ஆடு & செம்மறி ஆடுகள் சிகிச்சை', nameTanglish: 'Goat & Sheep Healthcare', icon: '🐐', color: '#f59e0b', descriptionEn: 'PPR infection, enterotoxaemia, bloated stomach, pneumonia & flock vaccination drives.', descriptionTa: 'ஆடுகளுக்கான பி.பி.ஆர் தடுப்பூசி, வயிறு உப்பசம், சளி காய்ச்சல் மற்றும் சிகிச்சை.' },
  { id: 'poultry_health', nameEn: 'Poultry Healthcare', nameTa: 'கோழிப் பண்ணை நலம் & நோய் தடுப்பு', nameTanglish: 'Poultry Healthcare', icon: '🐓', color: '#ec4899', descriptionEn: 'Ranikhet disease vaccine, bird flu surveillance, weight gain advice & flock mortality triage.', descriptionTa: 'ராணிகெட் தடுப்பூசி, வெள்ளைக்கழிச்சல், சளி நோய் மற்றும் பண்ணை மருத்துவ வழிகாட்டல்.' },
  { id: 'animal_vaccination', nameEn: 'Animal Vaccination', nameTa: 'விலங்குகள் தடுப்பூசி முகாம்', nameTanglish: 'Animal Vaccination', icon: '💉', color: '#06b6d4', descriptionEn: 'Govt anti-rabies vaccination (ARV), anthrax, black quarter & schedule tracking.', descriptionTa: 'இலவச வெறிநாய் தடுப்பூசி, அடைப்பான் மற்றும் கால்நடை நோய் தடுப்பு ஊசிகள்.' },
  { id: 'animal_emergency', nameEn: 'Animal Injury / Emergency', nameTa: 'விலங்கு அவசர காயம் & விபத்து', nameTanglish: 'Animal Injury / Emergency', icon: '🚨', color: '#ef4444', descriptionEn: 'Road accidents, deep bleeding lacerations, fractures & poisoning emergency triage.', descriptionTa: 'விபத்தில் காயம், தீவிர ரத்தக்கசிவு, எலும்பு முறிவு மற்றும் விஷக்கடி அவசர சிகிச்சை.' },
  { id: 'vet_doctor_appt', nameEn: 'Veterinary Doctor Appointment', nameTa: 'கால்நடை மருத்துவர் நேரடி சந்திப்பு', nameTanglish: 'Veterinary Doctor Appointment', icon: '👨‍⚕️', color: '#6366f1', descriptionEn: 'Schedule direct centre visit or farm home-visit by Senior Veterinary Surgeon.', descriptionTa: 'மூத்த கால்நடை மருத்துவருடன் நேரடி ஆலோசனை அல்லது பண்ணை வருகை முன்பதிவு.' },
  { id: 'other_animal_issues', nameEn: 'Other Animal Health Issues', nameTa: 'இதர கால்நடை உடல்நலக் கோளாறுகள்', nameTanglish: 'Other Animal Health Issues', icon: '📋', color: '#64748b', descriptionEn: 'Horses, birds, small pets, behavioral issues, nutrition & post-treatment follow-up.', descriptionTa: 'குதிரை, பறவைகள், வளர்ப்பு பிராணிகள் மற்றும் பிற உடல்நலக் கோளாறுகள்.' },
];

export const VET_ANIMAL_TYPES = [
  'Cattle / Cow (பசு / மாடு)',
  'Goat / Sheep (ஆடு / செம்மறி)',
  'Dog (நாய்)',
  'Cat (பூனை)',
  'Poultry / Chicken (கோழி)',
  'Buffalo (எருமை)',
  'Horse / Pony (குதிரை)',
  'Other Pet (இதர பிராணி)',
];

// ---------------------------------------------------------------------------
// 6. COACHING / EDUCATION — SARAN COACHING CENTRE (6 Courses)
// ---------------------------------------------------------------------------
export const COACHING_COURSES: ServiceItem[] = [
  {
    id: 'course_tnpsc_grp4',
    nameEn: 'TNPSC Group 4 Comprehensive Batch',
    nameTa: 'TNPSC குரூப் 4 முழுமையான பயிற்சி',
    nameTanglish: 'TNPSC Group 4 Batch',
    category: 'tnpsc',
    descriptionEn: 'Complete General Tamil (100 Qs), General Studies & Aptitude with SAMACHEER book coverage.',
    descriptionTa: 'பொதுத்தமிழ் 100 வினாக்கள், பொது அறிவு மற்றும் கணிதம் முழுமையான பள்ளிப் பாடப்புத்தக பயிற்சி.',
    descriptionTanglish: 'Complete coaching for VAO, Junior Assistant with daily test series.',
    icon: '📖',
    price: 8500,
    duration: '5 Months',
    facilities: ['120+ Daily Unit Tests', 'Full Samacheer Book Materials', 'Offline & Online Recordings', 'Hostel Tie-up Available'],
    syllabus: ['General Tamil (பொதுத்தமிழ்)', 'Indian Polity & Constitution', 'History & TN Administration', 'Mental Ability & Aptitude', 'Current Affairs'],
    batchTimings: ['Morning: 7:00 AM - 9:30 AM', 'Evening: 6:00 PM - 8:30 PM', 'Sunday Only: 9:00 AM - 4:00 PM'],
    available: true,
  },
  {
    id: 'course_tnpsc_grp2',
    nameEn: 'TNPSC Group 2 & 2A Foundation',
    nameTa: 'TNPSC குரூப் 2 & 2A அறக்கட்டளை பயிற்சி',
    nameTanglish: 'TNPSC Group 2/2A Foundation',
    category: 'tnpsc',
    descriptionEn: 'Prelims + Mains integrated coaching: Tamil Eligibility, Social Issues & Essay Writing.',
    descriptionTa: 'முதல்நிலை மற்றும் முதன்மைத் தேர்வு ஒருங்கிணைந்த பயிற்சி, மாதிரி தேர்வுகள்.',
    descriptionTanglish: 'Prelims + Mains integrated coaching with answer writing practice.',
    icon: '🏛️',
    price: 14500,
    duration: '8 Months',
    facilities: ['Mains Answer Writing Evaluation', 'Exclusive Mentorship', 'Library Access till 10 PM', 'Printed Study Kits'],
    syllabus: ['Prelims GS & Aptitude', 'Tamil Eligibility Test', 'Mains Paper II (Socio-Economic Issues)', 'Admin Machinery of TN'],
    batchTimings: ['Regular Morning: 10:00 AM - 1:00 PM', 'Weekend Batch: Sat & Sun 10 AM - 4 PM'],
    available: true,
  },
  {
    id: 'course_ssc',
    nameEn: 'SSC Preparation (CGL & CHSL)',
    nameTa: 'SSC தேர்வுகள் பயிற்சி (CGL & CHSL)',
    nameTanglish: 'SSC Preparation (CGL/CHSL)',
    category: 'ssc',
    descriptionEn: 'Advanced Quantitative Aptitude tricks, English Comprehension, Reasoning & Static GK.',
    descriptionTa: 'கணித எளிய முறைகள், ஆங்கிலப் புலமை, பகுத்தறிவு மற்றும் பொது அறிவு பயிற்சி.',
    descriptionTanglish: 'Fast math calculation techniques and English mastery for Central Govt jobs.',
    icon: '🎯',
    price: 11000,
    duration: '6 Months',
    facilities: ['Computer Lab for Online Mock Tests', 'Speed Math Workshops', 'Previous 10 Year Paper Solved'],
    syllabus: ['Quantitative Aptitude (Adv + Arith)', 'English Language & Comprehension', 'General Intelligence & Reasoning', 'General Awareness'],
    batchTimings: ['Morning: 7:30 AM - 10:00 AM', 'Evening: 5:30 PM - 8:00 PM'],
    available: true,
  },
  {
    id: 'course_banking',
    nameEn: 'Banking Exams (IBPS / SBI PO & Clerk)',
    nameTa: 'வங்கித் தேர்வுகள் பயிற்சி (IBPS / SBI)',
    nameTanglish: 'Banking Exams (IBPS/SBI)',
    category: 'banking',
    descriptionEn: 'Data Interpretation, High-level Puzzles, Financial Awareness & Sectional Time Speed drills.',
    descriptionTa: 'தரவு விளக்கம், உயர்நிலை புதிர்கள், வங்கி விழிப்புணர்வு மற்றும் நேர மேலாண்மை பயிற்சி.',
    descriptionTanglish: 'Speed puzzle drills and mock interviews by retired bank managers.',
    icon: '🏦',
    price: 12500,
    duration: '5 Months',
    facilities: ['50 Full Length Online Mocks', 'Banking Awareness Capsules', 'Mock Interview by Retired Managers'],
    syllabus: ['Data Interpretation & Analysis', 'Reasoning & Puzzles', 'English Grammar & Cloze Test', 'Banking & Financial Economy'],
    batchTimings: ['Morning: 8:00 AM - 10:30 AM', 'Evening: 6:00 PM - 8:30 PM'],
    available: true,
  },
  {
    id: 'course_railway',
    nameEn: 'Railway Exams (RRB NTPC & Group D)',
    nameTa: 'ரயில்வே தேர்வுகள் பயிற்சி (RRB NTPC)',
    nameTanglish: 'Railway Exams (RRB NTPC)',
    category: 'railway',
    descriptionEn: 'Science fundamentals, Basic Mathematics & General Awareness aligned to recent RRB CBT patterns.',
    descriptionTa: 'அறிவியல் அடிப்படைகள், கணிதம் மற்றும் பொது விழிப்புணர்வு முழு பயிற்சி.',
    descriptionTanglish: 'Comprehensive training for RRB CBT 1 and CBT 2 exams in Tamil & English.',
    icon: '🚆',
    price: 9000,
    duration: '4 Months',
    facilities: ['Science Concept Video Modules', 'Bilingual Test Papers', 'Formula Pocket Books'],
    syllabus: ['General Science (Physics/Chem/Bio)', 'Mathematics & Arithmetic', 'General Intelligence & Reasoning', 'Current Affairs'],
    batchTimings: ['Morning: 7:00 AM - 9:30 AM', 'Weekend Batch: Sat & Sun 9 AM - 3 PM'],
    available: true,
  },
  {
    id: 'course_spoken_english',
    nameEn: 'Spoken English & Communication Skills',
    nameTa: 'ஆங்கிலப் பேச்சு & தகவல் தொடர்பு பயிற்சி',
    nameTanglish: 'Spoken English & Communication',
    category: 'spoken_english',
    descriptionEn: 'Overcome hesitation, master daily conversational fluency, professional presentation & interview skills.',
    descriptionTa: 'தயக்கமின்றி சரளமாக ஆங்கிலம் பேசவும், நேர்காணல் எதிர்கொள்ளவும் நடைமுறைப் பயிற்சி.',
    descriptionTanglish: 'Practical daily speaking practice from Tamil to fluent English in 60 days.',
    icon: '🗣️',
    price: 4500,
    duration: '2 Months (60 Days)',
    facilities: ['1-on-1 Speaking Practice', 'Pronunciation & Accent Training', 'Job Interview Simulation'],
    syllabus: ['Daily Conversation Phrases', 'Tenses Made Simple', 'Public Speaking & GD Practice', 'Email Writing & Corporate Etiquette'],
    batchTimings: ['Early Morning: 6:30 AM - 7:45 AM', 'Evening: 7:00 PM - 8:15 PM'],
    available: true,
  },
];

