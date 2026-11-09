/**
 * Universal Indian Phone Number Normalization & Validation Utility
 * Supports English, Tamil script, Tanglish, and digit-by-digit / grouped / multiplier utterances.
 */

// Mapping of individual spoken digit tokens to digit characters
const DIGIT_MAP: Record<string, string> = {
  // English
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  'zero': '0', 'oh': '0', 'o': '0',
  'one': '1', 'won': '1',
  'two': '2', 'to': '2', 'too': '2',
  'three': '3', 'tree': '3',
  'four': '4', 'for': '4', 'fore': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8', 'ate': '8',
  'nine': '9',

  // Tamil Script
  'பூஜ்ஜியம்': '0', 'பூஜ்யம்': '0', 'சைபர்': '0',
  'ஒன்று': '1', 'ஒன்னு': '1', 'ஒரு': '1',
  'இரண்டு': '2', 'ரெண்டு': '2', 'ரெண்ட': '2',
  'மூன்று': '3', 'மூணு': '3',
  'நான்கு': '4', 'நாலு': '4',
  'ஐந்து': '5', 'அஞ்சு': '5',
  'ஆறு': '6',
  'ஏழு': '7',
  'எட்டு': '8',
  'ஒன்பது': '9',

  // Tanglish
  'poojiyam': '0', 'poojyam': '0', 'saibar': '0', 'cyber': '0',
  'onnu': '1', 'ondru': '1', 'oru': '1',
  'rendu': '2', 'irandu': '2', 'randu': '2',
  'moonu': '3', 'moondru': '3',
  'naalu': '4', 'naangu': '4',
  'anju': '5', 'aindhu': '5', 'ainthu': '5',
  'aaru': '6',
  'ezhu': '7', 'yelu': '7',
  'ettu': '8',
  'onbadhu': '9', 'ombadhu': '9', 'onbathu': '9', 'ombathu': '9',
};

// Teens
const TEENS_MAP: Record<string, string> = {
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
  'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
  'eighteen': '18', 'nineteen': '19',
  'பத்து': '10', 'பதினொன்று': '11', 'பதினொன்னு': '11',
  'பன்னிரண்டு': '12', 'பதின்மூன்று': '13', 'பதின்மூணு': '13',
  'பதினான்கு': '14', 'பதினைந்து': '15', 'பதினாறு': '16', 'பதினேழு': '17', 'பதினெட்டு': '18',
  'பத்தொன்பது': '19',
  'pathu': '10', 'padhinonnu': '11', 'pannirendu': '12', 'padhimoonu': '13',
  'padhinaalu': '14', 'padhinanju': '15', 'padhinaaru': '16',
  'padhinezhu': '17', 'padhinettu': '18', 'pathombadhu': '19',
};

// Tens base
const TENS_BASE_MAP: Record<string, string> = {
  'twenty': '2', 'thirty': '3', 'forty': '4', 'fifty': '5',
  'sixty': '6', 'seventy': '7', 'eighty': '8', 'ninety': '9',
  'இருபது': '2', 'இருபத்தி': '2', 'இருபத்து': '2',
  'முப்பது': '3', 'முப்பத்தி': '3', 'முப்பத்து': '3',
  'நாற்பது': '4', 'நாற்பத்தி': '4', 'நாற்பத்து': '4',
  'ஐம்பது': '5', 'ஐம்பத்தி': '5', 'ஐம்பத்து': '5',
  'அறுபது': '6', 'அறுபத்தி': '6', 'அறுபத்து': '6',
  'எழுபது': '7', 'எழுபத்தி': '7', 'எழுபத்து': '7',
  'எண்பது': '8', 'எண்பத்தி': '8', 'எண்பத்து': '8',
  'தொண்ணூறு': '9', 'தொண்ணூற்றி': '9', 'தொண்ணூற்று': '9',
  'irubadhu': '2', 'iruvathu': '2', 'irupathu': '2', 'iruvathi': '2',
  'muppadhu': '3', 'muppathu': '3', 'muppathi': '3',
  'naarpadhu': '4', 'naarpathu': '4', 'naappadhu': '4', 'naappathu': '4', 'naappaththu': '4',
  'aimbadhu': '5', 'aimbathu': '5', 'ambadhu': '5', 'ambathu': '5',
  'arubadhu': '6', 'arubathu': '6',
  'ezhubadhu': '7', 'ezhubathu': '7',
  'enbadhu': '8', 'enbathu': '8',
  'thonnooru': '9', 'thonnootru': '9',
};

