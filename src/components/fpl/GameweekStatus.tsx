"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Crown, Gem, LineChart, Users } from "lucide-react";

import { getPlayerTeamColors } from "@/lib/team-colors";
import type { FPLGameweekStatus } from "@/types/fpl";
import {
  Chip,
  Delta,
  EmptyState,
  ListRow,
  Panel,
  PlayerCell,
  RoleBadge,
  SectionLabel,
  SkeletonRows,
  cx,
  formatCompact,
  formatRank,
} from "@/components/fpl/live/ui";
import RankTrendChart from "@/components/fpl/live/RankTrendChart";
import {
  CHIP_SHORT,
  type OverviewCaptainAnalysis,
  type OverviewDifferential,
  type OverviewGameweekStatus,
  type OverviewSquadPlayer,
  type OverviewTeamTotals,
} from "@/components/fpl/live/overview-types";

type KitSource = { team?: number | null; team_code?: number | null; element_type?: number | null };

/** Adapt API kit fields to the PlayerJersey `player` shape. */
const kitOf = (p: KitSource) => ({
  team: p.team ?? undefined,
  team_code: p.team_code ?? undefined,
  element_type: p.element_type ?? undefined,
});

const shortOf = (p: KitSource) => getPlayerTeamColors(kitOf(p)).shortName;

/* ------------------------------------------------------------------ */
/* You vs the field                                                    */
/* ------------------------------------------------------------------ */

