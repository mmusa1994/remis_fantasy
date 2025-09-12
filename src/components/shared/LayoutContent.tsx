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
  return path.includes("login") || path.includes("signup") || path.includes("forgot-password");
};

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = isAdminPath(pathname);
  const isLoginPanelBool = isLoginPanel(pathname);

  // Determine current section for mobile menu
  const getCurrentSection = () => {
    if (pathname.startsWith("/premier-league")) return "premier-league";
    if (pathname.startsWith("/champions-league")) return "champions-league";
    if (pathname.startsWith("/f1-fantasy")) return "f1-fantasy";
    return null;
  };

  if (isAdmin) {
    return (
      <main>
        {children}
        {/* Onboarding Widget for admin too */}
        <OnboardingWidget />
      </main>
    );
  } else if (isLoginPanelBool) {
    return (
      <main>
        <Navbar />
        <div className="pt-0 md:pt-20 pb-16 md:pb-0">
          {children}
        </div>
        
        {/* Bottom Navigation for Mobile */}
        <BottomNavigation onMenuToggle={() => setIsMobileMenuOpen(true)} />
        
        {/* Mobile Menu */}
        <MobileMenu 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentSection={getCurrentSection()}
        />
        
        {/* Onboarding Widget for login pages too */}
        <OnboardingWidget />
      </main>
    );
  }

  return (
    <>
      <VisitorTracker />
      <Navbar />
      <main className="pt-0 md:pt-20 pb-16 md:pb-0">{children}</main>
      <Footer />
      
      {/* Bottom Navigation for Mobile */}
      <BottomNavigation onMenuToggle={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentSection={getCurrentSection()}
      />
      
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />

      {/* Permanent Onboarding Widget */}
      <OnboardingWidget />
    </>
  );
}
