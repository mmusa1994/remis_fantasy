"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MdExpandMore, MdRemove, MdRefresh, MdInfo } from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";
import { FaTrophy, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoFootballOutline } from "react-icons/io5";
import { getTeamColors } from "@/lib/team-colors";

interface ProcessedTeam {
  id: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  rank_change: number;
  event_total: number;
  total: number;
  live_points: number;
  live_total: number;
  captain: {
    name: string;
    points: number;
  };
  players_to_play: number;
  active_chip?: string;
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
  event_transfers: number;
  event_transfers_cost: number;
  team_value: number;
  bank: number;
  player_details: Array<{
    element: number;
    points: number;
    live_points: number;
    multiplier: number;
    position: number;
    is_captain: boolean;
    is_vice_captain: boolean;
    opponent?: string;
    is_home?: boolean;
  }>;
}

interface LeagueTableData {
  league: {
    id: string;
    name: string;
  };
  gameweek: number;
  teams: ProcessedTeam[];
  elements: Array<{
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
  }>;
  fpl_teams: Array<{
    id: number;
    name: string;
    short_name: string;
  }>;
  last_updated: string;
}

interface LeagueTablesProps {
  managerId?: number;
  gameweek: number;
  leagueId?: string;
  isPolling?: boolean;
}

export default function LeagueTables({
  managerId,
  gameweek,
  leagueId,
  isPolling = false,
}: LeagueTablesProps) {
  const { t } = useTranslation("fpl");

  const [data, setData] = useState<LeagueTableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueId || "");
  const [leagues, setLeagues] = useState<any[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);

  const fetchManagerLeagues = useCallback(async () => {
    if (!managerId) return;

    setLeaguesLoading(true);
    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Only get classic leagues, not H2H leagues
        setLeagues(result.data.classic || []);
      }
    } catch (err) {
      console.error("Error fetching manager leagues:", err);
    } finally {
      setLeaguesLoading(false);
    }
  }, [managerId]);

  const fetchLeagueTable = useCallback(async () => {
    if (!managerId || !selectedLeagueId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/fpl/live-table-calc?managerId=${managerId}&gameweek=${gameweek}&leagueId=${selectedLeagueId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch league table");
      }
    } catch (err) {
      console.error("Error fetching league table:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [managerId, selectedLeagueId, gameweek]);

  useEffect(() => {
    if (managerId) {
      fetchManagerLeagues();
    }
  }, [managerId, fetchManagerLeagues]);

  useEffect(() => {
    if (managerId && selectedLeagueId) {
      fetchLeagueTable();
    }
  }, [managerId, gameweek, selectedLeagueId, fetchLeagueTable]);

  // Auto-load table when league is selected
  useEffect(() => {
    if (selectedLeagueId && managerId && leagues.length > 0) {
      fetchLeagueTable();
    }
  }, [selectedLeagueId, managerId, leagues.length, fetchLeagueTable]);

  // Removed auto-refresh - user will use manual refresh button

  const toggleTeamExpansion = (teamId: number) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getChipAbbreviation = (chipName: string) => {
    const chipMap: { [key: string]: string } = {
      'freehit': 'FH',
      'wildcard': 'WC',
      'bencboost': 'BB',
      '3xc': 'TC',
      'triple_captain': 'TC',
      'bench_boost': 'BB',
      'free_hit': 'FH'
    };
    return chipMap[chipName.toLowerCase()] || chipName.toUpperCase().slice(0, 2);
  };

  const getChipColor = (chipName: string) => {
    const colorMap: { [key: string]: string } = {
      'FH': 'bg-blue-500',
      'WC': 'bg-green-500', 
      'BB': 'bg-orange-500',
      'TC': 'bg-purple-500'
    };
    return colorMap[chipName] || 'bg-gray-500';
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <FaArrowUp className="w-3 h-3 text-green-500" />;
    } else if (change < 0) {
      return <FaArrowDown className="w-3 h-3 text-red-500" />;
    }
    return <MdRemove className="w-3 h-3 text-gray-400" />;
  };

  const getPlayerElement = (elementId: number) => {
    return data?.elements.find((e) => e.id === elementId);
  };

  const renderPlayerBreakdown = (team: ProcessedTeam) => {
    if (!data) return null;

    const startingXI = team.player_details?.filter(p => p.position <= 11) || [];
    const bench = team.player_details?.filter(p => p.position > 11) || [];

    return (
      <div className="mt-4 p-4 bg-theme-card-secondary rounded-lg border border-theme-border">
        <h4 className="font-semibold text-theme-foreground mb-3 flex items-center gap-2">
          <IoFootballOutline className="w-4 h-4" />
          {t("leagueTables.squadBreakdown")}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {startingXI.map((playerDetail) => {
            const element = getPlayerElement(playerDetail.element);
            if (!element) return null;

            const teamColors = getTeamColors(element.team);
            const displayPoints = playerDetail.live_points * playerDetail.multiplier;

            return (
              <div
                key={playerDetail.element}
                className={`p-3 rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
                  playerDetail.is_captain
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20"
                    : playerDetail.is_vice_captain
                    ? "border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20"
                    : "border-theme-border bg-gradient-to-br from-theme-card to-theme-card-secondary hover:border-purple-300 dark:hover:border-purple-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: teamColors.primary }}
                      ></div>
                      <p className="text-sm font-bold text-theme-foreground truncate">
                        {element.web_name}
                        {playerDetail.is_captain && (
                          <span className="ml-1 text-xs bg-yellow-500 text-white px-1 rounded">
                            C
                          </span>
                        )}
                        {playerDetail.is_vice_captain && (
                          <span className="ml-1 text-xs bg-gray-500 text-white px-1 rounded">
                            V
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-theme-text-secondary leading-tight">
                      {element.first_name} {element.second_name}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-theme-foreground">
                      {displayPoints} pts
                    </div>
                    {playerDetail.multiplier > 1 && (
                      <div className="text-xs text-theme-text-secondary">
                        {playerDetail.live_points} × {playerDetail.multiplier}
                      </div>
                    )}
                    {playerDetail.opponent && (
                      <div className="text-xs text-theme-text-secondary/70">
                        {playerDetail.opponent} ({playerDetail.is_home ? 'H' : 'A'})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench Players */}
        <div className="mt-6">
          <h5 className="text-sm font-bold text-theme-text-secondary mb-3 flex items-center gap-2">
            <span>⚽</span>
            {t("leagueTables.bench")}
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bench.map((playerDetail) => {
              const element = getPlayerElement(playerDetail.element);
              if (!element) return null;

              const teamColors = getTeamColors(element.team);

              return (
                <div
                  key={playerDetail.element}
                  className="p-3 rounded-lg border border-theme-border bg-theme-card hover:bg-theme-card-secondary transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: teamColors.primary }}
                    ></div>
                    <p className="text-xs font-medium text-theme-foreground truncate">
                      {element.web_name}
                    </p>
                  </div>
                  <p className="text-xs text-theme-text-secondary truncate mb-1">
                    {element.first_name}
                  </p>
                  <div className="text-xs font-bold text-theme-foreground">
                    {playerDetail.live_points} pts
                  </div>
                  {playerDetail.opponent && (
                    <div className="text-xs text-theme-text-secondary/70 mt-1">
                      {playerDetail.opponent} ({playerDetail.is_home ? 'H' : 'A'})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!managerId) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-6">
        <div className="text-center">
          <MdInfo className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-theme-text-secondary">
            {t("leagueTables.loadManagerFirst")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* League Selection */}
      <div className="bg-theme-card rounded-lg border border-theme-border p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-theme-foreground mb-2">
              {t("leagueTables.selectLeague")}
            </label>
            {leaguesLoading ? (
              <LoadingCard
                title={t("leagueTables.loadingLeagues")}
                description={t("leagueTables.fetchingManagerLeagues")}
                className="bg-theme-card border-theme-border rounded-md shadow theme-transition"
              />
            ) : (
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="w-full px-3 py-2.5 border border-theme-border rounded-md bg-theme-card text-theme-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="">{t("leagueTables.chooseLeague")}</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} (
                    {league.entry_rank
                      ? `${t("leagueTables.rank")}: ${league.entry_rank}`
                      : t("leagueTables.unranked")}
                    )
                  </option>
                ))}
              </select>
            )}
          </div>
          {data && (
            <button
              onClick={fetchLeagueTable}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors min-h-[42px]"
            >
              <MdRefresh className="w-4 h-4" />
              <span className="hidden sm:inline">{t("leagueTables.refresh")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md">
          <p className="text-sm font-medium">
            {t("leagueTables.errorLoadingTable")}: {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-theme-card rounded-lg border border-theme-border p-8">
          <LoadingCard
            title={t("leagueTables.loadingLeagues")}
            description={t("leagueTables.fetchingManagerLeagues")}
            className="bg-theme-card border-theme-border rounded-md shadow theme-transition"
          />
        </div>
      )}

      {/* League Table */}
      {data && !loading && (
        <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden">
          {/* Header */}
          <div className="bg-theme-card-secondary border-b border-theme-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-theme-foreground flex items-center gap-2">
                  <FaTrophy className="w-5 h-5 text-yellow-500" />
                  {data.league.name}
                </h3>
                <p className="text-sm text-theme-text-secondary">
                  Gameweek {data.gameweek} • {t("leagueTables.liveTable")}
                  {isPolling && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      🔴 {t("leagueTables.live")}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-theme-text-secondary">
                  {t("leagueTables.updated")}:{" "}
                  {new Date(data.last_updated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal scroll container for mobile */}
          <div className="overflow-x-auto">
            {/* Table Headers */}
            <div className="bg-theme-card-secondary border-b-2 border-theme-border min-w-[800px]">
              <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-xs font-bold text-theme-text-secondary uppercase tracking-wider">
                <div className="col-span-1">{t("leagueTables.rank")}</div>
                <div className="col-span-3">{t("leagueTables.team")}</div>
                <div className="col-span-1 text-center">{t("leagueTables.yet")}</div>
                <div className="col-span-2">{t("leagueTables.captain")}</div>
                <div className="col-span-1 text-center">{t("leagueTables.gwPoints")}</div>
                <div className="col-span-1 text-center">{t("leagueTables.total")}</div>
                <div className="col-span-1 text-center">{t("leagueTables.chip")}</div>
                <div className="col-span-2"></div>
              </div>
            </div>

            {/* Table */}
            <div className="divide-y divide-theme-border min-w-[800px]">
              {data.teams.map((team) => {
                const isCurrentUser = managerId === team.id;
                return (
                  <div key={team.id} className="transition-colors">
                    {/* Main Row - Entire row is clickable */}
                    <div 
                      className={`p-4 cursor-pointer transition-all duration-300 group ${
                        isCurrentUser 
                          ? "bg-gradient-to-r from-purple-100/80 to-violet-100/80 dark:from-purple-900/30 dark:to-violet-900/30 shadow-md border-l-4 border-purple-500 dark:border-purple-400" 
                          : "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 dark:hover:from-purple-900/10 dark:hover:to-blue-900/10 hover:shadow-sm"
                      }`}
                      onClick={() => toggleTeamExpansion(team.id)}
                    >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      {/* Rank & Change */}
                      <div className="col-span-1 flex items-center gap-2 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <span className="font-bold text-theme-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {team.rank}
                        </span>
                        {getRankChangeIcon(team.rank_change)}
                      </div>

                      {/* Team Name */}
                      <div className={`col-span-3 min-w-0 rounded-lg px-3 py-2 transition-all duration-200 ${
                        isCurrentUser ? "" : "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-sm"
                      }`}>
                        <div className="flex items-center gap-2">
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white shadow-sm">
                              YOU
                            </span>
                          )}
                          <p className={`font-semibold truncate transition-colors ${
                            isCurrentUser 
                              ? "text-purple-800 dark:text-purple-200" 
                              : "text-theme-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300"
                          }`}>
                            {team.entry_name || "N/A"}
                          </p>
                        </div>
                        <p className={`text-xs truncate transition-colors ${
                          isCurrentUser 
                            ? "text-purple-700 dark:text-purple-300" 
                            : "text-theme-text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        }`}>
                          {team.player_name || "Unknown Player"}
                        </p>
                      </div>

                      {/* Yet (Players to Play) */}
                      <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <span className="font-medium text-theme-foreground group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                          {team.players_to_play || 0}
                        </span>
                      </div>

                      {/* Captain */}
                      <div className="col-span-2 min-w-0 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-yellow-900/20 dark:hover:to-amber-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <p className="font-medium text-theme-foreground group-hover:text-yellow-700 dark:group-hover:text-yellow-300 truncate transition-colors">
                          {team.captain?.name || "N/A"} (C)
                        </p>
                        <p className="text-xs text-theme-text-secondary group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                          {team.captain?.points || 0} pts
                        </p>
                      </div>

                      {/* GW Points */}
                      <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-green-50 hover:to-teal-50 dark:hover:from-green-900/20 dark:hover:to-teal-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <span className="font-bold text-theme-foreground group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          {team.live_points || team.event_total || 0}
                        </span>
                      </div>

                      {/* Total Points */}
                      <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <span className="font-bold text-theme-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {team.live_total || team.total || 0}
                        </span>
                      </div>

                      {/* Chip */}
                      <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-900/20 dark:hover:to-slate-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        {team.active_chip && (
                          <div className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white transition-transform hover:scale-110 ${getChipColor(getChipAbbreviation(team.active_chip))}`}>
                            {getChipAbbreviation(team.active_chip)}
                          </div>
                        )}
                      </div>

                      {/* Expand Indicator */}
                      <div className="col-span-2 flex justify-end hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                        <MdExpandMore
                          className={`w-5 h-5 text-theme-text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300 hover:scale-110 ${
                            expandedTeams.has(team.id) ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Transfer Info Row - Hidden on mobile */}
                    <div className="mt-3 pt-3 border-t border-theme-border/50 hidden md:block">
                      <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                        <div className="flex items-center gap-4">
                          <span>
                            {t("leagueTables.played")}:{" "}
                            {11 - (team.players_to_play || 0)}/11
                          </span>
                          <span>Team Value: £{(team.team_value / 10).toFixed(1)}m</span>
                          <span>Bank: £{(team.bank / 10).toFixed(1)}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            Transfers: {team.event_transfers}
                            {team.event_transfers_cost > 0 && (
                              <span className="text-red-500"> (-{team.event_transfers_cost})</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTeams.has(team.id) && renderPlayerBreakdown(team)}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
