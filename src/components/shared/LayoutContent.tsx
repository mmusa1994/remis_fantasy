"use client";

import { usePathname } from "next/navigation";
import { useOnboarding } from "@/contexts/OnboardingContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import VisitorTracker from "./VisitorTracker";
import OnboardingModal from "../onboarding/OnboardingModal";
import OnboardingWidget from "../onboarding/OnboardingWidget";

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
  const isAdmin = isAdminPath(pathname);
  const isLoginPanelBool = isLoginPanel(pathname);

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
        {children}
        
        {/* Onboarding Widget for login pages too */}
        <OnboardingWidget />
      </main>
    );
  }

  return (
    <>
      <VisitorTracker />
      <Navbar />
      <main className="pt-16 md:pt-20">{children}</main>
      <Footer />
      
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
