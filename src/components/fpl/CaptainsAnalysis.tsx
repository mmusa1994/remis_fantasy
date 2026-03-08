"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MdRefresh } from "react-icons/md";
import { FaCrown } from "react-icons/fa";

interface CaptainsAnalysisProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface CaptainEntry {
  player_id: number;
  web_name: string;
  team: number;
  ownership_pct: number;
  points: number;
  effective_points: number;
}

interface ChipUsage {
  wildcard: number;
  freehit: number;
  benchboost: number;
  triplecaptain: number;
}

interface TierCaptain {
  web_name: string;
  ownership_pct: number;
  points: number;
}

interface CaptainsByTier {
  tier: string;
  captains: TierCaptain[];
}

interface CaptainsData {
  topCaptains: CaptainEntry[];
  chipUsage: ChipUsage;
  captainsByTier: CaptainsByTier[];
}

const CHIP_KEYS: Array<{
  key: keyof ChipUsage;
  labelKey: string;
  labelFallback: string;
  abbr: string;
  color: string;
}> = [
  {
    key: "wildcard",
    labelKey: "captains.chipWildcard",
    labelFallback: "Wildcard",
    abbr: "WC",
    color: "text-red-600 dark:text-red-400",
  },
  {
    key: "freehit",
    labelKey: "captains.chipFreeHit",
    labelFallback: "Free Hit",
    abbr: "FH",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "benchboost",
    labelKey: "captains.chipBenchBoost",
    labelFallback: "Bench Boost",
    abbr: "BB",
    color: "text-green-600 dark:text-green-400",
  },
  {
    key: "triplecaptain",
    labelKey: "captains.chipTripleCaptain",
    labelFallback: "Triple Captain",
    abbr: "TC",
    color: "text-purple-600 dark:text-purple-400",
  },
];

function getPointsColor(points: number): string {
  if (points >= 10) return "text-green-600 dark:text-green-400";
  if (points >= 5) return "text-emerald-600 dark:text-emerald-400";
  if (points >= 2) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getPointsBg(points: number): string {
  if (points >= 10) return "bg-green-100 dark:bg-green-900/30";
  if (points >= 5) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (points >= 2) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function OwnershipBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 theme-transition"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-theme-text-secondary w-12 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-4 space-y-2 theme-transition">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse" />
      ))}
    </div>
  );
}

