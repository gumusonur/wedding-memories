'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig, Language } from '../config';
import '../lib/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(appConfig.defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize i18n with stored language or default
    const initializeLanguage = async () => {
      try {
        // Get stored language from localStorage
        const storedLanguage = localStorage.getItem('wedding-app-language') as Language;
        const initialLanguage = storedLanguage && appConfig.supportedLanguages.includes(storedLanguage) 
          ? storedLanguage 
          : appConfig.defaultLanguage;

        setLanguageState(initialLanguage);
        await i18n.changeLanguage(initialLanguage);
        setIsLoading(false);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [i18n]);

  const setLanguage = async (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      await i18n.changeLanguage(newLanguage);
      localStorage.setItem('wedding-app-language', newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { useI18n as useTranslation };