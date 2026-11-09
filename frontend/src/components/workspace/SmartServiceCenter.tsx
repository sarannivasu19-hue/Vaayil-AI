import React, { useState, useEffect, useMemo } from 'react';
import type { SectorDetail, Booking } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { normalizeSpokenPhone } from '../../utils/phoneNormalizer';
import { audioController } from '../../utils/audioPlaybackController';
import {
  PANCHAYAT_CATEGORIES,
  PANCHAYAT_SERVICES,
  CLINIC_CATEGORIES,
  CLINIC_DOCTORS,
  RESTAURANT_CATEGORIES,
  RESTAURANT_MENU_ITEMS,
  HOTEL_ROOM_TYPES,
  VET_CATEGORIES,
  VET_ANIMAL_TYPES,
  COACHING_COURSES,
  type ServiceCategoryDef,
  type ServiceItem,
} from '../../data/smartServiceMenus';
import {
  Sparkles,
  Search,
  Mic,
  MicOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ShoppingBag,
  Plus,
  Minus,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface SmartServiceCenterProps {
  sectorDetail: SectorDetail;
  onNavigateTab?: (tab: string) => void;
}

type CenterMode = 'menu' | 'workflow' | 'confirmed' | 'tracking';

export const SmartServiceCenter: React.FC<SmartServiceCenterProps> = ({
  sectorDetail,
  onNavigateTab,
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const sectorId = sectorDetail.id;

  // View state
  const [mode, setMode] = useState<CenterMode>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Selected Service / Item
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
  const [selectedItemObj, setSelectedItemObj] = useState<any>(null);

  // Restaurant Cart
  const [cart, setCart] = useState<Record<string, number>>({});

  // Workflow Form Fields
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({
    customer_name: '',
    phone: '',
    email: '',
    urgency: 'Normal',
  });

  // Voice Interaction State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Audio Playback via Centralized Controller
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Tracking view
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedBookings, setTrackedBookings] = useState<Booking[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Accent color from sector
  const accent = sectorDetail.accent_color || '#38BDF8';

  // -------------------------------------------------------------------------
  // 1. DATA SOURCES ACCORDING TO SECTOR
  // -------------------------------------------------------------------------
  const isPanchayat = sectorId === 'panchayat_health';
  const isClinic = sectorId === 'clinic';
  const isRestaurant = sectorId === 'restaurant';
  const isHotel = sectorId === 'hotel_lodge';
  const isVet = sectorId === 'vet_clinic';
  const isCoaching = sectorId === 'coaching';

  // Categories list
  const categoryList: ServiceCategoryDef[] = useMemo(() => {
    if (isPanchayat) return PANCHAYAT_CATEGORIES;
    if (isClinic) return CLINIC_CATEGORIES;
    if (isRestaurant) return RESTAURANT_CATEGORIES;
    if (isVet) return VET_CATEGORIES;
    return [];
  }, [isPanchayat, isClinic, isRestaurant, isVet]);

  // Items list (for restaurant, hotel, coaching)
  const itemsList: ServiceItem[] = useMemo(() => {
    if (isRestaurant) return RESTAURANT_MENU_ITEMS;
    if (isHotel) return HOTEL_ROOM_TYPES;
    if (isCoaching) return COACHING_COURSES;
    return [];
  }, [isRestaurant, isHotel, isCoaching]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (isRestaurant || isHotel || isCoaching) {
      return itemsList.filter((item) => {
        const matchesCategory =
          selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
        const matchesSearch =
          !q ||
          item.nameEn.toLowerCase().includes(q) ||
          item.nameTa.includes(q) ||
          item.descriptionEn.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      });
    }
    return [];
  }, [itemsList, selectedCategoryFilter, searchQuery, isRestaurant, isHotel, isCoaching]);

  // Filtered categories (for Panchayat, Clinic, Vet)
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categoryList;
    return categoryList.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameTa.includes(q) ||
        c.descriptionEn.toLowerCase().includes(q)
    );
  }, [categoryList, searchQuery]);

  // -------------------------------------------------------------------------
  // 2. RESTAURANT CART ACTIONS
  // -------------------------------------------------------------------------
  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[itemId] > 1) {
        copy[itemId] -= 1;
      } else {
        delete copy[itemId];
      }
      return copy;
    });
  };

  const cartTotalAmount = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = RESTAURANT_MENU_ITEMS.find((m) => m.id === id);
      return sum + (item?.price || 0) * qty;
    }, 0);
  }, [cart]);

  const cartTotalCount = useMemo(() => {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }, [cart]);

  // -------------------------------------------------------------------------
  // 3. STEP CONFIGURATIONS PER SECTOR
  // -------------------------------------------------------------------------
  interface StepDef {
    field: string;
    labelEn: string;
    labelTa: string;
    promptEn: string;
    promptTa: string;
    type: 'text' | 'phone' | 'date' | 'time' | 'select' | 'textarea';
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }

  const stepsForSector: StepDef[] = useMemo(() => {
    if (isPanchayat) {
      const subOptions = PANCHAYAT_SERVICES[selectedCategory] || [
        'Damaged roads (சேதமடைந்த சாலை)',
        'Drinking water problem (குடிநீர் பிரச்சனை)',
        'Garbage collection (குப்பை சேகரிப்பு)',
        'Streetlight issue (தெருவிளக்கு பிரச்சனை)',
      ];
      return [
        {
          field: 'sub_problem',
          labelEn: 'Specific Problem Type',
          labelTa: 'குறிப்பிட்ட பிரச்சனை வகை',
          promptEn: 'Please select the exact problem you want to report.',
          promptTa: 'நீங்கள் தெரிவிக்க விரும்பும் குறிப்பிட்ட பிரச்சனையை தேர்ந்தெடுக்கவும்.',
          type: 'select',
          options: subOptions,
          required: true,
        },
        {
          field: 'customer_name',
          labelEn: 'Complainant Full Name',
          labelTa: 'புகார்தாரர் முழுப் பெயர்',
          promptEn: 'What is your full name?',
          promptTa: 'உங்கள் முழுப் பெயரை கூறுங்கள் அல்லது தட்டச்சு செய்யுங்கள்?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit contact mobile number?',
          promptTa: 'உங்களை தொடர்பு கொள்ள 10 இலக்க அலைபேசி எண்ணை கூறுங்கள்?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'email',
          labelEn: 'Email Address (Optional)',
          labelTa: 'மின்னஞ்சல் முகவரி (விருப்பத்தேர்வு)',
          promptEn: 'What is your email address, if available?',
          promptTa: 'மின்னஞ்சல் முகவரி இருந்தால் குறிப்பிடவும் (கட்டாயமில்லை)?',
          type: 'text',
          placeholder: 'name@example.com',
        },
        {
          field: 'district',
          labelEn: 'District',
          labelTa: 'மாவட்டம்',
          promptEn: 'Which district are you reporting from in Tamil Nadu?',
          promptTa: 'தமிழ்நாட்டில் உங்கள் மாவட்டம் எது?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Madurai',
        },
        {
          field: 'village_ward',
          labelEn: 'Panchayat / Ward / Village',
          labelTa: 'ஊராட்சி / வார்டு / கிராமம்',
          promptEn: 'What is your Panchayat, Village, or Ward number?',
          promptTa: 'உங்கள் ஊராட்சி, கிராமம் அல்லது வார்டு எண் என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Melur Panchayat, Ward 4',
        },
        {
          field: 'street',
          labelEn: 'Street & House Details',
          labelTa: 'தெரு பெயர் & இருப்பிட விவரம்',
          promptEn: 'What is the street name or specific location?',
          promptTa: 'பிரச்சனை உள்ள தெருவின் பெயர் அல்லது இருப்பிடத்தைக் கூறுங்கள்?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Anna Nagar 2nd Street',
        },
        {
          field: 'landmark',
          labelEn: 'Nearby Landmark',
          labelTa: 'அருகிலுள்ள அடையாளம் (லேண்ட்மார்க்)',
          promptEn: 'What is a recognizable nearby landmark?',
          promptTa: 'அருகிலுள்ள புகழ்பெற்ற இடம் அல்லது அடையாளம் என்ன?',
          type: 'text',
          placeholder: 'e.g. Near Pillayar Kovil / Primary School',
        },
        {
          field: 'description',
          labelEn: 'Detailed Problem Description',
          labelTa: 'பிரச்சனை பற்றிய விரிவான விவரம்',
          promptEn: 'Please describe the issue in detail. You can speak or type.',
          promptTa: 'பிரச்சனை பற்றிய விரிவான விவரங்களை கூறுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.',
          type: 'textarea',
          required: true,
          placeholder: 'Describe what happened and how long this issue has persisted...',
        },
        {
          field: 'urgency',
          labelEn: 'Urgency Priority',
          labelTa: 'அவசர நிலைத் தன்மை',
          promptEn: 'What is the urgency level of this request?',
          promptTa: 'இந்த கோரிக்கையின் அவசர நிலை என்ன?',
          type: 'select',
          options: ['Normal (சாதாரண)', 'High (முக்கியமானது)', 'Emergency (அவசரம்)'],
          required: true,
        },
      ];
    }

    if (isClinic) {
      return [
        {
          field: 'customer_name',
          labelEn: 'Patient Full Name',
          labelTa: 'நோயாளி முழுப் பெயர்',
          promptEn: 'What is the patient full name?',
          promptTa: 'நோயாளியின் முழுப் பெயரை கூறுங்கள்?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'age',
          labelEn: 'Patient Age',
          labelTa: 'நோயாளியின் வயது',
          promptEn: 'What is the patient age?',
          promptTa: 'நோயாளியின் வயது என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. 28',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit mobile number for appointment SMS?',
          promptTa: 'முன்பதிவு குறுஞ்செய்தி பெற உங்கள் 10 இலக்க அலைபேசி எண் என்ன?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'consultation_type',
          labelEn: 'Consultation Mode',
          labelTa: 'ஆலோசனை முறை',
          promptEn: 'Do you prefer an in-person clinic visit or online consultation?',
          promptTa: 'நேரடி கிளினிக் வருகையா அல்லது இணைய வழியிலான ஆலோசனையா?',
          type: 'select',
          options: ['In-person Clinic Visit (நேரடி வருகை)', 'Online Video Consultation (ஆன்லைன் ஆலோசனை)'],
          required: true,
        },
        {
          field: 'main_concern',
          labelEn: 'Main Health Concern / Symptoms',
          labelTa: 'முக்கிய உடல்நலக் கோளாறு / அறிகுறிகள்',
          promptEn: 'Please describe the symptoms or main health complaint.',
          promptTa: 'உடல்நலக் கோளாறு அல்லது அறிகுறிகளை விளக்குங்கள்?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. High fever with throat congestion for past 2 days...',
        },
        {
          field: 'preferred_doctor',
          labelEn: 'Preferred Doctor',
          labelTa: 'விருப்பமான மருத்துவர்',
          promptEn: 'Do you have a preferred doctor at Saran Clinic?',
          promptTa: 'சரண் கிளினிக்கில் நீங்கள் சந்திக்க விரும்பும் மருத்துவர் யார்?',
          type: 'select',
          options: CLINIC_DOCTORS.map((d) => d.name),
          required: true,
        },
        {
          field: 'appointment_date',
          labelEn: 'Preferred Appointment Date',
          labelTa: 'முன்பதிவு தேதி',
          promptEn: 'Which date would you like to visit?',
          promptTa: 'எந்த தேதியில் மருத்துவரை சந்திக்க விரும்புகிறீர்கள்?',
          type: 'date',
          required: true,
        },
        {
          field: 'appointment_time',
          labelEn: 'Preferred Time Slot',
          labelTa: 'விருப்பமான நேரம்',
          promptEn: 'What time of day is convenient for you?',
          promptTa: 'எந்த நேரம் உங்களுக்கு வசதியானது?',
          type: 'select',
          options: [
            '10:00 AM - 11:00 AM',
            '11:00 AM - 12:00 PM',
            '12:00 PM - 01:00 PM',
            '05:00 PM - 06:00 PM',
            '06:00 PM - 07:00 PM',
            '07:00 PM - 08:30 PM',
          ],
          required: true,
        },
      ];
    }

    if (isRestaurant) {
      return [
        {
          field: 'order_type',
          labelEn: 'Order Type',
          labelTa: 'ஆர்டர் வகை',
          promptEn: 'How would you like to receive your food?',
          promptTa: 'உணவை எவ்வாறு பெற விரும்புகிறீர்கள்?',
          type: 'select',
          options: ['Takeaway / Parcel (பார்சல்)', 'Dine-in Reservation (உணவகத்தில் அமர்ந்து உண்ணல்)', 'Home Delivery (வீட்டு விநியோகம்)'],
          required: true,
        },
        {
          field: 'pickup_time',
          labelEn: 'Preferred Time',
          labelTa: 'விருப்பமான நேரம்',
          promptEn: 'At what time would you like your food ready or delivered?',
          promptTa: 'உணவு எந்த நேரத்தில் தயாராக அல்லது விநியோகிக்கப்பட வேண்டும்?',
          type: 'select',
          options: [
            '08:30 AM (Breakfast)',
            '09:30 AM (Breakfast)',
            '12:30 PM (Lunch)',
            '01:30 PM (Lunch)',
            '05:00 PM (Snacks & Tea)',
            '07:30 PM (Dinner)',
            '08:30 PM (Dinner)',
            '09:30 PM (Dinner)',
          ],
          required: true,
        },
        {
          field: 'customer_name',
          labelEn: 'Customer Name',
          labelTa: 'வாடிக்கையாளர் பெயர்',
          promptEn: 'What is your name for this food order?',
          promptTa: 'இந்த உணவு ஆர்டருக்கு உங்கள் பெயர் என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit mobile number for order confirmation?',
          promptTa: 'ஆர்டர் உறுதிப்படுத்தலுக்கு உங்கள் 10 இலக்க அலைபேசி எண் என்ன?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'delivery_address',
          labelEn: 'Delivery Address / Table Notes',
          labelTa: 'விநியோக முகவரி அல்லது சிறப்பு குறிப்புகள்',
          promptEn: 'Please enter delivery address or dining request.',
          promptTa: 'விநியோக முகவரி அல்லது கூடுதல் குறிப்புகளை குறிப்பிடுங்கள்.',
          type: 'textarea',
          placeholder: 'House number, street name, or dining notes...',
        },
      ];
    }

    if (isHotel) {
      return [
        {
          field: 'checkin_date',
          labelEn: 'Check-in Date',
          labelTa: 'அறைக்கு வரும் தேதி (செக்-இன்)',
          promptEn: 'What is your check-in date?',
          promptTa: 'நீங்கள் அறைக்கு வரும் தேதி என்ன?',
          type: 'date',
          required: true,
        },
        {
          field: 'checkout_date',
          labelEn: 'Check-out Date',
          labelTa: 'வெளியேறும் தேதி (செக்-அவுட்)',
          promptEn: 'What is your check-out date?',
          promptTa: 'நீங்கள் அறையை காலி செய்து வெளியேறும் தேதி என்ன?',
          type: 'date',
          required: true,
        },
        {
          field: 'num_guests',
          labelEn: 'Number of Guests',
          labelTa: 'விருந்தினர்களின் எண்ணிக்கை',
          promptEn: 'How many guests will be staying?',
          promptTa: 'எத்தனை விருந்தினர்கள் தங்க உள்ளனர்?',
          type: 'select',
          options: ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '5+ Guests'],
          required: true,
        },
        {
          field: 'num_rooms',
          labelEn: 'Number of Rooms',
          labelTa: 'தேவைப்படும் அறைகளின் எண்ணிக்கை',
          promptEn: 'How many rooms do you require?',
          promptTa: 'எத்தனை அறைகள் முன்பதிவு செய்ய வேண்டும்?',
          type: 'select',
          options: ['1 Room', '2 Rooms', '3 Rooms', '4+ Rooms'],
          required: true,
        },
        {
          field: 'customer_name',
          labelEn: 'Lead Guest Full Name',
          labelTa: 'முதன்மை விருந்தினர் பெயர்',
          promptEn: 'What is the full name of the primary guest?',
          promptTa: 'முதன்மை விருந்தினரின் முழுப் பெயர் என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit mobile number?',
          promptTa: 'உங்கள் 10 இலக்க அலைபேசி எண் என்ன?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'email',
          labelEn: 'Email for Booking Confirmation',
          labelTa: 'மின்னஞ்சல் முகவரி',
          promptEn: 'What is your email address for hotel voucher receipt?',
          promptTa: 'முன்பதிவு ரசீது பெற மின்னஞ்சல் முகவரி என்ன?',
          type: 'text',
          placeholder: 'name@example.com',
        },
        {
          field: 'special_requests',
          labelEn: 'Special Requests / Extra Bed',
          labelTa: 'கூடுதல் தேவைகள் / சிறப்பு கோரிக்கைகள்',
          promptEn: 'Any special requests such as extra bed, late check-in, or ground floor?',
          promptTa: 'கூடுதல் படுக்கை அல்லது பிற சிறப்புத் தேவைகள் ஏதேனும் உள்ளதா?',
          type: 'textarea',
          placeholder: 'e.g. Late check-in around 10 PM, ground floor room preferred...',
        },
      ];
    }

    if (isVet) {
      return [
        {
          field: 'customer_name',
          labelEn: 'Animal Owner Name',
          labelTa: 'உரிமையாளர் பெயர்',
          promptEn: 'What is your full name as the animal owner or farmer?',
          promptTa: 'கால்நடை உரிமையாளரின் முழுப் பெயர் என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit mobile number?',
          promptTa: 'உங்களை தொடர்பு கொள்ள 10 இலக்க அலைபேசி எண் என்ன?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'animal_type',
          labelEn: 'Animal Species / Type',
          labelTa: 'விலங்கு இனம் / வகை',
          promptEn: 'What type of animal requires veterinary care?',
          promptTa: 'சிகிச்சை தேவைப்படும் விலங்கின் இனம் எது?',
          type: 'select',
          options: VET_ANIMAL_TYPES,
          required: true,
        },
        {
          field: 'animal_name',
          labelEn: 'Animal Name / Tag Number',
          labelTa: 'விலங்கின் பெயர் அல்லது குறி எண்',
          promptEn: 'Does the animal have a name or government ear tag number?',
          promptTa: 'விலங்கின் பெயர் அல்லது காது அடையாள எண் ஏதேனும் உள்ளதா?',
          type: 'text',
          placeholder: 'e.g. Lakshmi / Tag #402',
        },
        {
          field: 'animal_age',
          labelEn: 'Animal Age',
          labelTa: 'விலங்கின் வயது',
          promptEn: 'What is the approximate age of the animal?',
          promptTa: 'அந்த விலங்கின் தோராயமான வயது என்ன?',
          type: 'text',
          placeholder: 'e.g. 3 years / 6 months',
        },
        {
          field: 'symptoms',
          labelEn: 'Observed Symptoms / Complaint',
          labelTa: 'அறிகுறிகள் & உடல்நலக் கோளாறு',
          promptEn: 'Please describe what symptoms or sickness you observed.',
          promptTa: 'விலங்கிற்கு என்ன பிரச்சனை அல்லது அறிகுறிகள் தென்படுகின்றன?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. Reduced milk yield, shivering, loss of appetite...',
        },
        {
          field: 'duration',
          labelEn: 'How Long Has the Animal Had This Issue?',
          labelTa: 'எத்தனை நாட்களாக இந்த பிரச்சனை உள்ளது?',
          promptEn: 'How many days has the animal shown these symptoms?',
          promptTa: 'இந்த அறிகுறிகள் எத்தனை நாட்களாக உள்ளன?',
          type: 'select',
          options: ['Since today (இன்று முதல்)', '2-3 Days (2-3 நாட்கள்)', 'Past 1 Week (1 வாரமாக)', 'More than a week (நீண்ட நாட்களாக)'],
          required: true,
        },
        {
          field: 'appointment_date',
          labelEn: 'Preferred Consultation Date',
          labelTa: 'மருத்துவ ஆலோசனை தேதி',
          promptEn: 'Which date would you like to bring the animal or request visit?',
          promptTa: 'எந்த தேதியில் மருத்துவ மையம் வர அல்லது மருத்துவர் வருகை விரும்புகிறீர்கள்?',
          type: 'date',
          required: true,
        },
        {
          field: 'appointment_time',
          labelEn: 'Preferred Time Slot',
          labelTa: 'விருப்பமான நேரம்',
          promptEn: 'What time is convenient?',
          promptTa: 'எந்த நேரம் வசதியானது?',
          type: 'select',
          options: [
            '08:30 AM - 10:00 AM (Morning)',
            '10:00 AM - 12:00 PM (Mid-day)',
            '03:00 PM - 05:00 PM (Afternoon)',
          ],
          required: true,
        },
      ];
    }

    if (isCoaching) {
      return [
        {
          field: 'customer_name',
          labelEn: 'Student Full Name',
          labelTa: 'மாணவர் முழுப் பெயர்',
          promptEn: 'What is the student full name?',
          promptTa: 'பயிற்சியில் சேரும் மாணவரின் முழுப் பெயர் என்ன?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Saran Nivasu',
        },
        {
          field: 'phone',
          labelEn: 'Contact Mobile Number',
          labelTa: 'தொடர்பு அலைபேசி எண்',
          promptEn: 'What is your 10-digit mobile number for class updates?',
          promptTa: 'வகுப்பு தகவல்களை பெற 10 இலக்க அலைபேசி எண் என்ன?',
          type: 'phone',
          required: true,
          placeholder: 'e.g. 9345000025',
        },
        {
          field: 'email',
          labelEn: 'Email Address',
          labelTa: 'மின்னஞ்சல் முகவரி',
          promptEn: 'What is your email address for study materials and syllabus?',
          promptTa: 'பாடப் புத்தகங்கள் மற்றும் தேர்வு அட்டவணை பெற மின்னஞ்சல் முகவரி என்ன?',
          type: 'text',
          placeholder: 'student@example.com',
        },
        {
          field: 'qualification',
          labelEn: 'Educational Qualification',
          labelTa: 'கல்வித் தகுதி',
          promptEn: 'What is your highest educational qualification?',
          promptTa: 'உங்கள் தற்போதைய கல்வித் தகுதி என்ன?',
          type: 'select',
          options: ['10th Standard / SSLC', '12th Standard / HSC', 'Any Bachelor Degree (BA / B.Sc / B.Com / B.E)', 'Post Graduate / Master Degree', 'Final Year College Student'],
          required: true,
        },
        {
          field: 'preferred_batch',
          labelEn: 'Preferred Batch',
          labelTa: 'விருப்பமான வகுப்பு தொகுதி',
          promptEn: 'Which batch timing suits your daily schedule?',
          promptTa: 'எந்த நேர தொகுதி உங்களுக்கு வசதியானது?',
          type: 'select',
          options: selectedItemObj?.batchTimings || [
            'Morning: 7:00 AM - 9:30 AM',
            'Evening: 6:00 PM - 8:30 PM',
            'Weekend Batch: Sat & Sun',
          ],
          required: true,
        },
        {
          field: 'learning_mode',
          labelEn: 'Learning Mode',
          labelTa: 'கற்றல் முறை',
          promptEn: 'Do you prefer classroom offline learning or live online classes?',
          promptTa: 'நேரடி வகுப்பறை பயிற்சியா அல்லது ஆன்லைன் வகுப்பா?',
          type: 'select',
          options: ['Classroom Offline (நேரடி வகுப்பறை)', 'Live Online Classes (நேரலை ஆன்லைன்)', 'Hybrid Both Modes (இரண்டும்)'],
          required: true,
        },
        {
          field: 'needs_books',
          labelEn: 'Samacheer Books & Study Materials Kit',
          labelTa: 'பாடப் புத்தகங்கள் மற்றும் குறிப்பேடுகள் தேவைப்படுகிறதா?',
          promptEn: 'Do you need the complete printed books and test series kit?',
          promptTa: 'அச்சிடப்பட்ட முழு பாடப் புத்தகங்கள் மற்றும் மாதிரி தேர்வுத் தொகுப்பு தேவையா?',
          type: 'select',
          options: ['Yes, include full printed study materials kit', 'No, digital materials are sufficient'],
          required: true,
        },
      ];
    }

    return [];
  }, [isPanchayat, isClinic, isRestaurant, isHotel, isVet, isCoaching, selectedCategory, selectedItemObj]);

  const currentStep = stepsForSector[stepIndex];
  const isLastStep = stepIndex === stepsForSector.length - 1;

  // -------------------------------------------------------------------------
  // 4. STARTING A GUIDED WORKFLOW
  // -------------------------------------------------------------------------
  const startServiceWorkflow = (categoryOrItem: any, isItem: boolean = false) => {
    if (isItem) {
      setSelectedItemObj(categoryOrItem);
      setSelectedServiceName(categoryOrItem.nameEn);
      setSelectedCategory(categoryOrItem.category || 'general');
    } else {
      setSelectedCategory(categoryOrItem.id);
      setSelectedServiceName(categoryOrItem.nameEn);
      setSelectedItemObj(null);
    }
    setStepIndex(0);
    setVoiceTranscript('');
    setMode('workflow');
    window.history.pushState({ inWorkflow: true, step: 0 }, '', window.location.hash);
  };

  const startRestaurantCheckout = () => {
    if (cartTotalCount === 0) {
      toast({ type: 'error', message: 'Please add at least one dish to proceed.' });
      return;
    }
    const cartSummary = Object.entries(cart)
      .map(([id, qty]) => {
        const item = RESTAURANT_MENU_ITEMS.find((m) => m.id === id);
        return `${item?.nameEn} x${qty}`;
      })
      .join(', ');
    setSelectedServiceName(`Food Order: ${cartSummary}`);
    setSelectedCategory('lunch');
    setStepIndex(0);
    setMode('workflow');
    window.history.pushState({ inWorkflow: true, step: 0 }, '', window.location.hash);
  };

  // -------------------------------------------------------------------------
  // 5. STEP NAVIGATION & DATA CAPTURE (PRESERVES ENTERED FORM DATA)
  // -------------------------------------------------------------------------
  const handleNextStep = () => {
    if (!currentStep) return;

    const val = formData[currentStep.field];
    if (currentStep.required && (!val || String(val).trim() === '')) {
      toast({
        type: 'error',
        message: `Please answer "${language === 'tamil' ? currentStep.labelTa : currentStep.labelEn}" to continue.`,
      });
      return;
    }

    // Phone validation
    if (currentStep.field === 'phone') {
      const analysis = normalizeSpokenPhone(String(val || ''), language);
      if (!analysis.isValid || !analysis.phone) {
        toast({
          type: 'error',
          message: analysis.message || 'Please provide a valid 10-digit mobile number.',
        });
        return;
      }
      handleFieldChange('phone', analysis.phone);
    }

    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      setVoiceTranscript('');
      window.history.pushState({ inWorkflow: true, step: stepIndex + 1 }, '', window.location.hash);
    }
  };

  const handlePrevStep = () => {
    if (window.history.state?.inWorkflow) {
      window.history.back();
    } else {
      if (stepIndex > 0) {
        setStepIndex((i) => i - 1);
        setVoiceTranscript('');
      } else {
        setMode('menu');
      }
    }
  };

  // Listen to popstate inside SmartServiceCenter to step backward gracefully
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      audioController.stop();
      const s = e.state;
      if (s && s.inWorkflow) {
        setMode('workflow');
        setStepIndex(typeof s.step === 'number' ? s.step : 0);
        setVoiceTranscript('');
      } else {
        if (mode === 'workflow' || mode === 'tracking' || mode === 'confirmed') {
          setMode('menu');
          setStepIndex(0);
        }
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [mode]);

  // Synchronize with centralized audio controller and clean up on unmount
  useEffect(() => {
    const unsubscribe = audioController.subscribe((playing, loading) => {
      setIsPlayingAudio(playing);
      setIsAudioLoading(loading);
    });
    return () => {
      unsubscribe();
      audioController.stop();
    };
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // -------------------------------------------------------------------------
  // 6. UNIVERSAL VOICE ASSISTANT (STT)
  // -------------------------------------------------------------------------
  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    // Stop any ongoing voice playback before starting speech recognition
    audioController.stop();

    // Browser SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        type: 'info',
        message: 'Web Speech API not supported in this browser. Please type your response.',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'tamil' ? 'ta-IN' : language === 'english' ? 'en-IN' : 'ta-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        if (currentStep) {
          if (currentStep.field === 'phone') {
            const analysis = normalizeSpokenPhone(transcript, language);
            if (analysis.phone) {
              handleFieldChange('phone', analysis.phone);
            } else {
              handleFieldChange('phone', transcript);
            }
          } else {
            handleFieldChange(currentStep.field, transcript);
          }
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
      setIsListening(false);
    }
  };

  // -------------------------------------------------------------------------
  // 7. FINAL SUBMISSION (PERSISTENCE + VOICE READOUT)
  // -------------------------------------------------------------------------
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    const customerName = formData.customer_name || 'Valued Citizen';

    // Validate and normalize phone number
    const phoneAnalysis = normalizeSpokenPhone(formData.phone || '', language);
    if (!phoneAnalysis.isValid || !phoneAnalysis.phone) {
      toast({
        type: 'error',
        message: phoneAnalysis.message || 'Valid 10-digit mobile number starting with 6-9 is required.',
      });
      return;
    }
    const phone = phoneAnalysis.phone;

    // Detailed payload preparation
    const fullDetails: Record<string, any> = { ...formData };

    if (isRestaurant) {
      fullDetails.items = Object.entries(cart).map(([id, qty]) => {
        const item = RESTAURANT_MENU_ITEMS.find((m) => m.id === id);
        return { id, name: item?.nameEn, qty, price: item?.price };
      });
      fullDetails.total_amount = cartTotalAmount + (formData.order_type?.includes('Delivery') ? 40 : 0);
    }

    if (isHotel && selectedItemObj) {
      fullDetails.room_type = selectedItemObj.nameEn;
      fullDetails.price_per_night = selectedItemObj.price;
      const nights = 2; // Default estimate or date diff
      fullDetails.total_amount = selectedItemObj.price * nights;
    }

    if (isCoaching && selectedItemObj) {
      fullDetails.course_name = selectedItemObj.nameEn;
      fullDetails.fees = selectedItemObj.price;
      fullDetails.duration = selectedItemObj.duration;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitSmartService({
        sector_id: sectorId,
        service_category: selectedCategory || 'general',
        service_name: selectedServiceName || 'General Request',
        customer_name: customerName,
        phone: phone,
        email: formData.email,
        details: fullDetails,
        notes: `Submitted via Smart Service Center [Lang:${language}]`,
        submission_mode: voiceTranscript ? 'hybrid' : 'manual',
        language: language,
        client_token: `${sectorId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });

      setSubmissionResult(res);
      setMode('confirmed');
      toast({
        type: 'success',
        message: `Request Registered! Reference ID: ${res.reference_number}`,
      });

      // AI Voice confirmation playback using single-source Gnani Timbre
      playVoiceConfirmation(res.confirmation_speech_text);
    } catch (err: any) {
      console.error('Submission error:', err);
      toast({
        type: 'error',
        message: err.message || 'Could not save your request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // 8. VOICE CONFIRMATION SYNTHESIS & PLAYBACK (Centralized Audio Controller)
  // -------------------------------------------------------------------------
  const playVoiceConfirmation = async (speechText: string) => {
    if (!speechText) return;

    // Toggle stop if already playing or loading
    if (audioController.isBusy) {
      audioController.stop();
      return;
    }

    const timbreLang = language === 'english' ? 'en-IN' : 'ta-IN';
    await audioController.playConfirmation(
      () => api.speakText(speechText, timbreLang, 'Shivani'),
      {
        langCode: timbreLang,
        voice: 'Shivani',
        onError: (err) => {
          console.warn('[SmartService] Confirmation playback notice:', err);
          // Per requirements: Display confirmation on screen and allow manual replay.
          // Do NOT start browser speech synthesis or secondary voice engine.
        },
      }
    );
  };

  // -------------------------------------------------------------------------
  // 9. REQUEST TRACKING
  // -------------------------------------------------------------------------
  const handleTrackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackQuery.trim()) return;

    setIsTrackingLoading(true);
    try {
      const records = await api.trackBookings(trackQuery, sectorId);
      setTrackedBookings(records);
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Tracking failed' });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-12">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-white/10 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3.5 z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0"
            style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${accent}25`, color: accent }}>
                {sectorDetail.name}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Official Service Portal</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              {t('smart_service.title')}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              {t('smart_service.subtitle')}
            </p>
          </div>
        </div>

        {/* Actions & Tab switch: Dashboard Return / Catalog vs Tracking */}
        <div className="flex flex-wrap items-center gap-2 z-10 self-start md:self-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer mr-1 active:scale-95"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </button>
          )}
          <button
            onClick={() => { setMode('menu'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
              mode !== 'tracking'
                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {t('smart_service.catalog_tab')}
          </button>
          <button
            onClick={() => { setMode('tracking'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
              mode === 'tracking'
                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {t('smart_service.tracking_tab')}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW A: TRACKING PORTAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === 'tracking' && (
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-6">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <h2 className="text-lg font-bold text-white">Track Your Request or Booking</h2>
            <p className="text-xs text-slate-400">
              Enter your reference number (e.g. VYL-PAN-2026-0001) or 10-digit mobile number to view live status.
            </p>
            <form onSubmit={handleTrackSubmit} className="flex items-center gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Reference Number or Mobile..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                disabled={isTrackingLoading || !trackQuery.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer disabled:opacity-50"
              >
                {isTrackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>
          </div>

          {/* Results table */}
          {trackedBookings.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-300 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3">Reference No.</th>
                    <th className="p-3">Citizen / Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {trackedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{b.reference_number}</td>
                      <td className="p-3">{b.customer_name}</td>
                      <td className="p-3">{b.phone}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {trackedBookings.length === 0 && trackQuery.trim() && !isTrackingLoading && (
            <p className="text-center text-xs text-slate-500 py-6">
              No matching records found for "{trackQuery}". Check your reference ID and try again.
            </p>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW B: SERVICE MENU / CATALOG BROWSING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === 'menu' && (
        <div className="space-y-6">
          {/* Search bar & Category filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('smart_service.search_placeholder')}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick stats / cart badge for restaurant */}
            {isRestaurant && cartTotalCount > 0 && (
              <button
                onClick={startRestaurantCheckout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 cursor-pointer shadow-lg animate-bounce"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{cartTotalCount} Items in Cart (₹{cartTotalAmount}) · Checkout</span>
              </button>
            )}
          </div>

          {/* 1. PANCHAYAT 10 CATEGORIES GRID */}
          {isPanchayat && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => startServiceWorkflow(cat)}
                  className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">{cat.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-400/10">
                        Panchayat Service
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {language === 'tamil' ? cat.nameTa : cat.nameEn}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {language === 'tamil' ? cat.descriptionTa : cat.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-cyan-400 pt-3 border-t border-white/5 font-semibold">
                    <span>Register Complaint / Request</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. CLINIC 10 CATEGORIES GRID */}
          {isClinic && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => startServiceWorkflow(cat)}
                  className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">{cat.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-400/10">
                        Saran Clinic
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {language === 'tamil' ? cat.nameTa : cat.nameEn}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {language === 'tamil' ? cat.descriptionTa : cat.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-cyan-400 pt-3 border-t border-white/5 font-semibold">
                    <span>Book Consultation Slot</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. RESTAURANT DIGITAL MENU */}
          {isRestaurant && (
            <div className="space-y-6">
              {/* Category selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  All Dishes
                </button>
                {RESTAURANT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all flex items-center gap-1.5 ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{language === 'tamil' ? cat.nameTa : cat.nameEn}</span>
                  </button>
                ))}
              </div>

              {/* Menu items grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                                item.isVeg ? 'border-emerald-500' : 'border-red-500'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                            </span>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {language === 'tamil' ? item.nameTa : item.nameEn}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.descriptionEn}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-base font-extrabold text-amber-400 font-mono">
                          ₹{item.price}
                        </span>

                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-amber-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-white px-1 font-mono">{qty}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="text-amber-400 hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. HOTEL ROOM TYPES */}
          {isHotel && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HOTEL_ROOM_TYPES.map((room) => (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between space-y-4 hover:border-yellow-400/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2 rounded-xl bg-white/5">{room.icon}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                        Up to {room.capacity} Guests
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {language === 'tamil' ? room.nameTa : room.nameEn}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{room.descriptionEn}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {room.facilities?.map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-lg font-extrabold text-yellow-400 font-mono">₹{room.price}</span>
                      <span className="text-[10px] text-slate-400"> / night</span>
                    </div>
                    <button
                      onClick={() => startServiceWorkflow(room, true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 cursor-pointer shadow-md transition-transform active:scale-95"
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. VETERINARY 10 CATEGORIES */}
          {isVet && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => startServiceWorkflow(cat)}
                  className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-orange-400/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">{cat.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded-full bg-orange-400/10">
                        Govt Vet Centre
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                      {language === 'tamil' ? cat.nameTa : cat.nameEn}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {language === 'tamil' ? cat.descriptionTa : cat.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-orange-400 pt-3 border-t border-white/5 font-semibold">
                    <span>Schedule Animal Visit</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. COACHING 6 COURSES */}
          {isCoaching && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {COACHING_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between space-y-4 hover:border-purple-400/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2 rounded-xl bg-white/5">{course.icon}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-400/10 text-purple-400 border border-purple-400/20">
                        {course.duration}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {language === 'tamil' ? course.nameTa : course.nameEn}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{course.descriptionEn}</p>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Syllabus Highlights:</span>
                      <div className="flex flex-wrap gap-1">
                        {course.syllabus?.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-purple-200 border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-lg font-extrabold text-purple-400 font-mono">₹{course.price}</span>
                      <span className="text-[10px] text-slate-400"> Total Fee</span>
                    </div>
                    <button
                      onClick={() => startServiceWorkflow(course, true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white cursor-pointer shadow-md transition-transform active:scale-95"
                    >
                      Enquire / Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW C: GUIDED STEP-BY-STEP WORKFLOW (VOICE + TEXT) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === 'workflow' && currentStep && (
        <div className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-3xl glass-panel border border-white/15 shadow-2xl space-y-6">
          {/* Header & Progress Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{stepIndex === 0 ? 'Cancel' : t('smart_service.previous_step')}</span>
              </button>
              <span className="font-mono font-semibold" style={{ color: accent }}>
                {t('smart_service.step_indicator', { current: stepIndex + 1, total: stepsForSector.length })}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((stepIndex + 1) / stepsForSector.length) * 100}%`,
                  background: `linear-gradient(90deg, ${accent}, #3B82F6)`,
                }}
              />
            </div>

            {/* Emergency Banner if flagged */}
            {(formData.urgency === 'Emergency (அவசரம்)' || isPanchayat && currentStep.field === 'urgency') && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{t('smart_service.emergency_warning')}</span>
              </div>
            )}
          </div>

          {/* Current Step Question Prompt in large clear font */}
          <div className="space-y-1.5 text-center sm:text-left py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
              {language === 'tamil' ? currentStep.labelTa : currentStep.labelEn}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {language === 'tamil' ? currentStep.promptTa : currentStep.promptEn}
            </h2>
          </div>

          {/* Interactive Form Field */}
          <div className="space-y-4">
            {currentStep.type === 'select' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentStep.options?.map((opt) => {
                  const isSelected = formData[currentStep.field] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleFieldChange(currentStep.field, opt)}
                      className={`p-3.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400/15 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : currentStep.type === 'textarea' ? (
              <textarea
                rows={4}
                value={formData[currentStep.field] || ''}
                onChange={(e) => handleFieldChange(currentStep.field, e.target.value)}
                placeholder={currentStep.placeholder || t('smart_service.type_or_speak')}
                className="w-full p-4 rounded-xl text-sm bg-white/5 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
              />
            ) : (
              <input
                type={currentStep.type === 'date' ? 'date' : 'text'}
                value={formData[currentStep.field] || ''}
                onChange={(e) => handleFieldChange(currentStep.field, e.target.value)}
                placeholder={currentStep.placeholder || t('smart_service.type_or_speak')}
                className="w-full p-4 rounded-xl text-sm bg-white/5 border border-white/15 text-white focus:outline-none focus:border-cyan-400"
              />
            )}

            {/* Voice input mic button & live waveform banner */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse border-red-400 shadow-lg shadow-red-500/50'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                  title={t('smart_service.speak_input')}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {isListening ? t('smart_service.recording_active') : 'Speak with AI Assistant'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isListening ? 'Click mic again when finished speaking' : 'Speak naturally in Tamil, Tanglish, or English'}
                  </p>
                </div>
              </div>

              {voiceTranscript && (
                <span className="text-xs font-mono text-cyan-300 italic px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 max-w-xs truncate">
                  "{voiceTranscript}"
                </span>
              )}
            </div>
          </div>

          {/* Navigation Controls: Back / Next / Review */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={handlePrevStep}
              data-testid="smart-service-prev-btn"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
            >
              {stepIndex === 0 ? 'Cancel' : t('smart_service.previous_step')}
            </button>

            {!isLastStep ? (
              <button
                onClick={handleNextStep}
                data-testid="smart-service-next-btn"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <span>{t('smart_service.next_step')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 transition-transform active:scale-95"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSubmitting ? 'Saving to Database...' : t('smart_service.confirm_and_submit')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW D: CONFIRMATION & AUDIO READOUT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mode === 'confirmed' && submissionResult && (
        <div className="max-w-2xl mx-auto w-full p-8 rounded-3xl glass-panel border border-emerald-500/30 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white">
              {t('smart_service.success_title')}
            </h2>
            <p className="text-xs text-slate-400">
              Your request has been officially assigned and saved in the database.
            </p>
          </div>

          {/* Reference ID card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Official Tracking Reference ID
            </span>
            <p className="text-2xl font-mono font-black text-cyan-400 tracking-wider">
              {submissionResult.reference_number}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {submissionResult.status}
              </span>
              <span className="text-xs text-slate-400">· {submissionResult.service_name}</span>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed text-left max-w-lg mx-auto">
            {submissionResult.confirmation_message}
          </div>

          {/* Voice Confirmation Player */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => playVoiceConfirmation(submissionResult.confirmation_speech_text)}
              disabled={isAudioLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-75"
            >
              {isPlayingAudio ? (
                <VolumeX className="w-4 h-4 animate-pulse text-rose-950" />
              ) : isAudioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>
                {isPlayingAudio
                  ? 'Stop Voice Confirmation'
                  : isAudioLoading
                  ? 'Loading Timbre Voice...'
                  : t('smart_service.play_voice_confirmation')}
              </span>
            </button>

            <button
              onClick={() => {
                audioController.stop();
                setTrackQuery(submissionResult.reference_number);
                setMode('tracking');
                handleTrackSubmit();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
            >
              {t('smart_service.track_status_button')}
            </button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                audioController.stop();
                setMode('menu');
                setFormData({ customer_name: '', phone: '', email: '', urgency: 'Normal' });
                setCart({});
                setStepIndex(0);
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer border-none bg-transparent"
            >
              ← {t('smart_service.submit_another')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
