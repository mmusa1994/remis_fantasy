"use client";

import { useState, useEffect, useCallback } from "react";
import SettingsCard from "@/components/fpl/SettingsCard";
import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import ScoreboardGrid from "@/components/fpl/ScoreboardGrid";
import LiveTicker from "@/components/fpl/LiveTicker";
import LeagueTables from "@/components/fpl/LeagueTables";
import { MdInfo, MdSettings, MdCancel } from "react-icons/md";
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

export default function FPLLivePage() {
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

  // Load manager ID and gameweek from localStorage on mount
  useEffect(() => {
    const savedManagerId = localStorage.getItem("fpl-manager-id");
    const savedGameweek = localStorage.getItem("fpl-gameweek");

    if (savedManagerId) {
      const parsedId = parseInt(savedManagerId, 10);
      if (!isNaN(parsedId)) {
        setManagerId(parsedId);
      } else {
        setManagerId(null);
      }
    } else {
      setManagerId(null);
    }

    if (savedGameweek) {
      const parsedGw = parseInt(savedGameweek, 10);
      if (!isNaN(parsedGw) && parsedGw >= 1 && parsedGw <= 38) {
        setGameweek(parsedGw);
      }
    }
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    console.log("Success:", message);
  };

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
          // Update with full team data
          setData(teamResult.data);
          setLastUpdated(new Date().toISOString());
          setTeamDataLoading(false);
          showSuccess("Full team data loaded");
        }
      }
    } catch (err) {
      console.warn("Failed to load full team data:", err);
      setTeamDataLoading(false);
    }
  }, [managerId, gameweek]);

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
      showError("Please enter a Manager ID first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save to localStorage when user manually loads team
      if (managerId !== null) {
        localStorage.setItem("fpl-manager-id", managerId.toString());
      }
      localStorage.setItem("fpl-gameweek", gameweek.toString());

      // First, get skeleton data with manager info immediately
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
          // Show skeleton data immediately
          setData(result.data);
          showSuccess("Manager info loaded");
          setLoading(false);

          // Now load full team data in background
          setTeamDataLoading(true);
          loadFullTeamData();

          // Load leagues in separate background service
          setLeaguesLoading(true);
          loadLeaguesData();

          // Load gameweek status in background
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
  ]);

  // Keep loadTeam for compatibility with polling
  const loadTeam = loadManagerInfo;

  const startPolling = useCallback(() => {
    if (!managerId) {
      showError("Please enter a Manager ID first");
      return;
    }

    if (!data.manager) {
      showError("Load a team first");
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
            // Trigger loadTeam without awaiting to avoid blocking polling
            loadTeam().catch((err) =>
              console.error("Polling load team error:", err)
            );
            // Also refresh gameweek status
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
    showSuccess("Live polling started (15s interval)");
  }, [managerId, data.manager, gameweek, loadTeam, loadGameweekStatus]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
    showSuccess("Live polling stopped");
  }, [pollingInterval]);

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
    showSuccess("Settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            FPL Live Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time Fantasy Premier League tracking with live bonus
            predictions
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <MdCancel className="text-red-500 w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls - Full Width */}
        <div className="mb-6">
          <ControlsBar
            managerId={managerId}
            gameweek={gameweek}
            isPolling={isPolling}
            onManagerIdChange={setManagerId}
            onGameweekChange={setGameweek}
            onLoadTeam={loadManagerInfo}
            onStartPolling={startPolling}
            onStopPolling={stopPolling}
            loading={loading}
          />
        </div>

        {/* Manager Overview + Squad alongside League Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {managerId && data.manager && (
              <>
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
                {teamDataLoading ? (
                  <div className="space-y-6">
                    {/* Squad Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 mt-2 animate-pulse"></div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {Array.from({ length: 14 }, (_, i) => (
                                <th key={i} className="px-3 py-3">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse"></div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {Array.from({ length: 15 }, (_, i) => (
                              <tr key={i}>
                                {Array.from({ length: 14 }, (_, j) => (
                                  <td key={j} className="px-3 py-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded animate-pulse"></div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Scoreboard Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4 animate-pulse"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div
                            key={i}
                            className="border dark:border-gray-600 rounded-lg p-4"
                          >
                            <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-500 rounded w-16 mb-3 animate-pulse"></div>
                            <div className="space-y-2">
                              {Array.from({ length: 3 }, (_, j) => (
                                <div
                                  key={j}
                                  className="h-4 bg-gray-200 dark:bg-gray-500 rounded animate-pulse"
                                ></div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <SquadTable
                      teamData={data.team_with_stats || []}
                      predictedBonuses={data.predicted_bonuses || []}
                      bonusAdded={data.bonus_added || false}
                    />
                    <ScoreboardGrid
                      fixtures={data.fixtures || []}
                      predictedBonuses={data.predicted_bonuses || []}
                      bonusAdded={data.bonus_added || false}
                    />
                  </>
                )}
              </>
            )}
          </div>
          <div className="space-y-6">
            <LiveTicker gameweek={gameweek} isPolling={isPolling} />
            {leaguesLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                </div>
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className="border dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600">
                        <div className="h-5 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              leagueData && (
                <LeagueTables leagueData={leagueData} managerId={managerId!} />
              )
            )}
          </div>
        </div>

        {/* FPL Settings at the bottom */}
        <div className="mt-8">
          <SettingsCard onSettingsSaved={handleSettingsSaved} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <MdInfo className="text-blue-500 w-5 h-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Kako koristiti FPL Live
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Unesite Manager ID (npr. 133790) i odaberite trenutni
                      Gameweek
                    </li>
                    <li>
                      Kliknite &quot;Load Team&quot; da učitate svoj tim i stats
                    </li>
                    <li>
                      &quot;Fetch Now&quot; za manuelno ažuriranje ili
                      &quot;Start Live&quot; za auto-polling
                    </li>
                    <li>
                      Pratite Live Ticker za golove/asiste/kartone u real-time
                    </li>
                    <li>
                      Bonus poeni se predviđaju dok ne budu finalni post-match
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <MdSettings className="text-yellow-500 w-5 h-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Settings objašnjenja
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <div>
                    <strong>FPL Proxy URL:</strong> Opcionalno za zaobilaženje
                    CORS problema
                  </div>
                  <div>
                    <strong>CRON Secret:</strong> Sigurnosni ključ za
                    server-side automatizaciju
                  </div>
                  <div>
                    <strong>Live Bonus:</strong> DA! Bonus se računa uživo tokom
                    mečeva
                  </div>
                  <div>
                    <strong>Points:</strong> Active = starter tim (1-11), Bench
                    = klupa (12-15)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
