"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import I18nProvider from "@/components/providers/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <I18nProvider>{children}</I18nProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
