"use client";

import { useEffect } from "react";
import "@/lib/i18n"; // Import i18n configuration

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize i18n on client side
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage) {
      // Language will be automatically set by i18next LanguageDetector
    }
  }, []);

  return <>{children}</>;
}
