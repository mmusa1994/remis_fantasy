import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEN from "@/locales/en/common.json";
import commonBS from "@/locales/bs/common.json";
import fplEN from "@/locales/en/fpl.json";
import fplBS from "@/locales/bs/fpl.json";
import heroEN from "@/locales/en/hero.json";
import heroBS from "@/locales/bs/hero.json";
import navigationEN from "@/locales/en/navigation.json";
import navigationBS from "@/locales/bs/navigation.json";

const resources = {
  en: {
    common: commonEN,
    fpl: fplEN,
    hero: heroEN,
    navigation: navigationEN,
  },
  bs: {
    common: commonBS,
    fpl: fplBS,
    hero: heroBS,
    navigation: navigationBS,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    defaultNS: "common",
    ns: ["common", "fpl", "hero", "navigation"],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
