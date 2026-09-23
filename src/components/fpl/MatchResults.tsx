"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RefreshCw, Trophy } from "lucide-react";
import { TbBallFootball, TbRectangleVerticalFilled, TbShoe } from "react-icons/tb";

import {
  Chip,
  EmptyState,
  GhostButton,
  LiveDot,
  Panel,
  PlayerCell,
  PlayerJersey,
  SkeletonRows,
  StatTile,
  cx,
} from "./live/ui";

interface MatchResultsProps {
  gameweek: number;
  isPolling?: boolean;
  onManagerSelect?: (managerId: number) => void;
}

interface MatchResultPlayer {
  id: number;
  web_name: string;
  team_id: number;
  team_code?: number;
  element_type?: number;
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

interface SidedStat {
  player: MatchResultPlayer;
  side: "home" | "away";
  value: number;
}

interface BpsEntry {
  player: MatchResultPlayer;
  bps: number;
  bonus: number;
}

interface MatchTeam {
  id: number;
  code?: number;
  name: string;
  short_name: string;
}

interface MatchResult {
  fixture_id: number;
  gameweek: number;
  home_team: MatchTeam;
  away_team: MatchTeam;
  home_score: number;
  away_score: number;
  status: "LIVE" | "FT" | "SCHEDULED";
  kickoff_time: string | null;
  minutes: number;
  bonus_status?: "none" | "provisional" | "official";
  home_goals: MatchGoal[];
  away_goals: MatchGoal[];
  home_assists: MatchAssist[];
  away_assists: MatchAssist[];
  top_performers: {
    home: MatchResultPlayer[];
    away: MatchResultPlayer[];
  };
  bonus?: BpsEntry[];
  bps_top?: BpsEntry[];
  yellow_cards?: SidedStat[];
  red_cards?: SidedStat[];
  penalties_saved?: SidedStat[];
  penalties_missed?: SidedStat[];
  saves?: SidedStat[];
  defensive_contributions?: (SidedStat & { points: number })[];
}

interface GameweekSummary {
  totalGoals: number;
  totalAssists: number;
  highestScorer: MatchResultPlayer | null;
  matchesTotal?: number;
  matchesFinished?: number;
  matchesLive?: number;
  matchesUpcoming?: number;
}

const localeFor = (lang?: string) => (lang?.startsWith("bs") ? "sr-Latn-BA" : "en-GB");

const jerseyPlayer = (p: MatchResultPlayer) => ({
  team: p.team_id,
  team_code: p.team_code,
  element_type: p.element_type,
});

/** Collapse one-entry-per-goal lists into "Name ×2". */
function groupByPlayer<T extends { player: MatchResultPlayer; own_goal?: boolean }>(items: T[]) {
  const groups = new Map<string, { player: MatchResultPlayer; count: number; ownGoal: boolean }>();
  for (const item of items) {
    const key = `${item.player.id}:${item.own_goal ? "og" : ""}`;
    const current = groups.get(key);
    if (current) current.count += 1;
    else groups.set(key, { player: item.player, count: 1, ownGoal: !!item.own_goal });
  }
  return Array.from(groups.values());
}

export default function MatchResults({ gameweek, isPolling = false }: MatchResultsProps) {
  const { t, i18n } = useTranslation("fpl");
  const locale = localeFor(i18n.language);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState<GameweekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/fpl/match-results?gameweek=${gameweek}`);
      if (!response.ok) {
        throw new Error(`Match data API failed with status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch match data");

      const list: MatchResult[] = result.data || [];
      setMatches(list);
      setSummary(
        result.summary ?? {
          // Fallback (mock data): derive the headline numbers from the matches.
          totalGoals: list.reduce(
            (sum, m) =>
              sum +
              [...m.home_goals, ...m.away_goals].filter((g) => !g.own_goal).length,
            0
          ),
          totalAssists: list.reduce(
            (sum, m) => sum + m.home_assists.length + m.away_assists.length,
            0
          ),
          highestScorer: null,
        }
      );
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [gameweek]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchMatchData, 30000);
    return () => clearInterval(interval);
  }, [isPolling, fetchMatchData]);

  const toggle = (fixtureId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fixtureId)) next.delete(fixtureId);
      else next.add(fixtureId);
      return next;
    });

  // Group by kick-off day, keeping FPL's chronological order.
  const days = useMemo(() => {
    const groups: Array<{ key: string; label: string; matches: MatchResult[] }> = [];
    for (const match of matches) {
      const date = match.kickoff_time ? new Date(match.kickoff_time) : null;
      const key = date ? date.toDateString() : "tbd";
      const label = date
        ? date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })
        : t("fplLive.ui.results.dateTbd", "Date to be confirmed");
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.matches.push(match);
      else groups.push({ key, label, matches: [match] });
    }
    return groups;
  }, [matches, locale, t]);

  const refreshButton = (
    <GhostButton onClick={fetchMatchData} disabled={loading} title={t("fplLive.refresh", "Refresh")}>
      <RefreshCw className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{t("fplLive.refresh", "Refresh")}</span>
    </GhostButton>
  );

  const title = t("fplLive.ui.results.title", "GW{{gw}} results", { gw: gameweek });

  if (loading && matches.length === 0) {
    return (
      <Panel title={title} icon={<TbBallFootball />} flush>
        <SkeletonRows rows={8} />
      </Panel>
    );
  }

  if (error && matches.length === 0) {
    return (
      <Panel title={title} icon={<TbBallFootball />}>
        <EmptyState
          icon={<TbBallFootball />}
          title={t("fplLive.ui.results.error", "Couldn't load results")}
          text={t("fplLive.ui.pages.retryHint", "Check your connection and try again.")}
          action={
            <GhostButton onClick={fetchMatchData}>
              <RefreshCw />
              {t("fplLive.ui.results.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  const total = summary?.matchesTotal ?? matches.length;
  const finished =
    summary?.matchesFinished ?? matches.filter((m) => m.status === "FT").length;
  const live = summary?.matchesLive ?? matches.filter((m) => m.status === "LIVE").length;
  const top = summary?.highestScorer;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title={title}
        subtitle={
          <>
            {t("fplLive.ui.results.matchesCount", "{{count}} matches", { count: total })}
            {lastUpdated && (
              <>
                {" · "}
                {t("fplLive.ui.results.updatedAt", "updated {{time}}", {
                  time: lastUpdated.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </>
            )}
          </>
        }
        icon={<TbBallFootball />}
        action={refreshButton}
      >
        <div className="grid grid-cols-3 gap-2">
          <StatTile label={t("fplLive.goals", "Goals")} value={summary?.totalGoals ?? "—"} />
          <StatTile label={t("fplLive.assists", "Assists")} value={summary?.totalAssists ?? "—"} />
          <StatTile
            label={t("fplLive.ui.results.matches", "Matches")}
            value={`${finished}/${total}`}
            hint={
              live > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-500">
                  <LiveDot className="scale-75" />
                  {t("fplLive.ui.results.liveCount", "{{count}} live", { count: live })}
                </span>
              ) : (
                t("fplLive.ui.results.finishedHint", "finished")
              )
            }
          />
        </div>

        {top && (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-theme-border px-3 py-2.5">
            <PlayerCell
              name={top.web_name}
              player={jerseyPlayer(top)}
              meta={
                <>
                  <Trophy className="h-3 w-3 shrink-0 text-amber-500" />
                  <span className="truncate">
                    {t("fplLive.ui.results.topScorer", "Top scorer of the gameweek")}
                  </span>
                </>
              }
            />
            <div className="shrink-0 text-right">
              <div className="text-lg font-semibold leading-none tabular-nums text-theme-heading-primary">
                {top.points}
              </div>
              <div className="mt-0.5 text-[10px] text-theme-text-muted">
                {t("fplLive.ui.results.ptsShort", "pts")}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-[11px] text-rose-500">
            {t("fplLive.ui.pages.refreshFailed", "Refresh failed — showing the last loaded data.")}
          </p>
        )}
      </Panel>

      {matches.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<TbBallFootball />}
            title={t("fplLive.ui.results.noMatches", "No matches in this gameweek")}
          />
        </Panel>
      ) : (
        <Panel flush>
          {days.map((day, dayIndex) => (
            <div key={day.key}>
              <div
                className={cx(
                  "bg-theme-card-secondary px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted sm:px-5",
                  dayIndex > 0 && "border-t border-theme-border"
                )}
              >
                {day.label}
              </div>
              <div className="divide-y divide-theme-border border-t border-theme-border">
                {day.matches.map((match) => (
                  <MatchRow
                    key={match.fixture_id}
                    match={match}
                    locale={locale}
                    expanded={expanded.has(match.fixture_id)}
                    onToggle={() => toggle(match.fixture_id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-theme-text-muted">
        <span className="inline-flex items-center gap-1">
          <TbBallFootball className="h-3 w-3" />
          {t("fplLive.ui.results.legendGoal", "goal")}
        </span>
        <span className="inline-flex items-center gap-1">
          <TbShoe className="h-3 w-3" />
          {t("fplLive.ui.results.legendAssist", "assist")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded bg-rose-500/10 px-1 text-[9px] font-semibold text-rose-500">
            {t("fplLive.ui.results.ownGoalShort", "OG")}
          </span>
          {t("fplLive.ui.results.legendOwnGoal", "own goal")}
        </span>
        <span className="inline-flex items-center gap-1">
          <TbRectangleVerticalFilled className="h-3 w-3 text-rose-500" />
          {t("fplLive.ui.results.legendRed", "red card")}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Match row                                                           */
/* ------------------------------------------------------------------ */

const ROW_GRID =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_3.25rem_minmax(0,1fr)_1rem] items-center gap-x-2";

function MatchRow({
  match,
  locale,
  expanded,
  onToggle,
}: {
  match: MatchResult;
  locale: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("fpl");
  const started = match.status !== "SCHEDULED";

  const homeGoals = groupByPlayer(match.home_goals);
  const awayGoals = groupByPlayer(match.away_goals);
  const homeAssists = groupByPlayer(match.home_assists);
  const awayAssists = groupByPlayer(match.away_assists);
  const homeReds = (match.red_cards || []).filter((c) => c.side === "home");
  const awayReds = (match.red_cards || []).filter((c) => c.side === "away");
  const hasEvents =
    homeGoals.length + awayGoals.length + homeAssists.length + awayAssists.length + homeReds.length + awayReds.length >
    0;

  const status =
    match.status === "LIVE" ? (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums text-emerald-500">
        <LiveDot className="scale-75" />
        {match.minutes}&apos;
      </span>
    ) : match.status === "FT" ? (
      <span className="text-[11px] font-medium text-theme-text-muted">
        {t("fplLive.ui.results.ft", "FT")}
      </span>
    ) : (
      <span className="text-[11px] font-medium tabular-nums text-theme-text-muted">
        {match.kickoff_time
          ? new Date(match.kickoff_time).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    );

  const content = (
    <>
      <div className={ROW_GRID}>
        <div>{status}</div>
        <TeamSide team={match.home_team} align="left" />
        <div className="text-center text-base font-semibold tabular-nums text-theme-heading-primary">
          {started ? (
            <>
              {match.home_score}
              <span className="mx-1 text-theme-text-muted">–</span>
              {match.away_score}
            </>
          ) : (
            <span className="text-xs font-medium text-theme-text-muted">vs</span>
          )}
        </div>
        <TeamSide team={match.away_team} align="right" />
        <div className="flex justify-end">
          {started && (
            <ChevronDown
              className={cx(
                "h-4 w-4 text-theme-text-muted transition-transform",
                expanded && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {hasEvents && (
        <div className={cx(ROW_GRID, "mt-2 items-start")}>
          <div />
          <EventList goals={homeGoals} assists={homeAssists} reds={homeReds} align="left" />
          <div />
          <EventList goals={awayGoals} assists={awayAssists} reds={awayReds} align="right" />
          <div />
        </div>
      )}
    </>
  );

  return (
    <div>
      {started ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="block w-full px-4 py-3 text-left transition-colors hover:bg-theme-card-secondary sm:px-5"
        >
          {content}
        </button>
      ) : (
        <div className="px-4 py-3 sm:px-5">{content}</div>
      )}
      {expanded && started && <MatchDetails match={match} />}
    </div>
  );
}

function TeamSide({ team, align }: { team: MatchTeam; align: "left" | "right" }) {
  return (
    <div
      className={cx(
        "flex min-w-0 items-center gap-2",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <PlayerJersey team={team.short_name} size="sm" />
      <span className="truncate text-sm font-semibold text-theme-heading-primary">
        <span className="sm:hidden">{team.short_name}</span>
        <span className="hidden sm:inline">{team.name}</span>
      </span>
    </div>
  );
}

function EventList({
  goals,
  assists,
  reds,
  align,
}: {
  goals: ReturnType<typeof groupByPlayer>;
  assists: ReturnType<typeof groupByPlayer>;
  reds: SidedStat[];
  align: "left" | "right";
}) {
  const { t } = useTranslation("fpl");
  const line = (key: string, icon: ReactNode, name: string, count: number, extra?: ReactNode, muted = false) => (
    <div
      key={key}
      className={cx(
        "flex min-w-0 items-center gap-1 text-[11px] leading-4",
        align === "right" && "flex-row-reverse",
        muted ? "text-theme-text-muted" : "text-theme-text-secondary"
      )}
    >
      <span className="shrink-0 [&_svg]:h-3 [&_svg]:w-3">{icon}</span>
      <span className="truncate">{name}</span>
      {count > 1 && <span className="shrink-0 tabular-nums text-theme-text-muted">×{count}</span>}
      {extra}
    </div>
  );

  return (
    <div className="min-w-0 space-y-0.5">
      {goals.map((g) =>
        line(
          `g-${g.player.id}-${g.ownGoal}`,
          <TbBallFootball className={g.ownGoal ? "text-rose-500" : "text-theme-heading-primary"} />,
          g.player.web_name,
          g.count,
          g.ownGoal ? (
            <span className="shrink-0 rounded bg-rose-500/10 px-1 text-[9px] font-semibold text-rose-500">
              {t("fplLive.ui.results.ownGoalShort", "OG")}
            </span>
          ) : undefined
        )
      )}
      {assists.map((a) => line(`a-${a.player.id}`, <TbShoe />, a.player.web_name, a.count, undefined, true))}
      {reds.map((r) =>
        line(`r-${r.player.id}`, <TbRectangleVerticalFilled className="text-rose-500" />, r.player.web_name, 1, undefined, true)
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expanded details                                                    */
/* ------------------------------------------------------------------ */

function DetailBlock({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
          {title}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function MatchDetails({ match }: { match: MatchResult }) {
  const { t } = useTranslation("fpl");
  const teamShort = (p: MatchResultPlayer) =>
    p.team_id === match.home_team.id ? match.home_team.short_name : match.away_team.short_name;

  const bpsRows = match.bps_top || [];
  const topPoints = [...match.top_performers.home, ...match.top_performers.away]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const listNames = (items: SidedStat[] | undefined, withValue = false) =>
    (items || [])
      .map((i) => (withValue ? `${i.player.web_name} ${i.value}` : i.player.web_name))
      .join(", ");

  const extras: Array<{ key: string; label: string; value: string; icon?: ReactNode }> = [
    {
      key: "yellow",
      label: t("fplLive.ui.results.yellowCards", "Yellow cards"),
      value: listNames(match.yellow_cards),
      icon: <TbRectangleVerticalFilled className="h-3 w-3 text-amber-400" />,
    },
    {
      key: "red",
      label: t("fplLive.ui.results.redCards", "Red cards"),
      value: listNames(match.red_cards),
      icon: <TbRectangleVerticalFilled className="h-3 w-3 text-rose-500" />,
    },
    {
      key: "ps",
      label: t("fplLive.ui.results.pensSaved", "Penalties saved"),
      value: listNames(match.penalties_saved),
    },
    {
      key: "pm",
      label: t("fplLive.ui.results.pensMissed", "Penalties missed"),
      value: listNames(match.penalties_missed),
    },
    {
      key: "saves",
      label: t("fplLive.ui.results.saves", "Saves"),
      value: listNames(match.saves, true),
    },
    {
      key: "defcon",
      label: t("fplLive.ui.results.defcon", "Defensive contribution"),
      value: (match.defensive_contributions || []).map((d) => d.player.web_name).join(", "),
    },
  ].filter((row) => row.value);

  return (
    <div className="space-y-4 border-t border-theme-border bg-theme-card-secondary px-4 py-3.5 sm:px-5">
      {bpsRows.length > 0 && (
        <DetailBlock
          title={t("fplLive.ui.results.bonus", "Bonus")}
          aside={
            match.bonus_status === "provisional" ? (
              <Chip tone="warning">{t("fplLive.ui.results.bonusProvisional", "provisional")}</Chip>
            ) : null
          }
        >
          <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-card">
            <div className="divide-y divide-theme-border">
              {bpsRows.map((row) => (
                <div key={row.player.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span
                    className={cx(
                      "w-6 shrink-0 text-center text-xs font-semibold tabular-nums",
                      row.bonus > 0 ? "text-emerald-500" : "text-theme-text-muted"
                    )}
                  >
                    {row.bonus > 0 ? `+${row.bonus}` : "–"}
                  </span>
                  <PlayerCell
                    size="sm"
                    name={row.player.web_name}
                    player={jerseyPlayer(row.player)}
                    meta={teamShort(row.player)}
                  />
                  <span className="shrink-0 text-right text-xs tabular-nums text-theme-text-secondary">
                    {row.bps}
                    <span className="ml-1 text-[10px] text-theme-text-muted">BPS</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DetailBlock>
      )}

      {topPoints.length > 0 && (
        <DetailBlock title={t("fplLive.ui.results.topPoints", "Most FPL points")}>
          <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-card">
            <div className="divide-y divide-theme-border">
              {topPoints.map((player) => (
                <div key={player.id} className="flex items-center gap-2.5 px-3 py-2">
                  <PlayerCell
                    size="sm"
                    name={player.web_name}
                    player={jerseyPlayer(player)}
                    meta={
                      <>
                        <span>{teamShort(player)}</span>
                        {typeof player.ownership_overall === "number" ||
                        typeof player.ownership_top10k === "number" ? (
                          <span
                            className="tabular-nums"
                            title={t("fplLive.ui.results.ownership", "Ownership")}
                          >
                            · {(player.ownership_overall ?? player.ownership_top10k ?? 0).toFixed(1)}%
                          </span>
                        ) : null}
                      </>
                    }
                  />
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-theme-heading-primary">
                    {player.points}
                    <span className="ml-1 text-[10px] font-normal text-theme-text-muted">
                      {t("fplLive.ui.results.ptsShort", "pts")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DetailBlock>
      )}

      {extras.length > 0 && (
        <div className="space-y-1.5">
          {extras.map((row) => (
            <div key={row.key} className="flex items-start gap-2 text-xs">
              <span className="flex w-32 shrink-0 items-center gap-1 text-theme-text-muted sm:w-40">
                {row.icon}
                {row.label}
              </span>
              <span className="min-w-0 flex-1 text-theme-text-secondary">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
