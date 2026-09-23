"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RefreshCw, Trophy } from "lucide-react";
import {
  Chip,
  cx,
  EmptyState,
  formatRank,
  GhostButton,
  LiveDot,
  Panel,
  Sheet,
  SkeletonRows, dateLocale } from "@/components/fpl/live/ui";
import LeagueTableHeader from "./LeagueTableHeader";
import LeagueTableRow from "./LeagueTableRow";
import LeagueTableExpanded from "./LeagueTableExpanded";
import LeagueFiltersPanel, { type LeagueOwnership } from "./LeagueFiltersPanel";
import LeaguePicker from "./LeaguePicker";
import Movement from "./Movement";
import type {
  FilterState,
  LeagueElementSummary,
  LeagueTableData,
  ManagerLeague,
  ProcessedTeam,
  SortDirection,
  SortKey,
} from "./types";

interface LeagueTableProps {
  managerId?: number;
  gameweek: number;
  leagueId?: string;
  isPolling?: boolean;
  /** Shows a live on/off pill in the standings header when provided. */
  onToggleLive?: () => void;
}

const SELECTED_LEAGUE_KEY = "fpl-live-league-id";

export default function LeagueTable({
  managerId,
  gameweek,
  leagueId,
  isPolling = false,
  onToggleLive,
}: LeagueTableProps) {
  const { t, i18n } = useTranslation("fpl");

  const [data, setData] = useState<LeagueTableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueId || "");
  const [leagues, setLeagues] = useState<ManagerLeague[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [leaguesInitiallyLoaded, setLeaguesInitiallyLoaded] = useState(false);
  const [includeAutoSubs, setIncludeAutoSubs] = useState(true);
  const [showGwNet, setShowGwNet] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("live_total");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState<FilterState>({
    playerId: null,
    playerQuery: "",
    scope: "startingXI",
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openTeamId, setOpenTeamId] = useState<number | null>(null);

  const fetchManagerLeagues = useCallback(async () => {
    if (!managerId) return;
    setLeaguesLoading(true);
    try {
      const response = await fetch(`/api/fpl/leagues?managerId=${managerId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      if (result.success) {
        const classic: ManagerLeague[] = result.data.classic || [];
        setLeagues(classic);
        // Reopen the league the manager looked at last time (if he's still in it).
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(SELECTED_LEAGUE_KEY);
        } catch {
          // storage unavailable — the picker still works
        }
        if (saved && classic.some((l) => String(l.id) === saved)) {
          setSelectedLeagueId((current) => current || (saved as string));
        }
      }
    } catch (err) {
      console.error("Failed to load manager leagues", err);
    } finally {
      setLeaguesLoading(false);
      setLeaguesInitiallyLoaded(true);
    }
  }, [managerId]);

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

  const selectLeague = (id: string) => {
    setPickerOpen(false);
    if (id === selectedLeagueId) return;
    setData(null);
    setOpenTeamId(null);
    setFilter({ playerId: null, playerQuery: "", scope: filter.scope });
    setSelectedLeagueId(id);
    try {
      localStorage.setItem(SELECTED_LEAGUE_KEY, id);
    } catch {
      // ignore
    }
  };

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        return prev;
      }
      // Rank reads naturally best-first; every points column highest-first.
      setSortDir(key === "rank" ? "asc" : "desc");
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
      return a.rank - b.rank;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const elementMap = useMemo(() => {
    const map = new Map<number, LeagueElementSummary>();
    for (const el of data?.elements ?? []) map.set(el.id, el);
    return map;
  }, [data]);

  // League-level ownership: how many of the listed managers start / own each player.
  const ownership = useMemo(() => {
    const map = new Map<number, LeagueOwnership>();
    for (const team of data?.teams ?? []) {
      for (const pick of team.picks) {
        const entry = map.get(pick.element) ?? { starting: 0, any: 0 };
        entry.any += 1;
        if (pick.position <= 11) entry.starting += 1;
        map.set(pick.element, entry);
      }
    }
    return map;
  }, [data]);

  const selectedLeague = useMemo(() => {
    const id = Number(selectedLeagueId);
    if (!id) return null;
    return leagues.find((l) => l.id === id) || null;
  }, [leagues, selectedLeagueId]);

  const userOutsideTable = useMemo(() => {
    if (!managerId || !data) return false;
    return !data.teams.some((team) => team.id === managerId);
  }, [managerId, data]);

  const matchingTeamIds = useMemo(() => {
    if (!filter.playerId || !data) return new Set<number>();
    const set = new Set<number>();
    for (const team of data.teams) {
      const has = team.picks.some((p) =>
        filter.scope === "startingXI"
          ? p.position <= 11 && p.element === filter.playerId
          : p.element === filter.playerId
      );
      if (has) set.add(team.id);
    }
    return set;
  }, [filter.playerId, filter.scope, data]);

  const openTeam = openTeamId ? data?.teams.find((team) => team.id === openTeamId) ?? null : null;

  /* ---------------------------------------------------------------- */

  if (leaguesLoading && !leaguesInitiallyLoaded) {
    return (
      <Panel
        flush
        icon={<Trophy />}
        title={t("fplLive.ui.leagues.yourLeagues", "Your leagues")}
        subtitle={t("fplLive.ui.leagues.loadingLeagues", "Loading your leagues…")}
      >
        <SkeletonRows rows={4} />
      </Panel>
    );
  }

  if (leagues.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={<Trophy />}
          title={t("fplLive.ui.leagues.noLeagues", "No leagues found")}
          text={t(
            "fplLive.ui.leagues.noLeaguesText",
            "We couldn't load this manager's classic leagues. Try again in a moment."
          )}
          action={
            <GhostButton onClick={fetchManagerLeagues}>
              <RefreshCw />
              {t("fplLive.ui.leagues.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  if (!selectedLeagueId) {
    return (
      <Panel
        flush
        icon={<Trophy />}
        title={t("fplLive.ui.leagues.yourLeagues", "Your leagues")}
        subtitle={t("fplLive.ui.leagues.pickLeague", "Pick a league to see its live table")}
      >
        <div className="border-t border-theme-border">
          <LeaguePicker leagues={leagues} selectedId="" onSelect={selectLeague} />
        </div>
      </Panel>
    );
  }

  const leagueName = data?.league.name ?? selectedLeague?.name ?? "";
  const updatedAt = data
    ? new Date(data.last_updated).toLocaleTimeString(dateLocale(i18n.language), { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        flush
        title={
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="-mx-1 flex max-w-full items-center gap-1 rounded-md px-1 text-left transition-colors hover:bg-theme-card-secondary"
          >
            <span className="truncate">{leagueName || t("fplLive.ui.leagues.chooseLeague", "Choose league")}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-theme-text-muted" />
          </button>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-1.5">
            <span>GW {data?.gameweek ?? gameweek}</span>
            {selectedLeague?.entry_rank ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  {t("fplLive.ui.leagues.yourRank", "You're")}{" "}
                  <span className="font-medium text-theme-text-secondary">
                    {formatRank(selectedLeague.entry_rank)}
                  </span>
                </span>
              </>
            ) : null}
            {updatedAt && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {t("fplLive.ui.leagues.updatedAt", "Updated {{time}}", { time: updatedAt })}
                </span>
              </>
            )}
          </span>
        }
        action={
          <div className="flex items-center gap-1.5">
            {onToggleLive && (
              <button
                type="button"
                onClick={onToggleLive}
                title={
                  isPolling
                    ? t("fplLive.ui.leagues.pauseLive", "Pause live tracking")
                    : t("fplLive.ui.leagues.resumeLive", "Resume live tracking")
                }
                className={cx(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  isPolling
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-theme-border bg-theme-card text-theme-text-muted hover:bg-theme-card-secondary"
                )}
              >
                {isPolling ? (
                  <LiveDot />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-theme-text-muted" />
                )}
                {isPolling
                  ? t("fplLive.ui.leagues.live", "Live")
                  : t("fplLive.ui.leagues.paused", "Paused")}
              </button>
            )}
            <GhostButton
              onClick={fetchLeagueTable}
              disabled={loading}
              className="h-8 w-8 !px-0"
              title={t("fplLive.ui.leagues.refresh", "Refresh")}
            >
              <RefreshCw className={cx(loading && "animate-spin")} />
            </GhostButton>
          </div>
        }
      >
        <div className="space-y-3 px-4 pb-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Toggle
              checked={includeAutoSubs}
              onChange={() => setIncludeAutoSubs((v) => !v)}
              label={t("fplLive.ui.leagues.autoSubs", "Auto subs")}
            />
            <Toggle
              checked={showGwNet}
              onChange={() => setShowGwNet((v) => !v)}
              label={t("fplLive.ui.leagues.deductHits", "Deduct hits")}
            />
            {data && !data.bonus_added && (
              <Chip tone="warning" className="ml-auto">
                {t("fplLive.ui.leagues.bonusProvisional", "Bonus provisional")}
              </Chip>
            )}
          </div>

          {data && (
            <LeagueFiltersPanel
              elements={data.elements}
              filter={filter}
              onChange={setFilter}
              ownership={ownership}
              teamCount={data.teams.length}
            />
          )}
        </div>

        {error && (
          <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 sm:mx-5">
            <span className="min-w-0 truncate">
              {t("fplLive.ui.leagues.tableError", "Couldn't load the live table.")}
            </span>
            <GhostButton onClick={fetchLeagueTable} disabled={loading}>
              {t("fplLive.ui.leagues.retry", "Try again")}
            </GhostButton>
          </div>
        )}

        {!data && loading && <SkeletonRows rows={8} className="border-t border-theme-border" />}

        {data && (
          <>
            <LeagueTableHeader
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              showGwNet={showGwNet}
            />
            <div className="divide-y divide-theme-border">
              {sortedTeams.map((team) => (
                <LeagueTableRow
                  key={team.id}
                  team={team}
                  elementMap={elementMap}
                  isCurrentUser={managerId === team.id}
                  isDimmed={!!filter.playerId && !matchingTeamIds.has(team.id)}
                  showGwNet={showGwNet}
                  onOpen={() => setOpenTeamId(team.id)}
                />
              ))}
            </div>
            {data.teams.length >= 50 && (
              <p className="border-t border-theme-border px-4 py-2.5 text-center text-[11px] text-theme-text-muted sm:px-5">
                {t("fplLive.ui.leagues.top50Note", "Live table covers the league's top 50.")}
              </p>
            )}
          </>
        )}
      </Panel>

      {data && userOutsideTable && selectedLeague?.entry_rank ? (
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-theme-heading-primary">
                  {t("fplLive.ui.leagues.yourPosition", "Your position")}
                </span>
                <Chip tone="accent">{t("fplLive.ui.leagues.you", "You")}</Chip>
              </div>
              <p className="mt-0.5 text-xs text-theme-text-muted">
                {t("fplLive.ui.leagues.outsideTop50", "Outside the live top 50")}
                {selectedLeague.entry_last_rank
                  ? ` · ${t("fplLive.ui.leagues.lastGw", "last GW")} ${formatRank(selectedLeague.entry_last_rank)}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-lg font-semibold leading-none tabular-nums text-theme-heading-primary">
                {formatRank(selectedLeague.entry_rank)}
              </span>
              <Movement
                value={
                  selectedLeague.entry_last_rank
                    ? selectedLeague.entry_last_rank - selectedLeague.entry_rank
                    : 0
                }
              />
            </div>
          </div>
        </Panel>
      ) : null}

      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("fplLive.ui.leagues.yourLeagues", "Your leagues")}
        subtitle={t("fplLive.ui.leagues.pickLeague", "Pick a league to see its live table")}
      >
        <div className="-mx-4 border-t border-theme-border sm:-mx-5">
          <LeaguePicker leagues={leagues} selectedId={selectedLeagueId} onSelect={selectLeague} />
        </div>
      </Sheet>

      <Sheet
        open={!!openTeam}
        onClose={() => setOpenTeamId(null)}
        title={openTeam?.entry_name}
        subtitle={
          openTeam
            ? `${openTeam.player_name} · #${openTeam.rank} ${t("fplLive.ui.leagues.inLeague", "in league")}`
            : undefined
        }
      >
        {openTeam && (
          <LeagueTableExpanded
            team={openTeam}
            elementMap={elementMap}
            bonusAdded={data?.bonus_added}
          />
        )}
      </Sheet>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="inline-flex items-center gap-2 text-xs text-theme-text-secondary"
    >
      <span
        className={cx(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-violet-500" : "bg-theme-border-strong"
        )}
      >
        <span
          className={cx(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
