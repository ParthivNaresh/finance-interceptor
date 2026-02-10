import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

import type { TranslationOptions } from './types';

type TranslateFunction = (key: string, options?: TranslationOptions) => string;

interface UseTranslationResult {
  t: TranslateFunction;
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
}

export function useTranslation(): UseTranslationResult {
  const { t: i18nT, i18n } = useI18nTranslation();

  const t: TranslateFunction = useCallback(
    (key: string, options?: TranslationOptions) => {
      return i18nT(key, options as Record<string, unknown>);
    },
    [i18nT]
  );

  const changeLanguage = useCallback(
    async (lang: string): Promise<void> => {
      await i18n.changeLanguage(lang);
    },
    [i18n]
  );

  return {
    t,
    language: i18n.language,
    changeLanguage,
  };
}
