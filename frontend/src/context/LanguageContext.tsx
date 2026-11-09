import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, {
  type AppLanguage,
  SUPPORTED_LANGUAGES,
  LS_LANGUAGE_KEY,
  getInitialLanguage,
} from '../i18n';
import { api } from '../services/api';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage, persistBackend?: boolean) => Promise<void>;
  t: (key: string, options?: Record<string, any>) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function mapAppLangToI18n(lang: AppLanguage): string {
  switch (lang) {
    case 'english':
      return 'en';
    case 'tanglish':
      return 'tanglish';
    case 'tamil':
    default:
      return 'ta';
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: translate } = useTranslation();
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const setLanguage = useCallback(
    async (newLang: AppLanguage, persistBackend: boolean = true) => {
      setLanguageState(newLang);
      const i18nCode = mapAppLangToI18n(newLang);
      await i18n.changeLanguage(i18nCode);

      try {
        localStorage.setItem(LS_LANGUAGE_KEY, newLang);
      } catch (e) {
        console.warn('Could not save language to localStorage:', e);
      }

      // Persist to backend if token is available
      if (persistBackend && api.getToken()) {
        try {
          await api.updateLanguagePreference(newLang);
        } catch (e) {
          console.warn('Could not persist language preference to backend:', e);
        }
      }
    },
    []
  );

  // Sync initial language on mount
  useEffect(() => {
    const initLang = getInitialLanguage();
    setLanguage(initLang, false);
  }, [setLanguage]);

  // Safe translation helper
  const t = useCallback(
    (key: string, options?: Record<string, any>): string => {
      if (options !== undefined) {
        return translate(key, options as any) as string;
      }
      return translate(key) as string;
    },
    [translate]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

