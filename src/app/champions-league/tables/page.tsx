"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ChampionsLeagueTable from "@/components/champions-league/ChampionsLeagueTable";

export default function ChampionsLeagueTabelePage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className={`text-4xl md:text-6xl font-black mb-12 text-center ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Champions League Tabele
        </motion.h1>

        <ChampionsLeagueTable />
      </div>
    </div>
  );
}