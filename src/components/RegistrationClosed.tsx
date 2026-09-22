"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Lock } from "lucide-react";

type Accent = "purple" | "blue" | "red";

const ACCENT_CLASSES: Record<Accent, { dark: string; light: string }> = {
  purple: { dark: "text-purple-400", light: "text-purple-600" },
  blue: { dark: "text-blue-400", light: "text-blue-600" },
  red: { dark: "text-red-400", light: "text-red-600" },
};

interface Props {
  message: string;
  title?: string;
  accent?: Accent;
  children: React.ReactNode;
}

/**
 * Zaključava registracijsku stranicu: forma se renderuje samo kao zamućena,
 * neinteraktivna podloga ispod obavještenja (`inert` je isključuje i za
 * tastaturu, ne samo za miš). Backend je blokiran nezavisno od ovog UI sloja —
 * vidi src/lib/registrations-closed.ts.
 */
export default function RegistrationClosed({
  message,
  title = "Registracija Zatvorena",
  accent = "purple",
  children,
}: Props) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const accentClass = dark
    ? ACCENT_CLASSES[accent].dark
    : ACCENT_CLASSES[accent].light;

  return (
    <div className="pb-16 xs:pb-20 pt-6 xs:pt-8 sm:pt-10 px-2 xs:px-4 relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-32 backdrop-blur-sm bg-black/30">
        <div
          className={`text-center p-8 rounded-xl shadow-2xl max-w-md mx-4 border ${
            dark ? "bg-gray-900/95 border-gray-700" : "bg-white/95 border-gray-200"
          }`}
        >
          <Lock className={`w-12 h-12 mx-auto mb-4 ${accentClass}`} />
          <h2
            className={`text-xl font-bold mb-2 ${
              dark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
            {message}
          </p>
        </div>
      </div>

      {/* Blurred, inert form underneath */}
      <div
        inert
        aria-hidden
        className="pointer-events-none select-none filter blur-[3px] opacity-60"
      >
        {children}
      </div>
    </div>
  );
}
