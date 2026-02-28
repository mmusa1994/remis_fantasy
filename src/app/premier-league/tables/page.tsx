"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import LeagueTableTabs from "@/components/shared/LeagueTableTabs";

export default function TabelePage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className={`text-2xl md:text-3xl font-black mb-12 text-center ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Premier League Tabele
        </motion.h1>

        <LeagueTableTabs />
      </div>
    </div>
  );
}
