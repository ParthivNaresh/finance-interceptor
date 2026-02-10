import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import type { SupportedLanguage } from './types';

const resources = {
  en: { translation: en },
} as const;

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export { i18n };
