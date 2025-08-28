/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MdRefresh,
  MdStar,
  MdTrendingUp,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { IoIosFootball } from "react-icons/io";
import { FaShoePrints, FaFire, FaCrown } from "react-icons/fa";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";
import LoadingCard from "../shared/LoadingCard";

interface MatchResultsProps {
  gameweek: number;
  isPolling?: boolean;
  onManagerSelect?: (managerId: number) => void;
}

interface MatchResultPlayer {
  id: number;
  web_name: string;
  team_id: number;
  ownership_top10k?: number;
  ownership_overall?: number;
  points: number;
}

interface MatchGoal {
  player: MatchResultPlayer;
  minute: number;
  own_goal: boolean;
  penalty: boolean;
}

interface MatchAssist {
  player: MatchResultPlayer;
  minute: number;
  goal_player_id: number;
}

interface MatchResult {
  fixture_id: number;
  gameweek: number;
  home_team: {
    id: number;
    name: string;
    short_name: string;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
  };
  home_score: number;
  away_score: number;
  status: "LIVE" | "FT" | "SCHEDULED";
  kickoff_time: string;
  minutes: number;
  home_goals: MatchGoal[];
  away_goals: MatchGoal[];
  home_assists: MatchAssist[];
  away_assists: MatchAssist[];
  top_performers: {
    home: MatchResultPlayer[];
    away: MatchResultPlayer[];
  };
  home_ownership: number;
  away_ownership: number;
}

interface GameweekStats {
  totalGoals: number;
  totalAssists: number;
  highestScorer: MatchResultPlayer | null;
  mostOwned: MatchResultPlayer | null;
  biggestDifferential: MatchResultPlayer | null;
}

