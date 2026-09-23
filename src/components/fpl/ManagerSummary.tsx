"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Repeat } from "lucide-react";

import {
  Bar,
  Chip,
  Panel,
  PlayerCell,
  StatTile,
  cx,
  formatCompact,
  formatNumber,
  formatPrice,
  formatRank,
} from "@/components/fpl/live/ui";
import type {
  OverviewEntryHistory,
  OverviewGameweekStatus,
  OverviewManager,
  OverviewSquadPlayer,
  OverviewTeamTotals,
} from "@/components/fpl/live/overview-types";

/* ------------------------------------------------------------------ */
/* Derived numbers                                                     */
/* ------------------------------------------------------------------ */

export interface OverviewNumbers {
  /** Live GW points (auto-subs + provisional bonus), before hits. */
  heroPoints: number;
  /** FPL's own figure for the GW, when it differs from the live one. */
  officialPoints: number | null;
  gwRank: number | null;
  overallRank: number | null;
  previousOverallRank: number | null;
  rankChange: number | null;
  arrow: "green" | "red" | "neutral" | null;
  totalPoints: number | null;
  percentile: number | null;
  value: number | null;
  bank: number | null;
  transfers: number | null;
  hitCost: number;
  benchPoints: number | null;
  activeChip: string | null;
  bonus: number;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Picks every headline number from the most specific source: the loaded
 * gameweek's history (gameweek-status / entry_history) before the manager
 * summary, which only ever describes the latest gameweek.
 */
export function deriveOverviewNumbers({
  manager,
  teamTotals,
  entryHistory,
  gameweekStatus,
  bonusAdded,
  activeChip,
}: {
  manager?: OverviewManager | null;
  teamTotals?: OverviewTeamTotals | null;
  entryHistory?: OverviewEntryHistory | null;
  gameweekStatus?: OverviewGameweekStatus | null;
  bonusAdded: boolean;
  activeChip?: string | null;
}): OverviewNumbers {
  const status = gameweekStatus ?? null;
  const official =
    num(entryHistory?.points) ?? num(status?.gameweek_points) ?? num(manager?.summary_event_points);
  // The scoring service reports zeros when it fails — only trust a live
  // figure that is non-zero, or when FPL itself has nothing yet.
  const liveRaw = num(teamTotals?.with_autosubs?.live_points_gross);
  const live = liveRaw !== null && (liveRaw > 0 || !official) ? liveRaw : null;
  const heroPoints = live ?? official ?? 0;
  const liveTotalRaw = num(teamTotals?.with_autosubs?.live_total);
  const liveTotal = liveTotalRaw !== null && liveTotalRaw > 0 ? liveTotalRaw : null;

  const hasRealArrow =
    !!status && num(status.previous_overall_rank) !== null && num(status.overall_rank) !== null;

  return {
    heroPoints,
    officialPoints: official !== null && live !== null && official !== live ? official : null,
    gwRank: num(status?.gameweek_rank) ?? num(entryHistory?.rank) ?? num(manager?.summary_event_rank),
    overallRank:
      num(status?.overall_rank) ?? num(entryHistory?.overall_rank) ?? num(manager?.summary_overall_rank),
    previousOverallRank: num(status?.previous_overall_rank),
    rankChange: hasRealArrow ? status!.rank_change : null,
    arrow: hasRealArrow ? status!.arrow_direction : null,
    totalPoints:
      liveTotal ??
      num(status?.total_points) ??
      num(entryHistory?.total_points) ??
      num(manager?.summary_overall_points),
    percentile: num(status?.percentile_rank) ?? num(entryHistory?.percentile_rank),
    value: num(status?.value) ?? num(entryHistory?.value) ?? num(manager?.last_deadline_value),
    bank: num(status?.bank) ?? num(entryHistory?.bank) ?? num(manager?.last_deadline_bank),
    transfers: num(status?.event_transfers) ?? num(entryHistory?.event_transfers),
    hitCost: num(status?.event_transfers_cost) ?? num(entryHistory?.event_transfers_cost) ?? 0,
    benchPoints:
      num(teamTotals?.bench_points_final) ?? num(status?.points_on_bench) ?? num(entryHistory?.points_on_bench),
    activeChip: activeChip ?? status?.active_chip ?? null,
    bonus: (bonusAdded ? teamTotals?.final_bonus : teamTotals?.predicted_bonus) ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const RANK_MILESTONES = [
  { label: "Top 10K", threshold: 10_000 },
  { label: "Top 50K", threshold: 50_000 },
  { label: "Top 100K", threshold: 100_000 },
  { label: "Top 250K", threshold: 250_000 },
  { label: "Top 500K", threshold: 500_000 },
  { label: "Top 1M", threshold: 1_000_000 },
  { label: "Top 2M", threshold: 2_000_000 },
  { label: "Top 5M", threshold: 5_000_000 },
];

function useChipLabel() {
  const { t } = useTranslation("fpl");
  return (chip: string) =>
    ({
      wildcard: t("fplLive.ui.overview.chipWildcard", "Wildcard"),
      freehit: t("fplLive.ui.overview.chipFreeHit", "Free Hit"),
      bboost: t("fplLive.ui.overview.chipBenchBoost", "Bench Boost"),
      "3xc": t("fplLive.ui.overview.chipTripleCaptain", "Triple Captain"),
      manager: t("fplLive.ui.overview.chipAssistantManager", "Assistant Manager"),
    })[chip] || chip;
}

interface OverviewHeroProps {
  manager?: OverviewManager | null;
  numbers: OverviewNumbers;
  gameweek: number;
  bonusAdded: boolean;
  gameweekStatus?: OverviewGameweekStatus | null;
}

export function OverviewHero({
  numbers,
  gameweek,
  bonusAdded,
}: OverviewHeroProps) {
  const { t } = useTranslation("fpl");
  const chipLabel = useChipLabel();

  const { overallRank } = numbers;
  const bracket = overallRank
    ? RANK_MILESTONES.find((m) => overallRank <= m.threshold) ?? null
    : null;
  const next = overallRank
    ? [...RANK_MILESTONES].reverse().find((m) => m.threshold < overallRank) ?? null
    : null;
  // Progress through the current bracket towards the next milestone
  const bracketProgress =
    overallRank && next
      ? (() => {
          const top = bracket?.threshold ?? next.threshold * 2;
          const span = top - next.threshold;
          return span > 0 ? ((top - overallRank) / span) * 100 : 0;
        })()
      : 100;


  const ArrowIcon =
    numbers.arrow === "green" ? ArrowUpRight : numbers.arrow === "red" ? ArrowDownRight : ArrowRight;

  return (
    <Panel>
      {/* Gameweek label + active chip (team name and live state sit in the page header) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
          {t("fplLive.ui.overview.heroLabel", "Gameweek {{gw}}", { gw: gameweek })}
        </span>
        {numbers.activeChip && <Chip tone="accent">{chipLabel(numbers.activeChip)}</Chip>}
      </div>

      {/* Points + ranks */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[3.25rem] font-semibold leading-none tracking-tight text-theme-heading-primary">
            {numbers.heroPoints}
          </div>
          <div className="mt-2 text-xs text-theme-text-muted">
            {t("fplLive.ui.overview.gwPoints", "points · GW{{gw}}", { gw: gameweek })}
            {numbers.bonus > 0 && (
              <span className="text-theme-text-secondary">
                {" · "}
                {bonusAdded
                  ? t("fplLive.ui.overview.bonusFinal", "bonus +{{bonus}}", { bonus: numbers.bonus })
                  : t("fplLive.ui.overview.bonusProvisional", "provisional bonus +{{bonus}}", {
                      bonus: numbers.bonus,
                    })}
              </span>
            )}
          </div>
          {numbers.officialPoints !== null && (
            <div className="mt-0.5 text-[11px] text-theme-text-muted">
              {t("fplLive.ui.overview.officialPoints", "Official {{points}} · live adds bonus & auto-subs", {
                points: numbers.officialPoints,
              })}
            </div>
          )}
        </div>

        <dl className="shrink-0 space-y-2 text-right">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
              {t("fplLive.ui.overview.gwRank", "GW rank")}
            </dt>
            <dd className="text-[15px] font-semibold tabular-nums text-theme-heading-primary">
              {formatRank(numbers.gwRank)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
              {t("fplLive.ui.overview.overallRank", "Overall rank")}
            </dt>
            <dd className="text-[15px] font-semibold tabular-nums text-theme-heading-primary">
              {formatRank(numbers.overallRank)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Arrow */}
      {numbers.arrow && (
        <div className="mt-4 flex items-center gap-2.5 border-t border-theme-border pt-3.5">
          <span
            className={cx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              numbers.arrow === "green"
                ? "bg-emerald-500/10 text-emerald-500"
                : numbers.arrow === "red"
                ? "bg-rose-500/10 text-rose-500"
                : "bg-theme-card-secondary text-theme-text-muted"
            )}
          >
            <ArrowIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-xs leading-snug">
            <div className="font-semibold text-theme-heading-primary">
              {numbers.arrow === "green"
                ? t("fplLive.ui.overview.greenArrow", "Green arrow")
                : numbers.arrow === "red"
                ? t("fplLive.ui.overview.redArrow", "Red arrow")
                : t("fplLive.ui.overview.noArrow", "No rank change")}
            </div>
            {numbers.rankChange !== null && numbers.rankChange !== 0 && (
              <div className="text-theme-text-muted">
                {numbers.rankChange > 0
                  ? t("fplLive.ui.overview.placesUp", "{{places}} places up from {{from}}", {
                      places: formatNumber(numbers.rankChange),
                      from: formatRank(numbers.previousOverallRank),
                    })
                  : t("fplLive.ui.overview.placesDown", "{{places}} places down from {{from}}", {
                      places: formatNumber(Math.abs(numbers.rankChange)),
                      from: formatRank(numbers.previousOverallRank),
                    })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next rank milestone */}
      {overallRank ? (
        <div className={cx("mt-3.5", !numbers.arrow && "border-t border-theme-border pt-3.5")}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]">
            <span className="font-medium text-theme-text-secondary">
              {numbers.percentile
                ? t("fplLive.ui.overview.topPercent", "Top {{pct}}%", { pct: numbers.percentile })
                : bracket?.label ?? formatRank(overallRank)}
            </span>
            <span className="truncate text-theme-text-muted">
              {next
                ? t("fplLive.ui.overview.milestoneNext", "{{places}} places to {{target}}", {
                    places: formatCompact(overallRank - next.threshold),
                    target: next.label,
                  })
                : t("fplLive.ui.overview.milestoneTop", "Inside the top 10K")}
            </span>
          </div>
          <Bar value={bracketProgress} />
        </div>
      ) : null}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* KPI tiles                                                           */
/* ------------------------------------------------------------------ */

export function OverviewKpis({ numbers }: { numbers: OverviewNumbers }) {
  const { t } = useTranslation("fpl");
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <StatTile
        label={t("fplLive.ui.overview.kpiTotalPoints", "Total points")}
        value={formatNumber(numbers.totalPoints)}
        hint={
          numbers.percentile
            ? t("fplLive.ui.overview.topPercent", "Top {{pct}}%", { pct: numbers.percentile })
            : undefined
        }
      />
      <StatTile
        label={t("fplLive.ui.overview.kpiTeamValue", "Team value")}
        value={formatPrice(numbers.value)}
        hint={
          numbers.bank !== null
            ? t("fplLive.ui.overview.kpiBank", "In the bank {{bank}}", { bank: formatPrice(numbers.bank) })
            : undefined
        }
      />
      <StatTile
        label={t("fplLive.ui.overview.kpiTransfers", "Transfers")}
        value={numbers.transfers ?? "—"}
        hint={
          numbers.hitCost > 0 ? (
            <span className="text-rose-500">
              {t("fplLive.ui.overview.kpiHit", "Hit −{{cost}}", { cost: numbers.hitCost })}
            </span>
          ) : (
            t("fplLive.ui.overview.kpiNoHit", "No hit taken")
          )
        }
      />
      <StatTile
        label={t("fplLive.ui.overview.kpiBench", "Bench points")}
        value={numbers.benchPoints ?? "—"}
        hint={
          numbers.activeChip === "bboost"
            ? t("fplLive.ui.overview.kpiBenchBoost", "counted — Bench Boost")
            : t("fplLive.ui.overview.kpiBenchHint", "left on the bench")
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auto-subs                                                           */
/* ------------------------------------------------------------------ */

export function AutoSubsPanel({
  teamTotals,
  teamWithStats,
}: {
  teamTotals?: OverviewTeamTotals | null;
  teamWithStats?: OverviewSquadPlayer[];
}) {
  const { t } = useTranslation("fpl");
  const subs = teamTotals?.with_autosubs?.auto_subs_applied ?? [];
  const promoted = teamTotals?.with_autosubs?.captain_promoted ?? null;
  if ((!subs.length && !promoted) || !teamWithStats?.length) return null;

  const byId = new Map(teamWithStats.map((p) => [p.player_id, p]));
  const pointsOf = (id: number) => byId.get(id)?.live_stats?.total_points ?? 0;

  return (
    <Panel
      icon={<Repeat />}
      title={t("fplLive.ui.overview.autoSubsTitle", "Automatic substitutions")}
      subtitle={t(
        "fplLive.ui.overview.autoSubsSubtitle",
        "Players who didn't play were replaced from the bench"
      )}
      flush
    >
      <div className="divide-y divide-theme-border border-t border-theme-border">
        {subs.map((sub) => {
          const out = byId.get(sub.outId);
          const inn = byId.get(sub.inId);
          if (!out?.player || !inn?.player) return null;
          return (
            <div key={`${sub.outId}-${sub.inId}`} className="flex items-center gap-2 px-4 py-2.5 sm:px-5">
              <PlayerCell
                size="sm"
                player={out.player}
                name={<span className="text-theme-text-muted line-through decoration-theme-border-strong">{out.player.web_name}</span>}
                meta={t("fplLive.ui.overview.didNotPlay", "Didn't play")}
              />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-theme-text-muted" />
              <PlayerCell
                size="sm"
                player={inn.player}
                name={inn.player.web_name}
                meta={t("fplLive.ui.overview.ptsValue", "{{points}} pts", { points: pointsOf(sub.inId) })}
              />
            </div>
          );
        })}
        {promoted && byId.get(promoted.toId)?.player && (
          <div className="px-4 py-2.5 text-xs text-theme-text-secondary sm:px-5">
            {t("fplLive.ui.overview.captainPromoted", "{{name}} took the armband", {
              name: byId.get(promoted.toId)!.player!.web_name,
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Squad output                                                        */
/* ------------------------------------------------------------------ */

export function TeamStatsPanel({ teamTotals }: { teamTotals?: OverviewTeamTotals | null }) {
  const { t } = useTranslation("fpl");
  if (!teamTotals) return null;
  const items = [
    { key: "goals", label: t("fplLive.ui.overview.goals", "Goals"), value: teamTotals.goals },
    { key: "assists", label: t("fplLive.ui.overview.assists", "Assists"), value: teamTotals.assists },
    { key: "cs", label: t("fplLive.ui.overview.cleanSheets", "Clean sheets"), value: teamTotals.clean_sheets },
    { key: "saves", label: t("fplLive.ui.overview.saves", "Saves"), value: teamTotals.saves },
    { key: "yc", label: t("fplLive.ui.overview.yellowCards", "Yellow cards"), value: teamTotals.yellow_cards },
    { key: "rc", label: t("fplLive.ui.overview.redCards", "Red cards"), value: teamTotals.red_cards },
  ];
  return (
    <Panel
      title={t("fplLive.ui.overview.teamStatsTitle", "Squad output")}
      subtitle={t("fplLive.ui.overview.teamStatsSubtitle", "All 15 players this gameweek")}
    >
      <dl className="grid grid-cols-3 gap-y-4 sm:grid-cols-6">
        {items.map((item) => (
          <div key={item.key} className="min-w-0 text-center">
            <dd className="text-xl font-semibold text-theme-heading-primary">{item.value}</dd>
            <dt className="mt-0.5 truncate text-[11px] text-theme-text-muted">{item.label}</dt>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export function OverviewHeroSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="rounded-2xl border border-theme-border bg-theme-card p-4 sm:p-5">
        <div className="h-3.5 w-28 animate-pulse rounded bg-theme-card-secondary" />
        <div className="mt-5 flex items-end justify-between">
          <div className="h-12 w-20 animate-pulse rounded-lg bg-theme-card-secondary" />
          <div className="space-y-2">
            <div className="ml-auto h-3 w-16 animate-pulse rounded bg-theme-card-secondary" />
            <div className="h-4 w-24 animate-pulse rounded bg-theme-card-secondary" />
          </div>
        </div>
        <div className="mt-5 h-1.5 w-full animate-pulse rounded-full bg-theme-card-secondary" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl border border-theme-border bg-theme-card-secondary" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Default export — the manager half of the Overview tab               */
/* ------------------------------------------------------------------ */

interface ManagerSummaryProps {
  manager?: OverviewManager;
  teamTotals?: OverviewTeamTotals | null;
  captain?: { player_id?: number; stats?: any };
  viceCaptain?: { player_id?: number; stats?: any };
  bonusAdded: boolean;
  gameweek: number;
  lastUpdated?: string;
  managerId?: number;
  loading?: boolean;
  /** Optional extras (wired by LiveOverview). */
  entryHistory?: OverviewEntryHistory | null;
  teamWithStats?: OverviewSquadPlayer[];
  activeChip?: string | null;
  gameweekStatus?: OverviewGameweekStatus | null;
}

const ManagerSummary = React.memo(function ManagerSummary({
  manager,
  teamTotals,
  bonusAdded,
  gameweek,
  loading = false,
  entryHistory,
  teamWithStats,
  activeChip,
  gameweekStatus,
}: ManagerSummaryProps) {
  const { t } = useTranslation("fpl");

  if (!manager || !teamTotals) {
    return loading ? (
      <OverviewHeroSkeleton />
    ) : (
      <Panel>
        <p className="py-6 text-center text-sm text-theme-text-muted">
          {t("fplLive.ui.overview.empty", "Load a team to see the overview")}
        </p>
      </Panel>
    );
  }

  const numbers = deriveOverviewNumbers({
    manager,
    teamTotals,
    entryHistory,
    gameweekStatus,
    bonusAdded,
    activeChip,
  });

  return (
    <div
      className={cx("space-y-2 transition-opacity sm:space-y-3", loading && "opacity-60")}
      aria-busy={loading || undefined}
    >
      <OverviewHero
        manager={manager}
        numbers={numbers}
        gameweek={gameweek}
        bonusAdded={bonusAdded}
        gameweekStatus={gameweekStatus}
      />
      <OverviewKpis numbers={numbers} />
      <AutoSubsPanel teamTotals={teamTotals} teamWithStats={teamWithStats} />
      <TeamStatsPanel teamTotals={teamTotals} />
    </div>
  );
});

export default ManagerSummary;
