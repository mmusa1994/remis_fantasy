"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
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

import { IoFootballOutline } from "react-icons/io5";

import SettingsCard from "@/components/fpl/SettingsCard";
import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import AdvancedStatistics from "@/components/fpl/AdvancedStatistics";
import LiveTracker from "@/components/fpl/LiveTracker";
import LeagueTables from "@/components/fpl/LeagueTables";
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
  const { t } = useTranslation("fpl");
  const { theme } = useTheme();

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
  const [showTabDropdown, setShowTabDropdown] = useState(false);
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
      icon: IoFootballOutline,
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
          showSuccess(t("fullTeamDataLoaded"));

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
      showError(t("pleaseEnterManagerId"));
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
          showSuccess(t("managerInfoLoaded"));
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
    data?.manager,
    data?.team_with_stats?.length,
    isPolling,
    teamLoaded,
  ]);

  const startPolling = useCallback(() => {
    if (!managerId) {
      showError(t("pleaseEnterManagerId"));
      return;
    }

    if (!data.manager) {
      showError(t("loadTeamFirst"));
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
          if (result.success && result.data?.new_events > 0) {
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
    showSuccess(t("livePollingStarted"));
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
    showSuccess(t("livePollingStopped"));
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
    showSuccess(t("settingsSavedSuccessfully"));
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
          <div className="bg-theme-card rounded-xl border-theme-border theme-transition">
            {/* Mobile-friendly loading state */}
            <div className="bg-theme-card rounded-xl border-theme-border overflow-hidden theme-transition">
              <div className="px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border-b-2 border-theme-border bg-theme-card theme-transition">
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
          <div className="bg-theme-card rounded-xl border-theme-border theme-transition">
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
              {/* Live Border Indicator */}
              <div className="bg-theme-card rounded-md p-1 border-theme-border theme-transition">
                <div
                  className={`w-full h-2 rounded-sm transition-all duration-300 ${
                    isPolling
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
                <div className="text-center mt-2">
                  <p className="text-xs font-medium text-theme-text-secondary theme-transition">
                    {isPolling
                      ? "🔴 Live praćenje aktivno"
                      : "⚪ Live praćenje neaktivno"}
                  </p>
                </div>
                {/* Live BPS Tracker */}
                <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <IoFootballOutline size={24} />
                    <div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-theme-foreground theme-transition">
                        {t("fplLive.liveTrackerTitle")}
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-base text-theme-text-secondary theme-transition">
                        Live bonus point system tracking
                      </p>
                    </div>
                  </div>
                  <LiveTracker gameweek={gameweek} isPolling={isPolling} />
                </div>
              </div>
              <LeagueTables
                leagueData={leagueData}
                managerId={managerId!}
                gameweek={gameweek}
                onManagerSelect={(selectedManagerId) => {
                  console.log("Manager selected:", selectedManagerId);
                  // Future: Load manager-specific data
                }}
              />
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
        return (
          <MatchResults
            gameweek={gameweek}
            isPolling={isPolling}
            onManagerSelect={(selectedManagerId) => {
              console.log(
                "Manager selected from match results:",
                selectedManagerId
              );
              // Future: Load manager-specific data
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-theme-card theme-transition">
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
            {/* How to Use Guide - Mobile Accordion */}
            <div className="bg-theme-card border border-theme-border rounded-md overflow-hidden theme-transition">
              <details className="group">
                <summary className="flex items-center gap-3 p-3 sm:p-4 lg:p-5 text-sm sm:text-base font-medium text-theme-foreground cursor-pointer hover:bg-theme-card-secondary transition-colors min-h-[56px] lg:min-h-[60px] touch-manipulation theme-transition">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-500 dark:bg-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <MdInfo className="text-white w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <span className="font-semibold flex-1 text-sm lg:text-base">
                    {t("howToUse")}
                  </span>
                  <MdExpandMore className="text-theme-foreground group-open:rotate-180 transition-transform duration-200 w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 theme-transition" />
                </summary>

                <div className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 space-y-3 lg:space-y-4 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-black theme-transition">
                  <div className="p-3 sm:p-4 lg:p-5 bg-theme-card rounded-md border-theme-border theme-transition">
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

                      <div className="mt-4 lg:mt-5 p-3 lg:p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 theme-transition">
                        <div className="flex items-start gap-2 text-sm text-black dark:text-white mb-2 lg:mb-3">
                          <span className="text-base lg:text-lg">💡</span>
                          <span className="font-medium">
                            {t("fplLive.exampleURL")}
                          </span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white p-2 lg:p-3 rounded-md font-mono text-xs sm:text-sm break-all overflow-hidden border border-gray-200 dark:border-gray-700 theme-transition">
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
          </div>
        )}

        {/* Mobile-First Dashboard Interface */}
        {teamLoaded && data.manager && (
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile-Optimized Controls Bar */}
            <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-5 border-theme-border theme-transition">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Manager Info - Always visible */}
                <div className="flex items-center gap-3 min-w-0">
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
                </div>

                {/* Mobile Action Buttons - Stack on mobile, inline on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={isPolling ? stopPolling : startPolling}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px] ${
                      isPolling
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isPolling ? (
                      <MdStop className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <MdPlayArrow className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="text-xs sm:text-sm">
                      {isPolling
                        ? t("stopLive")
                        : t("startLive")}
                    </span>
                  </button>

                  <button
                    onClick={loadManagerInfo}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-all min-h-[44px]"
                  >
                    <MdRefresh className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">
                      {t("refresh")}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-all min-h-[44px]"
                  >
                    <MdSettings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">
                      {t("settings")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Tab Navigation */}
            <div className="bg-theme-card rounded-md border-theme-border overflow-hidden theme-transition">
              <div className="border-b border-theme-border bg-theme-card theme-transition">
                {/* Mobile: Show 2 tabs + dropdown */}
                <div className="sm:hidden">
                  <div className="flex">
                    {/* First 2 tabs visible */}
                    {tabs.slice(0, 2).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-all border-b-2 min-h-[56px] ${
                            isActive
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                              : "border-transparent text-gray-600 dark:text-gray-400"
                          } theme-transition`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs leading-tight text-center">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* Dropdown for remaining tabs */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowTabDropdown(!showTabDropdown)}
                        className={`w-full flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-all border-b-2 min-h-[56px] ${
                          tabs.slice(2).some(tab => tab.id === activeTab)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs leading-tight text-center">
                          {tabs.slice(2).find(tab => tab.id === activeTab)?.label || t("common.more", "More")}
                        </span>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showTabDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-theme-card border border-theme-border rounded-b-md shadow-lg z-50 theme-transition">
                          {tabs.slice(2).map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setShowTabDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all ${
                                  isActive
                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                } theme-transition`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Tablet: Show 3 tabs + dropdown */}
                <div className="hidden sm:flex md:hidden">
                  {tabs.slice(0, 3).map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-all border-b-2 min-h-[60px] ${
                          isActive
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Tablet Dropdown */}
                  {tabs.length > 3 && (
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowTabDropdown(!showTabDropdown)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-all border-b-2 min-h-[60px] ${
                          tabs.slice(3).some(tab => tab.id === activeTab)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {tabs.slice(3).find(tab => tab.id === activeTab)?.label || t("common.more", "More")}
                        </span>
                      </button>
                      
                      {showTabDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-theme-card border border-theme-border rounded-b-md shadow-lg z-50 theme-transition">
                          {tabs.slice(3).map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setShowTabDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all ${
                                  isActive
                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                } theme-transition`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>
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
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-all border-b-2 min-h-[60px] ${
                          isActive
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        } theme-transition`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-base">{tab.label}</span>
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
