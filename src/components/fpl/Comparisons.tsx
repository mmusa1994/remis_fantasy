"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Check, Layers, Minus, RefreshCw, Scale, Users } from "lucide-react";

import {
  Delta,
  EmptyState,
  GhostButton,
  ListRow,
  Panel,
  PlayerCell,
  PosTag,
  SkeletonRows,
  StatTile,
  cx,
  formatCompact,
  formatNumber,
  formatRank,
} from "./live/ui";

interface ComparisonsProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface Benchmark {
  avgPoints: number;
  yourPoints: number;
  diff: number;
  sampleSize?: number;
}

interface RankCutoff {
  key: string;
  targetRank: number;
  rank: string;
  pointsNeeded: number;
  yourPoints: number;
  gap: number;
}

interface TemplatePlayer {
  id: number;
  web_name: string;
  team?: number;
  team_code?: number;
  element_type?: number;
  ownership: number;
  points: number;
  owned: boolean;
}

type Position = "GK" | "DEF" | "MID" | "FWD";

interface ComparisonsData {
  gameweek: number;
  you?: {
    gwPoints: number;
    transferCost: number;
    gwRank: number | null;
    gwPercentile: number | null;
    totalPoints: number;
    overallRank: number | null;
    overallPercentile: number | null;
    totalPlayers: number;
  };
  vsBenchmarks: {
    overall: Benchmark | null;
    top100k: Benchmark | null;
    top10k: Benchmark | null;
    highest?: Benchmark | null;
  };
  ranksNeeded: RankCutoff[];
  standingsUpdatedAt?: string | null;
  teamRatings: {
    templatePct: number | null;
    sampleSize?: number;
    byPosition: Record<Position, { yours: number; top10k: number | null }>;
  };
  template?: TemplatePlayer[];
}

const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];
const POSITION_TYPE: Record<Position, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };

const localeFor = (lang?: string) => (lang?.startsWith("bs") ? "sr-Latn-BA" : "en-GB");

const formatPct = (pct: number | null | undefined) => {
  if (typeof pct !== "number") return null;
  if (pct < 0.1) return "<0.1";
  return pct < 10 ? pct.toFixed(1) : Math.round(pct).toString();
};

