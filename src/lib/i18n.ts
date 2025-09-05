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
import aiEN from "@/locales/en/ai.json";
import aiBS from "@/locales/bs/ai.json";
import authEN from "@/locales/en/auth.json";
import authBS from "@/locales/bs/auth.json";
import profileEN from "@/locales/en/profile.json";
import profileBS from "@/locales/bs/profile.json";
import f1EN from "@/locales/en/f1.json";
import f1BS from "@/locales/bs/f1.json";
import billingEN from "@/locales/en/billing.json";
import billingBS from "@/locales/bs/billing.json";
import onboardingEN from "@/locales/en/onboarding.json";
import onboardingBS from "@/locales/bs/onboarding.json";

const resources = {
  en: {
    common: commonEN,
    fpl: fplEN,
    f1: f1EN,
    billing: billingEN,
    hero: heroEN,
    navigation: navigationEN,
    ai: aiEN,
    auth: authEN,
    profile: profileEN,
    onboarding: onboardingEN,
  },
  bs: {
    common: commonBS,
    fpl: fplBS,
    f1: f1BS,
    billing: billingBS,
    hero: heroBS,
    navigation: navigationBS,
    ai: aiBS,
    auth: authBS,
    profile: profileBS,
    onboarding: onboardingBS,
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
    ns: ["common", "fpl", "f1", "billing", "hero", "navigation", "ai", "auth", "profile", "onboarding"],

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
