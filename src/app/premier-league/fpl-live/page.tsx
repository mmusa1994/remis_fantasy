"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MdDashboard,
  MdGroup,
  MdInfo,
  MdExpandMore,
  MdCancel,
  MdPlayArrow,
  MdStop,
  MdRefresh,
  MdCompareArrows,
} from "react-icons/md";

import { FaChartLine, FaTrophy } from "react-icons/fa";
import { TbTransfer } from "react-icons/tb";

import { IoFootballOutline } from "react-icons/io5";
import { Zap, Users, Target, TrendingUp, ChevronDown, Sparkles, ClipboardList, Lightbulb, ArrowRight } from "lucide-react";
import Image from "next/image";

import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import AdvancedStatistics from "@/components/fpl/AdvancedStatistics";
import MatchResults from "@/components/fpl/MatchResults";
import TransfersMarket from "@/components/fpl/TransfersMarket";
import { LeagueTable } from "@/components/fpl/league-table";
import Link from "next/link";
import CaptainsAnalysis from "@/components/fpl/CaptainsAnalysis";
import WhatIfSimulator from "@/components/fpl/WhatIfSimulator";
import BpsLivePanel from "@/components/fpl/analytics/BpsLivePanel";
import EffectiveOwnershipPanel from "@/components/fpl/analytics/EffectiveOwnershipPanel";
import ChipUsagePanel from "@/components/fpl/analytics/ChipUsagePanel";
import XptsPredictionsPanel from "@/components/fpl/analytics/XptsPredictionsPanel";
import PLAnthemPlayer from "@/components/fpl/PLAnthemPlayer";
import RankGains from "@/components/fpl/RankGains";
import ThreatsAnalysis from "@/components/fpl/ThreatsAnalysis";
import Comparisons from "@/components/fpl/Comparisons";
import LoadingCard from "@/components/shared/LoadingCard";
import type { FPLGameweekStatus } from "@/types/fpl";

interface FPLData {
  manager?: any;
  team_with_stats?: any[];
  team_totals?: any;
  fixtures?: any[];
  predicted_bonuses?: any[];
  bonus_added?: boolean;
  entry_history?: any;
  captain?: any;
  vice_captain?: any;
  timestamp?: string;
}

type TabType =
  | "overview"
  | "squad"
  | "captains"
  | "live"
  | "whatIf"
  | "gains"
  | "threats"
  | "transfers"
  | "comparisons"
  | "leagues";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

