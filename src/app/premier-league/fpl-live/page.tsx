"use client";

import { useState, useEffect, useCallback } from "react";
import SettingsCard from "@/components/fpl/SettingsCard";
import ControlsBar from "@/components/fpl/ControlsBar";
import ManagerSummary from "@/components/fpl/ManagerSummary";
import SquadTable from "@/components/fpl/SquadTable";
import ScoreboardGrid from "@/components/fpl/ScoreboardGrid";
import LiveTicker from "@/components/fpl/LiveTicker";
import LeagueTables from "@/components/fpl/LeagueTables";

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
  const [data, setData] = useState<FPLData>({});
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

  // Save manager ID and gameweek to localStorage when they change
  useEffect(() => {
    if (managerId !== null) {
      localStorage.setItem("fpl-manager-id", managerId.toString());
    }
  }, [managerId]);

  useEffect(() => {
    localStorage.setItem("fpl-gameweek", gameweek.toString());
  }, [gameweek]);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    console.log("Success:", message);
  };

  const loadLeagues = useCallback(async () => {
    if (!managerId) return;

    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLeagueData(result.data);
        }
      }
    } catch (err) {
      console.error("Error loading leagues:", err);
      // Don't show error for leagues as it's not critical
    }
  }, [managerId]);

  const loadTeam = useCallback(async () => {
    if (!managerId) {
      showError("Please enter a Manager ID first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/load-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId,
          gameweek,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date().toISOString());
        showSuccess("Team loaded successfully");
        // Load leagues after successful team load
        loadLeagues();
      } else {
        throw new Error(result.error || "Failed to load team");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError(message);
      console.error("Error loading team:", err);
    } finally {
      setLoading(false);
    }
  }, [managerId, gameweek, loadLeagues]);

  const fetchNow = useCallback(async () => {
    if (!managerId) {
      showError("Please enter a Manager ID first");
      return;
    }

    if (!data.manager) {
      showError("Load a team first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/poll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameweek,
          secret: "manual-fetch",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await loadTeam();
        showSuccess(`Updated: ${result.data.new_events} new events`);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError(message);
      console.error("Error fetching now:", err);
    } finally {
      setLoading(false);
    }
  }, [gameweek, data.manager, loadTeam, managerId]);

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
            await loadTeam();
          }
        }
      } catch (err) {
        console.error("Error in polling:", err);
      }
    }, 15000);

    setPollingInterval(interval);
    showSuccess("Live polling started (15s interval)");
  }, [gameweek, data.manager, loadTeam, managerId]);

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
                <span className="text-red-500">❌</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <ControlsBar
              managerId={managerId}
              gameweek={gameweek}
              isPolling={isPolling}
              onManagerIdChange={setManagerId}
              onGameweekChange={setGameweek}
              onLoadTeam={loadTeam}
              onFetchNow={fetchNow}
              onStartPolling={startPolling}
              onStopPolling={stopPolling}
              loading={loading}
            />
            {managerId && data.manager && (
              <ManagerSummary
                manager={data.manager}
                teamTotals={data.team_totals}
                captain={data.captain}
                viceCaptain={data.vice_captain}
                bonusAdded={data.bonus_added || false}
                gameweek={gameweek}
                lastUpdated={lastUpdated || undefined}
              />
            )}
          </div>
          <div className="space-y-6">
            <SettingsCard onSettingsSaved={handleSettingsSaved} />
            <LiveTicker gameweek={gameweek} isPolling={isPolling} />
            {leagueData && (
              <LeagueTables leagueData={leagueData} managerId={managerId!} />
            )}
          </div>
        </div>

        {managerId && (
          <>
            <div className="mb-8">
              <SquadTable
                teamData={data.team_with_stats || []}
                predictedBonuses={data.predicted_bonuses || []}
                bonusAdded={data.bonus_added || false}
              />
            </div>

            <div>
              <ScoreboardGrid
                fixtures={data.fixtures || []}
                predictedBonuses={data.predicted_bonuses || []}
                bonusAdded={data.bonus_added || false}
              />
            </div>
          </>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-500">ℹ️</span>
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
                <span className="text-yellow-500">⚙️</span>
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
