"use client";

import { useState, useEffect, useCallback } from "react";
import SettingsCard from "@/components/fpl/SettingsCard";
import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import GameweekStatus from "@/components/fpl/GameweekStatus";
import SquadTable from "@/components/fpl/SquadTable";
import ScoreboardGrid from "@/components/fpl/ScoreboardGrid";
import AdvancedStatistics from "@/components/fpl/AdvancedStatistics";
import LiveTicker from "@/components/fpl/LiveTicker";
import LeagueTables from "@/components/fpl/LeagueTables";
import { MdCancel, MdInfo, MdSettings, MdExpandMore } from "react-icons/md";
import Image from "next/image";
import TeamSearchHelper from "@/components/fpl/TeamSearchHelper";
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

  // Load manager ID, gameweek, and cached data from localStorage on mount
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

      // Restore cached team data if available and not too old (24 hours)
      if (savedData && savedLastUpdated) {
        const lastUpdated = new Date(savedLastUpdated);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          try {
            const parsedData = JSON.parse(savedData);
            setData(parsedData);
            setLastUpdated(savedLastUpdated);
            showSuccess("Restored cached team data");

            // Auto-load leagues if we have cached team data
            if (parsedData.manager && savedManagerId) {
              setLeaguesLoading(true);
              loadLeaguesData();
            }
          } catch (parseError) {
            console.warn("Failed to parse cached data:", parseError);
          }
        } else {
          // Clear old cached data
          localStorage.removeItem("fpl-team-data");
          localStorage.removeItem("fpl-last-updated");
        }
      }
    } catch (error) {
      console.warn("Error loading from localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    console.log("Success:", message);
  };

  // Save data to localStorage with error handling
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
          // Update with full team data
          setData(teamResult.data);
          const timestamp = new Date().toISOString();
          setLastUpdated(timestamp);

          // Save to localStorage
          saveToLocalStorage("fpl-team-data", teamResult.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

          setTeamDataLoading(false);
          showSuccess("Full team data loaded");
        }
      }
    } catch (err) {
      console.warn("Failed to load full team data:", err);
      setTeamDataLoading(false);
    }
  }, [managerId, gameweek, saveToLocalStorage]);

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
        saveToLocalStorage("fpl-manager-id", managerId.toString());
      }
      saveToLocalStorage("fpl-gameweek", gameweek.toString());

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

          // Save skeleton data to localStorage
          const timestamp = new Date().toISOString();
          saveToLocalStorage("fpl-team-data", result.data);
          saveToLocalStorage("fpl-last-updated", timestamp);

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
    saveToLocalStorage,
  ]);

  // Keep loadTeam for compatibility with polling
  const loadTeam = loadManagerInfo;

  const handleManagerIdFound = useCallback(
    (newManagerId: number) => {
      setManagerId(newManagerId);
      // Automatically load the team when a new Manager ID is provided
      setTimeout(() => {
        loadManagerInfo();
      }, 100);
    },
    [loadManagerInfo]
  );

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          FPL Live Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time Fantasy Premier League praćenje sa live bonus predviđanjima
        </p>
      </div>

      {/* Enhanced Info Accordions - Moved to Top */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* How to Use - Enhanced Version */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-lg overflow-hidden">
          <details className="group">
            <summary className="flex items-center gap-3 p-4 text-sm font-medium text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                <MdInfo className="text-white w-4 h-4" />
              </div>
              <span className="font-semibold">Kako koristiti FPL Live</span>
              <MdExpandMore className="ml-auto text-blue-600 dark:text-blue-400 group-open:rotate-180 transition-transform duration-200 w-5 h-5" />
            </summary>

            <div className="px-4 pb-4 space-y-4 text-sm text-blue-800 dark:text-blue-200 bg-white/50 dark:bg-blue-900/20">
              {/* Manager ID - Detailed - Mobile Optimized */}
              <div className="p-3 bg-white dark:bg-blue-800/50 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2 text-sm md:text-base">
                  📋 Kako pronaći Manager ID
                </h4>
                <div className="space-y-3 text-xs md:text-sm">
                  <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300 leading-relaxed">
                    <li className="break-words">
                      Otvorite web browser (Chrome, Firefox, Safari)
                    </li>
                    <li className="break-words">
                      Idite na{" "}
                      <strong className="break-all">
                        fantasy.premierleague.com
                      </strong>
                    </li>
                    <li className="break-words">
                      Ulogujte se sa vašim Fantasy Premier League nalogom
                    </li>
                    <li className="break-words">
                      Kliknite na <strong>&quot;Points&quot;</strong> tab u
                      glavnoj navigaciji
                    </li>
                    <li className="break-words">
                      Kopirajte brojeve iz URL-a{" "}
                      <span className="text-xs">
                        (npr. entry/133444/event/1)
                      </span>
                    </li>
                  </ol>

                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded border">
                    <div className="flex items-start gap-2 text-xs md:text-sm text-blue-700 dark:text-blue-300 mb-2">
                      <span className="flex-shrink-0">💡</span>
                      <span className="font-medium">Primer URL-a:</span>
                    </div>
                    <div className="bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 p-2 rounded font-mono text-xs break-all overflow-hidden">
                      fantasy.premierleague.com/entry/133444/event/1
                    </div>
                    <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 mt-2 text-center">
                      Vaš Manager ID je:{" "}
                      <strong className="text-base md:text-lg">133444</strong>
                    </p>

                    <div className="mt-4">
                      <div className="relative overflow-hidden rounded border border-blue-300 dark:border-blue-600">
                        <Image
                          src="/images/path.png"
                          alt="FPL Manager ID u URL-u - primer iz browser-a"
                          width={400}
                          height={200}
                          className="w-full h-auto object-contain max-h-32 md:max-h-48"
                        />
                      </div>
                      <p className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2 italic leading-relaxed px-2">
                        Ovako izgleda URL u browser-u kada kliknete na
                        &quot;Points&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Steps - Detailed - Mobile Optimized */}
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 text-sm md:text-base">
                  🎯 Detaljni koraci za korišćenje
                </h4>
                <ol className="list-decimal list-inside space-y-3 text-blue-700 dark:text-blue-300 text-xs md:text-sm leading-relaxed">
                  <li className="break-words">
                    <strong>Unesite Manager ID</strong>{" "}
                    <span className="text-xs">(npr. 133444 )</span> i odaberite
                    trenutni Gameweek
                  </li>
                  <li className="break-words">
                    <strong>Kliknite &quot;Load Team&quot;</strong> da učitate
                    svoj tim i osnovne statistike
                  </li>
                  <li className="break-words">
                    <strong>&quot;Fetch Now&quot;</strong> za manuelno
                    ažuriranje ili <strong>&quot;Start Live&quot;</strong> za
                    automatsko praćenje
                  </li>
                  <li className="break-words">
                    Pratite <strong>LIVE BPS Tracker</strong> za golove, asiste
                    i kartone u real-time
                  </li>
                  <li className="break-words">
                    <strong>Bonus poeni</strong> se predviđaju u realnom vremenu
                    dok ne budu finalni post-match
                  </li>
                </ol>
              </div>
            </div>
          </details>
        </div>
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
      {/* Team Search Helper */}
      <div className="mb-6">
        <TeamSearchHelper
          onManagerIdFound={handleManagerIdFound}
          currentManagerId={managerId}
        />
      </div>

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
                  <AdvancedStatistics
                    managerId={managerId || undefined}
                    gameweek={gameweek}
                    loading={teamDataLoading}
                    managerData={data}
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
          {/* Move Scoreboard below Leagues on desktop */}
          {managerId && data.manager && (
            <div className="block">
              <ScoreboardGrid
                fixtures={data.fixtures || []}
                predictedBonuses={data.predicted_bonuses || []}
                bonusAdded={data.bonus_added || false}
              />
            </div>
          )}
        </div>
      </div>

      {/* FPL Settings at the bottom */}
      <div className="mt-8">
        <SettingsCard onSettingsSaved={handleSettingsSaved} />
      </div>
      {/* Settings - Enhanced Version */}
      <div className="mt-5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-lg overflow-hidden">
        <details className="group">
          <summary className="flex items-center gap-3 p-4 text-sm font-medium text-yellow-800 dark:text-yellow-200 cursor-pointer hover:bg-yellow-100/50 dark:hover:bg-yellow-800/30 transition-colors">
            <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center">
              <MdSettings className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold">Settings objašnjenja</span>
            <MdExpandMore className="ml-auto text-yellow-600 dark:text-yellow-400 group-open:rotate-180 transition-transform duration-200 w-5 h-5" />
          </summary>

          <div className="px-4 pb-4 space-y-3 text-sm text-yellow-800 dark:text-yellow-200 bg-white/50 dark:bg-yellow-900/20">
            <div className="space-y-3">
              <div className="p-2 bg-white dark:bg-yellow-800/30 rounded border border-yellow-200 dark:border-yellow-700">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  FPL Proxy URL:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Opcionalno polje za zaobilaženje CORS problema. Koristite samo
                  ako imate problema sa pristupom FPL API-ju.
                </p>
              </div>

              <div className="p-2 bg-white dark:bg-yellow-800/30 rounded border border-yellow-200 dark:border-yellow-700">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  CRON Secret:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Sigurnosni ključ za server-side automatizaciju i scheduled
                  taskove. Potreban za backend operacije.
                </p>
              </div>

              <div className="p-2 bg-white dark:bg-yellow-800/30 rounded border border-yellow-200 dark:border-yellow-700">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Live Bonus:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  DA! Bonus poeni se računaju uživo tokom mečeva na osnovu BPS
                  (Bonus Points System) statistika.
                </p>
              </div>

              <div className="p-2 bg-white dark:bg-yellow-800/30 rounded border border-yellow-200 dark:border-yellow-700">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Points System:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  <strong>Active</strong> = starter tim (pozicije 1-11),{" "}
                  <strong>Bench</strong> = rezerve (pozicije 12-15)
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
