"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MdWarning,
  MdFilterList,
  MdSort,
  MdShield,
  MdRefresh,
} from "react-icons/md";
import { MdChair } from "react-icons/md";
import { getTeamColors } from "@/lib/team-colors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Threat {
  player_id: number;
  web_name: string;
  team: number;
  element_type: number;
  points: number;
  ownership_pct: number;
  effective_ownership: number;
  threat_level: "high" | "medium" | "low";
  is_on_bench: boolean;
}

interface ThreatsData {
  threats: Threat[];
  totalThreatPoints: number;
}

interface ThreatsAnalysisProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const POSITION_LABELS: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

const POSITION_COLORS: Record<number, string> = {
  1: "bg-yellow-500",
  2: "bg-green-500",
  3: "bg-blue-500",
  4: "bg-red-500",
};

const THREAT_BADGE: Record<
  Threat["threat_level"],
  { dotClass: string; textClass: string; labelKey: string; labelFallback: string }
> = {
  high: {
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-400",
    labelKey: "threats.levelHigh",
    labelFallback: "High",
  },
  medium: {
    dotClass: "bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-400",
    labelKey: "threats.levelMedium",
    labelFallback: "Medium",
  },
  low: {
    dotClass: "bg-yellow-500",
    textClass: "text-yellow-700 dark:text-yellow-400",
    labelKey: "threats.levelLow",
    labelFallback: "Low",
  },
};

type ThreatFilter = "all" | "high" | "medium" | "low";
type SortKey = "points" | "ownership" | "threat";