export default function MatchResults({
  gameweek,
  isPolling = false,
}: MatchResultsProps) {
  const [matchData, setMatchData] = useState<MatchResult[]>([]);
  const [stats, setStats] = useState<GameweekStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(
    new Set()
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);

  const toggleMatchExpansion = (fixtureId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(fixtureId)) {
      newExpanded.delete(fixtureId);
    } else {
      newExpanded.add(fixtureId);
      setTimeout(() => {
        const expandedElement = document.getElementById(
          `expanded-${fixtureId}`
        );
        if (expandedElement) {
          expandedElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);
    }
    setExpandedMatches(newExpanded);
  };

  const fetchMatchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching match data for gameweek:", gameweek);
      
      // Use our API endpoint which handles CORS and data formatting
      const [matchResponse, statsResponse] = await Promise.all([
        fetch(`/api/fpl/match-results?gameweek=${gameweek}`),
        fetch(`/api/fpl/match-results?gameweek=${gameweek}&stats=true`),
      ]);

      console.log("📡 API responses:", {
        matchOk: matchResponse.ok,
        statsOk: statsResponse.ok,
        matchStatus: matchResponse.status,
        statsStatus: statsResponse.status
      });

      if (!matchResponse.ok) {
        throw new Error(`Match data API failed with status: ${matchResponse.status}`);
      }

      if (!statsResponse.ok) {
        console.warn("Stats API failed, continuing without stats:", statsResponse.status);
      }

      const matchResult = await matchResponse.json();
      
      if (!matchResult.success) {
        throw new Error(matchResult.error || "Failed to fetch match data");
      }

      console.log("✅ Match data loaded:", {
        gameweek: matchResult.gameweek,
        matchCount: matchResult.data?.length || 0,
        dataSource: matchResult.data_sources
      });

      setMatchData(matchResult.data || []);

      // Try to load stats if available
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
          console.log("✅ Stats data loaded:", statsResult.data);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ Error fetching match data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch match data"
      );
    } finally {
      setLoading(false);
    }
  }, [gameweek]);

  useEffect(() => {
    fetchMatchData();
  }, [gameweek, fetchMatchData]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchMatchData, 30000);
    return () => clearInterval(interval);
  }, [isPolling, gameweek, fetchMatchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-red-500 text-white animate-pulse";
      case "FT":
        return "bg-green-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const getStatusText = (match: MatchResult) => {
    switch (match.status) {
      case "LIVE":
        return `${match.minutes}'`;
      case "FT":
        return "FT";
      case "SCHEDULED":
        return new Date(match.kickoff_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      default:
        return match.status;
    }
  };

  // Group goals by player
  const getGroupedGoals = (goals: MatchGoal[]) => {
    const grouped = goals.reduce((acc, goal) => {
      const playerId = goal.player.id;
      if (!acc[playerId]) {
        acc[playerId] = {
          player: goal.player,
          count: 0,
          penalties: 0,
          minutes: [],
        };
      }
      acc[playerId].count++;
      acc[playerId].minutes.push(goal.minute);
      if (goal.penalty) acc[playerId].penalties++;
      return acc;
    }, {} as Record<number, { player: MatchResultPlayer; count: number; penalties: number; minutes: number[] }>);

    return Object.values(grouped);
  };

  // Group assists by player
  const getGroupedAssists = (assists: MatchAssist[]) => {
    const grouped = assists.reduce((acc, assist) => {
      const playerId = assist.player.id;
      if (!acc[playerId]) {
        acc[playerId] = {
          player: assist.player,
          count: 0,
          minutes: [],
        };
      }
      acc[playerId].count++;
      acc[playerId].minutes.push(assist.minute);
      return acc;
    }, {} as Record<number, { player: MatchResultPlayer; count: number; minutes: number[] }>);

    return Object.values(grouped);
  };

  if (loading && matchData.length === 0) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <LoadingCard title="Loading match results..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Manager Selection */}
      {selectedManagerId && (
        <div className="bg-theme-card rounded-md p-4 border-theme-border theme-transition mb-4">
          <h4 className="text-lg font-bold text-theme-foreground mb-2 theme-transition">
            Manager #{selectedManagerId} Statistics
          </h4>
          <button 
            onClick={() => setSelectedManagerId(null)}
            className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors theme-transition"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {/* Gameweek Stats */}
      {stats && (
        <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="text-lg font-bold text-theme-foreground mb-4 flex items-center gap-2 theme-transition">
            <FaFire className="text-orange-500" />
            GW{gameweek} Ključne Statistike
          </h4>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalGoals}
              </div>
              <div className="text-sm text-theme-foreground theme-transition">
                Golova
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalAssists}
              </div>
              <div className="text-sm text-theme-foreground theme-transition">
                Asistencija
              </div>
            </div>

            {stats.highestScorer && (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FaCrown className="text-yellow-600" />
                </div>
                <div className="font-bold text-yellow-600 dark:text-yellow-400 text-sm mb-1">
                  {stats.highestScorer.web_name}
                </div>
                <div className="text-lg font-bold text-theme-foreground theme-transition">
                  {stats.highestScorer.points} pts
                </div>
              </div>
            )}

            {stats.mostOwned && (
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdTrendingUp className="text-purple-600" />
                </div>
                <div className="font-bold text-purple-600 dark:text-purple-400 text-sm mb-1">
                  {stats.mostOwned.web_name}
                </div>
                <div className="text-lg font-bold text-theme-foreground theme-transition">
                  {stats.mostOwned.ownership_top10k?.toFixed(1)}%
                </div>
              </div>
            )}

            {stats.biggestDifferential && (
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdStar className="text-red-600" />
                </div>
                <div className="font-bold text-red-600 dark:text-red-400 text-sm mb-1">
                  {stats.biggestDifferential.web_name}
                </div>
                <div className="text-lg font-bold text-theme-foreground theme-transition">
                  {stats.biggestDifferential.points} pts
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Match Results Container */}
      <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <IoIosFootball className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-theme-foreground theme-transition">
                Rezultati utakmica GW{gameweek}
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60 theme-transition">
                {matchData.length} utakmica
                {lastUpdated && (
                  <span className="ml-2 text-xs">
                    • Ažurirano: {lastUpdated}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={fetchMatchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
          >
            <MdRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Ažuriraj
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Accordion Style Match Cards */}
        <div className="space-y-4">
          {matchData.map((match) => {
            const isExpanded = expandedMatches.has(match.fixture_id);
            const homeGoals = getGroupedGoals(match.home_goals);
            const awayGoals = getGroupedGoals(match.away_goals);
            const homeAssists = getGroupedAssists(match.home_assists);
            const awayAssists = getGroupedAssists(match.away_assists);

            return (
              <div
                key={match.fixture_id}
                className="bg-theme-card rounded-md border-theme-border overflow-hidden hover:shadow-lg transition-all theme-transition"
              >
                {/* Accordion Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-all theme-transition"
                  onClick={() => toggleMatchExpansion(match.fixture_id)}
                >
                  {/* Status and Expand Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                        match.status
                      )}`}
                    >
                      {getStatusText(match)}
                    </span>
                    <MdKeyboardArrowDown
                      className={`w-6 h-6 text-theme-foreground transition-transform theme-transition ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Teams and Score */}
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex items-center gap-4 flex-1">
                      <PiTShirtFill
                        className="w-12 h-12 drop-shadow-lg"
                        style={{
                          color: getTeamColors(match.home_team.id).primary,
                        }}
                      />
                      <div>
                        <div className="font-bold text-xl text-theme-foreground theme-transition">
                          {match.home_team.short_name}
                        </div>
                        <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                          {match.home_ownership.toFixed(1)}% EO
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="px-6 py-4 bg-black dark:bg-white rounded-md mx-6">
                      <div className="text-3xl font-bold text-white dark:text-black text-center theme-transition">
                        {match.home_score} - {match.away_score}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <div className="font-bold text-xl text-theme-foreground theme-transition">
                          {match.away_team.short_name}
                        </div>
                        <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                          {match.away_ownership.toFixed(1)}% EO
                        </div>
                      </div>
                      <PiTShirtFill
                        className="w-12 h-12 drop-shadow-lg"
                        style={{
                          color: getTeamColors(match.away_team.id).primary,
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Events Preview */}
                  {(homeGoals.length > 0 ||
                    awayGoals.length > 0 ||
                    homeAssists.length > 0 ||
                    awayAssists.length > 0) && (
                    <div className="mt-6 pt-4 border-t border-theme-border">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Home Team Events */}
                        <div className="space-y-2">
                          {homeGoals.map((goalData) => (
                            <div
                              key={`preview-home-goal-${goalData.player.id}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <IoIosFootball className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-theme-foreground theme-transition">
                                {goalData.player.web_name}
                                {goalData.count > 1
                                  ? ` (x${goalData.count})`
                                  : ""}
                              </span>
                              {goalData.penalties > 0 && (
                                <span className="px-1 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                                  P
                                  {goalData.penalties > 1
                                    ? `(x${goalData.penalties})`
                                    : ""}
                                </span>
                              )}
                            </div>
                          ))}
                          {homeAssists.map((assistData) => (
                            <div
                              key={`preview-home-assist-${assistData.player.id}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <FaShoePrints className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-theme-foreground theme-transition">
                                {assistData.player.web_name}
                                {assistData.count > 1
                                  ? ` (x${assistData.count})`
                                  : ""}
                              </span>
                            </div>
                          ))}
                          {homeGoals.length === 0 &&
                            homeAssists.length === 0 && (
                              <div className="text-sm text-black/50 dark:text-white/50 italic theme-transition">
                                Nema događaja
                              </div>
                            )}
                        </div>

                        {/* Away Team Events */}
                        <div className="space-y-2 text-right">
                          {awayGoals.map((goalData) => (
                            <div
                              key={`preview-away-goal-${goalData.player.id}`}
                              className="flex items-center gap-2 text-sm justify-end"
                            >
                              {goalData.penalties > 0 && (
                                <span className="px-1 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                                  P
                                  {goalData.penalties > 1
                                    ? `(x${goalData.penalties})`
                                    : ""}
                                </span>
                              )}
                              <span className="font-medium text-theme-foreground theme-transition">
                                {goalData.player.web_name}
                                {goalData.count > 1
                                  ? ` (x${goalData.count})`
                                  : ""}
                              </span>
                              <IoIosFootball className="w-4 h-4 text-green-600" />
                            </div>
                          ))}
                          {awayAssists.map((assistData) => (
                            <div
                              key={`preview-away-assist-${assistData.player.id}`}
                              className="flex items-center gap-2 text-sm justify-end"
                            >
                              <span className="font-medium text-theme-foreground theme-transition">
                                {assistData.player.web_name}
                                {assistData.count > 1
                                  ? ` (x${assistData.count})`
                                  : ""}
                              </span>
                              <FaShoePrints className="w-4 h-4 text-blue-600" />
                            </div>
                          ))}
                          {awayGoals.length === 0 &&
                            awayAssists.length === 0 && (
                              <div className="text-sm text-black/50 dark:text-white/50 italic theme-transition">
                                Nema događaja
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div
                    id={`expanded-${match.fixture_id}`}
                    className="border-t border-theme-border bg-gray-50 dark:bg-gray-900 p-6 theme-transition"
                  >
                    {/* Detailed Match Header */}
                    <div className="text-center mb-6 pb-4 border-b border-theme-border">
                      <h4 className="text-2xl font-bold text-theme-foreground mb-3 theme-transition">
                        {match.home_team.name} vs {match.away_team.name}
                      </h4>
                      <div className="text-4xl font-bold text-theme-foreground mb-4 theme-transition">
                        {match.home_score} - {match.away_score}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Home Team Details */}
                      <div className="space-y-6">
                        <h5 className="font-bold text-theme-foreground text-xl flex items-center gap-3 theme-transition">
                          <PiTShirtFill
                            className="w-6 h-6 drop-shadow-lg"
                            style={{
                              color: getTeamColors(match.home_team.id).primary,
                            }}
                          />
                          {match.home_team.name}
                        </h5>

                        {/* Goals */}
                        {homeGoals.length > 0 && (
                          <div>
                            <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                              <IoIosFootball className="w-5 h-5 text-green-600" />
                              Golovi
                            </h6>
                            <div className="space-y-3">
                              {homeGoals.map((goalData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-4 border-green-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <IoIosFootball className="w-5 h-5 text-green-600" />
                                    <div>
                                      <div className="font-bold text-theme-foreground theme-transition">
                                        {goalData.player.web_name}
                                        {goalData.count > 1
                                          ? ` (x${goalData.count})`
                                          : ""}
                                      </div>
                                      <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                        {goalData.minutes.join(", ")}'
                                        {goalData.penalties > 0 && (
                                          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-bold">
                                            PEN
                                            {goalData.penalties > 1
                                              ? `(x${goalData.penalties})`
                                              : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-green-600">
                                      {goalData.player.ownership_top10k?.toFixed(
                                        1
                                      )}
                                      %
                                    </div>
                                    <div className="text-xs text-black/60 dark:text-white/60 theme-transition">
                                      EO
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assists */}
                        {homeAssists.length > 0 && (
                          <div>
                            <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                              <FaShoePrints className="w-5 h-5 text-blue-600" />
                              Asistencije
                            </h6>
                            <div className="space-y-3">
                              {homeAssists.map((assistData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <FaShoePrints className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <div className="font-bold text-theme-foreground theme-transition">
                                        {assistData.player.web_name}
                                        {assistData.count > 1
                                          ? ` (x${assistData.count})`
                                          : ""}
                                      </div>
                                      <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                        {assistData.minutes.join(", ")}'
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-blue-600">
                                      {assistData.player.ownership_top10k?.toFixed(
                                        1
                                      )}
                                      %
                                    </div>
                                    <div className="text-xs text-black/60 dark:text-white/60 theme-transition">
                                      EO
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Top Players */}
                        <div>
                          <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                            <MdStar className="w-5 h-5 text-yellow-500" />
                            Najbiraniji u Top 10k
                          </h6>
                          <div className="space-y-2">
                            {match.top_performers.home.map(
                              (player: MatchResultPlayer, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-theme-card rounded-md border-theme-border hover:shadow-md transition-all cursor-pointer theme-transition"
                                  onClick={() => {
                                    if (player.ownership_top10k && player.ownership_top10k > 5) {
                                      setSelectedManagerId(player.id);
                                      onManagerSelect?.(player.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="font-bold text-theme-foreground theme-transition">
                                      {player.web_name}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-theme-foreground theme-transition">
                                      {player.points} pts
                                    </div>
                                    <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                      {player.ownership_top10k?.toFixed(1)}% EO
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Away Team Details - Same structure as home team */}
                      <div className="space-y-6">
                        <h5 className="font-bold text-theme-foreground text-xl flex items-center gap-3 theme-transition">
                          <PiTShirtFill
                            className="w-6 h-6 drop-shadow-lg"
                            style={{
                              color: getTeamColors(match.away_team.id).primary,
                            }}
                          />
                          {match.away_team.name}
                        </h5>

                        {/* Goals */}
                        {awayGoals.length > 0 && (
                          <div>
                            <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                              <IoIosFootball className="w-5 h-5 text-green-600" />
                              Golovi
                            </h6>
                            <div className="space-y-3">
                              {awayGoals.map((goalData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-4 border-green-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <IoIosFootball className="w-5 h-5 text-green-600" />
                                    <div>
                                      <div className="font-bold text-theme-foreground theme-transition">
                                        {goalData.player.web_name}
                                        {goalData.count > 1
                                          ? ` (x${goalData.count})`
                                          : ""}
                                      </div>
                                      <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                        {goalData.minutes.join(", ")}'
                                        {goalData.penalties > 0 && (
                                          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-bold">
                                            PEN
                                            {goalData.penalties > 1
                                              ? `(x${goalData.penalties})`
                                              : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-green-600">
                                      {goalData.player.ownership_top10k?.toFixed(
                                        1
                                      )}
                                      %
                                    </div>
                                    <div className="text-xs text-black/60 dark:text-white/60 theme-transition">
                                      EO
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assists */}
                        {awayAssists.length > 0 && (
                          <div>
                            <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                              <FaShoePrints className="w-5 h-5 text-blue-600" />
                              Asistencije
                            </h6>
                            <div className="space-y-3">
                              {awayAssists.map((assistData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <FaShoePrints className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <div className="font-bold text-theme-foreground theme-transition">
                                        {assistData.player.web_name}
                                        {assistData.count > 1
                                          ? ` (x${assistData.count})`
                                          : ""}
                                      </div>
                                      <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                        {assistData.minutes.join(", ")}'
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-blue-600">
                                      {assistData.player.ownership_top10k?.toFixed(
                                        1
                                      )}
                                      %
                                    </div>
                                    <div className="text-xs text-black/60 dark:text-white/60 theme-transition">
                                      EO
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Top Players */}
                        <div>
                          <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                            <MdStar className="w-5 h-5 text-yellow-500" />
                            Najbiraniji u Top 10k
                          </h6>
                          <div className="space-y-2">
                            {match.top_performers.away.map(
                              (player: MatchResultPlayer, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-theme-card rounded-md border-theme-border hover:shadow-md transition-all cursor-pointer theme-transition"
                                  onClick={() => {
                                    if (player.ownership_top10k && player.ownership_top10k > 5) {
                                      setSelectedManagerId(player.id);
                                      onManagerSelect?.(player.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="font-bold text-theme-foreground theme-transition">
                                      {player.web_name}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-theme-foreground theme-transition">
                                      {player.points} pts
                                    </div>
                                    <div className="text-sm text-black/60 dark:text-white/60 theme-transition">
                                      {player.ownership_top10k?.toFixed(1)}% EO
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
