import type { TranslationKeys } from './locales/en';

export type { TranslationKeys };

export type SupportedLanguage = 'en';

export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

export interface TranslationOptions {
  count?: number;
  [key: string]: string | number | undefined;
}
