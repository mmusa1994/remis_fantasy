"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useOnboarding } from "@/contexts/OnboardingContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import VisitorTracker from "./VisitorTracker";
import OnboardingModal from "../onboarding/OnboardingModal";
import OnboardingWidget from "../onboarding/OnboardingWidget";
import BottomNavigation from "./BottomNavigation";
import MobileMenu from "./MobileMenu";

const isAdminPath = (path: string) => {
  return path.includes("admin") || path.includes("dashboard");
};

const isLoginPanel = (path: string) => {
  return (
    path.includes("login") ||
    path.includes("signup") ||
    path.includes("forgot-password")
  );
};

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { showOnboarding, setShowOnboarding, completeOnboarding } =
    useOnboarding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = isAdminPath(pathname);
  const isLoginPanelBool = isLoginPanel(pathname);
  // The Fantasy Command Center onboarding tour is FPL-specific. We only
  // mount it on /premier-league/* routes so it never auto-pops on other
  // sections (predictor, F1, champions, registration, etc.).
  const isPremierLeague = pathname.startsWith("/premier-league");

  // Determine current section for mobile menu
  const getCurrentSection = (): string | undefined => {
    if (pathname.startsWith("/premier-league")) return "premier-league";
    if (pathname.startsWith("/champions-league")) return "champions-league";
    if (pathname.startsWith("/f1-fantasy")) return "f1-fantasy";
    return undefined;
  };

  if (isAdmin) {
    return (
      <main>
        {children}
      </main>
    );
  } else if (isLoginPanelBool) {
    return (
      <main>
        <Navbar />
        <div className="hidden md:block h-16" aria-hidden="true" />
        <div className="pb-16 md:pb-0">{children}</div>

        {/* Bottom Navigation for Mobile */}
        <BottomNavigation onMenuToggle={() => setIsMobileMenuOpen(true)} />

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentSection={getCurrentSection()}
        />

        </main>
    );
  }

  return (
    <>
      <VisitorTracker />
      <Navbar />
      <div className="hidden md:block h-16" aria-hidden="true" />
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation onMenuToggle={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentSection={getCurrentSection()}
      />

      {/* Onboarding modal + floating widget — FPL-only, opt-in.
          The widget button is what opens the modal; nothing auto-pops. */}
      {isPremierLeague && (
        <>
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onComplete={completeOnboarding}
          />
          <OnboardingWidget />
        </>
      )}
    </>
  );
}