export default function FPLLivePage() {
  const { t } = useTranslation("fpl");
  // const { theme } = useTheme(); // Unused but kept for future use

  // Core state
  const [managerId, setManagerId] = useState<number | null>(null);
  const [gameweek, setGameweek] = useState(1);
  const [activeAnalytics, setActiveAnalytics] = useState<
    "bps" | "effective-ownership" | "chips" | "predictions" | null
  >(null);
  // const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamDataLoading, setTeamDataLoading] = useState(false);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [data, setData] = useState<FPLData>({});
  const [gameweekStatus, setGameweekStatus] =
    useState<FPLGameweekStatus | null>(null);
  const [gameweekStatusLoading, setGameweekStatusLoading] = useState(false);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  // const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
  // null
  // );

  // Master live tracking state
  const [isLiveTracking, setIsLiveTracking] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  // tabLoading removed — instant tab switches, no double loaders

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: "overview",
      label: t("fplLive.tabs.overview"),
      icon: MdDashboard,
      description: t("fplLive.tabs.overviewDesc"),
      color: "purple",
    },
    {
      id: "leagues",
      label: t("fplLive.tabs.leagues"),
      icon: FaTrophy,
      description: t("fplLive.tabs.leaguesDesc"),
      color: "purple",
    },
    {
      id: "squad",
      label: t("fplLive.tabs.squad"),
      icon: MdGroup,
      description: t("fplLive.tabs.squadDesc"),
      color: "purple",
    },
    {
      id: "captains",
      label: t("fplLive.tabs.captains", "Captains"),
      icon: MdGroup,
      description: t("fplLive.tabs.captainsDesc", "Captain & chip analytics"),
      color: "purple",
    },
    {
      id: "whatIf",
      label: t("fplLive.tabs.whatIf", "What-If"),
      icon: MdCompareArrows,
      description: t("fplLive.tabs.whatIfDesc", "Scenario simulator"),
      color: "purple",
    },
    {
      id: "gains",
      label: t("fplLive.tabs.gains", "Gains"),
      icon: FaChartLine,
      description: t("fplLive.tabs.gainsDesc", "Player contributions"),
      color: "purple",
    },
    {
      id: "threats",
      label: t("fplLive.tabs.threats", "Threats"),
      icon: MdInfo,
      description: t("fplLive.tabs.threatsDesc", "Players hurting your rank"),
      color: "purple",
    },
    {
      id: "transfers",
      label: t("fplLive.tabs.transfers"),
      icon: TbTransfer,
      description: t("fplLive.tabs.transfersDesc"),
      color: "purple",
    },
    {
      id: "comparisons",
      label: t("fplLive.tabs.comparisons", "Compare"),
      icon: MdCompareArrows,
      description: t("fplLive.tabs.comparisonsDesc", "Compare vs benchmarks"),
      color: "purple",
    },
    {
      id: "live",
      label: t("fplLive.tabs.matchResults"),
      icon: IoFootballOutline,
      description: t("fplLive.tabs.matchResultsDesc"),
      color: "purple",
    },
  ];

  // Load manager ID and gameweek from localStorage on mount
  useEffect(() => {
    try {
      const savedManagerId = localStorage.getItem("fpl-manager-id");
      const savedGameweek = localStorage.getItem("fpl-gameweek");

      if (savedManagerId) {
        const parsedId = parseInt(savedManagerId, 10);
        if (!isNaN(parsedId)) {
          setManagerId(parsedId);
        }
      }

      if (savedGameweek) {
        const parsedGw = parseInt(savedGameweek, 10);
        if (!isNaN(parsedGw) && parsedGw >= 1 && parsedGw <= 38) {
          setGameweek(parsedGw);
        }
      }
    } catch (error) {
      console.warn("Error loading from localStorage:", error);
    }
  }, []);

  // Always fall back to detecting the latest live gameweek from FPL when no
  // saved gameweek exists. Robust to API outages — never throws.
  useEffect(() => {
    let cancelled = false;
    const detectLatestGameweek = async () => {
      // Skip if user already has a recent saved choice
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("fpl-gameweek");
        if (saved && !isNaN(parseInt(saved, 10))) return;
      }
      try {
        const res = await fetch("/api/fpl/bootstrap-static");
        if (!res.ok) return;
        const data = await res.json();
        const events: any[] = Array.isArray(data?.data?.events)
          ? data.data.events
          : [];
        if (events.length === 0) return;
        const resolved =
          events.find((e: any) => e?.is_current) ||
          events.find((e: any) => e?.is_next) ||
          [...events].reverse().find((e: any) => e?.finished) ||
          events[events.length - 1];
        if (!cancelled && resolved?.id) setGameweek(resolved.id);
      } catch (err) {
        console.warn("Failed to auto-detect current gameweek:", err);
      }
    };
    detectLatestGameweek();
    return () => {
      cancelled = true;
    };
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    console.info("Success:", message);
  };

  const loadFullTeamData = useCallback(
    async (useManagerId?: number, useGameweek?: number) => {
      const actualManagerId = useManagerId || managerId;
      const actualGameweek = useGameweek || gameweek;

      if (!actualManagerId) return;

      try {
        const teamResponse = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            managerId: actualManagerId,
            gameweek: actualGameweek,
          }),
        });

        if (teamResponse.ok) {
          const teamResult = await teamResponse.json();

          if (teamResult.success) {
            setData(teamResult.data);
            const timestamp = new Date().toISOString();
            setLastUpdated(timestamp);

            setTeamDataLoading(false);
            showSuccess(t("fullTeamDataLoaded"));
          }
        } else {
          console.error(
            "❌ [FRONTEND] API request failed:",
            teamResponse.status,
            teamResponse.statusText
          );
        }
      } catch (err) {
        console.error("💥 [FRONTEND] Failed to load full team data:", err);
        setTeamDataLoading(false);
      }
    },
    [managerId, gameweek, t]
  );

  const loadLeaguesData = useCallback(
    async (useManagerId?: number) => {
      const actualManagerId = useManagerId || managerId;

      if (!actualManagerId) return;

      try {
        const response = await fetch(
          `/api/fpl/leagues?managerId=${actualManagerId}`
        );

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            setLeagueData(result.data);
            setLeaguesLoading(false);
          }
        } else {
          console.error(
            "❌ [FRONTEND] Leagues API request failed:",
            response.status,
            response.statusText
          );
        }
      } catch (err) {
        console.error("💥 [FRONTEND] Failed to load leagues:", err);
        setLeaguesLoading(false);
      }
    },
    [managerId]
  );

  const loadGameweekStatus = useCallback(
    async (useManagerId?: number, useGameweek?: number) => {
      const actualManagerId = useManagerId || managerId;
      const actualGameweek = useGameweek || gameweek;

      if (!actualManagerId) return;

      setGameweekStatusLoading(true);
      try {
        const response = await fetch(
          `/api/fpl/gameweek-status?managerId=${actualManagerId}&gameweek=${actualGameweek}`
        );

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            setGameweekStatus(result.data);
          }
        } else {
          console.error(
            "❌ [FRONTEND] Gameweek Status API request failed:",
            response.status,
            response.statusText
          );
        }
      } catch (err) {
        console.error("💥 [FRONTEND] Failed to load gameweek status:", err);
      } finally {
        setGameweekStatusLoading(false);
      }
    },
    [managerId, gameweek]
  );

  const loadManagerInfo = useCallback(
    async (inputManagerId?: number, inputGameweek?: number) => {
      // Use input values if provided, otherwise fall back to state
      const useManagerId = inputManagerId || managerId;
      const useGameweek = inputGameweek || gameweek;

      if (!useManagerId) {
        showError(t("pleaseEnterManagerId"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (useManagerId !== null) {
          localStorage.setItem("fpl-manager-id", useManagerId.toString());
        }
        localStorage.setItem("fpl-gameweek", useGameweek.toString());

        // Get skeleton data first
        const skeletonResponse = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            managerId: useManagerId,
            gameweek: useGameweek,
            skeleton: true,
          }),
        });

        if (skeletonResponse.ok) {
          const result = await skeletonResponse.json();

          if (result.success) {
            setData(result.data);
            const timestamp = new Date().toISOString();
            setLastUpdated(timestamp);

            // Update state with the actual values being used
            if (inputManagerId) setManagerId(inputManagerId);
            if (inputGameweek) setGameweek(inputGameweek);

            setTeamLoaded(true);
            showSuccess(t("managerInfoLoaded"));
            setLoading(false);

            // Auto-activate live tracking when team loads
            setIsLiveTracking(true);

            // Load additional data in background
            setTeamDataLoading(true);
            loadFullTeamData(useManagerId, useGameweek);

            setLeaguesLoading(true);
            loadLeaguesData(useManagerId);

            loadGameweekStatus(useManagerId, useGameweek);
          } else {
            throw new Error(result.error || "Manager not found");
          }
        } else {
          console.error(
            "❌ [FRONTEND] Skeleton API request failed:",
            skeletonResponse.status,
            skeletonResponse.statusText
          );
          throw new Error(
            `Failed to fetch manager info: ${skeletonResponse.status}`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("💥 [FRONTEND] Error loading manager:", {
          error: err,
          message,
          managerId: useManagerId,
          gameweek: useGameweek,
        });
        showError(message);
        setLoading(false);
      }
    },
    [
      managerId,
      gameweek,
      loadFullTeamData,
      loadLeaguesData,
      loadGameweekStatus,
      t,
    ]
  );

  const toggleLiveTracking = useCallback(() => {
    if (!isLiveTracking) {
      // Start live tracking - Visual only, no API calls
      if (!managerId) {
        showError(t("pleaseEnterManagerId"));
        return;
      }

      setIsLiveTracking(true);

      if (teamLoaded) {
        handleTabChange("leagues");
      }

      showSuccess(t("fplLive.livePollingStarted"));
    } else {
      setIsLiveTracking(false);

      showSuccess(t("fplLive.livePollingStopped"));
    }
  }, [isLiveTracking, managerId, teamLoaded, t]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowTabDropdown(false);
    };

    const handleResize = () => {
      setShowTabDropdown(false);
    };

    if (showTabDropdown) {
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("resize", handleResize);

      return () => {
        document.removeEventListener("click", handleClickOutside);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showTabDropdown]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
  };

  const renderTabContent = () => {
    if (!teamLoaded || !data.manager) {
      return null;
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="bg-theme-card space-y-6 theme-transition">
            <ManagerSummary
              manager={data.manager}
              teamTotals={data.team_totals}
              captain={data.captain}
              viceCaptain={data.vice_captain}
              bonusAdded={data.bonus_added || false}
              gameweek={gameweek}
              lastUpdated={lastUpdated || undefined}
              managerId={managerId || undefined}
              loading={loading || teamDataLoading}
            />
            <GameweekStatus
              gameweekStatus={gameweekStatus || undefined}
              gameweek={gameweek}
              loading={gameweekStatusLoading}
            />
          </div>
        );
      case "squad":
        return teamDataLoading ? (
          <div className="bg-theme-card rounded-lg border border-theme-border theme-transition p-4 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse theme-transition"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            <SquadTable
              teamData={data.team_with_stats || []}
              predictedBonuses={data.predicted_bonuses || []}
              bonusAdded={data.bonus_added || false}
            />
          </div>
        );
      case "leagues":
        return leaguesLoading ? (
          <div className="bg-theme-card rounded-lg border border-theme-border theme-transition p-4 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse theme-transition"></div>
            ))}
          </div>
        ) : (
          leagueData && (
            <div className="space-y-4 lg:space-y-6">
              {/* Live Status */}
              <div className="bg-theme-card rounded-md px-3 py-2 border border-theme-border theme-transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isLiveTracking
                          ? "bg-green-500 animate-pulse"
                          : "bg-theme-text-secondary"
                      }`}
                    ></div>
                    <p className="text-xs text-theme-text-secondary theme-transition">
                      {isLiveTracking
                        ? t("fplLive.liveTrackingActive")
                        : t("fplLive.readyForLiveTracking")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={toggleLiveTracking}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                        isLiveTracking
                          ? "bg-theme-card-secondary hover:bg-theme-border text-theme-text-secondary"
                          : "bg-theme-card-secondary hover:bg-theme-border text-theme-foreground"
                      }`}
                    >
                      {isLiveTracking ? (
                        <MdStop className="w-3 h-3" />
                      ) : (
                        <MdPlayArrow className="w-3 h-3" />
                      )}
                      <span>
                        {isLiveTracking
                          ? t("fplLive.stopLive")
                          : t("fplLive.startLive")}
                      </span>
                    </button>
                    <button
                      onClick={() => loadManagerInfo()}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-card-secondary hover:bg-theme-border text-theme-text-secondary rounded text-xs font-medium transition-all"
                    >
                      <MdRefresh className="w-3 h-3" />
                      <span className="hidden sm:inline">{t("refresh")}</span>
                    </button>
                  </div>
                </div>
              </div>
              <LeagueTable
                managerId={managerId || undefined}
                gameweek={gameweek}
                isPolling={isLiveTracking}
              />
              <div className="bg-theme-card rounded-lg border border-theme-border p-4">
                <h4 className="text-sm font-bold text-theme-foreground mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  More Live Analytics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    { key: "bps", label: "BPS Live", Icon: Zap },
                    { key: "effective-ownership", label: "EO Buckets", Icon: Users },
                    { key: "chips", label: "Chip Usage", Icon: Target },
                    { key: "predictions", label: "xPts Predictions", Icon: TrendingUp },
                  ].map((a) => {
                    const isActive = activeAnalytics === (a.key as any);
                    const ItemIcon = a.Icon;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() =>
                          setActiveAnalytics(isActive ? null : (a.key as any))
                        }
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-all border ${
                          isActive
                            ? "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white border-purple-600 shadow-sm"
                            : "bg-theme-card-secondary border-transparent hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/40 dark:hover:bg-purple-900/20 text-theme-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          <ItemIcon className="w-3.5 h-3.5" />
                          {a.label}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                {activeAnalytics && (
                  <div className="mt-3 rounded-lg border border-purple-200/40 dark:border-purple-800/40 overflow-hidden bg-theme-card animate-in fade-in slide-in-from-top-1 duration-200">
                    {activeAnalytics === "bps" && <BpsLivePanel />}
                    {activeAnalytics === "effective-ownership" && <EffectiveOwnershipPanel />}
                    {activeAnalytics === "chips" && <ChipUsagePanel />}
                    {activeAnalytics === "predictions" && <XptsPredictionsPanel />}
                  </div>
                )}
              </div>
            </div>
          )
        );
      case "captains":
        return (
          <CaptainsAnalysis
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "live":
        return (
          <MatchResults
            gameweek={gameweek}
            isPolling={isLiveTracking}
            onManagerSelect={(selectedManagerId) => {
              // Future: Load manager-specific data
            }}
          />
        );
      case "whatIf":
        return (
          <WhatIfSimulator
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "gains":
        return (
          <RankGains
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "threats":
        return (
          <ThreatsAnalysis
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      case "transfers":
        return <TransfersMarket />;
      case "comparisons":
        return (
          <Comparisons
            managerId={managerId || undefined}
            gameweek={gameweek}
            managerData={data}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-theme-background theme-transition">
      <PLAnthemPlayer />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme-foreground mb-3 theme-transition">
              {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-theme-foreground max-w-2xl mx-auto leading-relaxed theme-transition">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-theme-card border-theme-border text-red-700 dark:text-red-300 p-4 rounded-md theme-transition">
            <div className="flex items-start gap-3">
              <MdCancel className="text-red-500 w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Mobile-First Setup Interface */}
        {!teamLoaded && (
          <div className="space-y-4 lg:space-y-6">
            {/* How to Use Guide - Sophisticated accordion */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-fuchsia-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-fuchsia-950/10 border border-purple-200/50 dark:border-purple-800/30 rounded-xl shadow-sm theme-transition">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />
              {/* PL logo, top-right, transparent — adjusted so it's fully visible on all breakpoints */}
              <Image
                src="/images/logos/pl-logo.png"
                alt="Premier League"
                width={120}
                height={120}
                priority={false}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain opacity-10 dark:opacity-15 pointer-events-none select-none"
              />
              <details className="group">
                <summary className="relative z-10 flex items-center gap-3 p-4 sm:p-5 cursor-pointer hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors theme-transition list-none [&::-webkit-details-marker]:hidden">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Lightbulb className="text-white w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-theme-foreground text-base">
                      {t("howToUse")}
                    </h3>
                    <p className="text-xs text-theme-text-secondary mt-0.5">
                      {t("fplLive.howToFindManagerIdShort", "Brzo objašnjenje kako pronaći svoj Manager ID")}
                    </p>
                  </div>
                  <ChevronDown className="text-theme-text-secondary group-open:rotate-180 transition-transform duration-200 w-5 h-5 shrink-0" />
                </summary>

                <div className="relative z-10 px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                  <div className="p-4 sm:p-5 bg-white/70 dark:bg-slate-900/50 rounded-lg border border-purple-200/40 dark:border-purple-800/30 backdrop-blur-sm">
                    <h4 className="font-semibold text-theme-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <ClipboardList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{t("fplLive.howToFindManagerIdDetailed")}</span>
                    </h4>

                    <ol className="space-y-2.5 text-sm">
                      {[
                        t("fplLive.openWebBrowser"),
                        <>
                          {t("fplLive.goToFPLWebsite")}{" "}
                          <strong className="text-purple-700 dark:text-purple-300 break-all">
                            fantasy.premierleague.com
                          </strong>
                        </>,
                        t("fplLive.loginToAccount"),
                        t("fplLive.clickPointsTab"),
                        <>
                          {t("fplLive.copyNumbersFromURL")}{" "}
                          <span className="text-xs text-theme-text-secondary block sm:inline">
                            (e.g. entry/133444/event/1)
                          </span>
                        </>,
                      ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white text-[11px] font-bold shadow-sm">
                            {idx + 1}
                          </span>
                          <span className="text-theme-foreground leading-relaxed flex-1 pt-0.5">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-5 p-3.5 rounded-lg bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/30 border border-purple-200/60 dark:border-purple-800/40">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2.5 uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{t("fplLive.exampleURL")}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-950 text-theme-foreground p-2.5 rounded-md font-mono text-xs sm:text-sm break-all border border-purple-200/40 dark:border-purple-800/40">
                        fantasy.premierleague.com/entry/<span className="font-bold text-purple-700 dark:text-purple-300">133444</span>/event/1
                      </div>
                      <p className="text-xs text-theme-text-secondary mt-2.5 flex items-center gap-1.5 justify-center">
                        <ArrowRight className="w-3 h-3 text-purple-500" />
                        {t("fplLive.yourManagerIdIs2")}{" "}
                        <strong className="text-sm sm:text-base font-bold text-purple-700 dark:text-purple-300">
                          133444
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Controls */}
            <ControlsBar
              managerId={managerId}
              gameweek={gameweek}
              isPolling={false}
              onManagerIdChange={setManagerId}
              onGameweekChange={setGameweek}
              onLoadTeam={(inputManagerId, inputGameweek) =>
                loadManagerInfo(inputManagerId, inputGameweek)
              }
              onStartPolling={() => {}}
              onStopPolling={() => {}}
              loading={loading}
            />
          </div>
        )}

        {/* Mobile-First Dashboard Interface */}
        {teamLoaded && data.manager && (
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile-Optimized Controls Bar */}
            <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-5 border-theme-border theme-transition">
              <div className="flex items-center gap-3">
                {/* Manager Info - Always visible */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
                  <IoFootballOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-theme-foreground text-sm sm:text-base lg:text-lg truncate theme-transition">
                    {data.manager?.player_first_name}{" "}
                    {data.manager?.player_last_name}
                  </p>
                  <p className="text-xs sm:text-sm text-theme-text-secondary theme-transition">
                    GW{gameweek} • ID: {managerId}
                  </p>
                </div>

                {/* Refresh button */}
                <button
                  onClick={() => loadManagerInfo()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-theme-card-secondary hover:bg-theme-border text-theme-text-secondary rounded-md text-xs font-medium transition-all min-h-[36px] flex-shrink-0"
                >
                  <MdRefresh className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("refresh")}</span>
                </button>
              </div>
            </div>

            {/* Responsive Tab Navigation */}
            <div className="bg-theme-card rounded-md border-theme-border overflow-hidden theme-transition">
              <div className="border-b border-theme-border bg-theme-card theme-transition">
                {/* Mobile: Show 3 tabs + dropdown */}
                <div className="sm:hidden">
                  <div className="flex">
                    {tabs.slice(0, 3).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium transition-all border-b-2 min-h-[48px] ${
                            isActive
                              ? "border-purple-500 text-purple-600 dark:text-purple-400"
                              : "border-transparent text-theme-text-secondary"
                          } theme-transition`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="leading-tight text-center">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}

                    {/* Dropdown for remaining tabs */}
                    <div className="relative flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTabDropdown(!showTabDropdown);
                        }}
                        className={`w-full flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium transition-all border-b-2 min-h-[48px] ${
                          tabs.slice(3).some((tab) => tab.id === activeTab)
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-theme-text-secondary"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="leading-tight text-center">
                          {tabs.slice(3).find((tab) => tab.id === activeTab)
                            ?.label || t("fplLive.common.more")}
                        </span>
                      </button>

                      {/* Dropdown Menu - Mobile Optimized */}
                      {showTabDropdown && (
                        <>
                          {/* Overlay to close dropdown when clicking outside */}
                          <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
                            onClick={() => setShowTabDropdown(false)}
                          />
                          <div className="absolute top-full right-0 w-44 max-w-[90vw] bg-theme-card border border-theme-border rounded-lg shadow-lg z-50 overflow-hidden theme-transition">
                            <div className="py-1">
                              {tabs.slice(3).map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      handleTabChange(tab.id);
                                      setShowTabDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all touch-manipulation ${
                                      isActive
                                        ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10"
                                        : "text-theme-text-secondary hover:bg-theme-card-secondary"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">
                                      {tab.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tablet: Show 4 tabs + dropdown */}
                <div className="hidden sm:flex md:hidden">
                  {tabs.slice(0, 4).map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-all border-b-2 min-h-[44px] ${
                          isActive
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-theme-text-secondary"
                        } theme-transition`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}

                  {/* Tablet Dropdown */}
                  {tabs.length > 4 && (
                    <div className="relative flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTabDropdown(!showTabDropdown);
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-all border-b-2 min-h-[44px] ${
                          tabs.slice(4).some((tab) => tab.id === activeTab)
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-theme-text-secondary"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {tabs.slice(4).find((tab) => tab.id === activeTab)
                            ?.label || t("fplLive.common.more")}
                        </span>
                      </button>

                      {showTabDropdown && (
                        <>
                          {/* Overlay to close dropdown when clicking outside - Tablet */}
                          <div
                            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setShowTabDropdown(false)}
                          />
                          <div className="absolute top-full right-0 w-48 max-w-[85vw] bg-theme-card border border-theme-border rounded-lg shadow-lg z-50 overflow-hidden theme-transition">
                            <div className="py-1">
                              {tabs.slice(4).map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      handleTabChange(tab.id);
                                      setShowTabDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all touch-manipulation ${
                                      isActive
                                        ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10"
                                        : "text-theme-text-secondary hover:bg-theme-card-secondary"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">
                                      {tab.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop: Show all tabs */}
                <div className="hidden md:flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex-1 relative flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-semibold transition-all border-b-2 min-h-[52px] ${
                          isActive
                            ? "border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-900/15"
                            : "border-transparent text-theme-text-secondary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/20 dark:hover:bg-purple-900/10"
                        } theme-transition`}
                      >
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-md transition-all ${
                            isActive
                              ? "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-sm"
                              : "bg-theme-card-secondary text-theme-text-secondary"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="tracking-tight">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content with Mobile Padding */}
              <div className="p-3 sm:p-4 lg:p-6 bg-theme-card theme-transition">
                {renderTabContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
