import { useCallback } from 'react';

import { useLocaleStore, type Locale } from '@/store/locale';

import km from './km.json';

/**
 * The app's strings, the way the web and the Flutter app do it: English is the
 * key, Khmer is looked up in a dictionary seeded from the web's lang/km.json.
 * An unknown key returns itself, so a missing translation leaves the UI
 * readable rather than blank. `:name` placeholders are filled from `params`.
 */
const dictionaries: Record<Locale, Record<string, string>> = {
  en: {},
  km: km as Record<string, string>,
};

export type TranslateParams = Record<string, string | number>;

export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  let text = dictionaries[locale][key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`:${name}`).join(String(value));
    }
  }
  return text;
}

/** For code outside React; components use `useT()` so they re-render on a switch. */
export function t(key: string, params?: TranslateParams): string {
  return translate(useLocaleStore.getState().locale, key, params);
}

export function useT(): (key: string, params?: TranslateParams) => string {
  const locale = useLocaleStore((state) => state.locale);
  return useCallback((key: string, params?: TranslateParams) => translate(locale, key, params), [locale]);
}