const Comparisons = React.memo(function Comparisons({ managerId, gameweek }: ComparisonsProps) {
  const { t, i18n } = useTranslation("fpl");
  const locale = localeFor(i18n.language);
  const [data, setData] = useState<ComparisonsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparisons = useCallback(async () => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/fpl/comparisons?managerId=${managerId}&gameweek=${gameweek}`
      );
      if (!response.ok) throw new Error("Failed to fetch comparisons data");
      const result = await response.json();
      if (result.success && result.data) setData(result.data);
      else throw new Error(result.error || "Unknown error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [managerId, gameweek]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  const title = t("fplLive.ui.compare.title", "How you compare");
  const subtitle = t("fplLive.ui.compare.subtitle", "GW{{gw}} against the rest of the game", {
    gw: gameweek,
  });

  if (!managerId) {
    return (
      <Panel>
        <EmptyState
          icon={<Scale />}
          title={t("fplLive.ui.compare.noManager", "Load your team to see comparisons")}
        />
      </Panel>
    );
  }

  if (loading && !data) {
    return (
      <Panel title={title} subtitle={subtitle} icon={<Scale />} flush>
        <SkeletonRows rows={7} />
      </Panel>
    );
  }

  if (error && !data) {
    return (
      <Panel title={title} icon={<Scale />}>
        <EmptyState
          icon={<Scale />}
          title={t("fplLive.ui.compare.error", "Couldn't load comparisons")}
          text={t("fplLive.ui.pages.retryHint", "Check your connection and try again.")}
          action={
            <GhostButton onClick={fetchComparisons}>
              <RefreshCw />
              {t("fplLive.ui.compare.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <BenchmarksPanel
        data={data}
        title={title}
        subtitle={subtitle}
        loading={loading}
        onRefresh={fetchComparisons}
      />
      <CutoffsPanel data={data} locale={locale} />
      <PositionsPanel data={data} />
      <TemplatePanel data={data} />
      <p className="px-1 text-[11px] leading-snug text-theme-text-muted">
        {t(
          "fplLive.ui.compare.note",
          "Top 10K and Top 100K figures are estimates from an evenly spread sample of managers."
        )}
      </p>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* You vs gameweek averages                                            */
/* ------------------------------------------------------------------ */

function BenchmarksPanel({
  data,
  title,
  subtitle,
  loading,
  onRefresh,
}: {
  data: ComparisonsData;
  title: string;
  subtitle: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation("fpl");
  const you = data.you;
  const b = data.vsBenchmarks;
  const yourPoints = you?.gwPoints ?? b.overall?.yourPoints ?? 0;

  const rows = [
    {
      key: "overall",
      label: t("fplLive.ui.compare.avgAll", "All managers"),
      hint: t("fplLive.ui.compare.official", "official FPL average"),
      bench: b.overall,
    },
    {
      key: "top100k",
      label: t("fplLive.ui.compare.avgTop100k", "Top 100K"),
      hint: b.top100k?.sampleSize
        ? t("fplLive.ui.compare.sample", "sample of {{n}} managers", { n: b.top100k.sampleSize })
        : undefined,
      bench: b.top100k,
    },
    {
      key: "top10k",
      label: t("fplLive.ui.compare.avgTop10k", "Top 10K"),
      hint: b.top10k?.sampleSize
        ? t("fplLive.ui.compare.sample", "sample of {{n}} managers", { n: b.top10k.sampleSize })
        : undefined,
      bench: b.top10k,
    },
    {
      key: "highest",
      label: t("fplLive.ui.compare.highest", "Highest score"),
      hint: undefined,
      bench: b.highest ?? null,
    },
  ].filter((row): row is typeof row & { bench: Benchmark } => !!row.bench);

  // One scale for every row so the bars can be compared with each other.
  const scale = Math.max(yourPoints, ...rows.map((r) => r.bench.avgPoints), 1);

  const topPct = (pct: number | null | undefined) => {
    const formatted = formatPct(pct);
    return formatted ? t("fplLive.ui.compare.topPct", "top {{pct}}%", { pct: formatted }) : null;
  };

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      icon={<Scale />}
      action={
        <GhostButton onClick={onRefresh} disabled={loading} title={t("fplLive.refresh", "Refresh")}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{t("fplLive.refresh", "Refresh")}</span>
        </GhostButton>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label={t("fplLive.ui.compare.gwPoints", "GW{{gw}} points", { gw: data.gameweek })}
          value={yourPoints}
          hint={
            you?.gwRank
              ? [formatRank(you.gwRank), topPct(you.gwPercentile)].filter(Boolean).join(" · ")
              : undefined
          }
        />
        <StatTile
          label={t("fplLive.ui.compare.overallRank", "Overall rank")}
          value={formatRank(you?.overallRank)}
          hint={[
            topPct(you?.overallPercentile),
            you?.totalPlayers
              ? t("fplLive.ui.compare.ofPlayers", "of {{n}}", { n: formatCompact(you.totalPlayers) })
              : null,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-theme-border">
        <div className="bg-theme-card-secondary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
          {t("fplLive.ui.compare.gwAverages", "Gameweek averages")}
        </div>
        <div className="divide-y divide-theme-border">
          {rows.map((row) => (
            <div key={row.key} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-theme-heading-primary">
                    {row.label}
                  </div>
                  {row.hint && (
                    <div className="truncate text-[11px] text-theme-text-muted">{row.hint}</div>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-theme-text-secondary">
                  {row.bench.avgPoints}
                </span>
                <span className="w-12 shrink-0 text-right text-xs">
                  <Delta value={yourPoints - row.bench.avgPoints} showZero />
                </span>
              </div>
              {/* Average as a bar, your score as a violet tick on the same scale */}
              <div className="relative mt-2 h-1.5 rounded-full bg-theme-card-secondary">
                <div
                  className="h-full rounded-full bg-theme-border-strong"
                  style={{ width: `${(row.bench.avgPoints / scale) * 100}%` }}
                />
                <span
                  className="absolute -top-[3px] h-3 w-[3px] -translate-x-1/2 rounded-full bg-violet-500"
                  style={{ left: `${(yourPoints / scale) * 100}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-theme-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-[3px] rounded-full bg-violet-500" />
          {t("fplLive.ui.compare.youMarker", "You")} · {yourPoints}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-theme-border-strong" />
          {t("fplLive.ui.compare.average", "Average")}
        </span>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Rank cut-offs                                                       */
/* ------------------------------------------------------------------ */

function CutoffsPanel({ data, locale }: { data: ComparisonsData; locale: string }) {
  const { t } = useTranslation("fpl");
  const cutoffs = data.ranksNeeded || [];
  if (cutoffs.length === 0) return null;

  const you = data.you;
  const yourRank = you?.overallRank ?? null;
  // "You" sits before the first cut-off whose rank is at or beyond yours.
  const youIndex =
    yourRank === null ? -1 : cutoffs.findIndex((c) => c.targetRank >= yourRank);

  const label = (c: RankCutoff) =>
    c.targetRank === 1
      ? t("fplLive.ui.compare.first", "1st place")
      : t("fplLive.ui.compare.topN", "Top {{n}}", { n: c.key.toUpperCase() });

  const updated = data.standingsUpdatedAt
    ? new Date(data.standingsUpdatedAt).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const youRow = you ? (
    <ListRow key="you" highlighted>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="h-4 w-[3px] shrink-0 rounded-full bg-violet-500" aria-hidden />
        <span className="text-sm font-semibold text-theme-heading-primary">
          {t("fplLive.ui.compare.youMarker", "You")}
        </span>
        <span className="truncate text-xs tabular-nums text-theme-text-muted">
          {formatRank(you.overallRank)}
        </span>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-theme-heading-primary">
        {formatNumber(you.totalPoints)}
        <span className="ml-1 text-[10px] font-normal text-theme-text-muted">
          {t("fplLive.ui.compare.ptsShort", "pts")}
        </span>
      </span>
      <span className="w-14 shrink-0" />
    </ListRow>
  ) : null;

  return (
    <Panel
      title={t("fplLive.ui.compare.cutoffsTitle", "Rank cut-offs")}
      subtitle={
        updated
          ? t(
              "fplLive.ui.compare.cutoffsSubtitle",
              "Total points of the manager at each rank · standings updated {{time}}",
              { time: updated }
            )
          : t(
              "fplLive.ui.compare.cutoffsSubtitleNoTime",
              "Total points of the manager at each rank"
            )
      }
      icon={<Layers />}
      flush
    >
      <div className="divide-y divide-theme-border border-t border-theme-border">
        {cutoffs.map((c, index) => (
          <React.Fragment key={c.key}>
            {index === youIndex && youRow}
            <ListRow>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="h-4 w-[3px] shrink-0 rounded-full bg-theme-border-strong" aria-hidden />
                <span className="truncate text-sm font-medium text-theme-heading-primary">
                  {label(c)}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-theme-text-secondary">
                {formatNumber(c.pointsNeeded)}
                <span className="ml-1 text-[10px] font-normal text-theme-text-muted">
                  {t("fplLive.ui.compare.ptsShort", "pts")}
                </span>
              </span>
              <span className="w-14 shrink-0 text-right text-xs">
                <Delta value={c.gap} showZero />
              </span>
            </ListRow>
          </React.Fragment>
        ))}
        {youIndex === -1 && yourRank !== null && youRow}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Points by position                                                  */
/* ------------------------------------------------------------------ */

function PositionsPanel({ data }: { data: ComparisonsData }) {
  const { t } = useTranslation("fpl");
  const byPosition = data.teamRatings?.byPosition;
  const sampleSize = data.teamRatings?.sampleSize ?? 0;
  const hasTop10k = POSITIONS.some((p) => typeof byPosition?.[p]?.top10k === "number");
  if (!byPosition || !hasTop10k) return null;

  const names: Record<Position, string> = {
    GK: t("fplLive.ui.compare.posGK", "Goalkeeper"),
    DEF: t("fplLive.ui.compare.posDEF", "Defence"),
    MID: t("fplLive.ui.compare.posMID", "Midfield"),
    FWD: t("fplLive.ui.compare.posFWD", "Attack"),
  };

  // Shared scale across the four lines, so a full bar means "most in any line".
  const scale = Math.max(
    1,
    ...POSITIONS.flatMap((p) => [byPosition[p]?.yours ?? 0, byPosition[p]?.top10k ?? 0])
  );

  return (
    <Panel
      title={t("fplLive.ui.compare.positionsTitle", "Points by line")}
      subtitle={t(
        "fplLive.ui.compare.positionsSubtitle",
        "Your team vs the Top 10K average (sample of {{n}})",
        { n: sampleSize }
      )}
      icon={<BarChart3 />}
    >
      <div className="space-y-3.5">
        {POSITIONS.map((pos) => {
          const row = byPosition[pos];
          const yours = row?.yours ?? 0;
          const top = row?.top10k ?? 0;
          const diff = Math.round((yours - top) * 10) / 10;
          return (
            <div key={pos}>
              <div className="mb-1.5 flex items-center gap-2">
                <PosTag type={POSITION_TYPE[pos]} />
                <span className="flex-1 truncate text-sm font-medium text-theme-heading-primary">
                  {names[pos]}
                </span>
                <span className="text-xs tabular-nums text-theme-text-secondary">
                  <span className="font-semibold text-theme-heading-primary">{yours}</span>
                  <span className="mx-1 text-theme-text-muted">/</span>
                  {top}
                </span>
                <span className="w-12 text-right text-xs">
                  <Delta value={diff} showZero />
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-theme-card-secondary">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width] duration-500"
                    style={{ width: `${(yours / scale) * 100}%` }}
                  />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-theme-card-secondary">
                  <div
                    className="h-full rounded-full bg-theme-border-strong transition-[width] duration-500"
                    style={{ width: `${(top / scale) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-theme-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-violet-500" />
          {t("fplLive.ui.compare.youMarker", "You")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-theme-border-strong" />
          {t("fplLive.ui.compare.avgTop10k", "Top 10K")}
        </span>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

function TemplatePanel({ data }: { data: ComparisonsData }) {
  const { t } = useTranslation("fpl");
  const template = useMemo(() => data.template || [], [data.template]);
  const pct = data.teamRatings?.templatePct;
  if (typeof pct !== "number" && template.length === 0) return null;

  const owned = template.filter((p) => p.owned).length;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((pct ?? 0) / 100) * circumference;

  return (
    <Panel
      title={t("fplLive.ui.compare.templateTitle", "Top 10K template")}
      subtitle={t(
        "fplLive.ui.compare.templateSubtitle",
        "Players most owned by Top 10K managers (sample)"
      )}
      icon={<Users />}
      flush
    >
      {typeof pct === "number" && (
        <div className="flex items-center gap-4 px-4 pb-4 sm:px-5">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                strokeWidth="6"
                className="stroke-theme-card-secondary"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="stroke-violet-500 transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-theme-heading-primary">
              {pct}%
            </span>
          </div>
          <div className="min-w-0 text-xs leading-snug text-theme-text-secondary">
            <p>
              {t(
                "fplLive.ui.compare.templateMatch",
                "On average your squad shares {{pct}}% of its players with a Top 10K team.",
                { pct }
              )}
            </p>
            {template.length > 0 && (
              <p className="mt-1 text-theme-text-muted">
                {t(
                  "fplLive.ui.compare.templateOwned",
                  "You own {{owned}} of {{total}} template players.",
                  { owned, total: template.length }
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {template.length > 0 && (
        <>
          <div className="flex items-center justify-between border-t border-theme-border bg-theme-card-secondary px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted sm:px-5">
            <span>{t("fplLive.ui.compare.player", "Player")}</span>
            <span>{t("fplLive.ui.compare.ownershipTop10k", "Top 10K ownership")}</span>
          </div>
          <div className="divide-y divide-theme-border border-t border-theme-border">
            {template.map((player) => (
              <ListRow key={player.id} className={cx(!player.owned && "opacity-90")}>
                <PlayerCell
                  name={player.web_name}
                  player={{
                    team: player.team,
                    team_code: player.team_code,
                    element_type: player.element_type,
                  }}
                  meta={
                    <>
                      <PosTag type={player.element_type} />
                      <span className="tabular-nums">
                        {t("fplLive.ui.compare.gwPts", "{{pts}} pts in GW", { pts: player.points })}
                      </span>
                    </>
                  }
                />
                <div className="flex w-20 shrink-0 items-center justify-end gap-2">
                  <span className="text-sm font-semibold tabular-nums text-theme-heading-primary">
                    {player.ownership}%
                  </span>
                  {player.owned ? (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
                      title={t("fplLive.ui.compare.owned", "In your team")}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-theme-card-secondary text-theme-text-muted"
                      title={t("fplLive.ui.compare.notOwned", "Not in your team")}
                    >
                      <Minus className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </ListRow>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export default Comparisons;