const THREAT_ORDER: Record<Threat["threat_level"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

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
  const [sortBy, setSortBy] = useState<SortKey>("points");

  // ---- Fetch ----------------------------------------------------------
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

  // ---- Derived data ---------------------------------------------------
  const filteredThreats = React.useMemo(() => {
    if (!data) return [];

    const base = Array.isArray(data.threats) ? data.threats : [];
    let list =
      filter === "all"
        ? base
        : base.filter((t) => t.threat_level === filter);

    list = [...list].sort((a, b) => {
      if (sortBy === "points") return b.points - a.points;
      if (sortBy === "ownership") return b.ownership_pct - a.ownership_pct;
      return THREAT_ORDER[b.threat_level] - THREAT_ORDER[a.threat_level];
    });

    return list;
  }, [data, filter, sortBy]);

  // ---- Loading --------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 space-y-2 theme-transition">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // ---- Error ----------------------------------------------------------
  if (error) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-6 theme-transition">
        <div className="flex items-center gap-3 mb-3">
          <MdWarning className="text-2xl text-red-500" />
          <h3 className="text-lg font-semibold text-theme-foreground theme-transition">
            {t("threats.title", "Threats Analysis")}
          </h3>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchThreats}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <MdRefresh className="text-lg" />
          {t("common.retry", "Retry")}
        </button>
      </div>
    );
  }

  // ---- No manager id --------------------------------------------------
  if (!managerId) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-6 theme-transition text-center">
        <MdShield className="text-4xl text-theme-text-secondary mx-auto mb-2" />
        <p className="text-theme-text-secondary theme-transition text-sm">
          {t("threats.noManager", "Enter your Manager ID to see threats.")}
        </p>
      </div>
    );
  }

  // ---- Empty ----------------------------------------------------------
  if (!data || data.threats.length === 0) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-6 theme-transition text-center">
        <MdShield className="text-4xl text-green-500 mx-auto mb-2" />
        <p className="text-theme-text-secondary theme-transition text-sm">
          {t("threats.noThreats", "No significant threats this gameweek.")}
        </p>
      </div>
    );
  }

  const threatCounts = {
    high: data.threats.filter((t) => t.threat_level === "high").length,
    medium: data.threats.filter((t) => t.threat_level === "medium").length,
    low: data.threats.filter((t) => t.threat_level === "low").length,
  };

  // ---- Render ---------------------------------------------------------
  return (
    <div className="bg-theme-card border border-theme-border rounded-lg theme-transition">
      {/* Summary bar */}
      <div className="p-4 sm:p-6 border-b border-theme-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <MdWarning className="text-2xl text-orange-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-theme-foreground theme-transition">
                {t("threats.title", "Threats Analysis")}
              </h3>
              <p className="text-sm text-theme-text-secondary theme-transition">
                {t("threats.subtitle", "Players you don't own scoring points")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {data.totalThreatPoints}
              </p>
              <p className="text-xs text-theme-text-secondary theme-transition">
                {t("threats.totalPoints", "Threat Pts")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-theme-foreground theme-transition">
                {data.threats.length}
              </p>
              <p className="text-xs text-theme-text-secondary theme-transition">
                {t("threats.count", "Threats")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & sort controls */}
      <div className="p-4 sm:px-6 border-b border-theme-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <MdFilterList className="text-theme-text-secondary shrink-0" />
          {(["all", "high", "medium", "low"] as ThreatFilter[]).map((level) => {
            const isActive = filter === level;
            const count =
              level === "all" ? data.threats.length : threatCounts[level];
            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-theme-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {level === "all"
                  ? t("threats.filterAll", "All")
                  : t(`threats.filter${level.charAt(0).toUpperCase() + level.slice(1)}`, level)}{" "}
                ({count})
              </button>
            );
          })}
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-2">
          <MdSort className="text-theme-text-secondary shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-gray-100 dark:bg-gray-700 text-theme-foreground text-xs rounded-lg px-3 py-1.5 border border-theme-border theme-transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="points">
              {t("threats.sortPoints", "Points")}
            </option>
            <option value="ownership">
              {t("threats.sortOwnership", "Ownership")}
            </option>
            <option value="threat">
              {t("threats.sortThreat", "Threat Level")}
            </option>
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-theme-text-secondary theme-transition">
              <th className="text-left py-3 px-4 font-medium">
                {t("threats.player", "Player")}
              </th>
              <th className="text-center py-3 px-2 font-medium">
                {t("threats.pos", "Pos")}
              </th>
              <th className="text-center py-3 px-2 font-medium">
                {t("threats.pts", "Pts")}
              </th>
              <th className="text-left py-3 px-4 font-medium">
                {t("threats.ownership", "Ownership")}
              </th>
              <th className="text-center py-3 px-2 font-medium">
                {t("threats.eo", "EO")}
              </th>
              <th className="text-center py-3 px-2 font-medium">
                {t("threats.level", "Level")}
              </th>
              <th className="text-center py-3 px-2 font-medium">
                {t("threats.status", "Status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat) => {
              const teamColors = getTeamColors(threat.team);
              const badge = THREAT_BADGE[threat.threat_level];

              return (
                <tr
                  key={threat.player_id}
                  className="border-b border-theme-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  {/* Player name + team dot */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: teamColors.primary }}
                      />
                      <span className="font-medium text-theme-foreground theme-transition">
                        {threat.web_name}
                      </span>
                      <span className="text-xs text-theme-text-secondary theme-transition">
                        {teamColors.shortName}
                      </span>
                    </div>
                  </td>

                  {/* Position badge */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        POSITION_COLORS[threat.element_type] || "bg-gray-500"
                      }`}
                    >
                      {POSITION_LABELS[threat.element_type] || "???"}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold text-theme-foreground theme-transition">
                      {threat.points}
                    </span>
                  </td>

                  {/* Ownership bar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(threat.ownership_pct, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-theme-text-secondary theme-transition w-12 text-right">
                        {threat.ownership_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Effective ownership */}
                  <td className="py-3 px-2 text-center text-xs text-theme-text-secondary theme-transition">
                    {threat.effective_ownership.toFixed(1)}%
                  </td>

                  {/* Threat level badge */}
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${badge.textClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                      {t(badge.labelKey, badge.labelFallback)}
                    </span>
                  </td>

                  {/* On bench indicator */}
                  <td className="py-3 px-2 text-center">
                    {threat.is_on_bench && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                        <MdChair className="text-xs" />
                        {t("threats.onBench", "Bench")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-theme-border">
        {filteredThreats.map((threat) => {
          const teamColors = getTeamColors(threat.team);
          const badge = THREAT_BADGE[threat.threat_level];

          return (
            <div key={threat.player_id} className="p-4 space-y-3">
              {/* Top row: name, position, points */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: teamColors.primary }}
                  />
                  <span className="font-medium text-theme-foreground theme-transition truncate">
                    {threat.web_name}
                  </span>
                  <span className="text-xs text-theme-text-secondary theme-transition shrink-0">
                    {teamColors.shortName}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${
                      POSITION_COLORS[threat.element_type] || "bg-gray-500"
                    }`}
                  >
                    {POSITION_LABELS[threat.element_type] || "???"}
                  </span>
                </div>
                <span className="text-xl font-bold text-theme-foreground theme-transition shrink-0 ml-2">
                  {threat.points}
                </span>
              </div>

              {/* Ownership bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-theme-text-secondary theme-transition mb-1">
                  <span>
                    {t("threats.ownership", "Ownership")}
                  </span>
                  <span>{threat.ownership_pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(threat.ownership_pct, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bottom row: badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${badge.textClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                  {t(badge.labelKey, badge.labelFallback)}
                </span>
                <span className="text-[10px] text-theme-text-secondary theme-transition">
                  EO: {threat.effective_ownership.toFixed(1)}%
                </span>
                {threat.is_on_bench && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                    <MdChair className="text-xs" />
                    {t("threats.onBench", "Bench")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filteredThreats.length === 0 && (
        <div className="p-8 text-center text-theme-text-secondary theme-transition text-sm">
          {t(
            "threats.noMatchingThreats",
            "No threats match the selected filter."
          )}
        </div>
      )}
    </div>
  );
});

export default ThreatsAnalysis;
