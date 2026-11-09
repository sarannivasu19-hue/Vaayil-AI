import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { ta } from './locales/ta';
import { tanglish } from './locales/tanglish';

export const SUPPORTED_LANGUAGES = [
  { code: 'tamil', i18nCode: 'ta', label: 'தமிழ்', nativeLabel: 'தமிழ் (Tamil)', desc: 'Pure Tamil interface & voice responses' },
  { code: 'english', i18nCode: 'en', label: 'English', nativeLabel: 'English', desc: 'English interface & voice responses' },
  { code: 'tanglish', i18nCode: 'tanglish', label: 'Tanglish', nativeLabel: 'Tanglish (Tamil + English)', desc: 'Conversational Tamil written in English letters' },
] as const;

export type AppLanguage = 'tamil' | 'english' | 'tanglish';

export const LS_LANGUAGE_KEY = 'vaayil_language_preference';

export function getInitialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LS_LANGUAGE_KEY);
    if (saved === 'english' || saved === 'tamil' || saved === 'tanglish') {
      return saved;
    }
  } catch {
    // ignore
  }
  // Default to Tamil as required: "Set Tamil as the initial default language for existing users"
  return 'tamil';
}

const initialLang = getInitialLanguage();
const initialI18nCode = initialLang === 'english' ? 'en' : initialLang === 'tanglish' ? 'tanglish' : 'ta';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      tanglish: { translation: tanglish },
    },
    lng: initialI18nCode,
    fallbackLng: 'ta',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

