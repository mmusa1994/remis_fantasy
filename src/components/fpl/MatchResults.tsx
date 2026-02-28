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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("fpl");
  const [matchData, setMatchData] = useState<MatchResult[]>([]);
  const [stats, setStats] = useState<GameweekStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(
    new Set()
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(
    null
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
      // Use our API endpoint which handles CORS and data formatting
      const [matchResponse, statsResponse] = await Promise.all([
        fetch(`/api/fpl/match-results?gameweek=${gameweek}`),
        fetch(`/api/fpl/match-results?gameweek=${gameweek}&stats=true`),
      ]);

      if (!matchResponse.ok) {
        throw new Error(
          `Match data API failed with status: ${matchResponse.status}`
        );
      }

      if (!statsResponse.ok) {
        console.warn(
          "Stats API failed, continuing without stats:",
          statsResponse.status
        );
      }

      const matchResult = await matchResponse.json();

      if (!matchResult.success) {
        throw new Error(matchResult.error || "Failed to fetch match data");
      }

      setMatchData(matchResult.data || []);

      // Try to load stats if available
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ Error fetching match data:", error);
      setError(
        error instanceof Error ? error.message : t("fplLive.fetchError")
      );
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [gameweek, t]);

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

  if (isInitialLoad || (loading && matchData.length === 0)) {
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
            GW{gameweek} {t("fplLive.keyStats")}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            <div className="text-center p-3 sm:p-4 lg:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-200 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                {stats.totalGoals}
              </div>
              <div className="text-xs sm:text-sm lg:text-base font-medium text-theme-foreground theme-transition">
                {t("fplLive.goals")}
              </div>
            </div>

            <div className="text-center p-3 sm:p-4 lg:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-200 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">
                {stats.totalAssists}
              </div>
              <div className="text-xs sm:text-sm lg:text-base font-medium text-theme-foreground theme-transition">
                {t("fplLive.assists")}
              </div>
            </div>

            {stats.highestScorer && (
              <div className="text-center p-3 sm:p-4 lg:p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm hover:shadow-md transition-all duration-200 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                  <FaCrown className="text-yellow-600 text-sm sm:text-lg" />
                </div>
                <div className="font-bold text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 truncate">
                  {stats.highestScorer.web_name}
                </div>
                <div className="text-sm sm:text-lg lg:text-xl font-bold text-theme-foreground theme-transition">
                  {stats.highestScorer.points} {t("fplLive.points")}
                </div>
              </div>
            )}

            {stats.mostOwned && (
              <div className="text-center p-3 sm:p-4 lg:p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all duration-200 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                  <MdTrendingUp className="text-purple-600 text-sm sm:text-lg" />
                </div>
                <div className="font-bold text-purple-600 dark:text-purple-400 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 truncate">
                  {stats.mostOwned.web_name}
                </div>
                <div className="text-sm sm:text-lg lg:text-xl font-bold text-theme-foreground theme-transition">
                  {stats.mostOwned.ownership_top10k?.toFixed(1)}%
                </div>
              </div>
            )}

            {stats.biggestDifferential && (
              <div className="text-center p-3 sm:p-4 lg:p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-all duration-200 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                  <MdStar className="text-red-600 text-sm sm:text-lg" />
                </div>
                <div className="font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 truncate">
                  {stats.biggestDifferential.web_name}
                </div>
                <div className="text-sm sm:text-lg lg:text-xl font-bold text-theme-foreground theme-transition">
                  {stats.biggestDifferential.points} {t("fplLive.points")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Match Results Container */}
      <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <IoIosFootball className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-theme-foreground theme-transition">
                {t("fplLive.matchResults")} GW{gameweek}
              </h3>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 theme-transition">
                {matchData.length} {t("fplLive.matches")}
                {lastUpdated && (
                  <span className="block sm:inline sm:ml-2 text-xs">
                    {lastUpdated && (
                      <span className="hidden sm:inline">• </span>
                    )}
                    {t("fplLive.updated")}: {lastUpdated}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={fetchMatchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <MdRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("fplLive.loading") : t("fplLive.refresh")}
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

            function onManagerSelect(id: number) {
              throw new Error("Function not implemented.");
            }

            return (
              <div
                key={match.fixture_id}
                className="bg-theme-card rounded-md border-theme-border overflow-hidden hover:shadow-lg transition-all theme-transition"
              >
                {/* Accordion Header */}
                <div
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-all theme-transition"
                  onClick={() => toggleMatchExpansion(match.fixture_id)}
                >
                  {/* Status and Expand Icon */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span
                      className={`px-3 py-1 rounded-md text-sm font-bold ${getStatusColor(
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
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <PiTShirtFill
                        className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-lg flex-shrink-0"
                        style={{
                          color: getTeamColors(match.home_team.id).primary,
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-xl text-theme-foreground theme-transition truncate">
                          {match.home_team.short_name}
                        </div>
                        <div className="text-xs sm:text-sm text-black/60 dark:text-white/60 theme-transition">
                          {match.home_ownership.toFixed(1)}%{" "}
                          <span className="hidden sm:inline">
                            {t("fplLive.effectiveOwnership")}
                          </span>
                          <span className="sm:hidden">EO</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="px-3 py-2 sm:px-6 sm:py-4 bg-black dark:bg-white rounded-md mx-2 sm:mx-6">
                      <div className="text-lg sm:text-3xl font-bold text-white dark:text-black text-center theme-transition">
                        {match.home_score} - {match.away_score}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                      <div className="text-right min-w-0">
                        <div className="font-bold text-sm sm:text-xl text-theme-foreground theme-transition truncate">
                          {match.away_team.short_name}
                        </div>
                        <div className="text-xs sm:text-sm text-black/60 dark:text-white/60 theme-transition">
                          {match.away_ownership.toFixed(1)}%{" "}
                          <span className="hidden sm:inline">
                            {t("fplLive.effectiveOwnership")}
                          </span>
                          <span className="sm:hidden">EO</span>
                        </div>
                      </div>
                      <PiTShirtFill
                        className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-lg flex-shrink-0"
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
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-theme-border">
                      <div className="grid grid-cols-2 gap-2 sm:gap-6">
                        {/* Home Team Events */}
                        <div className="space-y-1 sm:space-y-2">
                          {homeGoals.map((goalData) => (
                            <div
                              key={`preview-home-goal-${goalData.player.id}`}
                              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
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
                              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
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
                                {t("fplLive.noEvents")}
                              </div>
                            )}
                        </div>

                        {/* Away Team Events */}
                        <div className="space-y-1 sm:space-y-2 text-right">
                          {awayGoals.map((goalData) => (
                            <div
                              key={`preview-away-goal-${goalData.player.id}`}
                              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-end"
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
                              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-end"
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
                    className="border-t border-theme-border bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 theme-transition"
                  >
                    {/* Detailed Match Header */}
                    <div className="text-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-theme-border">
                      <h4 className="text-lg sm:text-2xl font-bold text-theme-foreground mb-2 sm:mb-3 theme-transition px-2">
                        {match.home_team.name} vs {match.away_team.name}
                      </h4>
                      <div className="text-2xl sm:text-4xl font-bold text-theme-foreground mb-3 sm:mb-4 theme-transition">
                        {match.home_score} - {match.away_score}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      {/* Home Team Details */}
                      <div className="space-y-4 sm:space-y-6">
                        <h5 className="font-bold text-theme-foreground text-lg sm:text-xl flex items-center gap-2 sm:gap-3 theme-transition">
                          <PiTShirtFill
                            className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg flex-shrink-0"
                            style={{
                              color: getTeamColors(match.home_team.id).primary,
                            }}
                          />
                          <span className="truncate">
                            {match.home_team.name}
                          </span>
                        </h5>

                        {/* Goals */}
                        {homeGoals.length > 0 && (
                          <div>
                            <h6 className="text-base sm:text-lg font-bold text-theme-foreground mb-2 sm:mb-3 flex items-center gap-2 theme-transition">
                              <IoIosFootball className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              Golovi
                            </h6>
                            <div className="space-y-2 sm:space-y-3">
                              {homeGoals.map((goalData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-2 sm:border-l-4 border-green-600"
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
                                        {goalData.minutes.join(", ")}&apos;
                                        {goalData.penalties > 0 && (
                                          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-md font-bold">
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
                                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-2 sm:border-l-4 border-blue-600"
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
                                        {assistData.minutes.join(", ")}&apos;
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

                        {/* Best Performers and EO Players */}
                        <div>
                          <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                            <MdStar className="w-5 h-5 text-yellow-500" />
                            {t("fplLive.bestPerformersAndEO")}
                          </h6>
                          <div className="space-y-2">
                            {match.top_performers.home.map(
                              (player: MatchResultPlayer, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-theme-card rounded-md border-theme-border hover:shadow-md transition-all cursor-pointer theme-transition"
                                  onClick={() => {
                                    if (
                                      player.ownership_top10k &&
                                      player.ownership_top10k > 5
                                    ) {
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
                                      {player.points} {t("fplLive.points")}
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
                      <div className="space-y-4 sm:space-y-6">
                        <h5 className="font-bold text-theme-foreground text-lg sm:text-xl flex items-center gap-2 sm:gap-3 theme-transition">
                          <PiTShirtFill
                            className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg flex-shrink-0"
                            style={{
                              color: getTeamColors(match.away_team.id).primary,
                            }}
                          />
                          <span className="truncate">
                            {match.away_team.name}
                          </span>
                        </h5>

                        {/* Goals */}
                        {awayGoals.length > 0 && (
                          <div>
                            <h6 className="text-lg font-bold text-theme-foreground mb-3 flex items-center gap-2 theme-transition">
                              <IoIosFootball className="w-5 h-5 text-green-600" />
                              {t("fplLive.goals")}
                            </h6>
                            <div className="space-y-3">
                              {awayGoals.map((goalData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-2 sm:border-l-4 border-green-600"
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
                                        {goalData.minutes.join(", ")}&apos;
                                        {goalData.penalties > 0 && (
                                          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-md font-bold">
                                            {t("fplLive.penalty")}
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
                              {t("fplLive.assists")}
                            </h6>
                            <div className="space-y-3">
                              {awayAssists.map((assistData, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-2 sm:border-l-4 border-blue-600"
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
                                        {assistData.minutes.join(", ")}&apos;
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
                            {t("fplLive.bestPerformersAndEO")}
                          </h6>
                          <div className="space-y-2">
                            {match.top_performers.away.map(
                              (player: MatchResultPlayer, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-theme-card rounded-md border-theme-border hover:shadow-md transition-all cursor-pointer theme-transition"
                                  onClick={() => {
                                    if (
                                      player.ownership_top10k &&
                                      player.ownership_top10k > 5
                                    ) {
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
