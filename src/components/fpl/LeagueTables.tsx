"use client";

import { useState, useEffect, useRef } from "react";
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
  MdStars
} from "react-icons/md";
import { GiTrophy, GiArmBandage } from "react-icons/gi";
import { BsLightningCharge } from "react-icons/bs";

interface LeagueTablesProps {
  leagueData: any;
  managerId: number;
}

// Liga configs for live mode
const LEAGUE_CONFIGS = {
  premium: { id: 277005, name: "REMIS - Premium Liga" },
  h2h: { id: 277479, name: "REMIS - H2H" }, 
  standard: { id: 277449, name: "REMIS - Standard Liga" },
};

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
}: LeagueTablesProps) {
  const [activeTab, setActiveTab] = useState<"classic" | "h2h">("classic");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(new Set());
  const [leagueStandings, setLeagueStandings] = useState<{ [key: number]: any }>({});
  const [loadingLeagues, setLoadingLeagues] = useState<Set<string>>(new Set());
  const [totalEntries, setTotalEntries] = useState<{ [key: number]: number }>({});
  const [lastFetched, setLastFetched] = useState<{ [key: number]: number }>({});
  
  // Live mode state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedLiveLeague, setSelectedLiveLeague] = useState<string>("premium");
  const [liveData, setLiveData] = useState<LivePlayer[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string>("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  
  const maxPositions = 50;
  const DATA_TTL = 5 * 60 * 1000;
  const LIVE_POLL_INTERVAL = 30000; // 30 seconds

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Live polling effect
  useEffect(() => {
    if (isPolling && isLiveMode) {
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
      // Get league players first
      const playersResponse = await fetch(`/api/admin/fpl-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueType: selectedLiveLeague })
      });
      
      if (!playersResponse.ok) return;
      
      const playersData = await playersResponse.json();
      
      // Get live bonus data
      const liveResponse = await fetch('/api/fpl/live-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameweek: 1, limit: 50 })
      });
      
      const liveBonus = liveResponse.ok ? await liveResponse.json() : { data: [] };
      
      // Combine data
      const combinedPlayers: LivePlayer[] = (playersData.matches || []).map((match: any, index: number) => ({
        id: match.dbId,
        name: match.dbName,
        team: match.dbTeam,
        overall_points: match.fplPoints,
        live_points: match.fplPoints + (liveBonus.data?.find((bonus: any) => 
          bonus.player_id === match.fplPlayer?.entry)?.points || 0),
        captain_multiplier: 2, // Default
        vice_captain_multiplier: 1,
        bonus_points: liveBonus.data?.find((bonus: any) => 
          bonus.player_id === match.fplPlayer?.entry)?.points || 0,
        rank: index + 1,
        is_captain: false, // Would need team data to determine
        is_vice_captain: false,
      })).sort((a: LivePlayer, b: LivePlayer) => b.live_points - a.live_points);
      
      setLiveData(combinedPlayers);
      setLiveStats({
        total_players: combinedPlayers.length,
        live_events: liveBonus.data?.length || 0,
        gameweek: liveBonus.gameweek || 1
      });
      setLastLiveUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Live data fetch error:', error);
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

  const fetchLeagueStandings = async (leagueId: number, isH2H: boolean = false) => {
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
          const userFound = standingsData.some((entry: any) => entry.entry === managerId);

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
      const isDataStale = lastFetchedTime && Date.now() - lastFetchedTime > DATA_TTL;

      if (!hasData || isDataStale) {
        fetchLeagueStandings(leagueId, isH2H);
      }
    }
  };

  if (!leagueData || (!leagueData.classic?.length && !leagueData.h2h?.length)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <GiTrophy className="mr-2 text-yellow-500" />
          Leagues
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No league data available. Load a team first to see leagues.
        </p>
      </div>
    );
  }

  const allClassicLeagues = leagueData.classic || [];
  const allH2HLeagues = leagueData.h2h || [];
  const hasClassic = allClassicLeagues.length > 0;
  const hasH2H = allH2HLeagues.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <GiTrophy className="mr-2 text-yellow-500" />
            {isLiveMode ? "Live League Tracking" : "Leagues"}
          </h3>
          
          {/* Live mode toggle */}
          <button
            onClick={toggleLiveMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLiveMode 
                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300" 
                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {isLiveMode ? <MdStop /> : <MdPlayArrow />}
            {isLiveMode ? "Exit Live" : "Start Live"}
          </button>
        </div>
      </div>

      {/* Live Mode UI */}
      {isLiveMode ? (
        <div className="p-6">
          {/* Live Controls Card */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-6 border border-blue-200 dark:border-gray-600">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Live Tracking Controls</h4>
            </div>
            
            {/* Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* League Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  📊 League Selection
                </label>
                <select
                  value={selectedLiveLeague}
                  onChange={(e) => setSelectedLiveLeague(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {Object.entries(LEAGUE_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      🏆 {config.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Control Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ⚡ Live Actions
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={togglePolling}
                    disabled={!selectedLiveLeague}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                      isPolling
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                        : "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                    }`}
                  >
                    {isPolling ? <MdStop className="w-5 h-5" /> : <MdPlayArrow className="w-5 h-5" />}
                    {isPolling ? "Stop Live" : "Start Live"}
                  </button>
                  
                  <button
                    onClick={fetchLiveData}
                    disabled={!selectedLiveLeague}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
                  >
                    <MdRefresh className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Live Stats */}
            {liveStats && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                    <MdPerson className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{liveStats.total_players}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Players</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                    <BsLightningCharge className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{liveStats.live_events}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Live Events</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                    <MdSports className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{liveStats.gameweek}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Gameweek</div>
                  </div>
                  
                  {lastLiveUpdate && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <MdRefresh className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{lastLiveUpdate}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Last Update</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Standings Table */}
          {liveData.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <BsLightningCharge className="w-5 h-5" />
                  Live League Standings
                  <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {LEAGUE_CONFIGS[selectedLiveLeague as keyof typeof LEAGUE_CONFIGS]?.name}
                  </span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <MdTrendingUp className="w-4 h-4" />
                          Overall
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <BsLightningCharge className="w-4 h-4" />
                          Live
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <MdStars className="w-4 h-4" />
                          Bonus
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <GiArmBandage className="w-4 h-4" />
                          Captain
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {liveData.map((player, index) => (
                      <tr
                        key={player.id}
                        className={`transition-colors duration-200 ${
                          player.id === managerId?.toString()
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-500"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index < 3 
                                ? index === 0 
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white" 
                                  : index === 1 
                                  ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800" 
                                  : "bg-gradient-to-r from-orange-300 to-orange-400 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}>
                              {index + 1}
                            </div>
                            {player.id === managerId?.toString() && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">YOU</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{player.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{player.team}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">
                            {player.overall_points}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                              {player.live_points}
                            </span>
                            {player.live_points !== player.overall_points && (
                              <span className="text-xs text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full mt-1">
                                +{player.live_points - player.overall_points}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {player.bonus_points > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                              +{player.bonus_points}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">–</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {player.is_captain ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                              <GiArmBandage className="w-4 h-4 text-white" />
                            </div>
                          ) : player.is_vice_captain ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                              VC
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live data updating every 30 seconds</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Total Players: <strong>{liveData.length}</strong></span>
                    {lastLiveUpdate && (
                      <span>Last Updated: <strong>{lastLiveUpdate}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                {isPolling ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
                      <BsLightningCharge className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Live Data...</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Fetching latest standings from {LEAGUE_CONFIGS[selectedLiveLeague as keyof typeof LEAGUE_CONFIGS]?.name}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                      <MdSports className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ready to Go Live!</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        Select your league above and click <strong>&quot;Start Live&quot;</strong> to begin tracking live standings with real-time bonus points and captain updates.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Auto-refresh every 30 seconds when active</span>
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
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("classic")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "classic"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <MdGroup className="inline mr-1" />
                  Classic ({allClassicLeagues.length})
                </button>
                <button
                  onClick={() => setActiveTab("h2h")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "h2h"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <MdPerson className="inline mr-1" />
                  Head-to-Head ({allH2HLeagues.length})
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
                    <div key={league.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleLeague(league.id)}
                        className="w-full bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-left">
                            {league.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div>
                          {isLoading ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="mt-2 text-sm text-gray-500">Loading...</p>
                            </div>
                          ) : standings?.error ? (
                            <div className="p-4 text-sm text-red-500">{standings.error}</div>
                          ) : standings?.has_data && standings?.standings && standings.standings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-600">
                                  <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Manager</th>
                                    <th className="px-4 py-2 text-right">Points</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.standings.map((entry: any) => (
                                    <tr key={entry.id} className={`border-b dark:border-gray-700 ${entry.entry === managerId ? "bg-blue-50 dark:bg-blue-900" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                                      <td className="px-4 py-2 font-medium">
                                        {entry.rank}
                                        {entry.entry === managerId && (
                                          <span className="ml-1 text-blue-500">←</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {entry.player_name || entry.entry_name}
                                        {entry.entry === managerId && (
                                          <span className="ml-1 text-xs text-blue-500 font-medium">You</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium">{entry.total.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Footer with position indicator */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                                <div className="flex flex-col items-center space-y-3">
                                  {standings.has_data && (
                                    <>
                                      {standings.user_found && standings.manager_position ? (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                          <MdPerson className="w-4 h-4" />
                                          <span className="font-medium">You are #{standings.manager_position}</span>
                                        </div>
                                      ) : (
                                        <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                          <span className="font-medium">You are not in top {maxPositions}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing top {maxPositions} positions • {totalEntries[league.id] || 0} total entries
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500">No standings available</div>
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
                    <div key={league.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleLeague(league.id, true)}
                        className="w-full bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-left">{league.name}</h4>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div>
                          {isLoading ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="mt-2 text-sm text-gray-500">Loading...</p>
                            </div>
                          ) : standings?.error ? (
                            <div className="p-4 text-sm text-red-500">{standings.error}</div>
                          ) : standings?.has_data && standings?.standings && standings.standings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-600">
                                  <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Manager</th>
                                    <th className="px-4 py-2 text-right">W-D-L</th>
                                    <th className="px-4 py-2 text-right">Points</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.standings.map((entry: any) => (
                                    <tr key={entry.id} className={`border-b dark:border-gray-700 ${entry.entry === managerId ? "bg-blue-50 dark:bg-blue-900" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                                      <td className="px-4 py-2 font-medium">
                                        {entry.rank}
                                        {entry.entry === managerId && (
                                          <span className="ml-1 text-blue-500">←</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {entry.player_name || entry.entry_name}
                                        {entry.entry === managerId && (
                                          <span className="ml-1 text-xs text-blue-500 font-medium">You</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right text-xs">
                                        {entry.matches_won}-{entry.matches_drawn}-{entry.matches_lost}
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium">{entry.total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* H2H Footer */}
                              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                                <div className="flex flex-col items-center space-y-3">
                                  {standings.has_data && (
                                    <>
                                      {standings.user_found && standings.manager_position ? (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                          <MdPerson className="w-4 h-4" />
                                          <span className="font-medium">You are #{standings.manager_position}</span>
                                        </div>
                                      ) : (
                                        <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                          <span className="font-medium">You are not in top {maxPositions}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing top {maxPositions} positions • {totalEntries[league.id] || 0} total entries
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500">No H2H standings available</div>
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