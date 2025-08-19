"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ReusableLeagueTable from "./ReusableLeagueTable";
import { getLeagueDataForReusableTable } from "@/data/leagueTableData";

const tabs = [
  { id: "premium", label: "Premium Liga", color: "yellow" },
  { id: "standard", label: "Standard Liga", color: "blue" },
  { id: "h2h", label: "H2H Liga", color: "red" },
  { id: "h2h2", label: "H2H2 Liga", color: "red" },
];

export default function LeagueTableTabs() {
  const [activeTab, setActiveTab] = useState("premium");
  const { theme } = useTheme();

  const getTabColors = (color: string) => {
    const colors = {
      yellow: {
        active: theme === "dark" ? "bg-yellow-500" : "bg-yellow-400",
        hover: theme === "dark" ? "hover:bg-yellow-600" : "hover:bg-yellow-500",
        text: theme === "dark" ? "text-yellow-300" : "text-yellow-800",
        border: theme === "dark" ? "border-yellow-500" : "border-yellow-400",
      },
      blue: {
        active: theme === "dark" ? "bg-blue-500" : "bg-blue-400",
        hover: theme === "dark" ? "hover:bg-blue-600" : "hover:bg-blue-500",
        text: theme === "dark" ? "text-blue-300" : "text-blue-800",
        border: theme === "dark" ? "border-blue-500" : "border-blue-400",
      },
      red: {
        active: theme === "dark" ? "bg-red-500" : "bg-red-400",
        hover: theme === "dark" ? "hover:bg-red-600" : "hover:bg-red-500",
        text: theme === "dark" ? "text-red-300" : "text-red-800",
        border: theme === "dark" ? "border-red-500" : "border-red-400",
      },
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  const getLeagueData = (leagueType: string) => {
    return getLeagueDataForReusableTable(leagueType);
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab) => {
          const colors = getTabColors(tab.color);
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 border-2 ${
                isActive
                  ? `${colors.active} ${colors.border} text-white shadow-lg`
                  : `${colors.hover} ${colors.text} border-transparent hover:border-current`
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {(() => {
            const leagueData = getLeagueData(activeTab);
            if (!leagueData) {
              return (
                <div className="text-center py-12">
                  <p className="text-theme-text-muted">
                    Podaci za {activeTab} ligu nisu dostupni.
                  </p>
                </div>
              );
            }

            return <ReusableLeagueTable {...leagueData} className="mb-8" />;
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
