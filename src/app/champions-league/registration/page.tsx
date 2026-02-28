"use client";

import ChampionsLeagueRegistrationForm from "@/components/ChampionsLeagueRegistrationForm";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function ChampionsLeagueRegistracijaPage() {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred form underneath */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        <ChampionsLeagueRegistrationForm />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className={`text-center p-8 md:p-12 rounded-md max-w-md mx-4 border backdrop-blur-md shadow-2xl ${
          theme === "dark"
            ? "bg-gray-900/90 border-blue-500/30"
            : "bg-white/90 border-blue-200"
        }`}>
          <div className={`w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-6 ${
            theme === "dark" ? "bg-blue-500/15" : "bg-blue-50"
          }`}>
            <Lock className={`w-8 h-8 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <h2 className={`text-xl md:text-2xl font-black mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Registracija trenutno nije aktivna
          </h2>
          <p className={`text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Pratite nas za informacije o sljedećoj sezoni Champions League Fantasy lige.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-md transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            Nazad na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}
