"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReusableLeagueTable from "./ReusableLeagueTable";
import { getLeagueDataForReusableTable } from "@/data/leagueTableData";
import { Trophy } from "lucide-react";
import { LeagueTableSkeleton } from "./TableSkeletons";
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

type Season = "25_26" | "26_27";

export default function LeagueTableTabs() {
  const { t } = useTranslation();

  const [season, setSeason] = useState<Season>("26_27");

  // H2H2 liga postoji samo u sezoni 25/26 — od 26/27 je samo jedna H2H liga
  const tabs = [
    { id: "premium", label: t("fplLive.premiumLeague"), color: "yellow" },
    { id: "standard", label: t("fplLive.standardLeague"), color: "blue" },
    { id: "h2h", label: t("fplLive.h2hLeague"), color: "red" },
    ...(season === "25_26"
      ? [{ id: "h2h2", label: t("fplLive.h2h2League"), color: "red" }]
      : []),
    { id: "free", label: t("fplLive.freeLeague"), color: "purple" },
  ];
  const [activeTab, setActiveTab] = useState("premium");
  const [tables, setTables] = useState<LeagueTables | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/premier-league-tables?season=${season}`
        );
        if (!response.ok) {
          throw new Error(t("fplLive.leagueTableErrorLoading"));
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
  }, [t, season, reloadKey]);

  const getLeagueData = (leagueType: string) => {
    // Get static league configuration (prizes, fees, etc.) from original data
    const staticLeagueData = getLeagueDataForReusableTable(leagueType, season);

    // Special handling for free league if no static data found
    if (leagueType === "free") {
      const freeFallbackData = {
        name: t("fplLive.freeLeague"),
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

  const ACCENT: Record<string, string> = {
    yellow: "#f5b50a",
    blue: "#3b82f6",
    red: "#f43f5e",
    purple: "#8b5cf6",
  };

  const renderBody = () => {
    if (loading) return <LeagueTableSkeleton />;

    if (error) {
      return (
        <div className="mx-auto max-w-md rounded-2xl border border-theme-border bg-theme-card px-6 py-10 text-center">
          <p className="font-bold text-theme-foreground">{t("leagueTables.errorTitle")}</p>
          <p className="mt-1 text-sm text-theme-text-muted">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-4 rounded-full bg-theme-foreground px-4 py-2 text-sm font-bold text-theme-background"
          >
            {t("leagueTables.retry")}
          </button>
        </div>
      );
    }

    const leagueData = getLeagueData(activeTab);
    // 26/27: show the league card (prizes etc.) even before standings exist
    if (leagueData && leagueData.players.length === 0 && season === "26_27" && activeTab !== "free") {
      return (
        <ReusableLeagueTable {...leagueData} seasonLabel="2026/27" className="mb-8" />
      );
    }

    if (!leagueData || leagueData.players.length === 0) {
      const accent = ACCENT[tabs.find((tab) => tab.id === activeTab)?.color || "purple"];
      if (season === "26_27") {
        return (
          <div
            className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl px-6 py-14 text-center text-white"
            style={{
              background: `radial-gradient(90% 120% at 50% 0%, ${accent}66 0%, transparent 60%), linear-gradient(160deg, #07071a, #12122e)`,
            }}
          >
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${accent}33`, boxShadow: `0 0 40px ${accent}55` }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Trophy className="h-8 w-8" style={{ color: accent }} />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-black">{t("leagueTables.comingSoonTitle")}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">{t("leagueTables.comingSoonText")}</p>
          </div>
        );
      }
      return (
        <div className="py-12 text-center text-theme-text-muted">
          {t("fplLive.noDataFor", {
            league: tabs.find((tab) => tab.id === activeTab)?.label,
          })}
        </div>
      );
    }

    return (
      <ReusableLeagueTable
        {...leagueData}
        seasonLabel={season === "26_27" ? "2026/27" : "2025/26"}
        className="mb-8"
      />
    );
  };

  return (
    <div className="w-full">
      {/* Season switcher */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-full border border-theme-border bg-theme-card p-1 shadow-sm">
          {(["25_26", "26_27"] as Season[]).map((s) => {
            const isActive = season === s;
            return (
              <button
                key={s}
                onClick={() => {
                  setSeason(s);
                  if (s === "26_27" && activeTab === "h2h2") setActiveTab("h2h");
                }}
                className={`relative rounded-full px-4 sm:px-5 py-1.5 text-sm font-bold transition-colors ${
                  isActive ? "text-theme-background" : "text-theme-text-muted hover:text-theme-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="season-pill"
                    className="absolute inset-0 rounded-full bg-theme-foreground"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {s === "26_27" ? "2026/27" : "2025/26"}
                  {s === "25_26" && (
                    <span className="ml-1 text-[10px] font-semibold opacity-70">· {t("leagueTables.completed")}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* League tabs */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
        <div className="mx-auto flex w-max gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const accent = ACCENT[tab.color];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "border-transparent text-white"
                    : "border-theme-border bg-theme-card text-theme-text-secondary hover:text-theme-foreground"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                        boxShadow: `0 10px 24px -10px ${accent}`,
                      }
                    : undefined
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: isActive ? "#fff" : accent }}
                  />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content — fixed min height so switching never jumps the page */}
      <div className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${season}-${activeTab}-${loading ? "l" : "d"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {renderBody()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
