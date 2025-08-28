"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MdPerson,
  MdGroup,
  MdExpandMore,
  MdExpandLess,
  MdPlayArrow,
  MdStop,
  MdRefresh,
  MdSports,
  MdTrendingUp,
  MdStars,
  MdBarChart,
  MdFlashOn,
  MdAccessTime,
} from "react-icons/md";
import { GiTrophy, GiArmBandage } from "react-icons/gi";
import { BsLightningCharge } from "react-icons/bs";

interface LeagueTablesProps {
  leagueData: any;
  managerId: number;
  gameweek: number;
  onManagerSelect?: (managerId: number) => void;
}

interface LivePlayer {
  id: string;
  name: string;
  team: string;
  overall_points: number;
  live_points: number;
  captain_multiplier: number;
  vice_captain_multiplier: number;
  bonus_points: number;
  rank: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export default function LeagueTables({
  leagueData,
  managerId,
  gameweek,
  onManagerSelect,
}: LeagueTablesProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"classic" | "h2h">("classic");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    new Set()
  );
  const [leagueStandings, setLeagueStandings] = useState<{
    [key: number]: any;
  }>({});
  const [loadingLeagues, setLoadingLeagues] = useState<Set<string>>(new Set());
  const [totalEntries, setTotalEntries] = useState<{ [key: number]: number }>(
    {}
  );
  const [lastFetched, setLastFetched] = useState<{ [key: number]: number }>({});

