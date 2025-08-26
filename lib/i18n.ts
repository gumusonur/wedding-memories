import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appConfig, Language } from '../config';

// Import translation files
import en from '../locales/en/common.json';
import tr from '../locales/tr/common.json';

const resources = {
  en: {
    common: en,
  },
  tr: {
    common: tr,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: appConfig.defaultLanguage,
    fallbackLng: Language.English,
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    defaultNS: 'common',
    ns: ['common'],
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;