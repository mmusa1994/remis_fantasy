"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowDown, FaArrowUp, FaTrophy } from "react-icons/fa";
import { MdRefresh, MdRemove } from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";
import FplLoadingSkeleton from "@/components/shared/FplLoadingSkeleton";
import LeagueTableHeader from "./LeagueTableHeader";
import LeagueTableRow from "./LeagueTableRow";
import LeagueTableCard from "./LeagueTableCard";
import LeagueTableExpanded from "./LeagueTableExpanded";
import LeagueFiltersPanel from "./LeagueFiltersPanel";
import type {
  FilterState,
  LeagueTableData,
  ProcessedTeam,
  SortDirection,
  SortKey,
} from "./types";

interface LeagueTableProps {
  managerId?: number;
  gameweek: number;
  leagueId?: string;
  isPolling?: boolean;
}

export default function LeagueTable({
  managerId,
  gameweek,
  leagueId,
  isPolling = false,
}: LeagueTableProps) {
  const { t } = useTranslation("fpl");

  const [data, setData] = useState<LeagueTableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueId || "");
  const [leagues, setLeagues] = useState<
    Array<{
      id: number;
      name: string;
      entry_rank: number | null;
      entry_last_rank: number | null;
    }>
  >([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [leaguesInitiallyLoaded, setLeaguesInitiallyLoaded] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [includeAutoSubs, setIncludeAutoSubs] = useState(true);
  const [showGwNet, setShowGwNet] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("live_total");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState<FilterState>({
    playerId: null,
    playerQuery: "",
    scope: "startingXI",
  });

  const fetchManagerLeagues = useCallback(async () => {
    if (!managerId) return;
    if (!leaguesInitiallyLoaded || leagues.length > 0) {
      setLeaguesLoading(true);
    }
    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setLeagues(result.data.classic || []);
      }
    } catch (err) {
      console.error("Failed to load manager leagues", err);
    } finally {
      setLeaguesLoading(false);
      setLeaguesInitiallyLoaded(true);
    }
  }, [managerId, leaguesInitiallyLoaded, leagues.length]);

  const fetchLeagueTable = useCallback(async () => {
    if (!managerId || !selectedLeagueId) return;
    setLoading(true);
    setError(null);
    try {
      const autoSubsParam = includeAutoSubs ? "1" : "0";
      const response = await fetch(
        `/api/fpl/live-table-calc?managerId=${managerId}&gameweek=${gameweek}&leagueId=${selectedLeagueId}&autoSubs=${autoSubsParam}`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch league table");
      }
    } catch (err) {
      console.error("Failed to load league table", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [managerId, selectedLeagueId, gameweek, includeAutoSubs]);

  useEffect(() => {
    if (managerId) {
      fetchManagerLeagues();
    } else {
      setLeaguesLoading(false);
      setLeaguesInitiallyLoaded(true);
    }
  }, [managerId, fetchManagerLeagues]);

  useEffect(() => {
    if (managerId && selectedLeagueId) {
      fetchLeagueTable();
    }
  }, [managerId, selectedLeagueId, gameweek, includeAutoSubs, fetchLeagueTable]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  const sortedTeams = useMemo<ProcessedTeam[]>(() => {
    if (!data) return [];
    const arr = [...data.teams];
    const sign = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const valueOf = (team: ProcessedTeam): number => {
        switch (sortKey) {
          case "live_total":
            return team.live_total;
          case "live_points_gross":
            return team.live_points_gross;
          case "live_points_net":
            return team.live_points_net;
          case "players_to_play":
            return team.players_to_play;
          case "rank":
            return team.rank;
          case "transfers":
            return team.event_transfers;
          case "team_value":
            return team.team_value;
          case "active_chip":
            return team.active_chip ? 1 : 0;
        }
      };
      const av = valueOf(a);
      const bv = valueOf(b);
      if (av < bv) return -1 * sign;
      if (av > bv) return 1 * sign;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const selectedLeague = useMemo(() => {
    const id = Number(selectedLeagueId);
    if (!id) return null;
    return leagues.find((l) => l.id === id) || null;
  }, [leagues, selectedLeagueId]);

  const userOutsideTop50 = useMemo(() => {
    if (!managerId || !data) return false;
    return !data.teams.some((t) => t.id === managerId);
  }, [managerId, data]);

  const matchingTeamIds = useMemo(() => {
    if (!filter.playerId || !data) return new Set<number>();
    const set = new Set<number>();
    for (const team of data.teams) {
      const has = team.picks.some((p) => {
        const isStarter = p.position <= 11;
        if (filter.scope === "startingXI")
          return isStarter && p.element === filter.playerId;
        return p.element === filter.playerId;
      });
      if (has) set.add(team.id);
    }
    return set;
  }, [filter.playerId, filter.scope, data]);

  const toggleExpand = (teamId: number) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const renderError = () =>
    error && (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-theme-card rounded-lg border border-theme-border p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-theme-foreground mb-2">
              {t("leagueTables.selectLeague")}
            </label>
            {leaguesLoading && !leaguesInitiallyLoaded ? (
              <LoadingCard
                title={t("leagueTables.loadingLeagues")}
                description={t("leagueTables.fetchingManagerLeagues")}
                className="bg-theme-card border-theme-border rounded-md shadow theme-transition"
              />
            ) : (
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                disabled={leaguesLoading}
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

        {data && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-theme-foreground">
                {t("leagueTables.includeAutoSubs", "Include Auto Subs")}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={includeAutoSubs}
                onClick={() => setIncludeAutoSubs((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeAutoSubs
                    ? "bg-purple-600"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeAutoSubs ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-theme-foreground">
                {t("leagueTables.showHits", "Show GW Net (with hits)")}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showGwNet}
                onClick={() => setShowGwNet((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showGwNet ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showGwNet ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        )}
      </div>

      {renderError()}

      {data && (
        <LeagueFiltersPanel
          elements={data.elements}
          filter={filter}
          onChange={setFilter}
        />
      )}

      {loading && !data && <FplLoadingSkeleton />}

      {data && (
        <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden">
          <div className="bg-theme-card-secondary border-b border-theme-border px-3 sm:px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-theme-foreground flex items-center gap-2">
                <FaTrophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                {data.league.name}
              </h3>
              <div className="text-xs sm:text-sm text-theme-text-secondary flex items-center gap-2 flex-wrap">
                <span>
                  Gameweek {data.gameweek} • {t("leagueTables.liveTable")}
                </span>
                {isPolling && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {t("leagueTables.live")}
                  </span>
                )}
                {!data.bonus_added && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {t("leagueTables.bonusPending", "Bonus pending")}
                  </span>
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

          {/* Mobile (< 640px) — card stack */}
          <div className="sm:hidden divide-y divide-theme-border">
            {sortedTeams.map((team, idx) => {
              const isCurrentUser = managerId === team.id;
              const isHighlighted = matchingTeamIds.has(team.id);
              const isExpanded = expandedTeams.has(team.id);
              return (
                <div key={team.id} className="p-2">
                  <LeagueTableCard
                    team={team}
                    rankDisplay={includeAutoSubs ? idx + 1 : team.rank}
                    isCurrentUser={isCurrentUser}
                    isHighlighted={isHighlighted}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(team.id)}
                    showGwNet={showGwNet}
                  />
                  {isExpanded && (
                    <LeagueTableExpanded team={team} elements={data.elements} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tablet (640-1023px) — compact table */}
          <div className="hidden sm:block lg:hidden">
            <LeagueTableHeader
              variant="tablet"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <div className="divide-y divide-theme-border">
              {sortedTeams.map((team, idx) => {
                const isCurrentUser = managerId === team.id;
                const isHighlighted = matchingTeamIds.has(team.id);
                const isExpanded = expandedTeams.has(team.id);
                return (
                  <div key={team.id}>
                    <LeagueTableRow
                      variant="tablet"
                      team={team}
                      rankDisplay={includeAutoSubs ? idx + 1 : team.rank}
                      isCurrentUser={isCurrentUser}
                      isHighlighted={isHighlighted}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(team.id)}
                      showGwNet={showGwNet}
                    />
                    {isExpanded && (
                      <LeagueTableExpanded
                        team={team}
                        elements={data.elements}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop (>= 1024px) — full table */}
          <div className="hidden lg:block">
            <LeagueTableHeader
              variant="desktop"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <div className="divide-y divide-theme-border">
              {sortedTeams.map((team, idx) => {
                const isCurrentUser = managerId === team.id;
                const isHighlighted = matchingTeamIds.has(team.id);
                const isExpanded = expandedTeams.has(team.id);
                return (
                  <div key={team.id}>
                    <LeagueTableRow
                      variant="desktop"
                      team={team}
                      rankDisplay={includeAutoSubs ? idx + 1 : team.rank}
                      isCurrentUser={isCurrentUser}
                      isHighlighted={isHighlighted}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(team.id)}
                      showGwNet={showGwNet}
                    />
                    {isExpanded && (
                      <LeagueTableExpanded
                        team={team}
                        elements={data.elements}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {data && userOutsideTop50 && selectedLeague && selectedLeague.entry_rank && (
        <UserPositionCard
          rank={selectedLeague.entry_rank}
          lastRank={selectedLeague.entry_last_rank}
          leagueName={data.league.name}
          t={t}
        />
      )}
    </div>
  );
}

interface UserPositionCardProps {
  rank: number;
  lastRank: number | null;
  leagueName: string;
  t: (key: string, defaultOrOptions?: any) => string;
}

function UserPositionCard({
  rank,
  lastRank,
  leagueName,
  t,
}: UserPositionCardProps) {
  const change =
    lastRank && lastRank > 0 ? lastRank - rank : 0;
  const arrowIcon =
    change > 0 ? (
      <FaArrowUp className="w-4 h-4 text-green-500" />
    ) : change < 0 ? (
      <FaArrowDown className="w-4 h-4 text-red-500" />
    ) : (
      <MdRemove className="w-4 h-4 text-gray-400" />
    );
  const changeLabel =
    change > 0
      ? t("leagueTables.yourPositionUp", {
          count: change,
          defaultValue: `Up ${change} places`,
        })
      : change < 0
      ? t("leagueTables.yourPositionDown", {
          count: Math.abs(change),
          defaultValue: `Down ${Math.abs(change)} places`,
        })
      : t("leagueTables.yourPositionNoChange", {
          defaultValue: "No change",
        });
  const changeColor =
    change > 0
      ? "text-green-600 dark:text-green-400"
      : change < 0
      ? "text-red-600 dark:text-red-400"
      : "text-theme-text-secondary";

  return (
    <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-300 dark:border-purple-700 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500 text-white shrink-0">
            {t("leagueTables.you", { defaultValue: "YOU" })}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-theme-foreground">
              {t("leagueTables.yourPositionTitle", {
                defaultValue: "Your position in this league",
              })}
            </div>
            <div className="text-xs text-theme-text-secondary truncate">
              {leagueName} •{" "}
              {t("leagueTables.yourPositionInfo", {
                defaultValue: "outside top 50",
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-theme-text-secondary">
              {t("leagueTables.rank", { defaultValue: "Rank" })}
            </div>
            <div className="text-2xl font-bold text-theme-foreground leading-tight">
              #{rank.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-theme-text-secondary">
              {t("leagueTables.change", { defaultValue: "Change" })}
            </div>
            <div
              className={`flex items-center justify-end gap-1 text-sm font-semibold ${changeColor}`}
            >
              {arrowIcon}
              <span>
                {change !== 0
                  ? `${change > 0 ? "+" : ""}${change}`
                  : "—"}
              </span>
            </div>
            <div className={`text-[11px] mt-0.5 ${changeColor}`}>
              {changeLabel}
            </div>
          </div>
        </div>
      </div>
      {lastRank && lastRank > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800 text-[11px] text-theme-text-secondary">
          {t("leagueTables.lastWeekRank", {
            defaultValue: "Last week's rank",
          })}
          : <span className="font-semibold">#{lastRank.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
