"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Crown, RefreshCw } from "lucide-react";

import { getPlayerTeamColors } from "@/lib/team-colors";
import {
  Bar,
  Chip,
  Delta,
  EmptyState,
  GhostButton,
  ListRow,
  Panel,
  PlayerCell,
  Segmented,
  SkeletonRows,
  StatTile,
  POSITION_SHORT,
  cx,
  formatCompact,
} from "./live/ui";

interface CaptainsAnalysisProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface PlayerRef {
  player_id: number;
  web_name: string;
  team: number;
  team_code?: number;
  element_type: number;
  points: number;
}

interface CaptainEntry extends PlayerRef {
  ownership_pct: number;
  captain_count?: number;
  /** Share of the sampled top managers who captained him. */
  captain_pct?: number;
  captain_pct_top10?: number;
  tc_count?: number;
  effective_points: number;
}

interface ChipUsage {
  wildcard: number;
  freehit: number;
  benchboost: number;
  triplecaptain: number;
}

interface CaptainsData {
  topCaptains: CaptainEntry[];
  chipUsage: ChipUsage;
  sample?: { size: number; top10_size: number; chips: ChipUsage } | null;
  overall?: {
    ranked_count: number;
    most_captained: PlayerRef | null;
  };
}

type Tier = "top10" | "top100";

const CHIPS: Array<{ key: keyof ChipUsage; labelKey: string; fallback: string }> = [
  { key: "wildcard", labelKey: "captains.chipWildcard", fallback: "Wildcard" },
  { key: "freehit", labelKey: "captains.chipFreeHit", fallback: "Free Hit" },
  { key: "benchboost", labelKey: "captains.chipBenchBoost", fallback: "Bench Boost" },
  { key: "triplecaptain", labelKey: "captains.chipTripleCaptain", fallback: "Triple Captain" },
];

const COLLAPSED_ROWS = 8;

const clubOf = (player: { team?: number; team_code?: number }) =>
  getPlayerTeamColors(player).shortName;

/** One of the three headline captain picks. */
function CaptainCard({
  label,
  player,
  meta,
  points,
  highlight = false,
}: {
  label: string;
  player: PlayerRef;
  meta: React.ReactNode;
  points: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "min-w-0 rounded-xl border px-3 py-2.5",
        highlight
          ? "border-violet-500/30 bg-violet-500/[0.06]"
          : "border-theme-border bg-theme-card-secondary"
      )}
    >
      <div className="truncate text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
        {label}
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <PlayerCell player={player} name={player.web_name} meta={meta} size="sm" />
        <span className="shrink-0 text-xl font-semibold leading-none tabular-nums text-theme-heading-primary">
          {points}
        </span>
      </div>
    </div>
  );
}

