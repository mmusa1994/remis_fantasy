"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Lock } from "lucide-react";
import PLRegistrationForm from "@/components/PLRegistrationForm";

export default function RegistracijaPage() {
  const { theme } = useTheme();

  return (
    <div className="pb-16 xs:pb-20 pt-6 xs:pt-8 sm:pt-10 px-2 xs:px-4 relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-32 backdrop-blur-sm bg-black/30">
        <div
          className={`text-center p-8 rounded-xl shadow-2xl max-w-md mx-4 border ${
            theme === "dark"
              ? "bg-gray-900/95 border-gray-700"
              : "bg-white/95 border-gray-200"
          }`}
        >
          <Lock
            className={`w-12 h-12 mx-auto mb-4 ${
              theme === "dark" ? "text-purple-400" : "text-purple-600"
            }`}
          />
          <h2
            className={`text-xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Registracija Zatvorena
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Registracija za sezonu 2026/27 će uskoro biti otvorena. Pratite nas
            za više informacija.
          </p>
        </div>
      </div>

      {/* Blurred form underneath */}
      <div className="pointer-events-none select-none filter blur-[3px] opacity-60">
        <PLRegistrationForm />
      </div>
    </div>
  );
}