  // Live mode state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedLiveLeague, setSelectedLiveLeague] = useState<number | null>(
    null
  );
  const [liveData, setLiveData] = useState<LivePlayer[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string>("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const maxPositions = 50;
  const DATA_TTL = 5 * 60 * 1000;
  const LIVE_POLL_INTERVAL = 30000; // 30 seconds

  // Get current gameweek from FPL API
  const getCurrentGameweek = async () => {
    try {
      const response = await fetch("/api/fpl/bootstrap-static");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.events) {
          // Find current gameweek (first event that hasn't finished)
          const currentGW = data.data.events.find(
            (event: any) => !event.finished && event.is_current
          );
          return currentGW ? currentGW.id : gameweek;
        }
      }
    } catch (error) {
      console.warn("Failed to get current gameweek:", error);
    }
    return gameweek; // fallback to passed gameweek
  };

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Get available leagues for live mode
  const availableLeagues = useMemo(
    () => [
      ...(leagueData?.classic || []).map((league: any) => ({
        ...league,
        type: "classic",
      })),
      ...(leagueData?.h2h || []).map((league: any) => ({
        ...league,
        type: "h2h",
      })),
    ],
    [leagueData]
  );

  // Set initial selected league when available leagues change
  useEffect(() => {
    if (availableLeagues.length > 0 && selectedLiveLeague === null) {
      setSelectedLiveLeague(availableLeagues[0].id);
    }
  }, [availableLeagues, selectedLiveLeague]);

  // Live polling effect
  useEffect(() => {
    if (isPolling && isLiveMode && selectedLiveLeague) {
      const poll = () => fetchLiveData();

      // Initial fetch
      fetchLiveData();

      // Start polling
      pollingInterval.current = setInterval(poll, LIVE_POLL_INTERVAL);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [isPolling, isLiveMode, selectedLiveLeague]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLiveData = async () => {
    if (!isLiveMode || !selectedLiveLeague) return;

    try {
      const selectedLeague = availableLeagues.find(
        (league) => league.id === selectedLiveLeague
      );
      if (!selectedLeague) return;

      // Get current gameweek
      const currentGW = await getCurrentGameweek();

      const isH2H = selectedLeague.type === "h2h";

      // Get league standings with regular API
      const standingsResponse = await fetch(
        `/api/fpl/leagues/${
          isH2H ? "h2h" : "classic"
        }?leagueId=${selectedLiveLeague}&managerId=${managerId}&page=1&pageSize=50`
      );

      if (!standingsResponse.ok) return;

      const standingsResult = await standingsResponse.json();
      if (!standingsResult.success || !standingsResult.data?.standings) return;

      // Get live data for each manager in the league
      const livePlayersPromises = standingsResult.data.standings.map(
        async (entry: any) => {
          try {
            // Get live team data for each manager
            const liveTeamResponse = await fetch("/api/fpl/load-team", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                managerId: entry.entry,
                gameweek: currentGW,
                skeleton: false,
              }),
            });

            if (liveTeamResponse.ok) {
              const liveTeamData = await liveTeamResponse.json();
              if (liveTeamData.success && liveTeamData.data) {
                const teamTotals = liveTeamData.data.team_totals || {};
                const livePoints = teamTotals.total_points || entry.total;
                const bonusPoints = teamTotals.bonus_points || 0;

                return {
                  id: entry.entry.toString(),
                  name: entry.player_name || entry.entry_name,
                  team: entry.entry_name,
                  overall_points: entry.total,
                  live_points: livePoints,
                  captain_multiplier: 2,
                  vice_captain_multiplier: 1,
                  bonus_points: bonusPoints,
                  rank: entry.rank,
                  is_captain: false,
                  is_vice_captain: false,
                };
              }
            }
          } catch (err) {
            console.warn(
              `Failed to get live data for manager ${entry.entry}:`,
              err
            );
          }

          // Fallback to regular data
          return {
            id: entry.entry.toString(),
            name: entry.player_name || entry.entry_name,
            team: entry.entry_name,
            overall_points: entry.total,
            live_points: entry.total,
            captain_multiplier: 2,
            vice_captain_multiplier: 1,
            bonus_points: 0,
            rank: entry.rank,
            is_captain: false,
            is_vice_captain: false,
          };
        }
      );

      const combinedPlayers = await Promise.all(livePlayersPromises);

      // Sort by live points
      combinedPlayers.sort(
        (a: LivePlayer, b: LivePlayer) => b.live_points - a.live_points
      );

      // Get live events count
      const liveResponse = await fetch("/api/fpl/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameweek: currentGW, secret: "auto-poll" }),
      });

      const liveBonus = liveResponse.ok
        ? await liveResponse.json()
        : { data: { new_events: 0 } };

      setLiveData(combinedPlayers);
      setLiveStats({
        total_players: combinedPlayers.length,
        live_events: liveBonus.data?.new_events || 0,
        gameweek: currentGW,
      });
      setLastLiveUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Live data fetch error:", error);
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
    setIsPolling(false);
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const fetchLeagueStandings = async (
    leagueId: number,
    isH2H: boolean = false
  ) => {
    const loadingKey = `${leagueId}_top50_${isH2H}`;
    if (loadingLeagues.has(loadingKey)) return;

    setLoadingLeagues((prev) => new Set([...prev, loadingKey]));

    try {
      const endpoint = isH2H ? "h2h" : "classic";
      const response = await fetch(
        `/api/fpl/leagues/${endpoint}?leagueId=${leagueId}&managerId=${managerId}&page=1&pageSize=${maxPositions}`
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const standingsData = result.data.standings || [];
          const userFound = standingsData.some(
            (entry: any) => entry.entry === managerId
          );

          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: {
              standings: standingsData,
              manager_position: result.data.manager_position,
              total_entries: result.data.total_entries || 0,
              user_found: userFound,
              has_data: true,
              error: null,
            },
          }));

          setTotalEntries((prev) => ({
            ...prev,
            [leagueId]: result.data.total_entries || 0,
          }));

          setLastFetched((prev) => ({
            ...prev,
            [leagueId]: Date.now(),
          }));
        } else {
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: {
              error: result.error || "Failed to load standings",
              has_data: false,
              standings: [],
              total_entries: 0,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching league standings:", error);
    } finally {
      setLoadingLeagues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  const toggleLeague = (leagueId: number, isH2H: boolean = false) => {
    if (isLiveMode) return; // Don't expand in live mode

    const isExpanded = expandedLeagues.has(leagueId);

    if (isExpanded) {
      setExpandedLeagues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(leagueId);
        return newSet;
      });
    } else {
      setExpandedLeagues((prev) => new Set([...prev, leagueId]));

      // Always fetch when expanding (keep current functionality)
      const hasData = leagueStandings[leagueId];
      const lastFetchedTime = lastFetched[leagueId];
      const isDataStale =
        lastFetchedTime && Date.now() - lastFetchedTime > DATA_TTL;

      if (!hasData || isDataStale) {
        fetchLeagueStandings(leagueId, isH2H);
      }
    }
  };

  if (!leagueData || (!leagueData.classic?.length && !leagueData.h2h?.length)) {
    return (
      <div className="bg-theme-card border-theme-border rounded-lg shadow p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground flex items-center theme-transition">
          <GiTrophy className="mr-2 text-yellow-500" />
          {t("fplLive.leaguesTables")}
        </h3>
        <p className="text-theme-text-secondary text-sm theme-transition">
          {t("fplLive.noLeagueDataAvailable")}
        </p>
      </div>
    );
  }

  const allClassicLeagues = leagueData.classic || [];
  const allH2HLeagues = leagueData.h2h || [];
  const hasClassic = allClassicLeagues.length > 0;
  const hasH2H = allH2HLeagues.length > 0;

  return (
    <div className="bg-theme-card border-theme-border rounded-lg shadow theme-transition">
      <div className="px-6 py-4 border-b border-theme-border">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-theme-foreground flex items-center theme-transition">
            <GiTrophy className="mr-2 text-yellow-500" />
            {isLiveMode
              ? t("fplLive.liveLeagueTracking")
              : t("fplLive.leaguesTables")}
          </h3>

          {/* Live mode toggle */}
          <button
            onClick={toggleLiveMode}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLiveMode
                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {isLiveMode ? <MdStop /> : <MdPlayArrow />}
            <span className="hidden xs:inline">
              {isLiveMode ? t("fplLive.exitLive") : t("fplLive.startLive")}
            </span>
            <span className="xs:hidden">
              {isLiveMode ? t("fplLive.exit") : t("fplLive.live")}
            </span>
          </button>
        </div>
      </div>

      {/* Live Mode UI */}
      {isLiveMode ? (
        <div className="p-6">
          {/* Live Controls Card */}
          <div className="bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-6 border border-blue-200/50 dark:border-gray-600 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h4 className="text-lg font-semibold text-theme-foreground theme-transition">
                {t("fplLive.liveTrackingControls")}
              </h4>
            </div>

            {/* League Selection */}
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-theme-secondary">
                  <MdBarChart className="w-4 h-4" />
                  {t("fplLive.leagueSelection")}
                </label>
                <select
                  value={selectedLiveLeague || ""}
                  onChange={(e) =>
                    setSelectedLiveLeague(Number(e.target.value))
                  }
                  className="w-full px-4 py-3 input-theme rounded-lg font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {availableLeagues.map((league: any) => (
                    <option
                      key={`${league.id}-${league.type}`}
                      value={league.id}
                    >
                      {league.name} (
                      {league.type === "h2h" ? "H2H" : t("fplLive.classic")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Control Buttons */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-theme-secondary">
                  <MdFlashOn className="w-4 h-4" />
                  {t("fplLive.liveActions")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={togglePolling}
                    disabled={!selectedLiveLeague}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                      isPolling
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {isPolling ? (
                      <MdStop className="w-5 h-5" />
                    ) : (
                      <MdPlayArrow className="w-5 h-5" />
                    )}
                    {isPolling ? t("fplLive.stopLive") : t("fplLive.startLive")}
                  </button>

                  <button
                    onClick={fetchLiveData}
                    disabled={!selectedLiveLeague}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <MdRefresh className="w-4 h-4" />
                    {t("fplLive.refresh")}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            {liveStats && (
              <div className="mt-6 pt-4 border-t border-theme-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-theme-card-secondary rounded-lg p-4 text-center shadow-sm border-theme-border theme-transition">
                    <MdPerson className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-theme-foreground theme-transition">
                      {liveStats.total_players}
                    </div>
                    <div className="text-xs text-theme-muted font-medium">
                      {t("fplLive.players")}
                    </div>
                  </div>

                  <div className="bg-theme-card-secondary rounded-lg p-4 text-center shadow-sm border-theme-border theme-transition">
                    <BsLightningCharge className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-theme-foreground theme-transition">
                      {liveStats.live_events}
                    </div>
                    <div className="text-xs text-theme-muted font-medium">
                      {t("fplLive.liveEvents")}
                    </div>
                  </div>

                  <div className="bg-theme-card-secondary rounded-lg p-4 text-center shadow-sm border-theme-border theme-transition">
                    <MdSports className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-theme-foreground theme-transition">
                      {liveStats.gameweek}
                    </div>
                    <div className="text-xs text-theme-muted font-medium">
                      {t("fplLive.gameweek")}
                    </div>
                  </div>

                  {lastLiveUpdate && (
                    <div className="bg-theme-card-secondary rounded-lg p-4 text-center shadow-sm border-theme-border theme-transition">
                      <MdRefresh className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm font-bold text-theme-primary">
                        {lastLiveUpdate}
                      </div>
                      <div className="text-xs text-theme-muted font-medium">
                        {t("fplLive.lastUpdate")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Standings Table */}
          {liveData.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 dark:from-green-600 dark:via-blue-600 dark:to-purple-700 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg flex items-center gap-2">
                  <BsLightningCharge className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  <span className="hidden sm:inline">
                    {t("fplLive.liveLeagueStandings")}
                  </span>
                  <span className="sm:hidden text-xs">
                    {t("fplLive.liveStandings")}
                  </span>
                  <span className="ml-auto bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                    <span className="hidden sm:inline">
                      {
                        availableLeagues.find(
                          (league) => league.id === selectedLiveLeague
                        )?.name
                      }
                    </span>
                    <span className="sm:hidden">
                      {availableLeagues
                        .find((league) => league.id === selectedLiveLeague)
                        ?.name?.substring(0, 15) + "..."}
                    </span>
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          #
                        </div>
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {t("fplLive.manager")}
                      </th>
                      <th className="px-1 sm:px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center justify-center gap-1">
                          <MdTrendingUp className="w-3 h-3 text-blue-500" />
                          <span className="hidden sm:inline">
                            {t("fplLive.overall")}
                          </span>
                          <span className="sm:hidden">Pts</span>
                        </div>
                      </th>
                      <th className="px-1 sm:px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center justify-center gap-1">
                          <BsLightningCharge className="w-3 h-3 text-green-500 animate-pulse" />
                          <span className="hidden sm:inline text-green-600 dark:text-green-400">
                            {t("fplLive.live")}
                          </span>
                          <span className="sm:hidden text-green-600 dark:text-green-400">
                            Live
                          </span>
                        </div>
                      </th>
                      <th className="px-1 sm:px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center justify-center gap-1">
                          <MdStars className="w-3 h-3 text-yellow-500" />
                          <span className="hidden sm:inline">
                            {t("fplLive.bonus")}
                          </span>
                          <span className="sm:hidden">B</span>
                        </div>
                      </th>
                      <th className="px-1 sm:px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center justify-center gap-1">
                          <GiArmBandage className="w-3 h-3 text-purple-500" />
                          <span className="hidden sm:inline">
                            {t("fplLive.captain")}
                          </span>
                          <span className="sm:hidden">C</span>
                        </div>
                      </th>
                      <th className="px-1 sm:px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="flex items-center justify-center gap-1">
                          <MdTrendingUp className="w-3 h-3 text-orange-500" />
                          <span className="hidden sm:inline">Pos Change</span>
                          <span className="sm:hidden">Δ</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {liveData.map((player, index) => {
                      const previousPosition = player.rank;
                      const currentPosition = index + 1;
                      const positionChange = previousPosition - currentPosition;

                      return (
                        <tr
                          key={player.id}
                          className={`transition-all duration-300 hover:shadow-sm ${
                            player.id === managerId?.toString()
                              ? "bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20 border-l-4 border-gradient-to-b from-blue-500 to-purple-500 shadow-md"
                              : index < 3
                              ? "bg-gradient-to-r from-yellow-50/50 to-orange-50/30 dark:from-yellow-900/10 dark:to-orange-900/10 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20"
                              : "hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/40 dark:hover:from-gray-700/30 dark:hover:to-blue-900/10"
                          }`}
                        >
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm border-2 ${
                                  index < 3
                                    ? index === 0
                                      ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white border-yellow-300 shadow-yellow-200"
                                      : index === 1
                                      ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-800 border-gray-200 shadow-gray-100"
                                      : "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white border-orange-300 shadow-orange-200"
                                    : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                                }`}
                              >
                                {currentPosition}
                              </div>
                              {player.id === managerId?.toString() && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm border border-blue-400">
                                  {t("fplLive.you")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                                {player.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                                {player.team}
                              </div>
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 py-3 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                              <span className="font-bold text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                                {player.overall_points}
                              </span>
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                <span className="font-bold text-green-700 dark:text-green-300 text-xs sm:text-sm">
                                  {player.live_points}
                                </span>
                              </div>
                              {player.live_points !== player.overall_points && (
                                <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full mt-1 font-medium border border-green-200 dark:border-green-800">
                                  +{player.live_points - player.overall_points}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 py-3 text-center">
                            {player.bonus_points > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white shadow-sm border border-yellow-300">
                                +{player.bonus_points}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-1 sm:px-2 py-3 text-center">
                            {player.is_captain ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-sm border-2 border-yellow-300">
                                <GiArmBandage className="w-3 h-3 text-white" />
                              </div>
                            ) : player.is_vice_captain ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                                VC
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-1 sm:px-2 py-3 text-center">
                            {positionChange !== 0 ? (
                              <div className="flex items-center justify-center">
                                {positionChange > 0 ? (
                                  <div className="flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg border border-red-200 dark:border-red-800">
                                    <MdTrendingUp className="w-3 h-3 rotate-180 text-red-600 dark:text-red-400" />
                                    <span className="text-xs ml-1 font-bold text-red-700 dark:text-red-300">
                                      -{positionChange}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
                                    <MdTrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs ml-1 font-bold text-green-700 dark:text-green-300">
                                      +{Math.abs(positionChange)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Live Stats Footer */}
              <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-green-50 dark:from-gray-800 dark:via-blue-900/30 dark:to-green-900/30 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        Live GW{liveStats?.gameweek}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdBarChart className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {liveStats?.total_players} players
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BsLightningCharge className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {liveStats?.live_events} live events
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MdAccessTime className="w-4 h-4" />
                    <span className="font-medium">
                      Last update: {lastLiveUpdate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card rounded-xl shadow-lg border border-theme-border p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                {isPolling ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-theme-border rounded-full animate-spin border-t-blue-500"></div>
                      <BsLightningCharge className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-theme-primary">
                        {t("fplLive.loadingLiveData")}
                      </h3>
                      <p className="text-theme-muted">
                        Fetching latest standings from{" "}
                        {
                          availableLeagues.find(
                            (league) => league.id === selectedLiveLeague
                          )?.name
                        }
                      </p>
                      <div className="flex items-center justify-center mt-4">
                        <div className="flex space-x-2">
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                      <MdSports className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-theme-primary">
                        {t("fplLive.readyToGoLive")}
                      </h3>
                      <p className="text-theme-muted max-w-md">
                        {t("fplLive.selectLeagueAndClickStartLive")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-theme-muted">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>{t("fplLive.autoRefreshEvery30Seconds")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Normal Mode UI (existing code)
        <>
          {/* Tab Navigation */}
          {hasClassic && hasH2H && (
            <div className="px-6 pt-4">
              <div className="flex space-x-1 bg-theme-secondary rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("classic")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "classic"
                      ? "bg-theme-card text-theme-primary shadow"
                      : "text-theme-muted hover:text-theme-primary"
                  }`}
                >
                  <MdGroup className="inline mr-1" />
                  {t("fplLive.classic")} ({allClassicLeagues.length})
                </button>
                <button
                  onClick={() => setActiveTab("h2h")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "h2h"
                      ? "bg-theme-card text-theme-primary shadow"
                      : "text-theme-muted hover:text-theme-primary"
                  }`}
                >
                  <MdPerson className="inline mr-1" />
                  {t("fplLive.headToHead")} ({allH2HLeagues.length})
                </button>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Classic Leagues */}
            {(activeTab === "classic" || !hasH2H) && hasClassic && (
              <div className="space-y-3">
                {allClassicLeagues.map((league: any) => {
                  const isExpanded = expandedLeagues.has(league.id);
                  const loadingKey = `${league.id}_top50_false`;
                  const isLoading = loadingLeagues.has(loadingKey);
                  const standings = leagueStandings[league.id];

                  return (
                    <div
                      key={league.id}
                      className="border border-theme-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleLeague(league.id)}
                        className="w-full bg-theme-secondary px-4 py-3 border-b border-theme-border hover:bg-theme-accent transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-theme-primary text-left">
                            {league.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <MdExpandLess className="text-theme-muted" />
                            ) : (
                              <MdExpandMore className="text-theme-muted" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div>
                          {isLoading ? (
                            <div className="p-6 text-center bg-theme-card">
                              <div className="relative mx-auto w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-theme-border"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-theme-primary">
                                  {t("fplLive.loadingLeagueStandings")}
                                </p>
                                <p className="text-xs text-theme-muted">
                                  Fetching top 50 positions
                                </p>
                              </div>
                              <div className="flex items-center justify-center mt-3">
                                <div className="flex space-x-1">
                                  <div
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "0ms" }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "200ms" }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "400ms" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : standings?.error ? (
                            <div className="p-4 text-sm text-red-500">
                              {standings.error}
                            </div>
                          ) : standings?.has_data &&
                            standings?.standings &&
                            standings.standings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-theme-secondary">
                                  <tr>
                                    <th className="px-2 sm:px-4 py-2 text-left text-theme-primary text-xs">
                                      #
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-left text-theme-primary text-xs">
                                      {t("fplLive.manager")}
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-right text-theme-primary text-xs">
                                      {t("fplLive.points")}
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-center text-theme-primary text-xs">
                                      Δ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.standings.map(
                                    (entry: any, index: number) => {
                                      const positionChange = entry.last_rank
                                        ? entry.rank - entry.last_rank
                                        : 0;
                                      return (
                                        <tr
                                          key={entry.id}
                                          className={`border-b dark:border-gray-700 ${
                                            entry.entry === managerId
                                              ? "bg-blue-50 dark:bg-blue-900"
                                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                          }`}
                                        >
                                          <td className="px-2 sm:px-4 py-2 font-medium text-xs">
                                            <div className="flex items-center gap-1">
                                              <span
                                                className={
                                                  index < 3 ? "font-bold" : ""
                                                }
                                              >
                                                {entry.rank}
                                              </span>
                                              {entry.entry === managerId && (
                                                <span className="text-blue-500 text-xs">
                                                  ←
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-2 sm:px-4 py-2">
                                            <div className="truncate">
                                              <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
                                                {entry.player_name ||
                                                  entry.entry_name}
                                                {entry.entry === managerId && (
                                                  <span className="text-xs text-blue-500 font-bold bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
                                                    TI
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-2 sm:px-4 py-2 text-right font-medium text-xs sm:text-sm">
                                            {entry.total.toLocaleString()}
                                          </td>
                                          <td className="px-2 sm:px-4 py-2 text-center">
                                            {positionChange > 0 ? (
                                              <div className="flex items-center justify-center text-red-600">
                                                <MdTrendingUp className="w-3 h-3 rotate-180" />
                                                <span className="text-xs ml-1">
                                                  -{Math.abs(positionChange)}
                                                </span>
                                              </div>
                                            ) : positionChange < 0 ? (
                                              <div className="flex items-center justify-center text-green-600">
                                                <MdTrendingUp className="w-3 h-3" />
                                                <span className="text-xs ml-1">
                                                  +{Math.abs(positionChange)}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 text-xs">
                                                —
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  )}
                                </tbody>
                              </table>

                              {/* Footer with position indicator */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                                <div className="flex flex-col items-center space-y-3">
                                  {standings.has_data && (
                                    <>
                                      {standings.user_found &&
                                      standings.manager_position ? (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                          <MdPerson className="w-4 h-4" />
                                          <span className="font-medium">
                                            TI si #{standings.manager_position}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                          <span className="font-medium">
                                            TI nisi u top {maxPositions}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing top {maxPositions} positions •{" "}
                                    {totalEntries[league.id] || 0} total entries
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500">
                              {t("fplLive.noStandingsAvailable")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* H2H Leagues */}
            {activeTab === "h2h" && hasH2H && (
              <div className="space-y-3">
                {allH2HLeagues.map((league: any) => {
                  const isExpanded = expandedLeagues.has(league.id);
                  const loadingKey = `${league.id}_top50_true`;
                  const isLoading = loadingLeagues.has(loadingKey);
                  const standings = leagueStandings[league.id];

                  return (
                    <div
                      key={league.id}
                      className="border border-theme-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleLeague(league.id, true)}
                        className="w-full bg-theme-secondary px-4 py-3 border-b border-theme-border hover:bg-theme-accent transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-theme-primary text-left">
                            {league.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <MdExpandLess className="text-theme-muted" />
                            ) : (
                              <MdExpandMore className="text-theme-muted" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div>
                          {isLoading ? (
                            <div className="p-6 text-center bg-theme-card">
                              <div className="relative mx-auto w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-theme-border"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-theme-primary">
                                  {t("fplLive.loadingH2HLeague")}
                                </p>
                                <p className="text-xs text-theme-muted">
                                  Fetching head-to-head standings
                                </p>
                              </div>
                              <div className="flex items-center justify-center mt-3">
                                <div className="flex space-x-1">
                                  <div
                                    className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "0ms" }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "200ms" }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                                    style={{ animationDelay: "400ms" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : standings?.error ? (
                            <div className="p-4 text-sm text-red-500">
                              {standings.error}
                            </div>
                          ) : standings?.has_data &&
                            standings?.standings &&
                            standings.standings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-600">
                                  <tr>
                                    <th className="px-2 sm:px-4 py-2 text-left text-xs">
                                      #
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-left text-xs">
                                      {t("fplLive.leaguesManager")}
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-right text-xs">
                                      {t("fplLive.wdl")}
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-right text-xs">
                                      {t("fplLive.leaguesPoints")}
                                    </th>
                                    <th className="px-2 sm:px-4 py-2 text-center text-xs">
                                      Δ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.standings.map(
                                    (entry: any, index: number) => {
                                      const positionChange = entry.last_rank
                                        ? entry.rank - entry.last_rank
                                        : 0;
                                      return (
                                        <tr
                                          key={entry.id}
                                          className={`border-b dark:border-gray-700 ${
                                            entry.entry === managerId
                                              ? "bg-blue-50 dark:bg-blue-900"
                                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                          }`}
                                        >
                                          <td className="px-2 sm:px-4 py-2 font-medium text-xs">
                                            <div className="flex items-center gap-1">
                                              <span
                                                className={
                                                  index < 3 ? "font-bold" : ""
                                                }
                                              >
                                                {entry.rank}
                                              </span>
                                              {entry.entry === managerId && (
                                                <span className="text-blue-500 text-xs">
                                                  ←
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-2 sm:px-4 py-2">
                                            <div className="truncate">
                                              <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
                                                {entry.player_name ||
                                                  entry.entry_name}
                                                {entry.entry === managerId && (
                                                  <span className="text-xs text-blue-500 font-bold bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
                                                    TI
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-2 sm:px-4 py-2 text-right text-xs">
                                            <span className="font-mono">
                                              {entry.matches_won}-
                                              {entry.matches_drawn}-
                                              {entry.matches_lost}
                                            </span>
                                          </td>
                                          <td className="px-2 sm:px-4 py-2 text-right font-medium text-xs sm:text-sm">
                                            {entry.total}
                                          </td>
                                          <td className="px-2 sm:px-4 py-2 text-center">
                                            {positionChange > 0 ? (
                                              <div className="flex items-center justify-center text-red-600">
                                                <MdTrendingUp className="w-3 h-3 rotate-180" />
                                                <span className="text-xs ml-1">
                                                  -{Math.abs(positionChange)}
                                                </span>
                                              </div>
                                            ) : positionChange < 0 ? (
                                              <div className="flex items-center justify-center text-green-600">
                                                <MdTrendingUp className="w-3 h-3" />
                                                <span className="text-xs ml-1">
                                                  +{Math.abs(positionChange)}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 text-xs">
                                                —
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  )}
                                </tbody>
                              </table>

                              {/* H2H Footer */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                                <div className="flex flex-col items-center space-y-3">
                                  {standings.has_data && (
                                    <>
                                      {standings.user_found &&
                                      standings.manager_position ? (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                          <MdPerson className="w-4 h-4" />
                                          <span className="font-medium">
                                            TI si #{standings.manager_position}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                          <span className="font-medium">
                                            TI nisi u top {maxPositions}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing top {maxPositions} positions •{" "}
                                    {totalEntries[league.id] || 0} total entries
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500">
                              {t("fplLive.noH2HStandingsAvailable")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
