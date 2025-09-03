"use client";

import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import FullPageLoader from "@/components/shared/FullPageLoader";

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkI18nReady = () => {
      if (i18n.isInitialized) {
        setIsLoaded(true);
      } else {
        i18n.on('initialized', () => {
          setIsLoaded(true);
        });
      }
    };

    checkI18nReady();
  }, []);

  if (!isLoaded) {
    return <FullPageLoader message="Loading translations..." />;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
