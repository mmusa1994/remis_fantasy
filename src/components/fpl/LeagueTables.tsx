"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MdExpandMore, MdRemove, MdRefresh, MdInfo } from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";
import FplLoadingSkeleton from "@/components/shared/FplLoadingSkeleton";
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
  currentUserData?: any;
}

export default function LeagueTables({
  currentUserData,
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
  const [currentUserExpanded, setCurrentUserExpanded] =
    useState<boolean>(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueId || "");
  const [leagues, setLeagues] = useState<any[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
    } else {
      setIsInitializing(false);
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

  // Update initializing state
  useEffect(() => {
    // If we don't have a manager, no skeleton
    if (!managerId) {
      setIsInitializing(false);
      return;
    }

    // Do NOT show global skeleton while loading leagues list; the select area shows its own loader
    if (managerId && leagues.length === 0 && leaguesLoading) {
      setIsInitializing(false);
      return;
    }

    // Do NOT show skeleton before a league is selected
    if (managerId && leagues.length > 0 && !selectedLeagueId && !data) {
      setIsInitializing(false);
      return;
    }

    // Only show skeleton after a league is selected and while table is loading
    if (selectedLeagueId && loading) {
      setIsInitializing(true);
      return;
    }

    // Otherwise, no skeleton
    setIsInitializing(false);
  }, [managerId, leagues.length, leaguesLoading, selectedLeagueId, data, loading]);

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
      freehit: "FH",
      wildcard: "WC",
      bencboost: "BB",
      "3xc": "TC",
      triple_captain: "TC",
      bench_boost: "BB",
      free_hit: "FH",
    };
    return (
      chipMap[chipName.toLowerCase()] || chipName.toUpperCase().slice(0, 2)
    );
  };

  const getChipColor = (chipName: string) => {
    const colorMap: { [key: string]: string } = {
      FH: "bg-blue-500",
      WC: "bg-green-500",
      BB: "bg-orange-500",
      TC: "bg-purple-500",
    };
    return colorMap[chipName] || "bg-gray-500";
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <FaArrowUp className="w-4 h-4 text-green-500 flex-shrink-0" />;
    } else if (change < 0) {
      return <FaArrowDown className="w-4 h-4 text-red-500 flex-shrink-0" />;
    }
    return <MdRemove className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  };

  const getPlayerElement = (elementId: number) => {
    return data?.elements.find((e) => e.id === elementId);
  };

  const getCaptainInfo = () => {
    if (!currentUserData?.captain || !data?.elements) return null;

    const captainElement = data.elements.find(
      (e) => e.id === currentUserData.captain.player_id
    );
    if (!captainElement) return null;

    return {
      name: captainElement.web_name,
      points:
        (currentUserData.captain.stats?.total_points || 0) *
        (currentUserData.captain.multiplier || 1),
    };
  };

  const getTeamName = () => {
    // Debug log to see what's available
    return currentUserData?.manager?.name || "Your Team";
  };

  const renderCurrentUserTeamBreakdown = () => {
    if (!currentUserData?.team_with_stats) return null;

    const startingXI = currentUserData.team_with_stats.filter(
      (p: any) => p.position <= 11
    );
    const bench = currentUserData.team_with_stats.filter(
      (p: any) => p.position > 11
    );

    return (
      <div className="mt-2 mx-2 mb-4 p-3 bg-theme-card-secondary rounded-lg border border-theme-border md:mt-4 md:mx-4 md:p-4">
        <h4 className="font-semibold text-theme-foreground mb-3 flex items-center gap-2 text-sm md:text-base">
          <IoFootballOutline className="w-4 h-4" />
          {t("leagueTables.squadBreakdown")}
        </h4>

        {/* Starting XI - Mobile Optimized */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {startingXI.map((playerDetail: any) => {
            const teamColors = getTeamColors(playerDetail.player?.team || 1);
            const displayPoints =
              (playerDetail.live_stats?.total_points || 0) *
              (playerDetail.multiplier || 1);

            return (
              <div
                key={playerDetail.player_id}
                className={`p-2 rounded border text-xs md:p-3 md:text-sm ${
                  playerDetail.is_captain
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : playerDetail.is_vice_captain
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-900/20"
                    : "border-theme-border bg-theme-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <div
                        className="w-2 h-2 rounded-sm flex-shrink-0 md:w-3 md:h-3"
                        style={{ backgroundColor: teamColors.primary }}
                      ></div>
                      <p className="font-bold text-theme-foreground truncate text-xs md:text-sm">
                        {playerDetail.player?.web_name || "Unknown"}
                        {playerDetail.is_captain && (
                          <span className="ml-1 text-xs bg-yellow-500 text-white px-1 py-0.5 rounded">
                            C
                          </span>
                        )}
                        {playerDetail.is_vice_captain && (
                          <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded">
                            V
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-theme-text-secondary truncate">
                        {playerDetail.player?.first_name || ""}
                      </p>
                      {playerDetail.player?.opponent_short && (
                        <span className="text-xs text-theme-text-secondary/70 ml-2">
                          {playerDetail.player.opponent_short}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {displayPoints}
                    </div>
                    {(playerDetail.multiplier || 1) > 1 && (
                      <div className="text-xs text-theme-text-secondary">
                        ×{playerDetail.multiplier}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench Players - Mobile Optimized */}
        <div className="mt-4">
          <h5 className="text-sm font-bold text-theme-text-secondary mb-2 flex items-center gap-2">
            <span>⚽</span>
            {t("leagueTables.bench")}
          </h5>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {bench.map((playerDetail: any) => {
              const teamColors = getTeamColors(playerDetail.player?.team || 1);

              return (
                <div
                  key={playerDetail.player_id}
                  className="p-2 rounded border border-theme-border bg-theme-card text-xs"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: teamColors.primary }}
                    ></div>
                    <p className="font-medium text-theme-foreground truncate">
                      {playerDetail.player?.web_name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-theme-text-secondary truncate">
                      {playerDetail.player?.first_name || ""}
                    </p>
                    <span className="text-xs font-bold text-theme-foreground">
                      {playerDetail.live_stats?.total_points || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Summary - Mobile Only */}
        <div className="mt-3 pt-3 border-t border-theme-border/50 md:hidden">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-theme-text-secondary">
                {t("leagueTables.played")}:{" "}
              </span>
              <span className="font-medium text-theme-foreground">
                {11 -
                  (currentUserData?.team_with_stats?.filter(
                    (p: any) => p.is_playing_this_round && !p.has_played
                  ).length || 0)}
                /11
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">
                {t("leagueTables.transfers")}:{" "}
              </span>
              <span className="font-medium text-theme-foreground">
                {currentUserData?.entry_history?.event_transfers || 0}
                {(currentUserData?.entry_history?.event_transfers_cost || 0) >
                  0 && (
                  <span className="text-red-500">
                    {" "}
                    (-{currentUserData?.entry_history?.event_transfers_cost})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">
                {t("leagueTables.teamValue")}:{" "}
              </span>
              <span className="font-medium text-theme-foreground">
                £
                {((currentUserData?.entry_history?.value || 0) / 10).toFixed(1)}
                m
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">
                {t("leagueTables.bank")}:{" "}
              </span>
              <span className="font-medium text-theme-foreground">
                £{((currentUserData?.entry_history?.bank || 0) / 10).toFixed(1)}
                m
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerBreakdown = (team: ProcessedTeam) => {
    if (!data) return null;

    const startingXI =
      team.player_details?.filter((p) => p.position <= 11) || [];
    const bench = team.player_details?.filter((p) => p.position > 11) || [];

    return (
      <div className="mt-2 mx-2 mb-4 p-3 bg-theme-card-secondary rounded-lg border border-theme-border md:mt-4 md:mx-4 md:p-4">
        <h4 className="font-semibold text-theme-foreground mb-3 flex items-center gap-2 text-sm md:text-base">
          <IoFootballOutline className="w-4 h-4" />
          Squad
        </h4>

        {/* Starting XI - Mobile Optimized */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {startingXI.map((playerDetail) => {
            const element = getPlayerElement(playerDetail.element);
            if (!element) return null;

            const teamColors = getTeamColors(element.team);
            const displayPoints =
              playerDetail.live_points * playerDetail.multiplier;

            return (
              <div
                key={playerDetail.element}
                className={`p-2 rounded border text-xs md:p-3 md:text-sm ${
                  playerDetail.is_captain
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : playerDetail.is_vice_captain
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-900/20"
                    : "border-theme-border bg-theme-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <div
                        className="w-2 h-2 rounded-sm flex-shrink-0 md:w-3 md:h-3"
                        style={{ backgroundColor: teamColors.primary }}
                      ></div>
                      <p className="font-bold text-theme-foreground truncate text-xs md:text-sm">
                        {element.web_name}
                        {playerDetail.is_captain && (
                          <span className="ml-1 text-xs bg-yellow-500 text-white px-1 py-0.5 rounded">
                            C
                          </span>
                        )}
                        {playerDetail.is_vice_captain && (
                          <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded">
                            V
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-theme-text-secondary truncate">
                        {element.first_name}
                      </p>
                      {playerDetail.opponent && (
                        <span className="text-xs text-theme-text-secondary/70 ml-2">
                          {playerDetail.opponent}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {displayPoints}
                    </div>
                    {playerDetail.multiplier > 1 && (
                      <div className="text-xs text-theme-text-secondary">
                        ×{playerDetail.multiplier}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench Players - Mobile Optimized */}
        <div className="mt-4">
          <h5 className="text-sm font-bold text-theme-text-secondary mb-2 flex items-center gap-2">
            <span>⚽</span>
            Bench
          </h5>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {bench.map((playerDetail) => {
              const element = getPlayerElement(playerDetail.element);
              if (!element) return null;

              const teamColors = getTeamColors(element.team);

              return (
                <div
                  key={playerDetail.element}
                  className="p-2 rounded border border-theme-border bg-theme-card text-xs"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: teamColors.primary }}
                    ></div>
                    <p className="font-medium text-theme-foreground truncate">
                      {element.web_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-theme-text-secondary truncate">
                      {element.first_name}
                    </p>
                    <span className="text-xs font-bold text-theme-foreground">
                      {playerDetail.live_points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Summary - Mobile Only */}
        <div className="mt-3 pt-3 border-t border-theme-border/50 md:hidden">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-theme-text-secondary">Played: </span>
              <span className="font-medium text-theme-foreground">
                {11 - (team.players_to_play || 0)}/11
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">Transfers: </span>
              <span className="font-medium text-theme-foreground">
                {team.event_transfers}
                {team.event_transfers_cost > 0 && (
                  <span className="text-red-500">
                    {" "}
                    (-{team.event_transfers_cost})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">Team Value: </span>
              <span className="font-medium text-theme-foreground">
                £{(team.team_value / 10).toFixed(1)}m
              </span>
            </div>
            <div>
              <span className="text-theme-text-secondary">Bank: </span>
              <span className="font-medium text-theme-foreground">
                £{(team.bank / 10).toFixed(1)}m
              </span>
            </div>
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
              <span className="hidden sm:inline">
                {t("leagueTables.refresh")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && !isInitializing && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md">
          <p className="text-sm font-medium">
            {t("leagueTables.errorLoadingTable")}: {error}
          </p>
        </div>
      )}

      {/* Unified Loading State */}
      {isInitializing && (
        <FplLoadingSkeleton
          variant="league-table"
          title={t("leagueTables.loadingLeagues")}
          description={
            leaguesLoading
              ? t("leagueTables.fetchingManagerLeagues")
              : loading
              ? "Loading league table..."
              : "Preparing league data..."
          }
        />
      )}

      {/* League Table */}
      {data && !isInitializing && (
        <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden">
          {/* Header */}
          <div className="bg-theme-card-secondary border-b border-theme-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-theme-foreground flex items-center gap-2">
                  <FaTrophy className="w-5 h-5 text-yellow-500" />
                  {data.league.name}
                </h3>
                <div className="text-sm text-theme-text-secondary">
                  Gameweek {data.gameweek} • {t("leagueTables.liveTable")}
                  {isPolling && (
                    <div>
                      <span className="inline-flex items-center pr-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                        🔴 {t("leagueTables.live")}
                      </span>
                      <span>{t("leagueTables.liveAddingBonusPoints")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-theme-text-secondary">
                  {t("leagueTables.updated")}:{" "}
                  {new Date(data.last_updated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table Headers */}
          <div className="hidden md:block">
            <div className="bg-theme-card-secondary border-b-2 border-theme-border">
              <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-xs font-bold text-theme-text-secondary uppercase tracking-wider">
                <div className="col-span-1">{t("leagueTables.rank")}</div>
                <div className="col-span-3">{t("leagueTables.team")}</div>
                <div className="col-span-1 text-center">
                  {t("leagueTables.yet")}
                </div>
                <div className="col-span-2">{t("leagueTables.captain")}</div>
                <div className="col-span-1 text-center">
                  {t("leagueTables.gwPoints")}
                </div>
                <div className="col-span-1 text-center">
                  {t("leagueTables.total")}
                </div>
                <div className="col-span-1 text-center">
                  {t("leagueTables.chip")}
                </div>
                <div className="col-span-2"></div>
              </div>
            </div>
          </div>

          {/* Mobile Table Headers */}
          <div className="md:hidden bg-theme-card-secondary border-b-2 border-theme-border">
            <div className="px-3 py-2">
              <div className="grid grid-cols-6 gap-1 text-xs font-bold text-theme-text-secondary uppercase">
                <div className="text-center">POS</div>
                <div className="col-span-2">TIM</div>
                <div className="text-center">YET</div>
                <div className="text-center">GW</div>
                <div className="text-center">TOT</div>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block divide-y divide-theme-border">
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
                      <div
                        className={`col-span-3 min-w-0 rounded-lg px-3 py-2 transition-all duration-200 ${
                          isCurrentUser
                            ? ""
                            : "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white shadow-sm">
                              YOU
                            </span>
                          )}
                          <p
                            className={`font-semibold truncate transition-colors ${
                              isCurrentUser
                                ? "text-purple-800 dark:text-purple-200"
                                : "text-theme-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300"
                            }`}
                          >
                            {team.entry_name || "N/A"}
                          </p>
                        </div>
                        <p
                          className={`text-xs truncate transition-colors ${
                            isCurrentUser
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-theme-text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          }`}
                        >
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
                          <div
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white transition-transform hover:scale-110 ${getChipColor(
                              getChipAbbreviation(team.active_chip)
                            )}`}
                          >
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

                    {/* Transfer Info Row */}
                    <div className="mt-3 pt-3 border-t border-theme-border/50">
                      <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                        <div className="flex items-center gap-4">
                          <span>
                            {t("leagueTables.played")}:{" "}
                            {11 - (team.players_to_play || 0)}/11
                          </span>
                          <span>
                            Team Value: £{(team.team_value / 10).toFixed(1)}m
                          </span>
                          <span>Bank: £{(team.bank / 10).toFixed(1)}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            Transfers: {team.event_transfers}
                            {team.event_transfers_cost > 0 && (
                              <span className="text-red-500">
                                {" "}
                                (-{team.event_transfers_cost})
                              </span>
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

            {/* Current Manager Row - Display if not in main table */}
            {(() => {
              const currentUserInTable = data.teams.find(
                (team) => team.id === managerId
              );
              if (!!currentUserInTable) return null;

              // Find the current manager's league entry rank for display
              const currentUserLeague = leagues.find(
                (league) => league.id.toString() === selectedLeagueId.toString()
              );

              if (!currentUserLeague) return null;

              return (
                <>
                  <div className="border-t-4 border-purple-300 dark:border-purple-600"></div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/20 border-t border-theme-border">
                    <div className="p-2 text-center">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {t("leagueTables.yourPositionInLeague")}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-100/80 to-violet-100/80 dark:from-purple-900/30 dark:to-violet-900/30 shadow-md border-l-4 border-purple-500 dark:border-purple-400 transition-colors">
                    <div
                      className="p-4 cursor-pointer transition-all duration-300 group"
                      onClick={() =>
                        setCurrentUserExpanded(!currentUserExpanded)
                      }
                    >
                      <div className="grid grid-cols-12 gap-4 items-center text-sm">
                        {/* Rank & Change */}
                        <div className="col-span-1 flex items-center gap-2 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            {currentUserLeague.entry_rank || "Unranked"}
                          </span>
                          <MdRemove className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>

                        {/* Team Name */}
                        <div className="col-span-3 min-w-0 rounded-lg px-3 py-2 transition-all duration-200">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white shadow-sm">
                              YOU
                            </span>
                            <p className="font-semibold truncate text-purple-800 dark:text-purple-200">
                              {getTeamName()}
                            </p>
                          </div>
                          <p className="text-xs truncate text-purple-700 dark:text-purple-300">
                            {currentUserData?.manager?.player_first_name}{" "}
                            {currentUserData?.manager?.player_last_name}
                          </p>
                        </div>

                        {/* Yet (Players to Play) */}
                        <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                          <span className="font-medium text-theme-foreground">
                            {currentUserData?.team_with_stats?.filter(
                              (p: any) =>
                                p.is_playing_this_round && !p.has_played
                            ).length || 0}
                          </span>
                        </div>

                        {/* Captain */}
                        <div className="col-span-2 min-w-0 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-yellow-900/20 dark:hover:to-amber-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                          <p className="font-medium text-theme-foreground truncate">
                            {getCaptainInfo()?.name || "N/A"} (C)
                          </p>
                          <p className="text-xs text-theme-text-secondary">
                            {getCaptainInfo()?.points || 0} pts
                          </p>
                        </div>

                        {/* GW Points */}
                        <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-green-50 hover:to-teal-50 dark:hover:from-green-900/20 dark:hover:to-teal-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {(() => {
                              const startingXI = currentUserData?.team_with_stats?.filter((p: any) => p.position <= 11) || [];
                              const totalPoints = startingXI.reduce((sum: number, player: any) => {
                                const playerPoints = player.player?.event_points || 0;
                                const multiplier = player.multiplier || 1;
                                const points = playerPoints * multiplier;
                                return sum + points;
                              }, 0);
                              return totalPoints;
                            })()}
                          </span>
                        </div>

                        {/* Total Points */}
                        <div className="col-span-1 text-center hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-sm">
                          <span className="font-bold text-theme-foreground">
                            {currentUserData?.entry_history?.total_points || 0}
                          </span>
                        </div>

                        {/* Chip */}
                        <div className="col-span-1 text-center">
                          {currentUserData?.active_chip && (
                            <div
                              className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white transition-transform hover:scale-110 ${getChipColor(
                                getChipAbbreviation(currentUserData.active_chip)
                              )}`}
                            >
                              {getChipAbbreviation(currentUserData.active_chip)}
                            </div>
                          )}
                        </div>

                        {/* Expand Indicator */}
                        <div className="col-span-2 flex justify-end items-center gap-2">
                          <span className="text-xs text-theme-text-secondary">
                            {t("leagueTables.rank")}: #
                            {currentUserLeague.entry_rank ||
                              t("leagueTables.unranked")}
                          </span>
                          <MdExpandMore
                            className={`w-5 h-5 text-theme-text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300 hover:scale-110 ${
                              currentUserExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Transfer Info Row */}
                      <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-700/50">
                        <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300">
                          <div className="flex items-center gap-4">
                            <span>
                              {t("leagueTables.played")}:{" "}
                              {11 -
                                (currentUserData?.team_with_stats?.filter(
                                  (p: any) =>
                                    p.is_playing_this_round && !p.has_played
                                ).length || 0)}
                              /11
                            </span>
                            <span>
                              {t("leagueTables.teamValue")}: £
                              {(
                                (currentUserData?.entry_history?.value || 0) /
                                10
                              ).toFixed(1)}
                              m
                            </span>
                            <span>
                              {t("leagueTables.bank")}: £
                              {(
                                (currentUserData?.entry_history?.bank || 0) / 10
                              ).toFixed(1)}
                              m
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {t("leagueTables.transfers")}:{" "}
                              {currentUserData?.entry_history
                                ?.event_transfers || 0}
                              {(currentUserData?.entry_history
                                ?.event_transfers_cost || 0) > 0 && (
                                <span className="text-red-500">
                                  {" "}
                                  (-
                                  {
                                    currentUserData?.entry_history
                                      ?.event_transfers_cost
                                  }
                                  )
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content for Current User */}
                  {currentUserExpanded && renderCurrentUserTeamBreakdown()}
                </>
              );
            })()}
          </div>

          {/* Mobile Table */}
          <div className="md:hidden divide-y divide-theme-border">
            {data.teams.map((team) => {
              const isCurrentUser = managerId === team.id;
              return (
                <div key={team.id} className="transition-colors">
                  {/* Main Row - Compact Mobile Layout */}
                  <div
                    className={`p-2 cursor-pointer transition-all duration-200 ${
                      isCurrentUser
                        ? "bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-400"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => toggleTeamExpansion(team.id)}
                  >
                    <div className="grid grid-cols-6 gap-1 items-center text-xs">
                      {/* Rank */}
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-theme-foreground text-sm">
                          {team.rank}
                        </span>
                        {getRankChangeIcon(team.rank_change)}
                      </div>

                      {/* Team Name */}
                      <div className="col-span-2 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          {isCurrentUser && (
                            <span className="text-xs font-bold bg-purple-500 text-white px-1 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <p
                          className={`font-semibold text-xs truncate ${
                            isCurrentUser
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-theme-foreground"
                          }`}
                        >
                          {team.entry_name || "N/A"}
                        </p>
                        <p className="text-xs text-theme-text-secondary truncate">
                          {team.player_name || "Unknown"}
                        </p>
                      </div>

                      {/* Yet */}
                      <div className="text-center">
                        <span className="font-bold text-theme-foreground text-sm">
                          {team.players_to_play || 0}
                        </span>
                      </div>

                      {/* GW Points */}
                      <div className="text-center">
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                          {team.live_points || team.event_total || 0}
                        </span>
                      </div>

                      {/* Total Points */}
                      <div className="text-center">
                        <span className="font-bold text-theme-foreground text-sm">
                          {team.live_total || team.total || 0}
                        </span>
                        {team.active_chip && (
                          <div
                            className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold text-white ml-1 ${getChipColor(
                              getChipAbbreviation(team.active_chip)
                            )}`}
                          >
                            {getChipAbbreviation(team.active_chip)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Captain Info - Mobile */}
                    <div className="mt-2 pt-2 border-t border-theme-border/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-theme-text-secondary">
                          Captain:{" "}
                          <span className="font-medium text-theme-foreground">
                            {team.captain?.name || "N/A"}
                          </span>
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            ({team.captain?.points || 0}pts)
                          </span>
                        </span>
                        <MdExpandMore
                          className={`w-4 h-4 text-theme-text-secondary transition-transform ${
                            expandedTeams.has(team.id) ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTeams.has(team.id) && renderPlayerBreakdown(team)}
                </div>
              );
            })}

            {/* Current Manager Row - Mobile - Display if not in main table */}
            {(() => {
              const currentUserInTable = data.teams.find(
                (team) => team.id === managerId
              );
              if (currentUserInTable) return null;

              // Find the current manager's league entry rank for display
              const currentUserLeague = leagues.find(
                (league) => league.id.toString() === selectedLeagueId.toString()
              );

              if (!currentUserLeague) return null;

              return (
                <>
                  <div className="border-t-4 border-purple-300 dark:border-purple-600"></div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/20 border-t border-theme-border">
                    <div className="p-2 text-center">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {t("leagueTables.yourPositionInLeague")}
                      </span>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-400 transition-colors">
                    <div
                      className="p-2 cursor-pointer transition-all duration-200"
                      onClick={() =>
                        setCurrentUserExpanded(!currentUserExpanded)
                      }
                    >
                      <div className="grid grid-cols-6 gap-1 items-center text-xs">
                        {/* Rank */}
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                            {currentUserLeague.entry_rank || "N/A"}
                          </span>
                          <MdRemove className="w-3 h-3 text-gray-400" />
                        </div>

                        {/* Team Name */}
                        <div className="col-span-2 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-bold bg-purple-500 text-white px-1 py-0.5 rounded">
                              YOU
                            </span>
                          </div>
                          <p className="font-semibold text-xs truncate text-purple-700 dark:text-purple-300">
                            {getTeamName()}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                            {currentUserData?.manager?.player_first_name}{" "}
                            {currentUserData?.manager?.player_last_name}
                          </p>
                        </div>

                        {/* Yet */}
                        <div className="text-center">
                          <span className="font-bold text-theme-foreground text-sm">
                            {currentUserData?.team_with_stats?.filter(
                              (p: any) =>
                                p.is_playing_this_round && !p.has_played
                            ).length || 0}
                          </span>
                        </div>

                        {/* GW Points */}
                        <div className="text-center">
                          <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                            {(() => {
                              const startingXI = currentUserData?.team_with_stats?.filter((p: any) => p.position <= 11) || [];
                              const totalPoints = startingXI.reduce((sum: number, player: any) => {
                                const playerPoints = player.player?.event_points || 0;
                                const multiplier = player.multiplier || 1;
                                const points = playerPoints * multiplier;
                                return sum + points;
                              }, 0);
                              return totalPoints;
                            })()}
                          </span>
                        </div>

                        {/* Total Points */}
                        <div className="text-center">
                          <span className="font-bold text-theme-foreground text-sm">
                            {currentUserData?.entry_history?.total_points || 0}
                          </span>
                          {currentUserData?.active_chip && (
                            <div
                              className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold text-white ml-1 ${getChipColor(
                                getChipAbbreviation(currentUserData.active_chip)
                              )}`}
                            >
                              {getChipAbbreviation(currentUserData.active_chip)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Captain Info - Mobile */}
                      <div className="mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-700/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-700 dark:text-purple-300">
                            {t("leagueTables.rank")}: #
                            {currentUserLeague.entry_rank ||
                              t("leagueTables.unranked")}
                          </span>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {t("leagueTables.captain")}:{" "}
                            {getCaptainInfo()?.name || "N/A"} (
                            {getCaptainInfo()?.points || 0}pts)
                          </span>
                          <MdExpandMore
                            className={`w-4 h-4 text-theme-text-secondary transition-transform ${
                              currentUserExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content for Current User */}
                  {currentUserExpanded && renderCurrentUserTeamBreakdown()}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
