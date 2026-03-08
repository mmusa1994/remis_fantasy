"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MdRefresh,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { getTeamColors } from "@/lib/team-colors";
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const toggleMatchExpansion = (fixtureId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(fixtureId)) {
      newExpanded.delete(fixtureId);
    } else {
      newExpanded.add(fixtureId);
      setTimeout(() => {
        const el = document.getElementById(`expanded-${fixtureId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    setExpandedMatches(newExpanded);
  };

  const fetchMatchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [matchResponse, statsResponse] = await Promise.all([
        fetch(`/api/fpl/match-results?gameweek=${gameweek}`),
        fetch(`/api/fpl/match-results?gameweek=${gameweek}&stats=true`),
      ]);

      if (!matchResponse.ok) {
        throw new Error(`Match data API failed with status: ${matchResponse.status}`);
      }

      const matchResult = await matchResponse.json();
      if (!matchResult.success) {
        throw new Error(matchResult.error || "Failed to fetch match data");
      }

      setMatchData(matchResult.data || []);

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) setStats(statsResult.data);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "LIVE":
        return "text-red-500 font-semibold animate-pulse";
      case "FT":
        return "text-theme-text-secondary font-medium";
      default:
        return "text-theme-text-secondary font-medium";
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

  const getGroupedGoals = (goals: MatchGoal[]) => {
    const grouped = goals.reduce((acc, goal) => {
      const pid = goal.player.id;
      if (!acc[pid]) acc[pid] = { player: goal.player, count: 0, penalties: 0, minutes: [] };
      acc[pid].count++;
      acc[pid].minutes.push(goal.minute);
      if (goal.penalty) acc[pid].penalties++;
      return acc;
    }, {} as Record<number, { player: MatchResultPlayer; count: number; penalties: number; minutes: number[] }>);
    return Object.values(grouped);
  };

  const getGroupedAssists = (assists: MatchAssist[]) => {
    const grouped = assists.reduce((acc, assist) => {
      const pid = assist.player.id;
      if (!acc[pid]) acc[pid] = { player: assist.player, count: 0, minutes: [] };
      acc[pid].count++;
      acc[pid].minutes.push(assist.minute);
      return acc;
    }, {} as Record<number, { player: MatchResultPlayer; count: number; minutes: number[] }>);
    return Object.values(grouped);
  };

  if (isInitialLoad || (loading && matchData.length === 0)) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 space-y-2 theme-transition">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      {stats && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-theme-foreground">{stats.totalGoals}</span>
            <span className="text-xs text-theme-text-secondary">{t("fplLive.goals")}</span>
          </div>
          <div className="w-px h-4 bg-theme-border" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-theme-foreground">{stats.totalAssists}</span>
            <span className="text-xs text-theme-text-secondary">{t("fplLive.assists")}</span>
          </div>
          {stats.highestScorer && (
            <>
              <div className="w-px h-4 bg-theme-border" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-theme-foreground">{stats.highestScorer.web_name}</span>
                <span className="text-xs text-theme-text-secondary">{stats.highestScorer.points} {t("fplLive.pts")}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-semibold text-theme-foreground">
            {t("fplLive.matchResults")} GW{gameweek}
          </h3>
          <p className="text-[11px] text-theme-text-secondary">
            {matchData.length} {t("fplLive.matches")}
            {lastUpdated && <span> &middot; {t("fplLive.updated")}: {lastUpdated}</span>}
          </p>
        </div>
        <button
          onClick={fetchMatchData}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-card-secondary hover:bg-theme-border text-theme-text-secondary rounded text-xs font-medium transition-all"
        >
          <MdRefresh className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {t("fplLive.refresh")}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-theme-card border border-theme-border rounded text-xs text-red-500">
          {error}
        </div>
      )}

      {/* Match Cards */}
      <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden divide-y divide-theme-border theme-transition">
        {matchData.map((match) => {
          const isExpanded = expandedMatches.has(match.fixture_id);
          const homeGoals = getGroupedGoals(match.home_goals);
          const awayGoals = getGroupedGoals(match.away_goals);
          const homeAssists = getGroupedAssists(match.home_assists);
          const awayAssists = getGroupedAssists(match.away_assists);
          const hasEvents = homeGoals.length > 0 || awayGoals.length > 0 || homeAssists.length > 0 || awayAssists.length > 0;

          return (
            <div key={match.fixture_id}>
              {/* Match Row */}
              <div
                className="px-3 py-3 sm:px-4 sm:py-3.5 cursor-pointer hover:bg-theme-card-secondary transition-colors theme-transition"
                onClick={() => toggleMatchExpansion(match.fixture_id)}
              >
                {/* Main score line */}
                <div className="flex items-center gap-2">
                  {/* Status */}
                  <span className={`text-[10px] w-7 text-center flex-shrink-0 ${getStatusStyle(match.status)}`}>
                    {getStatusText(match)}
                  </span>

                  {/* Home */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div
                      className="w-1 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTeamColors(match.home_team.id).primary }}
                    />
                    <span className="text-xs sm:text-sm font-semibold text-theme-foreground truncate">
                      {match.home_team.short_name}
                    </span>
                    <span className="text-[10px] text-theme-text-secondary hidden sm:inline">
                      {match.home_ownership.toFixed(1)}%
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 px-2">
                    <span className="text-sm sm:text-base font-bold text-theme-foreground tabular-nums">
                      {match.home_score}
                    </span>
                    <span className="text-[10px] text-theme-text-secondary">-</span>
                    <span className="text-sm sm:text-base font-bold text-theme-foreground tabular-nums">
                      {match.away_score}
                    </span>
                  </div>

                  {/* Away */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-[10px] text-theme-text-secondary hidden sm:inline">
                      {match.away_ownership.toFixed(1)}%
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-theme-foreground truncate text-right">
                      {match.away_team.short_name}
                    </span>
                    <div
                      className="w-1 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTeamColors(match.away_team.id).primary }}
                    />
                  </div>

                  {/* Expand */}
                  <MdKeyboardArrowDown
                    className={`w-4 h-4 text-theme-text-secondary flex-shrink-0 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Events preview */}
                {hasEvents && (
                  <div className="mt-2 ml-9 grid grid-cols-2 gap-x-6 gap-y-0.5">
                    {/* Home events */}
                    <div className="space-y-0.5">
                      {homeGoals.map((g) => (
                        <p key={`hg-${g.player.id}`} className="text-[11px] text-theme-foreground truncate">
                          {g.player.web_name}{g.count > 1 ? ` ×${g.count}` : ""}
                        </p>
                      ))}
                      {homeAssists.map((a) => (
                        <p key={`ha-${a.player.id}`} className="text-[11px] text-theme-text-secondary truncate">
                          {a.player.web_name}{a.count > 1 ? ` ×${a.count}` : ""}
                        </p>
                      ))}
                    </div>

                    {/* Away events */}
                    <div className="space-y-0.5 text-right">
                      {awayGoals.map((g) => (
                        <p key={`ag-${g.player.id}`} className="text-[11px] text-theme-foreground truncate">
                          {g.player.web_name}{g.count > 1 ? ` ×${g.count}` : ""}
                        </p>
                      ))}
                      {awayAssists.map((a) => (
                        <p key={`aa-${a.player.id}`} className="text-[11px] text-theme-text-secondary truncate">
                          {a.player.web_name}{a.count > 1 ? ` ×${a.count}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  id={`expanded-${match.fixture_id}`}
                  className="px-3 py-4 sm:px-5 sm:py-5 bg-theme-card-secondary border-t border-theme-border theme-transition"
                >
                  {/* Match title */}
                  <div className="text-center mb-4 pb-3 border-b border-theme-border">
                    <p className="text-sm font-semibold text-theme-foreground">
                      {match.home_team.name} {match.home_score} - {match.away_score} {match.away_team.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Home Team */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold text-theme-foreground flex items-center gap-2 uppercase tracking-wide">
                        <div
                          className="w-1 h-3.5 rounded-full"
                          style={{ backgroundColor: getTeamColors(match.home_team.id).primary }}
                        />
                        {match.home_team.name}
                      </h5>

                      {homeGoals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.goals")}
                          </p>
                          <div className="space-y-1">
                            {homeGoals.map((g, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-theme-card rounded border border-theme-border">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-theme-foreground">
                                    {g.player.web_name}{g.count > 1 ? ` ×${g.count}` : ""}
                                  </span>
                                  <span className="text-[10px] text-theme-text-secondary">
                                    {g.minutes.join(", ")}&apos;
                                    {g.penalties > 0 ? " (P)" : ""}
                                  </span>
                                </div>
                                <span className="text-[10px] text-theme-text-secondary tabular-nums">
                                  {g.player.ownership_top10k?.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {homeAssists.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.assists")}
                          </p>
                          <div className="space-y-1">
                            {homeAssists.map((a, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-theme-card rounded border border-theme-border">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-theme-foreground">
                                    {a.player.web_name}{a.count > 1 ? ` ×${a.count}` : ""}
                                  </span>
                                  <span className="text-[10px] text-theme-text-secondary">{a.minutes.join(", ")}&apos;</span>
                                </div>
                                <span className="text-[10px] text-theme-text-secondary tabular-nums">
                                  {a.player.ownership_top10k?.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top performers */}
                      {match.top_performers.home.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.bestPerformersAndEO")}
                          </p>
                          <div className="space-y-0.5">
                            {match.top_performers.home.map((player, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1 px-2.5">
                                <span className="text-xs text-theme-foreground">{player.web_name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-theme-foreground tabular-nums">{player.points} {t("fplLive.pts")}</span>
                                  <span className="text-[10px] text-theme-text-secondary tabular-nums">{player.ownership_top10k?.toFixed(1)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold text-theme-foreground flex items-center gap-2 uppercase tracking-wide">
                        <div
                          className="w-1 h-3.5 rounded-full"
                          style={{ backgroundColor: getTeamColors(match.away_team.id).primary }}
                        />
                        {match.away_team.name}
                      </h5>

                      {awayGoals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.goals")}
                          </p>
                          <div className="space-y-1">
                            {awayGoals.map((g, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-theme-card rounded border border-theme-border">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-theme-foreground">
                                    {g.player.web_name}{g.count > 1 ? ` ×${g.count}` : ""}
                                  </span>
                                  <span className="text-[10px] text-theme-text-secondary">
                                    {g.minutes.join(", ")}&apos;
                                    {g.penalties > 0 ? " (P)" : ""}
                                  </span>
                                </div>
                                <span className="text-[10px] text-theme-text-secondary tabular-nums">
                                  {g.player.ownership_top10k?.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {awayAssists.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.assists")}
                          </p>
                          <div className="space-y-1">
                            {awayAssists.map((a, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-theme-card rounded border border-theme-border">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-theme-foreground">
                                    {a.player.web_name}{a.count > 1 ? ` ×${a.count}` : ""}
                                  </span>
                                  <span className="text-[10px] text-theme-text-secondary">{a.minutes.join(", ")}&apos;</span>
                                </div>
                                <span className="text-[10px] text-theme-text-secondary tabular-nums">
                                  {a.player.ownership_top10k?.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {match.top_performers.away.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-theme-text-secondary uppercase tracking-wide mb-1.5">
                            {t("fplLive.bestPerformersAndEO")}
                          </p>
                          <div className="space-y-0.5">
                            {match.top_performers.away.map((player, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1 px-2.5">
                                <span className="text-xs text-theme-foreground">{player.web_name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-theme-foreground tabular-nums">{player.points} {t("fplLive.pts")}</span>
                                  <span className="text-[10px] text-theme-text-secondary tabular-nums">{player.ownership_top10k?.toFixed(1)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
