import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/* =========================
   IMPORT TRANSLATIONS
========================= */

// VI
import viCommon from './locales/vi/common.json';
import viPrivacy from './locales/vi/privacy.json';
import viTerms from './locales/vi/terms.json';
import viFaq from './locales/vi/faq.json';
import viAbout from './locales/vi/about.json';
import viSeo from './locales/vi/seo.json';
import viDashboard from './locales/vi/dashboard.json';
import viFlights from './locales/vi/flights.json';
import viCars from './locales/vi/cars.json';
import viHotels from './locales/vi/hotels.json';
import viProfile from './locales/vi/profile.json';

// EN
import enCommon from './locales/en/common.json';
import enPrivacy from './locales/en/privacy.json';
import enTerms from './locales/en/terms.json';
import enFaq from './locales/en/faq.json';
import enAbout from './locales/en/about.json';
import enSeo from './locales/en/seo.json';
import enDashboard from './locales/en/dashboard.json';
import enFlights from './locales/en/flights.json';
import enCars from './locales/en/cars.json';
import enHotels from './locales/en/hotels.json';
import enProfile from './locales/en/profile.json';

/* =========================
   I18N CONFIG
========================= */

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,

    fallbackLng: 'vi',

    supportedLngs: ['vi', 'en'],

    ns: ['common', 'privacy', 'terms', 'faq', 'about', 'seo','dashboard','flights','cars','hotels','profile'],
    defaultNS: 'common',

    resources: {
      vi: {
        common: viCommon,
        privacy: viPrivacy,
        terms: viTerms,
        faq: viFaq,
        about: viAbout,
        seo: viSeo,
        dashboard: viDashboard,
        flights: viFlights,
        cars: viCars,
        hotels: viHotels,
        profile: viProfile
      },
      en: {
        common: enCommon,
        privacy: enPrivacy,
        terms: enTerms,
        faq: enFaq,
        about: enAbout,
        seo: enSeo,
        dashboard: enDashboard,
        flights: enFlights,
        cars: enCars,
        hotels: enHotels,
        profile: enProfile
      }
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;