const CaptainsAnalysis = React.memo(function CaptainsAnalysis({
  managerId,
  gameweek,
  managerData,
}: CaptainsAnalysisProps) {
  const { t } = useTranslation("fpl");
  const [data, setData] = useState<CaptainsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!gameweek) return;

    setError(null);

    try {
      const response = await fetch(
        `/api/fpl/captains-stats?gameweek=${gameweek}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch captains data");
      }
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Invalid response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameweek]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="w-full">
          <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
            {t("common.error", "Error")}
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-3">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { topCaptains, chipUsage, captainsByTier } = data;
  const tcPlayers = topCaptains.filter(
    (c) => c.effective_points > c.points * 1.5
  );

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 theme-transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCrown className="text-lg text-amber-500" />
            <div>
              <h2 className="text-lg font-bold text-theme-foreground">
                {t("captains.title", "Captains Analysis")}
              </h2>
              <p className="text-theme-text-secondary text-sm">
                {t(
                  "captains.subtitle",
                  `GW${gameweek} captain picks & chip usage`
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-md border border-theme-border text-theme-text-secondary hover:text-theme-foreground transition-colors disabled:opacity-50"
            title={t("common.refresh", "Refresh")}
          >
            <MdRefresh
              className={`text-lg ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Top Captains Table */}
      <div className="bg-theme-card rounded-lg border border-theme-border shadow-sm overflow-hidden theme-transition">
        <div className="px-4 py-3 border-b border-theme-border">
          <h3 className="text-sm font-semibold text-theme-foreground">
            {t("captains.topCaptains", "Top Captains")}
          </h3>
        </div>

        {topCaptains.length === 0 ? (
          <div className="p-6 text-center text-theme-text-secondary text-sm">
            {t("captains.noCaptainData", "No captain data available")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-secondary text-xs">
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">
                    {t("captains.player", "Player")}
                  </th>
                  <th className="text-left px-4 py-2 font-medium min-w-[120px]">
                    {t("captains.ownership", "Captaincy %")}
                  </th>
                  <th className="text-center px-4 py-2 font-medium">
                    {t("captains.points", "Pts")}
                  </th>
                  <th className="text-center px-4 py-2 font-medium">
                    {t("captains.effective", "Eff. Pts")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCaptains.map((captain, index) => (
                  <tr
                    key={captain.player_id}
                    className="border-b border-theme-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 theme-transition"
                  >
                    <td className="px-4 py-3 text-theme-text-secondary font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <FaCrown className="text-amber-500 text-xs flex-shrink-0" />
                        )}
                        <span className="font-medium text-theme-foreground">
                          {captain.web_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OwnershipBar pct={captain.ownership_pct} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold ${getPointsColor(captain.points)}`}
                      >
                        {captain.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getPointsBg(captain.effective_points)} ${getPointsColor(captain.effective_points)}`}
                      >
                        {captain.effective_points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chips Used This GW */}
      <div className="bg-theme-card rounded-lg border border-theme-border shadow-sm theme-transition">
        <div className="px-4 py-3 border-b border-theme-border">
          <h3 className="text-sm font-semibold text-theme-foreground">
            {t("captains.chipsUsed", "Chips Used This GW")}
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CHIP_KEYS.map(({ key, labelKey, labelFallback, abbr, color }) => {
              const usage = chipUsage[key] ?? 0;
              return (
                <div
                  key={key}
                  className="rounded-lg border border-theme-border p-3 text-center theme-transition"
                >
                  <div
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${color}`}
                  >
                    {abbr}
                  </div>
                  <div className="text-2xl font-bold text-theme-foreground">
                    {usage >= 1000000
                      ? `${(usage / 1000000).toFixed(1)}M`
                      : usage >= 1000
                        ? `${(usage / 1000).toFixed(1)}k`
                        : usage.toLocaleString()}
                  </div>
                  <div className="text-xs text-theme-text-secondary mt-1">
                    {t(labelKey, labelFallback)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Captain by Rank Tier */}
      {captainsByTier && captainsByTier.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme-border shadow-sm overflow-hidden theme-transition">
          <div className="px-4 py-3 border-b border-theme-border">
            <h3 className="text-sm font-semibold text-theme-foreground">
              {t("captains.byRankTier", "Captain by Rank Tier")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-secondary text-xs">
                  <th className="text-left px-4 py-2 font-medium">
                    {t("captains.tier", "Tier")}
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    {t("captains.topPick", "Top Pick")}
                  </th>
                  <th className="text-left px-4 py-2 font-medium min-w-[100px]">
                    {t("captains.ownership", "Captaincy %")}
                  </th>
                  <th className="text-center px-4 py-2 font-medium">
                    {t("captains.points", "Pts")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {captainsByTier.map((tierData) => {
                  const topCaptain = tierData.captains[0];
                  if (!topCaptain) return null;

                  return (
                    <tr
                      key={tierData.tier}
                      className="border-b border-theme-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 theme-transition"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {tierData.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-theme-foreground">
                        {topCaptain.web_name}
                      </td>
                      <td className="px-4 py-3">
                        <OwnershipBar pct={topCaptain.ownership_pct} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold ${getPointsColor(topCaptain.points)}`}
                        >
                          {topCaptain.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded tier details */}
          <div className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {captainsByTier.map((tierData) => (
                <div
                  key={`detail-${tierData.tier}`}
                  className="rounded-lg border border-theme-border p-3 theme-transition"
                >
                  <div className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider mb-2">
                    {tierData.tier}
                  </div>
                  <div className="space-y-1.5">
                    {tierData.captains.slice(0, 3).map((captain, idx) => (
                      <div
                        key={`${tierData.tier}-${captain.web_name}`}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-theme-text-secondary w-4">
                            {idx + 1}.
                          </span>
                          <span className="text-theme-foreground font-medium">
                            {captain.web_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-theme-text-secondary">
                            {captain.ownership_pct.toFixed(1)}%
                          </span>
                          <span
                            className={`font-semibold ${getPointsColor(captain.points)}`}
                          >
                            {captain.points}{t("captains.ptsAbbr", "pts")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Triple Captains */}
      {tcPlayers.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme-border shadow-sm overflow-hidden theme-transition">
          <div className="px-4 py-3 border-b border-theme-border">
            <h3 className="text-sm font-semibold text-theme-foreground">
              {t("captains.tripleCaptains", "Top Triple Captains")}
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tcPlayers.map((player) => (
                <div
                  key={`tc-${player.player_id}`}
                  className="flex items-center gap-3 rounded-lg border border-theme-border p-3 theme-transition"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-700 dark:text-purple-300 text-xs font-bold">3x</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-theme-foreground text-sm truncate">
                      {player.web_name}
                    </div>
                    <div className="text-xs text-theme-text-secondary">
                      {player.ownership_pct.toFixed(1)}% {t("captains.ownership", "Captaincy %")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${getPointsColor(player.effective_points)}`}
                    >
                      {player.effective_points}
                    </div>
                    <div className="text-xs text-theme-text-secondary">
                      ({player.points} x3)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CaptainsAnalysis;
