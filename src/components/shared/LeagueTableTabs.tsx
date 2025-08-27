"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ReusableLeagueTable from "./ReusableLeagueTable";
import { getLeagueDataForReusableTable } from "@/data/leagueTableData";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";

interface LeaguePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  points: number;
  position: number;
  league_type: string;
  h2h_category: "h2h" | "h2h2" | null;
  h2h_points: number | null;
  h2h_stats: { w: number; d: number; l: number } | null;
}

interface LeagueTables {
  premiumLeague: LeaguePlayer[];
  standardLeague: LeaguePlayer[];
  h2hLeague: LeaguePlayer[];
  h2h2League: LeaguePlayer[];
  freeLeague: LeaguePlayer[];
}

export default function LeagueTableTabs() {
  const { t } = useTranslation();

  const tabs = [
    { id: "premium", label: t("fplLive.premiumLeague"), color: "yellow" },
    { id: "standard", label: t("fplLive.standardLeague"), color: "blue" },
    { id: "h2h", label: t("fplLive.h2hLeague"), color: "red" },
    { id: "h2h2", label: t("fplLive.h2h2League"), color: "red" },
    { id: "free", label: t("fplLive.freeLeague"), color: "purple" },
  ];
  const [activeTab, setActiveTab] = useState("premium");
  const [tables, setTables] = useState<LeagueTables | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      purple: {
        active: theme === "dark" ? "bg-purple-500" : "bg-purple-400",
        hover: theme === "dark" ? "hover:bg-purple-600" : "hover:bg-purple-500",
        text: theme === "dark" ? "text-purple-300" : "text-purple-800",
        border: theme === "dark" ? "border-purple-500" : "border-purple-400",
      },
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/premier-league-tables");
        if (!response.ok) {
          throw new Error("Failed to fetch tables");
        }

        const data = await response.json();
        setTables(data.tables);
      } catch (error) {
        console.error("Error loading tables:", error);
        setError(t("fplLive.leagueTableErrorLoading"));
      } finally {
        setLoading(false);
      }
    };

    loadTables();
  }, [t]);

  const getLeagueData = (leagueType: string) => {
    // Get static league configuration (prizes, fees, etc.) from original data
    const staticLeagueData = getLeagueDataForReusableTable(leagueType);

    // Special handling for free league if no static data found
    if (leagueType === "free") {
      const freeFallbackData = {
        name: "Free Liga",
        type: "free" as const,
        totalPrizeFundKM: 0,
        totalPrizeFundEUR: 0,
        entryFeeKM: 0,
        entryFeeEUR: 0,
        monthlyPrizeKM: 0,
        monthlyPrizeEUR: 0,
        cupPrizeKM: 0,
        cupPrizeEUR: 0,
        maxParticipants: 1,
        prizes: [
          {
            position: 1,
            description: "ORIGINAL DRES Premier Liga 25/26",
            amountKM: 0,
            amountEUR: 0,
            percentage: 0,
          },
        ],
      };

      if (!tables) return null;

      let dynamicPlayers = [...tables.freeLeague].sort(
        (a, b) => b.points - a.points
      );
      dynamicPlayers = dynamicPlayers.map((player, index) => ({
        ...player,
        position: index + 1,
      }));

      return {
        ...freeFallbackData,
        leagueName: freeFallbackData.name,
        leagueType: freeFallbackData.type,
        players: dynamicPlayers.map((player) => ({
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          teamName: player.teamName,
          points: player.points,
          position: player.position,
          h2h_points: player.h2h_points,
          h2h_stats: player.h2h_stats,
        })),
      };
    }

    if (!staticLeagueData || !tables) return null;

    // Get dynamic players from database and sort them properly
    let dynamicPlayers: LeaguePlayer[] = [];

    switch (leagueType) {
      case "premium":
        dynamicPlayers = [...tables.premiumLeague].sort(
          (a, b) => b.points - a.points
        );
        break;
      case "standard":
        dynamicPlayers = [...tables.standardLeague].sort(
          (a, b) => b.points - a.points
        );
        break;
      case "h2h":
        dynamicPlayers = [...tables.h2hLeague].sort((a, b) => {
          const aH2HPoints = a.h2h_points || 0;
          const bH2HPoints = b.h2h_points || 0;

          // First sort by H2H points
          if (bH2HPoints !== aH2HPoints) {
            return bH2HPoints - aH2HPoints;
          }

          // If H2H points are equal, sort by overall points
          return b.points - a.points;
        });
        break;
      case "h2h2":
        dynamicPlayers = [...tables.h2h2League].sort((a, b) => {
          const aH2HPoints = a.h2h_points || 0;
          const bH2HPoints = b.h2h_points || 0;

          // First sort by H2H points
          if (bH2HPoints !== aH2HPoints) {
            return bH2HPoints - aH2HPoints;
          }

          // If H2H points are equal, sort by overall points
          return b.points - a.points;
        });
        break;
      case "free":
        dynamicPlayers = [...tables.freeLeague].sort(
          (a, b) => b.points - a.points
        );
        break;
      default:
        return null;
    }

    // Recalculate positions based on sorted order
    dynamicPlayers = dynamicPlayers.map((player, index) => ({
      ...player,
      position: index + 1,
    }));

    // Combine static configuration with dynamic players
    return {
      ...staticLeagueData,
      leagueName: staticLeagueData.name,
      leagueType: staticLeagueData.type,
      players: dynamicPlayers.map((player) => ({
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        teamName: player.teamName,
        points: player.points,
        position: player.position,
        h2h_points: player.h2h_points,
        h2h_stats: player.h2h_stats,
      })),
    };
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
            if (loading) {
              return (
                <div className="py-4 flex justify-center">
                  <LoadingCard 
                    title={`Loading ${tabs.find((t) => t.id === activeTab)?.label}`}
                    description="Please wait while we fetch the latest league standings"
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              );
            }

            if (error) {
              return (
                <div className="text-center py-12">
                  <p
                    className={
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }
                  >
                    {error}
                  </p>
                </div>
              );
            }

            const leagueData = getLeagueData(activeTab);
            if (!leagueData || leagueData.players.length === 0) {
              return (
                <div className="text-center py-12">
                  <p
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }
                  >
                    Nema podataka za{" "}
                    {tabs.find((t) => t.id === activeTab)?.label}.
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
