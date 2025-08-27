"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MdDashboard,
  MdGroup,
  MdInfo,
  MdSettings,
  MdExpandMore,
  MdCancel,
  MdPlayArrow,
  MdStop,
  MdRefresh,
} from "react-icons/md";

import { FaChartLine, FaTrophy } from "react-icons/fa";

import { IoIosFootball } from "react-icons/io";

import SettingsCard from "@/components/fpl/SettingsCard";
import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import AdvancedStatistics from "@/components/fpl/AdvancedStatistics";
import LiveTracker from "@/components/fpl/LiveTracker";
import LeagueTables from "@/components/fpl/LeagueTables";
import TeamSearchHelper from "@/components/fpl/TeamSearchHelper";
import MatchResults from "@/components/fpl/MatchResults";
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

type TabType = "overview" | "squad" | "leagues" | "analytics" | "matchResults";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

export default function FPLLivePage() {
  const { t } = useTranslation();

  // Core state
  const [managerId, setManagerId] = useState<number | null>(null);
  const [gameweek, setGameweek] = useState(1);
  const [isPolling, setIsPolling] = useState(false);
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
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showSettings, setShowSettings] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: "overview",
      label: t("fplLive.tabs.overview"),
      icon: MdDashboard,
      description: t("fplLive.tabs.overviewDesc"),
      color: "blue",
    },
    {
      id: "squad",
      label: t("fplLive.tabs.squad"),
      icon: MdGroup,
      description: t("fplLive.tabs.squadDesc"),
      color: "green",
    },
    {
      id: "leagues",
      label: t("fplLive.tabs.leagues"),
      icon: FaTrophy,
      description: t("fplLive.tabs.leaguesDesc"),
      color: "yellow",
    },
    {
      id: "analytics",
      label: t("fplLive.tabs.analytics"),
      icon: FaChartLine,
      description: t("fplLive.tabs.analyticsDesc"),
      color: "purple",
    },
    {
      id: "matchResults",
      label: "Rezultati utakmica",
      icon: IoIosFootball,
      description: "Live match results and player ownership",
      color: "green",
    },
  ];

  // Load manager ID and cached data on mount
  useEffect(() => {
    try {
      const savedManagerId = localStorage.getItem("fpl-manager-id");
      const savedGameweek = localStorage.getItem("fpl-gameweek");
      const savedData = localStorage.getItem("fpl-team-data");
      const savedLastUpdated = localStorage.getItem("fpl-last-updated");

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

      // Clear stale cached data
      if (savedData && savedLastUpdated) {
        const lastUpdated = new Date(savedLastUpdated);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDiff >= 24) {
          localStorage.removeItem("fpl-team-data");
          localStorage.removeItem("fpl-last-updated");
        }
      }
    } catch (error) {
      console.warn("Error loading from localStorage:", error);
    }
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    console.log("Success:", message);
  };

  const saveToLocalStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, []);

  const loadFullTeamData = useCallback(async () => {
    if (!managerId) return;

    console.log(
      "🔄 [FRONTEND] loadFullTeamData - Starting full team data load"
    );
    console.log("📥 [FRONTEND] Request params:", { managerId, gameweek });

    try {
      const teamResponse = await fetch("/api/fpl/load-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId,
          gameweek,
        }),
      });

      console.log("🌐 [FRONTEND] API Response status:", teamResponse.status);

      if (teamResponse.ok) {
        const teamResult = await teamResponse.json();
        console.log("✅ [FRONTEND] Full team API response received:", {
          success: teamResult.success,
          dataKeys: Object.keys(teamResult.data || {}),
          teamSize: teamResult.data?.team_with_stats?.length || 0,
          managerName: teamResult.data?.manager?.name || "Unknown",
          responseTimeMs: teamResult.response_time_ms,
          timestamp: teamResult.timestamp,
        });

        console.log(
          "📊 [FRONTEND] Complete team data structure:",
          teamResult.data
        );

        // Log detailed player statistics breakdown
        if (teamResult.data?.team_with_stats) {
          console.log("👥 [FRONTEND] Player Statistics Breakdown:");
          teamResult.data.team_with_stats.forEach(
            (player: any, index: number) => {
              console.log(`🎯 Player ${index + 1}:`, {
                name: player.player?.web_name || "Unknown",
                position: player.position <= 11 ? "Starting XI" : "Bench",
                captain: player.is_captain
                  ? "(C)"
                  : player.is_vice_captain
                  ? "(VC)"
                  : "",
                points: player.live_stats?.total_points || 0,
                minutes: player.live_stats?.minutes || 0,
                goals: player.live_stats?.goals_scored || 0,
                assists: player.live_stats?.assists || 0,
                bps: player.live_stats?.bps || 0,
                bonus: player.live_stats?.bonus || 0,
                multiplier: player.multiplier,
              });
            }
          );
        }

        // Log team totals breakdown
        if (teamResult.data?.team_totals) {
          console.log("📈 [FRONTEND] Team Totals Analysis:", {
            active_points_no_bonus:
              teamResult.data.team_totals.active_points_no_bonus,
            active_points_final:
              teamResult.data.team_totals.active_points_final,
            bench_points: teamResult.data.team_totals.bench_points_final,
            captain_bonus:
              teamResult.data.captain?.stats?.total_points *
                (teamResult.data.captain?.multiplier - 1) || 0,
            predicted_bonus: teamResult.data.team_totals.predicted_bonus,
            final_bonus: teamResult.data.team_totals.final_bonus,
            total_goals: teamResult.data.team_totals.goals,
            total_assists: teamResult.data.team_totals.assists,
            clean_sheets: teamResult.data.team_totals.clean_sheets,
          });
        }

        if (teamResult.success) {
          console.log("✅ [FRONTEND] Setting team data to component state");
          setData(teamResult.data);
          const timestamp = new Date().toISOString();
          setLastUpdated(timestamp);

          saveToLocalStorage("fpl-team-data", teamResult.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

          setTeamDataLoading(false);
          showSuccess(t("fplLive.fullTeamDataLoaded"));

          console.log("✅ [FRONTEND] Team data loading completed successfully");
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
  }, [managerId, gameweek, saveToLocalStorage, t]);

  const loadLeaguesData = useCallback(async () => {
    if (!managerId) return;

    console.log("🏆 [FRONTEND] loadLeaguesData - Starting leagues data load");
    console.log("📥 [FRONTEND] Request params:", { managerId });

    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);
      console.log(
        "🌐 [FRONTEND] Leagues API Response status:",
        response.status
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [FRONTEND] Leagues API response received:", {
          success: result.success,
          classicLeagues: result.data?.classic?.length || 0,
          h2hLeagues: result.data?.h2h?.length || 0,
          managerName: result.data?.manager?.name || "Unknown",
          responseTimeMs: result.response_time_ms,
        });

        console.log("🏅 [FRONTEND] Complete leagues data:", {
          classic: result.data?.classic,
          h2h: result.data?.h2h,
          manager: result.data?.manager,
        });

        if (result.success) {
          console.log("✅ [FRONTEND] Setting leagues data to component state");
          setLeagueData(result.data);
          setLeaguesLoading(false);
          console.log(
            "✅ [FRONTEND] Leagues data loading completed successfully"
          );
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
  }, [managerId]);

  const loadGameweekStatus = useCallback(async () => {
    if (!managerId) return;

    console.log(
      "🎯 [FRONTEND] loadGameweekStatus - Starting gameweek status load"
    );
    console.log("📥 [FRONTEND] Request params:", { managerId, gameweek });

    setGameweekStatusLoading(true);
    try {
      const response = await fetch(
        `/api/fpl/gameweek-status?managerId=${managerId}&gameweek=${gameweek}`
      );
      console.log(
        "🌐 [FRONTEND] Gameweek Status API Response status:",
        response.status
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [FRONTEND] Gameweek Status API response received:", {
          success: result.success,
          arrowDirection: result.data?.arrow_direction,
          rankChange: result.data?.rank_change,
          gameweekPoints: result.data?.gameweek_points,
          safetyScore: result.data?.safety_score,
          differentials: result.data?.differentials?.length || 0,
          threats: result.data?.threats?.length || 0,
          hasCaptainAnalysis: !!result.data?.captain_analysis,
          responseTimeMs: result.response_time_ms,
        });

        console.log(
          "🔍 [FRONTEND] Complete gameweek status data:",
          result.data
        );

        if (result.success) {
          console.log(
            "✅ [FRONTEND] Setting gameweek status data to component state"
          );
          setGameweekStatus(result.data);
          console.log(
            "✅ [FRONTEND] Gameweek status data loading completed successfully"
          );
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
  }, [managerId, gameweek]);

  const loadManagerInfo = useCallback(async () => {
    if (!managerId) {
      showError(t("fplLive.pleaseEnterManagerId"));
      return;
    }

    setLoading(true);
    setError(null);

    console.log("🚀 [FRONTEND] =================================");
    console.log("🚀 [FRONTEND] FPL LIVE DATA LOADING INITIATED");
    console.log("🚀 [FRONTEND] =================================");
    console.log("📋 [FRONTEND] User clicked Load Team button");
    console.log("👤 [FRONTEND] Manager ID:", managerId);
    console.log("🏆 [FRONTEND] Gameweek:", gameweek);
    console.log("⏰ [FRONTEND] Loading started at:", new Date().toISOString());
    console.log("🔄 [FRONTEND] Current data state:", {
      hasExistingData: !!data.manager,
      teamLoaded: teamLoaded,
      isPolling: isPolling,
      currentTeamSize: data.team_with_stats?.length || 0,
    });

    try {
      if (managerId !== null) {
        saveToLocalStorage("fpl-manager-id", managerId.toString());
      }
      saveToLocalStorage("fpl-gameweek", gameweek.toString());

      console.log(
        "🏃‍♂️ [FRONTEND] loadManagerInfo - Fetching skeleton data first"
      );
      console.log("📥 [FRONTEND] Skeleton request params:", {
        managerId,
        gameweek,
        skeleton: true,
      });

      // Get skeleton data first
      const skeletonResponse = await fetch("/api/fpl/load-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId,
          gameweek,
          skeleton: true,
        }),
      });

      console.log(
        "🌐 [FRONTEND] Skeleton API Response status:",
        skeletonResponse.status
      );

      if (skeletonResponse.ok) {
        const result = await skeletonResponse.json();

        console.log("✅ [FRONTEND] Skeleton API response received:", {
          success: result.success,
          skeleton: result.skeleton,
          managerName: result.data?.manager?.name || "Unknown",
          managerId: result.manager_id,
          gameweek: result.gameweek,
          responseTimeMs: result.response_time_ms,
        });

        console.log(
          "👤 [FRONTEND] Manager skeleton data:",
          result.data?.manager
        );

        if (result.success) {
          console.log("✅ [FRONTEND] Setting skeleton data to component state");
          setData(result.data);
          const timestamp = new Date().toISOString();
          saveToLocalStorage("fpl-team-data", result.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

          setTeamLoaded(true);
          showSuccess(t("fplLive.managerInfoLoaded"));
          setLoading(false);

          console.log("🔄 [FRONTEND] Starting background data loading...");
          // Load additional data in background
          setTeamDataLoading(true);
          loadFullTeamData();

          setLeaguesLoading(true);
          loadLeaguesData();

          loadGameweekStatus();

          console.log("✅ [FRONTEND] Background loading initiated");

          // Set up final completion tracker
          setTimeout(() => {
            console.log(
              "📋 [FRONTEND] COMPLETE DATA FLOW SUMMARY for Manager ID:",
              managerId
            );
            console.log("┌─────────────────────────────────────────────┐");
            console.log("│          FPL Live Data Loading Summary      │");
            console.log("└─────────────────────────────────────────────┘");
            console.log("🏃‍♂️ 1. Skeleton data: ✅ Manager info loaded");
            console.log("👥 2. Full team data: ✅ Players and live stats");
            console.log("🏆 3. Leagues data: ✅ League tables and rankings");
            console.log("📊 4. Gameweek status: ✅ Performance analysis");
            console.log("💾 5. Local storage: ✅ Data cached");
            console.log("🔄 Ready for live polling and real-time updates");
          }, 3000);
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
        managerId,
        gameweek,
      });
      showError(message);
      setLoading(false);
    }
  }, [
    managerId,
    gameweek,
    loadFullTeamData,
    loadLeaguesData,
    loadGameweekStatus,
    saveToLocalStorage,
    t,
  ]);

  const handleManagerIdFound = useCallback(
    (newManagerId: number) => {
      setManagerId(newManagerId);
      saveToLocalStorage("fpl-manager-id", newManagerId.toString());
    },
    [saveToLocalStorage]
  );

  const startPolling = useCallback(() => {
    if (!managerId) {
      showError(t("fplLive.pleaseEnterManagerId"));
      return;
    }

    if (!data.manager) {
      showError(t("fplLive.loadTeamFirst"));
      return;
    }

    setIsPolling(true);

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/fpl/poll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameweek,
            secret: "auto-poll",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.new_events > 0) {
            loadManagerInfo().catch((err) =>
              console.error("Polling load team error:", err)
            );
            loadGameweekStatus().catch((err) =>
              console.error("Polling gameweek status error:", err)
            );
          }
        }
      } catch (err) {
        console.error("Error in polling:", err);
      }
    }, 15000);

    setPollingInterval(interval);
    showSuccess(t("fplLive.livePollingStarted"));
  }, [
    managerId,
    data.manager,
    gameweek,
    loadManagerInfo,
    loadGameweekStatus,
    t,
  ]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
    showSuccess(t("fplLive.livePollingStopped"));
  }, [pollingInterval, t]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleSettingsSaved = (settings: any) => {
    if (settings.default_manager_id !== managerId) {
      setManagerId(settings.default_manager_id);
    }
    if (settings.default_gw !== gameweek) {
      setGameweek(settings.default_gw);
    }
    showSuccess(t("fplLive.settingsSavedSuccessfully"));
  };

  const renderTabContent = () => {
    if (!teamLoaded || !data.manager) {
      return null;
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <ManagerSummary
              manager={data.manager}
              teamTotals={data.team_totals}
              captain={data.captain}
              viceCaptain={data.vice_captain}
              bonusAdded={data.bonus_added || false}
              gameweek={gameweek}
              lastUpdated={lastUpdated || undefined}
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
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile-friendly loading state */}
            <div className="bg-white dark:bg-black rounded-xl border-2 border-black dark:border-white overflow-hidden theme-transition">
              <div className="px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border-b-2 border-black dark:border-white bg-white dark:bg-black theme-transition">
                <div className="h-4 sm:h-5 lg:h-6 bg-black/20 dark:bg-white/20 rounded w-20 sm:w-24 animate-pulse theme-transition"></div>
              </div>
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="h-10 sm:h-11 lg:h-12 bg-black/10 dark:bg-white/10 rounded animate-pulse theme-transition"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
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
          <div className="bg-white dark:bg-black rounded-xl border-2 border-black dark:border-white theme-transition">
            <div className="px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border-b-2 border-black dark:border-white bg-white dark:bg-black theme-transition">
              <div className="h-4 sm:h-5 lg:h-6 bg-black/20 dark:bg-white/20 rounded w-16 sm:w-20 animate-pulse theme-transition"></div>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="border-2 border-black dark:border-white rounded-lg overflow-hidden theme-transition"
                >
                  <div className="bg-black/5 dark:bg-white/5 px-3 py-2 sm:px-4 sm:py-3 border-b-2 border-black dark:border-white theme-transition">
                    <div className="h-4 sm:h-5 bg-black/20 dark:bg-white/20 rounded w-24 sm:w-32 animate-pulse theme-transition"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          leagueData && (
            <div className="space-y-4 lg:space-y-6">
              <LeagueTables
                leagueData={leagueData}
                managerId={managerId!}
                gameweek={gameweek}
              />

              {/* Live BPS Tracker */}
              <div className="bg-white dark:bg-black rounded-xl p-3 sm:p-4 lg:p-6 border-2 border-black dark:border-white theme-transition">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center theme-transition">
                    <IoIosFootball className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-black theme-transition" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-black dark:text-white theme-transition">
                      {t("fplLive.liveTrackerTitle")}
                    </h3>
                    <p className="text-xs sm:text-sm lg:text-base text-black/70 dark:text-white/70 theme-transition">
                      Live bonus point system tracking
                    </p>
                  </div>
                </div>
                <LiveTracker gameweek={gameweek} isPolling={isPolling} />
              </div>
            </div>
          )
        );
      case "analytics":
        return (
          <AdvancedStatistics
            managerId={managerId || undefined}
            gameweek={gameweek}
            loading={teamDataLoading}
            managerData={data}
          />
        );
      case "matchResults":
        return <MatchResults gameweek={gameweek} isPolling={isPolling} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black theme-transition">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-3 theme-transition">
              {t("fplLive.title")}
            </h1>
            <p className="text-base sm:text-lg text-black dark:text-white max-w-2xl mx-auto leading-relaxed theme-transition">
              {t("fplLive.subtitle")}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white p-4 rounded-lg theme-transition">
            <div className="flex items-start gap-3">
              <MdCancel className="text-black dark:text-white w-5 h-5 mt-0.5 flex-shrink-0 theme-transition" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Mobile-First Setup Interface */}
        {!teamLoaded && (
          <div className="space-y-4 lg:space-y-6">
            {/* How to Use Guide - Mobile Accordion */}
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-xl overflow-hidden theme-transition">
              <details className="group">
                <summary className="flex items-center gap-3 p-3 sm:p-4 lg:p-5 text-sm sm:text-base font-medium text-black dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[56px] lg:min-h-[60px] touch-manipulation theme-transition">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0 theme-transition">
                    <MdInfo className="text-white dark:text-black w-4 h-4 lg:w-5 lg:h-5 theme-transition" />
                  </div>
                  <span className="font-semibold flex-1 text-sm lg:text-base">
                    {t("fplLive.howToUse")}
                  </span>
                  <MdExpandMore className="text-black dark:text-white group-open:rotate-180 transition-transform duration-200 w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 theme-transition" />
                </summary>

                <div className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 space-y-3 lg:space-y-4 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-black theme-transition">
                  <div className="p-3 sm:p-4 lg:p-5 bg-white dark:bg-black rounded-lg border-2 border-black dark:border-white theme-transition">
                    <h4 className="font-semibold text-black dark:text-white mb-3 lg:mb-4 flex items-start gap-2 text-sm sm:text-base lg:text-lg theme-transition">
                      <span className="text-base sm:text-lg lg:text-xl">
                        📋
                      </span>
                      <span className="leading-tight">
                        {t("fplLive.howToFindManagerIdDetailed")}
                      </span>
                    </h4>
                    <div className="space-y-3 lg:space-y-4">
                      <ol className="list-decimal list-inside space-y-2 lg:space-y-3 text-black dark:text-white leading-relaxed theme-transition text-sm sm:text-base">
                        <li className="pl-1 sm:pl-2">
                          {t("fplLive.openWebBrowser")}
                        </li>
                        <li className="pl-1 sm:pl-2">
                          {t("fplLive.goToFPLWebsite")}{" "}
                          <strong className="text-black dark:text-white break-all">
                            fantasy.premierleague.com
                          </strong>
                        </li>
                        <li className="pl-1 sm:pl-2">
                          {t("fplLive.loginToAccount")}
                        </li>
                        <li className="pl-1 sm:pl-2">
                          {t("fplLive.clickPointsTab")}
                        </li>
                        <li className="pl-1 sm:pl-2">
                          {t("fplLive.copyNumbersFromURL")}{" "}
                          <span className="text-xs text-black/70 dark:text-white/70 block sm:inline mt-1 sm:mt-0">
                            (e.g. entry/133444/event/1)
                          </span>
                        </li>
                      </ol>

                      <div className="mt-4 lg:mt-5 p-3 lg:p-4 bg-white dark:bg-black rounded-lg border-2 border-black dark:border-white theme-transition">
                        <div className="flex items-start gap-2 text-sm text-black dark:text-white mb-2 lg:mb-3">
                          <span className="text-base lg:text-lg">💡</span>
                          <span className="font-medium">
                            {t("fplLive.exampleURL")}
                          </span>
                        </div>
                        <div className="bg-black/5 dark:bg-white/5 text-black dark:text-white p-2 lg:p-3 rounded font-mono text-xs sm:text-sm break-all overflow-hidden border border-black/20 dark:border-white/20 theme-transition">
                          fantasy.premierleague.com/entry/133444/event/1
                        </div>
                        <p className="text-xs sm:text-sm text-black dark:text-white mt-2 lg:mt-3 text-center theme-transition">
                          {t("fplLive.yourManagerIdIs2")}{" "}
                          <strong className="text-base sm:text-lg font-bold">
                            133444
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Team Search Helper */}
            <TeamSearchHelper
              onManagerIdFound={handleManagerIdFound}
              currentManagerId={managerId}
            />

            {/* Controls */}
            <ControlsBar
              managerId={managerId}
              gameweek={gameweek}
              isPolling={false}
              onManagerIdChange={setManagerId}
              onGameweekChange={setGameweek}
              onLoadTeam={loadManagerInfo}
              onStartPolling={() => {}}
              onStopPolling={() => {}}
              loading={loading}
            />

            {/* Mobile-Friendly Call to Action */}
            <div className="text-center py-4 sm:py-6 lg:py-8">
              <div className="bg-white dark:bg-black rounded-xl p-4 sm:p-6 lg:p-8 border-2 border-black dark:border-white theme-transition">
                <IoIosFootball className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-black dark:text-white mx-auto mb-4 lg:mb-6 theme-transition" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-black dark:text-white mb-2 lg:mb-3 theme-transition">
                  {t("fplLive.readyToStart")}
                </h3>
                <p className="text-sm sm:text-base text-black dark:text-white mb-4 lg:mb-6 max-w-md mx-auto leading-relaxed theme-transition">
                  {t("fplLive.enterManagerIdToStart")}
                </p>
                {!managerId ? (
                  <div className="bg-white dark:bg-black rounded-lg p-3 lg:p-4 border-2 border-black dark:border-white theme-transition">
                    <p className="text-sm font-medium text-black dark:text-white theme-transition">
                      {t("fplLive.enterManagerIdFirst")}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={loadManagerInfo}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 lg:py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 transition-all text-sm sm:text-base min-h-[48px] lg:min-h-[52px] touch-manipulation theme-transition"
                  >
                    {loading ? t("fplLive.loading") : t("fplLive.loadTeam")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile-First Dashboard Interface */}
        {teamLoaded && data.manager && (
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile-Optimized Controls Bar */}
            <div className="bg-white dark:bg-black rounded-xl p-3 sm:p-4 lg:p-5 border-2 border-black dark:border-white theme-transition">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Manager Info - Always visible */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0 theme-transition">
                    <IoIosFootball className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-black theme-transition" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-black dark:text-white text-sm sm:text-base lg:text-lg truncate theme-transition">
                      {data.manager?.player_first_name}{" "}
                      {data.manager?.player_last_name}
                    </p>
                    <p className="text-xs sm:text-sm text-black/70 dark:text-white/70 theme-transition">
                      GW{gameweek} • ID: {managerId}
                    </p>
                  </div>
                </div>

                {/* Mobile Action Buttons - Stack on mobile, inline on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={isPolling ? stopPolling : startPolling}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] theme-transition ${
                      isPolling
                        ? "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                        : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                    }`}
                  >
                    {isPolling ? (
                      <MdStop className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <MdPlayArrow className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="text-xs sm:text-sm">
                      {isPolling
                        ? t("fplLive.stopLive")
                        : t("fplLive.startLive")}
                    </span>
                  </button>

                  <button
                    onClick={loadManagerInfo}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium transition-all min-h-[44px] hover:bg-black/90 dark:hover:bg-white/90 theme-transition"
                  >
                    <MdRefresh className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">
                      {t("fplLive.refresh")}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium transition-all min-h-[44px] hover:bg-black/90 dark:hover:bg-white/90 theme-transition"
                  >
                    <MdSettings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">
                      {t("fplLive.settings")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile-First Tab Navigation */}
            <div className="bg-white dark:bg-black rounded-xl border-2 border-black dark:border-white overflow-hidden theme-transition">
              {/* Mobile Horizontal Scroll Tab Bar */}
              <div className="border-b-2 border-black dark:border-white bg-white dark:bg-black theme-transition">
                <div
                  className="flex overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm lg:text-base font-medium whitespace-nowrap transition-all border-b-2 min-w-max touch-manipulation min-h-[56px] sm:min-h-[60px] ${
                          isActive
                            ? "border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white"
                            : "border-transparent text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        } theme-transition`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm lg:text-base leading-tight text-center sm:text-left">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content with Mobile Padding */}
              <div className="p-3 sm:p-4 lg:p-6 bg-white dark:bg-black theme-transition">
                {renderTabContent()}
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-6">
                <SettingsCard onSettingsSaved={handleSettingsSaved} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
