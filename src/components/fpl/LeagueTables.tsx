"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MdExpandMore, MdRemove, MdRefresh, MdInfo } from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";
import { FaTrophy, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoFootballOutline } from "react-icons/io5";

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
  }, [managerId]);

  useEffect(() => {
    if (managerId && selectedLeagueId) {
      fetchLeagueTable();
    }
  }, [managerId, gameweek, selectedLeagueId]);

  // Auto-load table when league is selected
  useEffect(() => {
    if (selectedLeagueId && managerId && leagues.length > 0) {
      fetchLeagueTable();
    }
  }, [selectedLeagueId, managerId, leagues.length, fetchLeagueTable]);

  // Auto-refresh during polling
  useEffect(() => {
    if (isPolling && managerId && selectedLeagueId) {
      const interval = setInterval(() => {
        fetchLeagueTable();
      }, 30000); // Refresh every 30 seconds during live polling

      return () => clearInterval(interval);
    }
  }, [isPolling, managerId, selectedLeagueId]);

  const toggleTeamExpansion = (teamId: number) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
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

    return (
      <div className="mt-4 p-4 bg-theme-card-secondary rounded-lg border border-theme-border">
        <h4 className="font-semibold text-theme-foreground mb-3 flex items-center gap-2">
          <IoFootballOutline className="w-4 h-4" />
          {t("leagueTables.squadBreakdown")}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.picks?.slice(0, 11)?.map((pick) => {
            const element = getPlayerElement(pick.element);
            if (!element) return null;

            return (
              <div
                key={pick.element}
                className={`p-3 rounded-md border ${
                  pick.is_captain
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : pick.is_vice_captain
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-900/20"
                    : "border-theme-border bg-theme-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-theme-foreground truncate">
                      {element.web_name}
                      {pick.is_captain && (
                        <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">
                          (C)
                        </span>
                      )}
                      {pick.is_vice_captain && (
                        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                          (V)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-theme-text-secondary">
                      {element.first_name} {element.second_name}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-theme-foreground">
                    {/* This would show individual player points if we had that data */}
                    pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench Players */}
        <div className="mt-4">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">
            {t("leagueTables.bench")}
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {team.picks?.slice(11)?.map((pick) => {
              const element = getPlayerElement(pick.element);
              if (!element) return null;

              return (
                <div
                  key={pick.element}
                  className="p-2 rounded-md border border-theme-border bg-theme-card"
                >
                  <p className="text-xs font-medium text-theme-foreground truncate">
                    {element.web_name}
                  </p>
                  <p className="text-xs text-theme-text-secondary truncate">
                    {element.first_name}
                  </p>
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
        <div className="flex items-center gap-4">
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
                className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-card text-theme-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">{t("leagueTables.chooseLeague")}</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} (
                    {league.entry_rank
                      ? `Rank: ${league.entry_rank}`
                      : "Unranked"}
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
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              <MdRefresh className="w-4 h-4" />
              {t("leagueTables.refresh")}
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

          {/* Table */}
          <div className="divide-y divide-theme-border">
            {data.teams.map((team) => (
              <div
                key={team.id}
                className="hover:bg-theme-card-secondary transition-colors"
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    {/* Rank & Change */}
                    <div className="col-span-1 flex items-center gap-2">
                      <span className="font-bold text-theme-foreground">
                        {team.rank}
                      </span>
                      {getRankChangeIcon(team.rank_change)}
                    </div>

                    {/* Team Name */}
                    <div className="col-span-3 min-w-0">
                      <p className="font-semibold text-theme-foreground truncate">
                        {team.entry_name || "N/A"}
                      </p>
                      <p className="text-xs text-theme-text-secondary truncate">
                        {team.player_name || "Unknown Player"}
                      </p>
                    </div>

                    {/* Yet (Players to Play) */}
                    <div className="col-span-1 text-center">
                      <span className="font-medium text-theme-foreground">
                        {team.players_to_play || 0}
                      </span>
                    </div>

                    {/* Captain */}
                    <div className="col-span-2 min-w-0">
                      <p className="font-medium text-theme-foreground truncate">
                        {team.captain?.name || "N/A"} (C)
                      </p>
                      <p className="text-xs text-theme-text-secondary">
                        {team.captain?.points || 0} pts
                      </p>
                    </div>

                    {/* GW Points */}
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-theme-foreground">
                        {team.live_points || team.event_total || 0}
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-theme-foreground">
                        {team.live_total || team.total || 0}
                      </span>
                    </div>

                    {/* Chip */}
                    <div className="col-span-1 text-center">
                      {team.active_chip && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {team.active_chip}
                        </span>
                      )}
                    </div>

                    {/* Expand Button */}
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => toggleTeamExpansion(team.id)}
                        className="p-1 hover:bg-theme-card rounded transition-colors"
                      >
                        <MdExpandMore
                          className={`w-5 h-5 text-theme-text-secondary transition-transform ${
                            expandedTeams.has(team.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Transfer Info Row */}
                  <div className="mt-3 pt-3 border-t border-theme-border/50">
                    <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                      <div className="flex items-center gap-4">
                        <span>{t("leagueTables.freeTransfers")}: 2</span>
                        <span>{t("leagueTables.teamValue")}: £100.6m</span>
                        <span>
                          {t("leagueTables.played")}:{" "}
                          {11 - (team.players_to_play || 0)}/11
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>
                          {t("leagueTables.lastTransfer")}: Palmer → Mbeumo
                          (+10)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTeams.has(team.id) && renderPlayerBreakdown(team)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
