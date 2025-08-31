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
} from "react-icons/md";

import { FaChartLine, FaTrophy } from "react-icons/fa";
import { TbTransfer } from "react-icons/tb";

import { IoFootballOutline } from "react-icons/io5";

import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import AdvancedStatistics from "@/components/fpl/AdvancedStatistics";
// import LiveTracker from "@/components/fpl/LiveTracker";
import MatchResults from "@/components/fpl/MatchResults";
import TransfersMarket from "@/components/fpl/TransfersMarket";
import LeagueTables from "@/components/fpl/LeagueTables";
import LoadingCard from "@/components/shared/LoadingCard";
// import LiveTracker from "@/components/fpl/LiveTracker";
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
  | "leagues"
  | "analytics"
  | "transfers"
  | "matchResults";

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

  // Master live tracking state
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

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
      id: "transfers",
      label: t("fplLive.tabs.transfers"),
      icon: TbTransfer,
      description: t("fplLive.tabs.transfersDesc"),
      color: "orange",
    },
    {
      id: "matchResults",
      label: t("fplLive.tabs.matchResults"),
      icon: IoFootballOutline,
      description: t("fplLive.tabs.matchResultsDesc"),
      color: "green",
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

  // DISABLED: Auto-load team data - user must click Load Team button manually
  // useEffect(() => {
  //   // Only auto-load if we have manager ID AND it came from localStorage (not user input)
  //   const savedManagerId = localStorage.getItem("fpl-manager-id");
  //   if (
  //     savedManagerId &&
  //     managerId &&
  //     !data.manager &&
  //     !loading &&
  //     managerId.toString() === savedManagerId
  //   ) {
  //     console.log(
  //       "🔄 [FRONTEND] Auto-loading team data for saved manager ID:",
  //       managerId
  //     );
  //     loadManagerInfo();
  //   }
  // }, [managerId, data.manager, loading, loadManagerInfo]);

  const toggleLiveTracking = useCallback(() => {
    if (!isLiveTracking) {
      // Start live tracking - Visual only, no API calls
      if (!managerId) {
        showError(t("pleaseEnterManagerId"));
        return;
      }

      if (!data.manager) {
        showError(t("loadTeamFirst"));
        return;
      }

      setIsLiveTracking(true);
      setIsPolling(true);

      showSuccess("Pokrenuto je uživo praćenje za sve komponente");
    } else {
      // Stop live tracking - Visual only
      setIsLiveTracking(false);
      setIsPolling(false);

      showSuccess("Zaustavljen je uživo praćenje");
    }
  }, [isLiveTracking, managerId, data.manager, t]);

  // Legacy functions removed - now using toggleLiveTracking directly

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Close dropdown when clicking outside or on window resize
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
    setTabLoading(true);
    setActiveTab(newTab);

    // Simulate brief loading for smooth transition
    setTimeout(() => {
      setTabLoading(false);
    }, 300);
  };

  const renderTabContent = () => {
    if (!teamLoaded || !data.manager) {
      return null;
    }

    // Show loading during tab transitions
    if (tabLoading) {
      return (
        <LoadingCard
          title={`${t("fplLive.loadingContent")} ${
            tabs.find((tab) => tab.id === activeTab)?.label || ""
          }...`}
          description={t("fplLive.preparingContent")}
          className="bg-theme-card border-theme-border rounded-lg shadow theme-transition"
        />
      );
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
              {/* Live Status Indicator */}
              <div className="bg-theme-card rounded-md p-3 border-theme-border theme-transition">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      isLiveTracking
                        ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/30"
                        : "bg-red-500 shadow-lg shadow-red-500/30"
                    }`}
                  ></div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-theme-foreground theme-transition">
                      {isLiveTracking
                        ? "LIVE TRACKING ACTIVE"
                        : "LIVE TRACKING INACTIVE"}
                    </p>
                    <p className="text-xs text-theme-text-secondary theme-transition">
                      {isLiveTracking
                        ? "Data is being tracked in real-time"
                        : "Click 'Start Live' to begin tracking"}
                    </p>
                  </div>
                </div>
              </div>
              <LeagueTables
                currentUserData={data}
                managerId={managerId || undefined}
                gameweek={gameweek}
                isPolling={isLiveTracking}
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
            isPolling={isLiveTracking}
            onManagerSelect={(selectedManagerId) => {
              console.log(
                "Manager selected from match results:",
                selectedManagerId
              );
              // Future: Load manager-specific data
            }}
          />
        );
      case "transfers":
        return <TransfersMarket />;
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={toggleLiveTracking}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all min-h-[44px] ${
                      isLiveTracking
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isLiveTracking ? (
                      <MdStop className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <MdPlayArrow className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="text-xs sm:text-sm">
                      {isLiveTracking
                        ? t("fplLive.stopLive")
                        : t("fplLive.startLive")}
                    </span>
                  </button>

                  <button
                    onClick={() => loadManagerInfo()}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-all min-h-[44px]"
                  >
                    <MdRefresh className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">{t("refresh")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Tab Navigation */}
            <div className="bg-theme-card rounded-md border-theme-border overflow-hidden theme-transition">
              <div className="border-b border-theme-border bg-theme-card theme-transition">
                {/* Mobile: Show 3 tabs + dropdown - always show Overview, Squad, Leagues */}
                <div className="sm:hidden">
                  <div className="flex">
                    {/* First 3 tabs visible - ensure Leagues is always visible */}
                    {tabs.slice(0, 3).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`flex-1 flex flex-col items-center gap-1 px-1 py-3 text-xs font-medium transition-all border-b-2 min-h-[56px] ${
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTabDropdown(!showTabDropdown);
                        }}
                        className={`w-full flex flex-col items-center gap-1 px-1 py-3 text-xs font-medium transition-all border-b-2 min-h-[56px] ${
                          tabs.slice(3).some((tab) => tab.id === activeTab)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs leading-tight text-center">
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
                          <div className="absolute top-full right-0 w-48 max-w-[90vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden theme-transition">
                            <div className="py-2">
                              {tabs.slice(3).map((tab, index) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      handleTabChange(tab.id);
                                      setShowTabDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all touch-manipulation ${
                                      isActive
                                        ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-r-2 border-purple-500"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700"
                                    } ${index === 0 ? "rounded-t-lg" : ""} ${
                                      index === tabs.slice(3).length - 1
                                        ? "rounded-b-lg"
                                        : ""
                                    }`}
                                  >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
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
                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-all border-b-2 min-h-[60px] ${
                          isActive
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{tab.label}</span>
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
                        className={`w-full flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-all border-b-2 min-h-[60px] ${
                          tabs.slice(4).some((tab) => tab.id === activeTab)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-600 dark:text-gray-400"
                        } theme-transition`}
                      >
                        <MdExpandMore className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">
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
                          <div className="absolute top-full right-0 w-56 max-w-[85vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden theme-transition">
                            <div className="py-2">
                              {tabs.slice(4).map((tab, index) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      handleTabChange(tab.id);
                                      setShowTabDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all touch-manipulation ${
                                      isActive
                                        ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-r-2 border-purple-500"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700"
                                    } ${index === 0 ? "rounded-t-lg" : ""} ${
                                      index === tabs.slice(4).length - 1
                                        ? "rounded-b-lg"
                                        : ""
                                    }`}
                                  >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
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
          </div>
        )}
      </div>
    </div>
  );
}
