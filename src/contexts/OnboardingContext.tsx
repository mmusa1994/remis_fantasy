"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface OnboardingContextType {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // The onboarding tour is now strictly opt-in: the floating widget on
  // /premier-league/* opens it manually. We still read the API state in case
  // a future page wants to deep-link / re-trigger, but we never set
  // `showOnboarding` automatically.
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/user/onboarding")
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status]);

  const completeOnboarding = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      });

      if (response.ok) {
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Still hide onboarding on client side
      setShowOnboarding(false);
    }
  };

  const value = {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