// Compound words
const COMPOUND_MAP: Record<string, string> = {
  'நாற்பத்தைந்து': '45', 'இருபத்தைந்து': '25', 'முப்பத்தைந்து': '35',
  'ஐம்பத்தைந்து': '55', 'அறுபத்தைந்து': '65', 'எழுபத்தைந்து': '75',
  'எண்பத்தைந்து': '85', 'தொண்ணூற்றைந்து': '95',
  'naappathanju': '45', 'naappaththanju': '45', 'iruvathanju': '25',
  'irupathanju': '25', 'iruvathianju': '25', 'iruvathi anju': '25',
};

const DOUBLE_TOKENS = new Set(['double', 'இரட்டை', 'டபுள்', 'irattai', 'rendu murai']);
const TRIPLE_TOKENS = new Set(['triple', 'மும்முறை', 'ட்ரிபிள்', 'moondru murai']);

export function cleanSpokenWord(token: string): string {
  return token.replace(/[^\w\u0B80-\u0BFF]/g, '').toLowerCase().trim();
}

/**
 * Tokenizes text and extracts raw digit stream
 */
export function extractDigitStream(text: string): string {
  if (!text) return '';

  const normalized = text
    .replace(/-/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/,/g, ' ');

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const digits: string[] = [];
  let i = 0;

  while (i < rawTokens.length) {
    const rawTok = rawTokens[i];
    const tok = cleanSpokenWord(rawTok);

    if (!tok) {
      i++;
      continue;
    }

    // Direct multi-digit numbers
    if (/^\d+$/.test(tok)) {
      digits.push(tok);
      i++;
      continue;
    }

    // Multiplier lookahead (double / triple)
    if (DOUBLE_TOKENS.has(tok)) {
      if (i + 1 < rawTokens.length) {
        const nextTok = cleanSpokenWord(rawTokens[i + 1]);
        const d = DIGIT_MAP[nextTok] || (/^\d$/.test(nextTok) ? nextTok : '');
        if (d) {
          digits.push(d, d);
          i += 2;
          continue;
        }
      }
    }

    if (TRIPLE_TOKENS.has(tok)) {
      if (i + 1 < rawTokens.length) {
        const nextTok = cleanSpokenWord(rawTokens[i + 1]);
        const d = DIGIT_MAP[nextTok] || (/^\d$/.test(nextTok) ? nextTok : '');
        if (d) {
          digits.push(d, d, d);
          i += 2;
          continue;
        }
      }
    }

    // Exact compound lookup
    if (COMPOUND_MAP[tok]) {
      digits.push(COMPOUND_MAP[tok]);
      i++;
      continue;
    }

    // Teens
    if (TEENS_MAP[tok]) {
      digits.push(TEENS_MAP[tok]);
      i++;
      continue;
    }

    // Tens base
    if (TENS_BASE_MAP[tok]) {
      const tenDigit = TENS_BASE_MAP[tok];
      if (i + 1 < rawTokens.length) {
        const nextTok = cleanSpokenWord(rawTokens[i + 1]);
        const unitDigit = DIGIT_MAP[nextTok] || (/^\d$/.test(nextTok) ? nextTok : '');
        if (unitDigit && unitDigit !== '0') {
          digits.push(tenDigit + unitDigit);
          i += 2;
          continue;
        }
      }
      digits.push(tenDigit + '0');
      i++;
      continue;
    }

    // Single digit
    if (DIGIT_MAP[tok]) {
      digits.push(DIGIT_MAP[tok]);
      i++;
      continue;
    }

    i++;
  }

  return digits.join('');
}

/**
 * Validates strictly whether string represents a valid 10-digit Indian mobile number
 * starting with 6, 7, 8, or 9. Handles prefix 0091, 91, or 0.
 */
export function validateIndianMobile(digits: string): string | null {
  if (!digits) return null;
  const clean = digits.replace(/\D/g, '');

  if (clean.length === 14 && clean.startsWith('0091')) {
    const sub = clean.slice(4);
    if (/^[6-9]\d{9}$/.test(sub)) return sub;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    const sub = clean.slice(2);
    if (/^[6-9]\d{9}$/.test(sub)) return sub;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    const sub = clean.slice(1);
    if (/^[6-9]\d{9}$/.test(sub)) return sub;
  }
  if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
    return clean;
  }
  return null;
}

export interface ClientPhoneAnalysis {
  isValid: boolean;
  phone: string | null;
  rawDigits: string;
  digitCount: number;
  status: 'valid' | 'incomplete' | 'too_long' | 'invalid_prefix' | 'no_digits';
  message: string;
}

/**
 * Normalizes spoken or written phone text client-side.
 */
