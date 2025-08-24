"use client";

import { useState, useEffect } from "react";
import { MdRefresh, MdTrendingUp, MdStar } from "react-icons/md";
import { IoIosFootball } from "react-icons/io";
import { FaShoePrints, FaFire, FaCrown } from "react-icons/fa";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";

interface MatchResultsProps {
  gameweek: number;
  isPolling?: boolean;
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

  const toggleMatchExpansion = (fixtureId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(fixtureId)) {
      newExpanded.delete(fixtureId);
    } else {
      newExpanded.add(fixtureId);
      // Scroll to expanded details after a short delay to allow rendering
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

  const fetchMatchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [matchResponse, statsResponse] = await Promise.all([
        fetch(`/api/fpl/match-results?gameweek=${gameweek}`),
        fetch(`/api/fpl/match-results?gameweek=${gameweek}&stats=true`),
      ]);

      if (!matchResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch match data");
      }

      const [matchResult, statsResult] = await Promise.all([
        matchResponse.json(),
        statsResponse.json(),
      ]);

      if (matchResult.success) {
        setMatchData(matchResult.data);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching match data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch match data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameweek]);

  // Auto-refresh every 30 seconds if polling is enabled
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(fetchMatchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolling, gameweek]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 animate-pulse";
      case "FT":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    }
  };

  const getStatusText = (match: MatchResult) => {
    switch (match.status) {
      case "LIVE":
        return `${match.minutes}&apos;`;
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

  if (loading && matchData.length === 0) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="h-4 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 lg:p-4"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Gameweek Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 lg:p-6 border border-purple-200 dark:border-purple-800">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaFire className="text-orange-500" />
            GW{gameweek} Key Stats
          </h4>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalGoals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Golova
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalAssists}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Asistencija
              </div>
            </div>

            {stats.highestScorer && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FaCrown className="text-yellow-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.highestScorer.web_name}
                  </span>
                </div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.highestScorer.points}pts
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Najviše bodova
                </div>
              </div>
            )}

            {stats.mostOwned && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdTrendingUp className="text-green-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.mostOwned.web_name}
                  </span>
                </div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.mostOwned.ownership_top10k?.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Top 10k EO
                </div>
              </div>
            )}

            {stats.biggestDifferential && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdStar className="text-purple-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.biggestDifferential.web_name}
                  </span>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {stats.biggestDifferential.points}pts
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Diferencijalac
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Match Results */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <IoIosFootball className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                Rezultati utakmica GW{gameweek}
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
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
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            <MdRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Ažuriraj
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
          {matchData.map((match) => (
            <div
              key={match.fixture_id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 lg:p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => toggleMatchExpansion(match.fixture_id)}
            >
              <div className="text-center mb-2">
                <div
                  className={`inline-flex px-2 py-1 rounded text-xs lg:text-sm font-medium ${getStatusColor(
                    match.status
                  )}`}
                >
                  {getStatusText(match)}
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PiTShirtFill
                    className="w-4 h-4"
                    style={{ color: getTeamColors(match.home_team.id).primary }}
                  />
                  <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">
                    {match.home_team.short_name}
                  </div>
                </div>
                <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                  VS
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">
                    {match.away_team.short_name}
                  </div>
                  <PiTShirtFill
                    className="w-4 h-4"
                    style={{ color: getTeamColors(match.away_team.id).primary }}
                  />
                </div>
              </div>

              <div className="text-center mb-2">
                <div className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                  {match.home_score} - {match.away_score}
                </div>
              </div>

              {/* Goals and Assists Preview */}
              {(match.home_goals.length > 0 ||
                match.away_goals.length > 0 ||
                match.home_assists.length > 0 ||
                match.away_assists.length > 0) && (
                <div className="mb-2 space-y-1">
                  {/* Home team goals - grouped by player */}
                  {(() => {
                    const groupedGoals = match.home_goals.reduce(
                      (acc, goal) => {
                        const playerId = goal.player.id;
                        if (!acc[playerId]) {
                          acc[playerId] = {
                            player: goal.player,
                            count: 0,
                            penalties: 0,
                          };
                        }
                        acc[playerId].count++;
                        if (goal.penalty) acc[playerId].penalties++;
                        return acc;
                      },
                      {} as Record<
                        number,
                        { player: any; count: number; penalties: number }
                      >
                    );

                    return Object.values(groupedGoals).map((goalData, idx) => (
                      <div
                        key={`home-goal-${idx}`}
                        className="flex items-center text-xs text-green-600 dark:text-green-400"
                      >
                        <IoIosFootball className="w-3 h-3 mr-1" />
                        {goalData.penalties > 0 && (
                          <span className="mr-1 text-yellow-500">
                            P
                            {goalData.penalties > 1
                              ? `(x${goalData.penalties})`
                              : ""}
                          </span>
                        )}
                        <span className="truncate">
                          {goalData.player.web_name}
                          {goalData.count > 1 ? ` (x${goalData.count})` : ""}
                        </span>
                      </div>
                    ));
                  })()}

                  {/* Home team assists - grouped by player */}
                  {(() => {
                    const groupedAssists = match.home_assists.reduce(
                      (acc, assist) => {
                        const playerId = assist.player.id;
                        if (!acc[playerId]) {
                          acc[playerId] = { player: assist.player, count: 0 };
                        }
                        acc[playerId].count++;
                        return acc;
                      },
                      {} as Record<number, { player: any; count: number }>
                    );

                    return Object.values(groupedAssists).map(
                      (assistData, idx) => (
                        <div
                          key={`home-assist-${idx}`}
                          className="flex items-center text-xs text-blue-600 dark:text-blue-400"
                        >
                          <FaShoePrints className="w-3 h-3 mr-1" />
                          <span className="truncate">
                            {assistData.player.web_name}
                            {assistData.count > 1
                              ? ` (x${assistData.count})`
                              : ""}
                          </span>
                        </div>
                      )
                    );
                  })()}

                  {/* Away team goals - grouped by player */}
                  {(() => {
                    const groupedGoals = match.away_goals.reduce(
                      (acc, goal) => {
                        const playerId = goal.player.id;
                        if (!acc[playerId]) {
                          acc[playerId] = {
                            player: goal.player,
                            count: 0,
                            penalties: 0,
                          };
                        }
                        acc[playerId].count++;
                        if (goal.penalty) acc[playerId].penalties++;
                        return acc;
                      },
                      {} as Record<
                        number,
                        { player: any; count: number; penalties: number }
                      >
                    );

                    return Object.values(groupedGoals).map((goalData, idx) => (
                      <div
                        key={`away-goal-${idx}`}
                        className="flex items-center justify-end text-xs text-green-600 dark:text-green-400"
                      >
                        <span className="truncate mr-1">
                          {goalData.player.web_name}
                          {goalData.count > 1 ? ` (x${goalData.count})` : ""}
                        </span>
                        {goalData.penalties > 0 && (
                          <span className="mr-1 text-yellow-500">
                            {goalData.penalties > 1
                              ? `P(x${goalData.penalties})`
                              : "P"}
                          </span>
                        )}
                        <IoIosFootball className="w-3 h-3" />
                      </div>
                    ));
                  })()}

                  {/* Away team assists - grouped by player */}
                  {(() => {
                    const groupedAssists = match.away_assists.reduce(
                      (acc, assist) => {
                        const playerId = assist.player.id;
                        if (!acc[playerId]) {
                          acc[playerId] = { player: assist.player, count: 0 };
                        }
                        acc[playerId].count++;
                        return acc;
                      },
                      {} as Record<number, { player: any; count: number }>
                    );

                    return Object.values(groupedAssists).map(
                      (assistData, idx) => (
                        <div
                          key={`away-assist-${idx}`}
                          className="flex items-center justify-end text-xs text-blue-600 dark:text-blue-400"
                        >
                          <span className="truncate mr-1">
                            {assistData.player.web_name}
                            {assistData.count > 1
                              ? ` (x${assistData.count})`
                              : ""}
                          </span>
                          <FaShoePrints className="w-3 h-3" />
                        </div>
                      )
                    );
                  })()}
                </div>
              )}

              {/* Ownership Info */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                EO: {match.home_ownership.toFixed(2)}% -{" "}
                {match.away_ownership.toFixed(2)}%
              </div>

              {/* Expand button - always at bottom */}
              <div className="mt-auto pt-2">
                <button className="w-full px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  {expandedMatches.has(match.fixture_id)
                    ? "Sakrij detalje"
                    : "Više detalja"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Match Details */}
        {Array.from(expandedMatches).map((fixtureId) => {
          const match = matchData.find((m) => m.fixture_id === fixtureId);
          if (!match) return null;

          return (
            <div
              key={`expanded-${fixtureId}`}
              id={`expanded-${fixtureId}`}
              className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6"
            >
              <div className="text-center mb-6">
                <h4 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {match.home_team.name} vs {match.away_team.name}
                </h4>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {match.home_score} - {match.away_score}
                </div>
                <div className="flex justify-center gap-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {match.home_team.name}: {match.home_ownership.toFixed(2)}%
                    EO
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {match.away_team.name}: {match.away_ownership.toFixed(2)}%
                    EO
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Details */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <PiTShirtFill
                      className="w-5 h-5"
                      style={{
                        color: getTeamColors(match.home_team.id).primary,
                      }}
                    />
                    {match.home_team.name}
                  </h5>

                  {/* Goals */}
                  {match.home_goals.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Golovi
                      </h6>
                      {(() => {
                        const groupedGoals = match.home_goals.reduce(
                          (acc, goal) => {
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
                          },
                          {} as Record<
                            number,
                            {
                              player: any;
                              count: number;
                              penalties: number;
                              minutes: number[];
                            }
                          >
                        );

                        return Object.values(groupedGoals).map(
                          (goalData, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <IoIosFootball className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {goalData.player.web_name}
                                  {goalData.count > 1
                                    ? ` (x${goalData.count})`
                                    : ""}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {goalData.minutes.join(", ")}&apos;
                                </span>
                                {goalData.penalties > 0 && (
                                  <span className="text-yellow-500 text-xs">
                                    PEN
                                    {goalData.penalties > 1
                                      ? `(x${goalData.penalties})`
                                      : ""}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {goalData.player.ownership_top10k?.toFixed(2)}%
                                EO
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  )}

                  {/* Assists */}
                  {match.home_assists.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Asistencije
                      </h6>
                      {(() => {
                        const groupedAssists = match.home_assists.reduce(
                          (acc, assist) => {
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
                          },
                          {} as Record<
                            number,
                            { player: any; count: number; minutes: number[] }
                          >
                        );

                        return Object.values(groupedAssists).map(
                          (assistData, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FaShoePrints className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {assistData.player.web_name}
                                  {assistData.count > 1
                                    ? ` (x${assistData.count})`
                                    : ""}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {assistData.minutes.join(", ")}&apos;
                                </span>
                              </div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {assistData.player.ownership_top10k?.toFixed(2)}
                                % EO
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  )}

                  {/* Top Players */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top 10k Ownership
                    </h6>
                    <div className="space-y-1">
                      {match.top_performers.home.map((player, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded text-sm"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.web_name}
                          </span>
                          <div className="flex gap-3">
                            <span className="text-gray-600 dark:text-gray-400">
                              {player.ownership_top10k?.toFixed(2)}% EO
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {player.points}pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Away Team Details */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <PiTShirtFill
                      className="w-5 h-5"
                      style={{
                        color: getTeamColors(match.away_team.id).primary,
                      }}
                    />
                    {match.away_team.name}
                  </h5>

                  {/* Goals */}
                  {match.away_goals.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Golovi
                      </h6>
                      {(() => {
                        const groupedGoals = match.away_goals.reduce(
                          (acc, goal) => {
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
                          },
                          {} as Record<
                            number,
                            {
                              player: any;
                              count: number;
                              penalties: number;
                              minutes: number[];
                            }
                          >
                        );

                        return Object.values(groupedGoals).map(
                          (goalData, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <IoIosFootball className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {goalData.player.web_name}
                                  {goalData.count > 1
                                    ? ` (x${goalData.count})`
                                    : ""}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {goalData.minutes.join(", ")}&apos;
                                </span>
                                {goalData.penalties > 0 && (
                                  <span className="text-yellow-500 text-xs">
                                    PEN
                                    {goalData.penalties > 1
                                      ? `(x${goalData.penalties})`
                                      : ""}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {goalData.player.ownership_top10k?.toFixed(2)}%
                                EO
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  )}

                  {/* Assists */}
                  {match.away_assists.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Asistencije
                      </h6>
                      {(() => {
                        const groupedAssists = match.away_assists.reduce(
                          (acc, assist) => {
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
                          },
                          {} as Record<
                            number,
                            { player: any; count: number; minutes: number[] }
                          >
                        );

                        return Object.values(groupedAssists).map(
                          (assistData, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FaShoePrints className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {assistData.player.web_name}
                                  {assistData.count > 1
                                    ? ` (x${assistData.count})`
                                    : ""}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {assistData.minutes.join(", ")}&apos;
                                </span>
                              </div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {assistData.player.ownership_top10k?.toFixed(2)}
                                % EO
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  )}

                  {/* Top Players */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top 10k Ownership
                    </h6>
                    <div className="space-y-1">
                      {match.top_performers.away.map((player, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded text-sm"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.web_name}
                          </span>
                          <div className="flex gap-3">
                            <span className="text-gray-600 dark:text-gray-400">
                              {player.ownership_top10k?.toFixed(2)}% EO
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {player.points}pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
