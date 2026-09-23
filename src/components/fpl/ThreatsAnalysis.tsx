"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

import { getPlayerTeamColors } from "@/lib/team-colors";

import {
  Bar,
  Chip,
  EmptyState,
  GhostButton,
  ListRow,
  Panel,
  PlayerCell,
  PosTag,
  Segmented,
  SkeletonRows,
  StatTile,
  cx,
} from "./live/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Threat {
  player_id: number;
  web_name: string;
  team: number;
  team_code?: number;
  element_type: number;
  points: number;
  ownership_pct: number;
  effective_ownership: number;
  /** points × ownership: what the average manager banked from him. */
  impact?: number;
  threat_level: "high" | "medium" | "low";
  is_on_bench: boolean;
}

interface ThreatsData {
  threats: Threat[];
  totalThreatPoints: number;
  totalImpact?: number;
}

interface ThreatsAnalysisProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

type ThreatFilter = "all" | "high" | "medium" | "low";
type SortKey = "impact" | "points" | "ownership";

const LEVEL_TONE: Record<Threat["threat_level"], "negative" | "warning" | "neutral"> = {
  high: "negative",
  medium: "warning",
  low: "neutral",
};

const impactOf = (threat: Threat) =>
  typeof threat.impact === "number"
    ? threat.impact
    : (threat.points * threat.ownership_pct) / 100;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ThreatsAnalysis = React.memo(function ThreatsAnalysis({
  managerId,
  gameweek,
}: ThreatsAnalysisProps) {
  const { t } = useTranslation("fpl");

  const [data, setData] = useState<ThreatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ThreatFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("impact");

  const fetchThreats = useCallback(async () => {
    if (!managerId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/fpl/threats?managerId=${managerId}&gameweek=${gameweek}`
      );
      if (!res.ok) throw new Error("Failed to fetch threats data");

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || "Failed to fetch threats data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [managerId, gameweek]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  const threats = useMemo(
    () => (Array.isArray(data?.threats) ? data!.threats : []),
    [data]
  );

  const counts = useMemo(
    () => ({
      all: threats.length,
      high: threats.filter((x) => x.threat_level === "high").length,
      medium: threats.filter((x) => x.threat_level === "medium").length,
      low: threats.filter((x) => x.threat_level === "low").length,
    }),
    [threats]
  );

  const visible = useMemo(() => {
    const list =
      filter === "all" ? threats : threats.filter((x) => x.threat_level === filter);
    return [...list].sort((a, b) => {
      if (sortBy === "points") return b.points - a.points;
      if (sortBy === "ownership") return b.ownership_pct - a.ownership_pct;
      return impactOf(b) - impactOf(a);
    });
  }, [threats, filter, sortBy]);

  const totalImpact = useMemo(
    () =>
      typeof data?.totalImpact === "number"
        ? data.totalImpact
        : threats.reduce((sum, x) => sum + impactOf(x), 0),
    [data, threats]
  );

  const title = t("threats.title", "Threats Analysis");
  const subtitle = t(
    "fplLive.ui.threats.subtitle",
    "Players you don't own who scored. Impact = points × ownership: what the average manager gained from them."
  );

  if (!managerId) {
    return (
      <Panel title={title}>
        <EmptyState
          icon={<ShieldAlert />}
          title={t("threats.noManager", "Load your team to see threats")}
        />
      </Panel>
    );
  }

  if (loading && !data) {
    return (
      <Panel title={title} subtitle={subtitle} flush>
        <SkeletonRows rows={7} />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title={title}>
        <EmptyState
          icon={<ShieldAlert />}
          title={t("threats.error", "Error loading threats data")}
          text={t("fplLive.ui.pages.retryHint", "Check your connection and try again.")}
          action={
            <GhostButton onClick={fetchThreats}>
              <RefreshCw />
              {t("fplLive.ui.threats.retry", "Try again")}
            </GhostButton>
          }
        />
      </Panel>
    );
  }

  if (!threats.length) {
    return (
      <Panel title={title}>
        <EmptyState
          icon={<ShieldCheck />}
          title={t("threats.noThreats", "No threats found")}
          text={t(
            "fplLive.ui.threats.noThreatsText",
            "No widely owned player outside your team has scored yet this gameweek."
          )}
        />
      </Panel>
    );
  }

  const levelLabel = (level: Threat["threat_level"]) =>
    level === "high"
      ? t("threats.levelHigh", "High")
      : level === "medium"
      ? t("threats.levelMedium", "Medium")
      : t("threats.levelLow", "Low");

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary */}
      <Panel
        title={title}
        subtitle={subtitle}
        action={
          <GhostButton
            onClick={fetchThreats}
            disabled={loading}
            title={t("refresh", "Refresh")}
          >
            <RefreshCw className={cx(loading && "animate-spin")} />
          </GhostButton>
        }
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile
            label={t("fplLive.ui.threats.count", "Threats")}
            value={threats.length}
            hint={t("fplLive.ui.threats.highCount", "high: {{n}}", {
              n: counts.high,
            })}
          />
          <StatTile
            label={t("fplLive.ui.threats.theirPoints", "Their points")}
            value={data?.totalThreatPoints ?? 0}
            hint={t("fplLive.ui.threats.gw", "GW{{gw}}", { gw: gameweek })}
          />
          <StatTile
            label={t("fplLive.ui.threats.impact", "Impact")}
            value={`−${totalImpact.toFixed(1)}`}
            hint={t("fplLive.ui.threats.vsAverage", "vs average manager")}
          />
        </div>
      </Panel>

      {/* List */}
      <Panel flush>
        <div className="flex flex-col gap-2 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Segmented<ThreatFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t("threats.filterAll", "All"), count: counts.all },
              { value: "high", label: levelLabel("high"), count: counts.high },
              { value: "medium", label: levelLabel("medium"), count: counts.medium },
              { value: "low", label: levelLabel("low"), count: counts.low },
            ]}
          />
          <label className="flex items-center gap-2 self-start text-[11px] text-theme-text-muted sm:self-auto">
            {t("threats.sortBy", "Sort by")}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-theme-border bg-theme-card px-2 py-1.5 text-xs font-medium text-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="impact">{t("fplLive.ui.threats.impact", "Impact")}</option>
              <option value="points">{t("threats.sortPoints", "Points")}</option>
              <option value="ownership">{t("threats.sortOwnership", "Ownership")}</option>
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="border-t border-theme-border"
            title={t("threats.noMatchingThreats", "No threats matching current filter")}
          />
        ) : (
          <div className="divide-y divide-theme-border border-t border-theme-border">
            {visible.map((threat) => {
              const impact = impactOf(threat);
              const club = getPlayerTeamColors({
                team: threat.team,
                team_code: threat.team_code,
              }).shortName;
              return (
                <ListRow key={threat.player_id}>
                  <PlayerCell
                    player={{
                      team: threat.team,
                      team_code: threat.team_code,
                      element_type: threat.element_type,
                    }}
                    name={threat.web_name}
                    badges={
                      <>
                        <PosTag type={threat.element_type} />
                        {threat.is_on_bench && (
                          <Chip tone="warning">
                            {t("fplLive.ui.threats.yourBench", "Your bench")}
                          </Chip>
                        )}
                      </>
                    }
                    meta={
                      <>
                        <span className="shrink-0">{club}</span>
                        <span className="shrink-0 text-theme-border-strong">·</span>
                        <span className="shrink-0 tabular-nums">
                          {threat.ownership_pct.toFixed(1)}%
                        </span>
                        {/* Bar is w-full, so size it through a wrapper */}
                        <div className="w-14 shrink-0 sm:w-24">
                          <Bar value={threat.ownership_pct} tone="neutral" />
                        </div>
                      </>
                    }
                  />
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-base font-semibold leading-none tabular-nums text-theme-heading-primary">
                      {threat.points}
                    </span>
                    <Chip
                      tone={LEVEL_TONE[threat.threat_level]}
                      className="tabular-nums"
                    >
                      −{impact.toFixed(1)}
                    </Chip>
                  </div>
                </ListRow>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
});

export default ThreatsAnalysis;