export function normalizeSpokenPhone(text: string, language: 'tamil' | 'english' | 'tanglish' = 'tamil'): ClientPhoneAnalysis {
  if (!text || !text.trim()) {
    return {
      isValid: false,
      phone: null,
      rawDigits: '',
      digitCount: 0,
      status: 'no_digits',
      message: language === 'tamil'
        ? 'மொபைல் எண் கண்டறியப்படவில்லை. தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணை கூறுங்கள்.'
        : language === 'english'
        ? 'No phone number detected. Please provide your 10-digit mobile number.'
        : 'Mobile number theriyala. Unga 10-digit mobile number-a sollunga.',
    };
  }

  // 1. Check direct standard phone pattern first
  const directMatch = text.match(/(?:(?:\+?91[\s\-]*)|\b0091[\s\-]*|\b0)?\b([6-9]\d{4}[\s\-]*\d{5}|[6-9]\d{9})\b/);
  if (directMatch) {
    const cleanNum = directMatch[1].replace(/\D/g, '');
    if (cleanNum.length === 10 && /^[6-9]/.test(cleanNum)) {
      return {
        isValid: true,
        phone: cleanNum,
        rawDigits: cleanNum,
        digitCount: 10,
        status: 'valid',
        message: language === 'tamil'
          ? `மொபைல் எண் ${cleanNum} கண்டறியப்பட்டது.`
          : language === 'english'
          ? `Mobile number ${cleanNum} detected.`
          : `Mobile number ${cleanNum} kidaichirukku.`,
      };
    }
  }

  // 2. Extract digit stream
  const stream = extractDigitStream(text);
  let core = stream;
  if (core.startsWith('0091') && core.length >= 14) {
    core = core.slice(4);
  } else if (core.startsWith('91') && core.length >= 12) {
    core = core.slice(2);
  } else if (core.startsWith('0') && core.length >= 11) {
    core = core.slice(1);
  }

  const count = core.length;
  if (count === 0) {
    return {
      isValid: false,
      phone: null,
      rawDigits: '',
      digitCount: 0,
      status: 'no_digits',
      message: language === 'tamil'
        ? 'மொபைல் எண் கண்டறியப்படவில்லை.'
        : language === 'english'
        ? 'No phone number detected.'
        : 'Mobile number theriyala.',
    };
  }

  if (count < 10) {
    return {
      isValid: false,
      phone: null,
      rawDigits: core,
      digitCount: count,
      status: 'incomplete',
      message: language === 'tamil'
        ? `${count} இலக்கங்கள் மட்டுமே உள்ளன (${core}). 10 இலக்க மொபைல் எண்ணை முழுமையாக சொல்லுங்கள்.`
        : language === 'english'
        ? `I heard only ${count} digits (${core}). Please provide all 10 digits.`
        : `${count} digits dhaan kettadhu (${core}). 10 digits mobile number-a muzhusa sollunga.`,
    };
  }

  if (count > 10) {
    return {
      isValid: false,
      phone: null,
      rawDigits: core,
      digitCount: count,
      status: 'too_long',
      message: language === 'tamil'
        ? `10 இலக்கங்களுக்கு மேல் (${count}) உள்ளன. தயவுசெய்து 10 இலக்க எண்ணை மட்டும் கூறுங்கள்.`
        : language === 'english'
        ? `More than 10 digits detected (${count} digits). Please speak only your 10-digit mobile number.`
        : `10 digits-ku mela irukku (${count} digits). 10-digit mobile number mattum sollunga.`,
    };
  }

  if (!/^[6-9]/.test(core)) {
    return {
      isValid: false,
      phone: null,
      rawDigits: core,
      digitCount: 10,
      status: 'invalid_prefix',
      message: language === 'tamil'
        ? `இந்திய மொபைல் எண்கள் 6, 7, 8 அல்லது 9 இல் தொடங்க வேண்டும் (${core[0]} இல் தொடங்குகிறது).`
        : language === 'english'
        ? `Indian mobile numbers must start with 6, 7, 8, or 9 (starts with ${core[0]}).`
        : `Indian mobile number 6, 7, 8 illa 9-la start aaganum (${core[0]}-la start aagudhu).`,
    };
  }

  return {
    isValid: true,
    phone: core,
    rawDigits: core,
    digitCount: 10,
    status: 'valid',
    message: language === 'tamil'
      ? `மொபைல் எண் ${core} உறுதி செய்யப்பட்டது.`
      : language === 'english'
      ? `Mobile number ${core} validated.`
      : `Mobile number ${core} confirmed.`,
  };
}

/**
 * Mask phone number for logging and display: 93******25
 */
export function maskPhone(phone: string): string {
  if (!phone) return '**********';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return '**********';
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}
