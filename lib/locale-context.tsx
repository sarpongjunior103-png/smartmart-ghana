// @ts-nocheck
'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { COUNTRY_BY_CODE, LANGUAGES, translate, type CountryConfig } from '@/lib/constants';

interface LocaleContextValue {
  country: string;
  countryCode: string;
  currency: string;
  language: string;
  setCountry: (code: string) => void;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  countryConfig: CountryConfig;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY_COUNTRY = 'smartmart_country';
const STORAGE_KEY_LANG = 'smartmart_language';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState('GH');
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const savedCountry = localStorage.getItem(STORAGE_KEY_COUNTRY);
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
    if (savedCountry) setCountryCode(savedCountry);
    if (savedLang) setLanguageState(savedLang);
  }, []);

  const setCountry = useCallback((code: string) => {
    setCountryCode(code);
    localStorage.setItem(STORAGE_KEY_COUNTRY, code);
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY_LANG, code);
  }, []);

  const t = useCallback((key: string) => translate(key, language), [language]);

  const countryConfig = COUNTRY_BY_CODE[countryCode] ?? COUNTRY_BY_CODE['GH'];

  const value: LocaleContextValue = {
    country: countryConfig.name,
    countryCode,
    currency: countryConfig.currency,
    language,
    setCountry,
    setLanguage,
    t,
    countryConfig,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export { LANGUAGES };