export function FieldComparisonPanel({
  yourPoints,
  average,
  highest,
  gameweek,
}: {
  yourPoints: number;
  average: number | null;
  highest: number | null;
  gameweek: number;
}) {
  const { t } = useTranslation("fpl");
  const scaleMax = Math.max(highest ?? 0, yourPoints, average ?? 0, 1);
  const youPct = (yourPoints / scaleMax) * 100;
  const avgPct = average !== null ? (average / scaleMax) * 100 : null;
  const diff = average !== null ? yourPoints - average : null;

  const figures = [
    {
      key: "you",
      label: t("fplLive.ui.overview.you", "You"),
      value: yourPoints,
      mark: <span className="h-0.5 w-3 rounded-full bg-violet-500" />,
    },
    {
      key: "avg",
      label: t("fplLive.ui.overview.average", "Average"),
      value: average ?? "—",
      mark: <span className="h-3 w-0.5 rounded-full bg-theme-heading-primary" />,
    },
    { key: "top", label: t("fplLive.ui.overview.highest", "Highest"), value: highest ?? "—", mark: null },
  ];

  return (
    <Panel
      title={t("fplLive.ui.overview.fieldTitle", "You vs the field")}
      subtitle={t("fplLive.ui.overview.fieldSubtitle", "GW{{gw}} points against every manager", { gw: gameweek })}
    >
      <dl className="grid grid-cols-3 gap-2">
        {figures.map((f) => (
          <div key={f.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] text-theme-text-muted">
              {f.mark}
              {f.label}
            </dt>
            <dd className="mt-0.5 text-xl font-semibold text-theme-heading-primary">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-3" aria-hidden="true">
        <div className="h-2 overflow-hidden rounded-full bg-violet-500/15">
          <div className="h-full rounded-full bg-violet-500 transition-[width] duration-500" style={{ width: `${youPct}%` }} />
        </div>
        {avgPct !== null && (
          <span
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-theme-heading-primary ring-2 ring-[color:var(--theme-card)]"
            style={{ left: `calc(${avgPct}% - 1px)` }}
          />
        )}
      </div>

      {diff !== null && (
        <p className="mt-2.5 text-xs text-theme-text-muted">
          {diff === 0 ? (
            t("fplLive.ui.overview.atAverage", "Exactly on the average")
          ) : (
            <>
              <Delta value={diff} />{" "}
              {diff > 0
                ? t("fplLive.ui.overview.aboveAverage", "above average")
                : t("fplLive.ui.overview.belowAverage", "below average")}
            </>
          )}
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Captaincy                                                           */
/* ------------------------------------------------------------------ */

export function CaptaincyPanel({
  analysis,
  teamWithStats,
  teamTotals,
}: {
  analysis: OverviewCaptainAnalysis | null;
  teamWithStats?: OverviewSquadPlayer[];
  teamTotals?: OverviewTeamTotals | null;
}) {
  const { t } = useTranslation("fpl");
  if (!analysis) return null;

  const multiplier = analysis.multiplier ?? 2;
  const base = analysis.base_points ?? Math.round(analysis.points / multiplier);
  const squad = teamWithStats ?? [];
  const captainEntry = squad.find((p) => p.player_id === analysis.player_id);
  const vice = squad.find((p) => p.is_vice_captain);
  const promoted = teamTotals?.with_autosubs?.captain_promoted ?? null;
  const template = analysis.template_captain ?? null;
  const sameAsTemplate = template?.player_id === analysis.player_id;

  const minutesText = (entry?: OverviewSquadPlayer) =>
    entry?.live_stats ? `${entry.live_stats.minutes}'` : null;

  return (
    <Panel
      icon={<Crown />}
      title={t("fplLive.ui.overview.captaincyTitle", "Captaincy")}
      subtitle={t("fplLive.ui.overview.captaincySubtitle", "Your armband against the most captained player")}
      flush
    >
      <div className="divide-y divide-theme-border border-t border-theme-border">
        <ListRow>
          <PlayerCell
            player={kitOf(analysis)}
            name={analysis.web_name}
            badges={<RoleBadge role={multiplier === 3 ? "TC" : "C"} />}
            meta={
              <>
                {shortOf(analysis)}
                {minutesText(captainEntry) && <span>· {minutesText(captainEntry)}</span>}
                <span>
                  · {base} × {multiplier}
                </span>
              </>
            }
          />
          <span className="shrink-0 text-base font-semibold tabular-nums text-theme-heading-primary">
            {analysis.points}
          </span>
        </ListRow>

        {vice?.player && (
          <ListRow>
            <PlayerCell
              player={vice.player}
              name={vice.player.web_name}
              badges={
                <>
                  <RoleBadge role="V" />
                  {promoted?.toId === vice.player_id && (
                    <Chip tone="accent">{t("fplLive.ui.overview.tookArmband", "took the armband")}</Chip>
                  )}
                </>
              }
              meta={
                <>
                  {getPlayerTeamColors(vice.player).shortName}
                  {minutesText(vice) && <span>· {minutesText(vice)}</span>}
                </>
              }
            />
            <span className="shrink-0 text-base font-semibold tabular-nums text-theme-text-secondary">
              {vice.live_stats?.total_points ?? 0}
            </span>
          </ListRow>
        )}

        {template && !sameAsTemplate && (
          <div>
            <SectionLabel>{t("fplLive.ui.overview.templateCaptain", "Most captained")}</SectionLabel>
            <ListRow className="pt-1">
              <PlayerCell
                player={kitOf(template)}
                name={template.web_name}
                meta={
                  <>
                    {shortOf(template)}
                    <span>
                      · {template.base_points} × 2
                    </span>
                  </>
                }
              />
              <span className="shrink-0 text-base font-semibold tabular-nums text-theme-text-secondary">
                {template.points}
              </span>
            </ListRow>
          </div>
        )}

        {template && (
          <div className="px-4 py-3 text-xs sm:px-5">
            {sameAsTemplate ? (
              <span className="text-theme-text-secondary">
                {t("fplLive.ui.overview.sameAsTemplate", "Same pick as most managers — no rank swing from the armband")}
              </span>
            ) : analysis.points_vs_template !== null && analysis.points_vs_template !== undefined ? (
              analysis.points_vs_template === 0 ? (
                <span className="text-theme-text-secondary">
                  {t("fplLive.ui.overview.levelWithTemplate", "Level with the most captained player")}
                </span>
              ) : (
                <span className="text-theme-text-muted">
                  <Delta value={analysis.points_vs_template} />{" "}
                  {t("fplLive.ui.overview.vsTemplate", "vs the most captained player")}
                </span>
              )
            ) : null}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Rank trend                                                          */
/* ------------------------------------------------------------------ */

export function RankTrendPanel({
  history,
  chipsPlayed,
}: {
  history: NonNullable<OverviewGameweekStatus["rank_history"]>;
  chipsPlayed?: OverviewGameweekStatus["chips_played"];
}) {
  const { t } = useTranslation("fpl");
  const [showAll, setShowAll] = useState(false);
  if (!history.length) return null;

  const chipByEvent = new Map((chipsPlayed ?? []).map((c) => [c.event, CHIP_SHORT[c.name] ?? c.name]));
  const rows = history
    .map((h, i) => ({
      ...h,
      change: i > 0 && history[i - 1].overall_rank > 0 && h.overall_rank > 0 ? history[i - 1].overall_rank - h.overall_rank : null,
    }))
    .reverse();
  const visible = showAll ? rows : rows.slice(0, 5);
  const pts = (points: number) => t("fplLive.ui.overview.ptsValue", "{{points}} pts", { points });

  return (
    <Panel
      icon={<LineChart />}
      title={t("fplLive.ui.overview.rankTrendTitle", "Rank trend")}
      subtitle={t("fplLive.ui.overview.rankTrendSubtitle", "Overall rank after each gameweek")}
      flush
    >
      <div className="px-4 pb-2 sm:px-5">
        <RankTrendChart
          data={history}
          ariaLabel={t("fplLive.ui.overview.rankTrendTitle", "Rank trend")}
          scaleNote={t("fplLive.ui.overview.logScale", "log scale")}
          formatPoints={pts}
        />
      </div>

      {/* Table twin of the chart — every value readable without hovering */}
      <div className="border-t border-theme-border">
        <div className="grid grid-cols-[1fr_3rem_minmax(0,6.5rem)_4.5rem] gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-theme-text-muted sm:px-5">
          <span>{t("fplLive.ui.overview.colGw", "GW")}</span>
          <span className="text-right">{t("fplLive.ui.overview.colPoints", "Pts")}</span>
          <span className="text-right">{t("fplLive.ui.overview.colRank", "Overall")}</span>
          <span className="text-right">{t("fplLive.ui.overview.colChange", "Change")}</span>
        </div>
        <div className="divide-y divide-theme-border">
          {visible.map((row) => (
            <div
              key={row.event}
              className="grid grid-cols-[1fr_3rem_minmax(0,6.5rem)_4.5rem] items-center gap-2 px-4 py-2 text-xs tabular-nums sm:px-5"
            >
              <span className="flex items-center gap-1.5 font-medium text-theme-heading-secondary">
                GW{row.event}
                {chipByEvent.get(row.event) && <Chip tone="accent">{chipByEvent.get(row.event)}</Chip>}
              </span>
              <span className="text-right text-theme-text-secondary">{row.points}</span>
              <span className="truncate text-right font-medium text-theme-heading-primary">
                {formatRank(row.overall_rank)}
              </span>
              <span className="text-right">
                {row.change === null || row.change === 0 ? (
                  <span className="text-theme-text-muted">—</span>
                ) : (
                  <span
                    className={cx(
                      "inline-flex items-center gap-0.5 font-semibold",
                      row.change > 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    <span className="text-[0.7em]">{row.change > 0 ? "▲" : "▼"}</span>
                    {formatCompact(Math.abs(row.change))}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        {rows.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full border-t border-theme-border px-4 py-2.5 text-xs font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary sm:px-5"
          >
            {showAll
              ? t("fplLive.ui.overview.showLess", "Show less")
              : t("fplLive.ui.overview.showAllGws", "Show all {{count}} gameweeks", { count: rows.length })}
          </button>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Differentials & template players                                    */
/* ------------------------------------------------------------------ */

function OwnershipRow({ player, gain }: { player: OverviewDifferential; gain?: boolean }) {
  const { t } = useTranslation("fpl");
  const multiplier = player.multiplier ?? 1;
  return (
    <ListRow>
      <PlayerCell
        player={kitOf(player)}
        name={player.web_name}
        badges={multiplier > 1 ? <RoleBadge role={multiplier === 3 ? "TC" : "C"} /> : null}
        meta={
          <>
            {shortOf(player)}
            <span>
              ·{" "}
              {t("fplLive.ui.overview.owned", "{{pct}}% owned", {
                pct: player.ownership_percentage.toFixed(1),
              })}
            </span>
          </>
        }
      />
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums text-theme-heading-primary">
          {t("fplLive.ui.overview.ptsValue", "{{points}} pts", { points: player.points })}
        </div>
        {gain && player.impact_percentage > 0 && (
          <div className="text-[11px] font-medium tabular-nums text-emerald-500">
            +{player.impact_percentage.toFixed(1)}
          </div>
        )}
      </div>
    </ListRow>
  );
}

export function DifferentialsPanel({ items }: { items: OverviewDifferential[] }) {
  const { t } = useTranslation("fpl");
  return (
    <Panel
      icon={<Gem />}
      title={t("fplLive.ui.overview.differentialsTitle", "Differentials")}
      subtitle={t("fplLive.ui.overview.differentialsSubtitle", "Low-owned players who gained you ground")}
      flush
    >
      {items.length ? (
        <>
          <div className="divide-y divide-theme-border border-t border-theme-border">
            {items.map((p) => (
              <OwnershipRow key={p.player_id} player={p} gain />
            ))}
          </div>
          <p className="border-t border-theme-border px-4 py-2.5 text-[11px] text-theme-text-muted sm:px-5">
            {t(
              "fplLive.ui.overview.gainHint",
              "Green = approximate points gained on the average manager (points × share who don't own him)."
            )}
          </p>
        </>
      ) : (
        <p className="border-t border-theme-border px-4 py-4 text-xs text-theme-text-muted sm:px-5">
          {t("fplLive.ui.overview.noDifferentials", "No low-owned player returned points this gameweek.")}
        </p>
      )}
    </Panel>
  );
}

export function TemplatePlayersPanel({ items }: { items: OverviewDifferential[] }) {
  const { t } = useTranslation("fpl");
  if (!items.length) return null;
  return (
    <Panel
      icon={<Users />}
      title={t("fplLive.ui.overview.templateTitle", "Template players")}
      subtitle={t("fplLive.ui.overview.templateSubtitle", "Most managers own them, so they barely move your rank")}
      flush
    >
      <div className="divide-y divide-theme-border border-t border-theme-border">
        {items.map((p) => (
          <OwnershipRow key={p.player_id} player={p} />
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export function GameweekStatusSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-2xl border border-theme-border bg-theme-card p-4 sm:p-5">
        <div className="h-3.5 w-32 animate-pulse rounded bg-theme-card-secondary" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-theme-card-secondary" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-card">
        <SkeletonRows rows={3} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Default export — the gameweek half of the Overview tab              */
/* ------------------------------------------------------------------ */

interface GameweekStatusProps {
  gameweekStatus?: OverviewGameweekStatus | FPLGameweekStatus;
  gameweek: number;
  loading?: boolean;
  /** Optional extras (wired by LiveOverview). */
  teamWithStats?: OverviewSquadPlayer[];
  teamTotals?: OverviewTeamTotals | null;
  /** Live GW points to compare against the average (defaults to FPL's figure). */
  yourPoints?: number;
}

const GameweekStatus = React.memo(function GameweekStatus({
  gameweekStatus,
  gameweek,
  loading = false,
  teamWithStats,
  teamTotals,
  yourPoints,
}: GameweekStatusProps) {
  const { t } = useTranslation("fpl");
  const status = gameweekStatus as OverviewGameweekStatus | undefined;

  if (!status) {
    return loading ? (
      <GameweekStatusSkeleton />
    ) : (
      <Panel>
        <EmptyState
          title={t("fplLive.ui.overview.statusUnavailable", "Gameweek status isn't available yet")}
        />
      </Panel>
    );
  }

  return (
    <div className={cx("space-y-3 transition-opacity sm:space-y-4", loading && "opacity-60")} aria-busy={loading || undefined}>
      <FieldComparisonPanel
        yourPoints={yourPoints ?? status.gameweek_points}
        average={status.average_score || null}
        highest={status.highest_score || null}
        gameweek={gameweek}
      />
      <CaptaincyPanel analysis={status.captain_analysis} teamWithStats={teamWithStats} teamTotals={teamTotals} />
      {status.rank_history && status.rank_history.length > 0 && (
        <RankTrendPanel history={status.rank_history} chipsPlayed={status.chips_played} />
      )}
      <DifferentialsPanel items={status.differentials} />
      <TemplatePlayersPanel items={status.threats} />
    </div>
  );
});

export default GameweekStatus;
