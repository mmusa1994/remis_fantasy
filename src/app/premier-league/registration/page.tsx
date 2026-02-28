"use client";

import RegistrationForm from "@/components/RegistrationForm";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function RegistracijaPage() {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred form underneath */}
      <div className="blur-sm pointer-events-none select-none opacity-40 pb-16 xs:pb-20 pt-6 xs:pt-8 sm:pt-10 px-2 xs:px-4">
        <RegistrationForm leagueType="premier" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className={`text-center p-8 md:p-12 rounded-md max-w-md mx-4 border backdrop-blur-md shadow-2xl ${
          theme === "dark"
            ? "bg-gray-900/90 border-purple-500/30"
            : "bg-white/90 border-purple-200"
        }`}>
          <div className={`w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-6 ${
            theme === "dark" ? "bg-purple-500/15" : "bg-purple-50"
          }`}>
            <Lock className={`w-8 h-8 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
          </div>
          <h2 className={`text-xl md:text-2xl font-black mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Registracija trenutno nije aktivna
          </h2>
          <p className={`text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Pratite nas za informacije o sljedećoj sezoni Premier League Fantasy lige.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-sm rounded-md transition-all duration-300 shadow-lg shadow-purple-500/20"
          >
            Nazad na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}
