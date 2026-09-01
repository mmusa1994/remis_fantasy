"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ChampionsLeagueTable, {
  type ClSeason,
} from "@/components/champions-league/ChampionsLeagueTable";

export default function ChampionsLeagueTabelePage() {
  const { theme } = useTheme();
  const [season, setSeason] = useState<ClSeason>("26_27");

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className={`text-4xl font-black mb-12 text-center ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Champions League Tabele
        </motion.h1>

        {/* Season switcher */}
        <div className="flex justify-center gap-8 mb-8">
          {(["25_26", "26_27"] as ClSeason[]).map((s) => {
            const isActive = season === s;
            const label = s === "26_27" ? "2026/27" : "2025/26";
            return (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className="relative pb-1.5 font-bold text-base md:text-lg transition-colors duration-300"
                style={{
                  color: isActive
                    ? theme === "dark"
                      ? "#60a5fa"
                      : "#2563eb"
                    : theme === "dark"
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(0,0,0,0.45)",
                }}
              >
                {label}
                {s === "25_26" && !isActive && (
                  <span className="ml-1 text-[10px] font-medium opacity-60">
                    (Završena)
                  </span>
                )}
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isActive
                      ? theme === "dark"
                        ? "#60a5fa"
                        : "#2563eb"
                      : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={season}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ChampionsLeagueTable season={season} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
