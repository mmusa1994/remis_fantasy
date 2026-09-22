"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ToastProvider } from "@/contexts/ToastContext";
import I18nProvider from "@/components/providers/I18nProvider";
import { AITeamAnalysisProvider } from "@/contexts/AITeamAnalysisContext";
import AIAnalysisToast from "@/components/fpl/AIAnalysisToast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <I18nProvider>
            <ToastProvider>
              <AITeamAnalysisProvider>
                {children}
                <AIAnalysisToast />
              </AITeamAnalysisProvider>
            </ToastProvider>
          </I18nProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