const CaptainsAnalysis = React.memo(function CaptainsAnalysis({
  gameweek,
  managerData,
}: CaptainsAnalysisProps) {
  const { t } = useTranslation("fpl");
  const [data, setData] = useState<CaptainsData | null>(null);
  // GW whose request has settled; anything else means we're still loading
  const [loadedGw, setLoadedGw] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tier, setTier] = useState<Tier>("top100");
  const [expanded, setExpanded] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!gameweek) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/fpl/captains-stats?gameweek=${gameweek}`);
        if (!response.ok) throw new Error("Failed to fetch captains data");
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || "Invalid response");
        }
        if (!cancelled) {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setLoadedGw(gameweek);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameweek, reloadKey]);

  const loading = loadedGw !== gameweek;

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  };

  // The manager's own captain, straight from the loaded team
  const own = useMemo(() => {
    const pick = (managerData?.team_with_stats ?? []).find((p: any) => p.is_captain);
    if (!pick?.player) return null;
    const points = pick.live_stats?.total_points ?? 0;
    const multiplier = pick.multiplier || 2;
    return {
      ref: {
        player_id: pick.player_id,
        web_name: pick.player.web_name,
        team: pick.player.team,
        team_code: pick.player.team_code,
        element_type: pick.player.element_type,
        points,
      } as PlayerRef,
      multiplier,
      total: points * multiplier,
    };
  }, [managerData?.team_with_stats]);

  const rows = useMemo(() => {
    if (!data) return [];
    const pctOf = (c: CaptainEntry) =>
      (tier === "top10" ? c.captain_pct_top10 : c.captain_pct) ?? 0;
    return data.topCaptains
      .filter((c) => pctOf(c) > 0)
      .map((c) => ({ ...c, pct: pctOf(c) }))
      .sort((a, b) => b.pct - a.pct || b.points - a.points);
  }, [data, tier]);

  const title = t("fplLive.ui.captains.title", "Captains · GW{{gw}}", { gw: gameweek });
  const refreshButton = (
    <GhostButton
      onClick={handleRefresh}
      disabled={refreshing}
      title={t("refresh", "Refresh")}
    >
      <RefreshCw className={cx(refreshing && "animate-spin")} />
    </GhostButton>
  );

  if (loading) {
    return (
      <Panel title={title} flush>
        <SkeletonRows rows={7} />
      </Panel>
    );
  }

  if (error || !data) {
    return (
      <Panel title={title}>
        <EmptyState
          icon={<Crown />}
          title={t("captains.error", "Error loading captain data")}
          text={error ? t("fplLive.ui.pages.retryHint", "Check your connection and try again.") : undefined}
          action={
            <GhostButton onClick={handleRefresh}>
              <RefreshCw />
              {t("fplLive.ui.captains.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  const sample = data.sample ?? null;
  const mostCaptained = data.overall?.most_captained ?? null;
  const topPick = sample ? rows[0] ?? null : null;
  const rankedCount = data.overall?.ranked_count ?? 0;
  const tierSize = sample ? (tier === "top10" ? sample.top10_size : sample.size) : 0;
  const shownRows = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  const vsCrowd = own && mostCaptained && own.ref.player_id !== mostCaptained.player_id
    ? own.total - mostCaptained.points * 2
    : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Headline picks */}
      <Panel
        title={title}
        subtitle={t(
          "fplLive.ui.captains.subtitle",
          "Your captain against the whole game and the top managers"
        )}
        action={refreshButton}
      >
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {own && (
            <CaptainCard
              highlight
              label={t("fplLive.ui.captains.yourCaptain", "Your captain")}
              player={own.ref}
              points={own.total}
              meta={
                <>
                  <span className="shrink-0">{clubOf(own.ref)}</span>
                  <span className="shrink-0 tabular-nums">
                    {own.ref.points}×{own.multiplier}
                  </span>
                  {vsCrowd !== 0 && (
                    <Delta value={vsCrowd} className="text-[11px]" />
                  )}
                </>
              }
            />
          )}
          {mostCaptained && (
            <CaptainCard
              label={t("fplLive.ui.captains.mostCaptained", "Most captained · all")}
              player={mostCaptained}
              points={mostCaptained.points * 2}
              meta={
                <>
                  <span className="shrink-0">{clubOf(mostCaptained)}</span>
                  <span className="shrink-0 tabular-nums">{mostCaptained.points}×2</span>
                </>
              }
            />
          )}
          {topPick && sample && (
            <CaptainCard
              label={t("fplLive.ui.captains.topPick", "Top {{n}} pick", { n: tierSize })}
              player={topPick}
              points={topPick.points * 2}
              meta={
                <>
                  <span className="shrink-0">{clubOf(topPick)}</span>
                  <span className="shrink-0 tabular-nums">{topPick.pct}%</span>
                </>
              }
            />
          )}
        </div>
      </Panel>

      {/* Top managers' captains */}
      <Panel
        flush
        title={t("fplLive.ui.captains.listTitle", "Top managers' captains")}
        subtitle={
          sample
            ? t(
                "fplLive.ui.captains.listSubtitle",
                "% = share of the top {{n}} in the overall standings who captained him",
                { n: tierSize }
              )
            : undefined
        }
      >
        {!sample || rows.length === 0 ? (
          <EmptyState
            icon={<Crown />}
            title={t("fplLive.ui.captains.noSample", "No captain picks yet")}
            text={t(
              "fplLive.ui.captains.noSampleText",
              "Top managers' captains become public after the GW{{gw}} deadline.",
              { gw: gameweek }
            )}
          />
        ) : (
          <>
            <div className="px-4 pb-3 sm:px-5">
              <Segmented<Tier>
                value={tier}
                onChange={(value) => {
                  setTier(value);
                  setExpanded(false);
                }}
                options={[
                  { value: "top10", label: `Top ${sample.top10_size}` },
                  { value: "top100", label: `Top ${sample.size}` },
                ]}
              />
            </div>

            <div className="flex items-center gap-3 border-t border-theme-border px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-theme-text-muted sm:px-5">
              <span className="w-4 shrink-0">#</span>
              <span className="min-w-0 flex-1">{t("captains.player", "Player")}</span>
              <span className="w-20 shrink-0 sm:w-32">
                {t("fplLive.ui.captains.captaincy", "Captaincy")}
              </span>
              <span className="w-8 shrink-0 text-right">×2</span>
            </div>

            <div className="divide-y divide-theme-border border-t border-theme-border">
              {shownRows.map((captain, index) => {
                const isOwn = own?.ref.player_id === captain.player_id;
                return (
                  <ListRow key={captain.player_id} highlighted={isOwn}>
                    <span className="w-4 shrink-0 text-xs tabular-nums text-theme-text-muted">
                      {index + 1}
                    </span>
                    <PlayerCell
                      player={captain}
                      name={captain.web_name}
                      badges={
                        isOwn ? (
                          <Chip tone="accent">{t("fplLive.ui.captains.yours", "Yours")}</Chip>
                        ) : undefined
                      }
                      meta={
                        <>
                          <span className="shrink-0">{clubOf(captain)}</span>
                          <span className="shrink-0 text-theme-border-strong">·</span>
                          <span className="shrink-0">{POSITION_SHORT[captain.element_type]}</span>
                          {(captain.tc_count ?? 0) > 0 && (
                            <span
                              className="shrink-0"
                              title={t(
                                "fplLive.ui.captains.tcTitle",
                                "Triple captained by {{n}} top managers",
                                { n: captain.tc_count }
                              )}
                            >
                              <Chip>TC {captain.tc_count}</Chip>
                            </span>
                          )}
                        </>
                      }
                    />
                    <div className="w-20 shrink-0 sm:w-32">
                      <div className="mb-1 text-xs font-semibold tabular-nums text-theme-heading-primary">
                        {captain.pct}%
                      </div>
                      <Bar value={captain.pct} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-base font-semibold tabular-nums text-theme-heading-primary">
                      {captain.points * 2}
                    </span>
                  </ListRow>
                );
              })}
            </div>

            {rows.length > COLLAPSED_ROWS && (
              <div className="flex justify-center border-t border-theme-border px-4 py-3">
                <GhostButton onClick={() => setExpanded((value) => !value)}>
                  {expanded
                    ? t("fplLive.ui.captains.showLess", "Show less")
                    : t("fplLive.ui.captains.showAll", "Show all ({{n}})", { n: rows.length })}
                </GhostButton>
              </div>
            )}
          </>
        )}
      </Panel>

      {/* Chips */}
      <Panel
        title={t("fplLive.ui.captains.chipsTitle", "Chips in GW{{gw}}", { gw: gameweek })}
        subtitle={t("fplLive.ui.captains.chipsSubtitle", "Across all managers")}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {CHIPS.map(({ key, labelKey, fallback }) => {
            const usage = data.chipUsage?.[key] ?? 0;
            const share = rankedCount > 0 ? ((usage / rankedCount) * 100).toFixed(1) : null;
            const hintParts = [
              share !== null
                ? t("fplLive.ui.captains.chipShare", "{{pct}}% of managers", { pct: share })
                : null,
              sample
                ? t("fplLive.ui.captains.chipTop", "top {{n}}: {{used}}", {
                    n: sample.size,
                    used: sample.chips[key],
                  })
                : null,
            ].filter(Boolean);
            return (
              <StatTile
                key={key}
                label={t(labelKey, fallback)}
                value={formatCompact(usage)}
                hint={hintParts.length ? hintParts.join(" · ") : undefined}
              />
            );
          })}
        </div>
      </Panel>
    </div>
  );
});

export default CaptainsAnalysis;
