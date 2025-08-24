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
import type { GameweekStatus as GameweekStatusType } from "@/lib/fpl-api";

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
    useState<GameweekStatusType | null>(null);
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

      if (teamResponse.ok) {
        const teamResult = await teamResponse.json();
        if (teamResult.success) {
          setData(teamResult.data);
          const timestamp = new Date().toISOString();
          setLastUpdated(timestamp);

          saveToLocalStorage("fpl-team-data", teamResult.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

          setTeamDataLoading(false);
          showSuccess(t("fplLive.fullTeamDataLoaded"));
        }
      }
    } catch (err) {
      console.warn("Failed to load full team data:", err);
      setTeamDataLoading(false);
    }
  }, [managerId, gameweek, saveToLocalStorage, t]);

  const loadLeaguesData = useCallback(async () => {
    if (!managerId) return;

    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLeagueData(result.data);
          setLeaguesLoading(false);
        }
      }
    } catch (err) {
      console.warn("Failed to load leagues:", err);
      setLeaguesLoading(false);
    }
  }, [managerId]);

  const loadGameweekStatus = useCallback(async () => {
    if (!managerId) return;

    setGameweekStatusLoading(true);
    try {
      const response = await fetch(
        `/api/fpl/gameweek-status?managerId=${managerId}&gameweek=${gameweek}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGameweekStatus(result.data);
        }
      }
    } catch (err) {
      console.warn("Failed to load gameweek status:", err);
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

    try {
      if (managerId !== null) {
        saveToLocalStorage("fpl-manager-id", managerId.toString());
      }
      saveToLocalStorage("fpl-gameweek", gameweek.toString());

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

      if (skeletonResponse.ok) {
        const result = await skeletonResponse.json();

        if (result.success) {
          setData(result.data);
          const timestamp = new Date().toISOString();
          saveToLocalStorage("fpl-team-data", result.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

          setTeamLoaded(true);
          showSuccess(t("fplLive.managerInfoLoaded"));
          setLoading(false);

          // Load additional data in background
          setTeamDataLoading(true);
          loadFullTeamData();

          setLeaguesLoading(true);
          loadLeaguesData();

          loadGameweekStatus();
        } else {
          throw new Error(result.error || "Manager not found");
        }
      } else {
        throw new Error(
          `Failed to fetch manager info: ${skeletonResponse.status}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError(message);
      console.error("Error loading manager:", err);
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
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow border border-amber-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-200 dark:border-gray-700 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-700 dark:to-gray-800">
                <div className="h-6 bg-amber-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-amber-100 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <SquadTable
              teamData={data.team_with_stats || []}
              predictedBonuses={data.predicted_bonuses || []}
              bonusAdded={data.bonus_added || false}
            />

            {/* UŽIVO BPS Tracker */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <IoIosFootball className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                    UŽIVO BPS Tracker
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                    Live bonus point system tracking
                  </p>
                </div>
              </div>
              <LiveTracker gameweek={gameweek} isPolling={isPolling} />
            </div>
          </div>
        );
      case "leagues":
        return leaguesLoading ? (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow border border-amber-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-amber-200 dark:border-gray-700 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-700 dark:to-gray-800">
              <div className="h-6 bg-amber-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="border border-amber-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="bg-amber-100 dark:bg-gray-700 px-4 py-3 border-b border-amber-200 dark:border-gray-600">
                    <div className="h-5 bg-amber-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          leagueData && (
            <div className="space-y-6">
              <LeagueTables
                leagueData={leagueData}
                managerId={managerId!}
                gameweek={gameweek}
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
        return <MatchResults gameweek={gameweek} isPolling={isPolling} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-amber-50 dark:bg-black">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t("fplLive.title")}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t("fplLive.subtitle")}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <MdCancel className="text-red-500 w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Mandatory Manager ID Entry */}
        {!teamLoaded && (
          <div className="space-y-6">
            {/* How to Use Guide */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-amber-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <details className="group">
                <summary className="flex items-center gap-3 p-4 sm:p-5 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-gray-700 transition-colors min-h-[60px] touch-manipulation">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MdInfo className="text-white w-5 h-5" />
                  </div>
                  <span className="font-semibold flex-1">{t("fplLive.howToUse")}</span>
                  <MdExpandMore className="text-gray-600 dark:text-gray-400 group-open:rotate-180 transition-transform duration-200 w-6 h-6 flex-shrink-0" />
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800">
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-25 to-orange-25 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-amber-200 dark:border-gray-600">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-start gap-2 text-base sm:text-lg">
                      <span className="text-xl">📋</span>
                      <span>{t("fplLive.howToFindManagerIdDetailed")}</span>
                    </h4>
                    <div className="space-y-4">
                      <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                        <li className="pl-2">{t("fplLive.openWebBrowser")}</li>
                        <li className="pl-2">
                          {t("fplLive.goToFPLWebsite")}{" "}
                          <strong className="text-blue-600 dark:text-blue-400">fantasy.premierleague.com</strong>
                        </li>
                        <li className="pl-2">{t("fplLive.loginToAccount")}</li>
                        <li className="pl-2">{t("fplLive.clickPointsTab")}</li>
                        <li className="pl-2">
                          {t("fplLive.copyNumbersFromURL")}{" "}
                          <span className="text-xs text-gray-500">
                            (e.g. entry/133444/event/1)
                          </span>
                        </li>
                      </ol>

                      <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300 mb-3">
                          <span className="text-lg">💡</span>
                          <span className="font-medium">
                            {t("fplLive.exampleURL")}
                          </span>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-800/30 text-blue-900 dark:text-blue-100 p-3 rounded font-mono text-xs sm:text-sm break-all overflow-hidden">
                          fantasy.premierleague.com/entry/133444/event/1
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 text-center">
                          {t("fplLive.yourManagerIdIs2")}{" "}
                          <strong className="text-lg font-bold">133444</strong>
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

            {/* Call to Action */}
            <div className="text-center py-6 sm:py-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 sm:p-8 border border-amber-200 dark:border-gray-700">
                <IoIosFootball className="w-16 h-16 sm:w-20 sm:h-20 text-amber-600 dark:text-amber-400 mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t("fplLive.readyToStart")}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                  {t("fplLive.enterManagerIdToStart")}
                </p>
                {!managerId ? (
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {t("fplLive.enterManagerIdFirst")}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={loadManagerInfo}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg text-base min-h-[52px] touch-manipulation"
                  >
                    {loading ? t("fplLive.loading") : t("fplLive.loadTeam")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Interface - Only shown after team is loaded */}
        {teamLoaded && data.manager && (
          <div className="space-y-6">
            {/* Quick Controls Bar */}
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-5 border border-amber-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IoIosFootball className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                      {data.manager?.player_first_name}{" "}
                      {data.manager?.player_last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      GW{gameweek} • ID: {managerId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                  <button
                    onClick={isPolling ? stopPolling : startPolling}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                      isPolling
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isPolling ? (
                      <MdStop className="w-5 h-5" />
                    ) : (
                      <MdPlayArrow className="w-5 h-5" />
                    )}
                    <span className="hidden xs:inline sm:inline">
                      {isPolling
                        ? t("fplLive.stopLive")
                        : t("fplLive.startLive")}
                    </span>
                  </button>

                  <button
                    onClick={loadManagerInfo}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all min-h-[44px]"
                  >
                    <MdRefresh className="w-5 h-5" />
                    <span className="hidden xs:inline sm:inline">
                      {t("fplLive.refresh")}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all min-h-[44px]"
                  >
                    <MdSettings className="w-5 h-5" />
                    <span className="hidden xs:inline sm:inline">
                      {t("fplLive.settings")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <div className="flex overflow-x-auto scrollbar-hide lg:justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 min-w-max touch-manipulation lg:px-6 lg:py-4 lg:text-base min-h-[60px] ${
                          isActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs sm:text-sm lg:text-base">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 bg-gradient-to-br from-amber-25 via-orange-25 to-amber-50 dark:bg-gray-900">
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
