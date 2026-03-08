"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
// skeleton loader used inline

interface ComparisonsProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface BenchmarkData {
  avgPoints: number;
  yourPoints: number;
  diff: number;
}

interface RankEntry {
  rank: string;
  pointsNeeded: number;
  yourPoints: number;
  gap: number;
}

interface PositionRating {
  yours: number;
  top10k: number;
}

interface ComparisonsData {
  vsBenchmarks: {
    top10k: BenchmarkData;
    top100k: BenchmarkData;
    overall: BenchmarkData;
  };
  ranksNeeded: RankEntry[];
  teamRatings: {
    templatePct: number;
    byPosition: {
      GK: PositionRating;
      DEF: PositionRating;
      MID: PositionRating;
      FWD: PositionRating;
    };
  };
}

const Comparisons = React.memo(function Comparisons({
  managerId,
  gameweek,
  managerData,
}: ComparisonsProps) {
  const { t } = useTranslation("fpl");
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
      if (!response.ok) {
        throw new Error("Failed to fetch comparisons data");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [managerId, gameweek]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  if (!managerId) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-6 text-center theme-transition">
        <p className="text-theme-text-secondary text-sm">
          {t("comparisons.noManager", "Enter a manager ID to see comparisons")}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 space-y-2 theme-transition">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 bg-theme-card-secondary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
          {t("common.error", "Error")}
        </h3>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={fetchComparisons}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
        >
          {t("common.retry", "Retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-card rounded-lg border border-theme-border p-4 theme-transition">
        <h2 className="text-lg font-bold text-theme-foreground">
          {t("comparisons.title", "GW Comparisons")}
        </h2>
        <p className="text-theme-text-secondary text-sm mt-0.5">
          {t(
            "comparisons.subtitle",
            "See how you stack up against the best"
          )}
        </p>
      </div>

      {/* Your GW vs Benchmarks */}
      <BenchmarkSection
        benchmarks={data.vsBenchmarks}
        gameweek={gameweek}
        t={t}
      />

      {/* Points Needed for Ranks */}
      <RanksNeededSection ranksNeeded={data.ranksNeeded} t={t} />

      {/* Team Ratings */}
      <TeamRatingsSection teamRatings={data.teamRatings} t={t} />
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Benchmark Cards                                                     */
/* ------------------------------------------------------------------ */

interface BenchmarkSectionProps {
  benchmarks: ComparisonsData["vsBenchmarks"];
  gameweek: number;
  t: any;
}

const BenchmarkSection = React.memo(function BenchmarkSection({
  benchmarks,
  gameweek,
  t,
}: BenchmarkSectionProps) {
  const entries: { label: string; data: BenchmarkData }[] = [
    {
      label: t("comparisons.top10k", "Top 10K Avg"),
      data: benchmarks.top10k,
    },
    {
      label: t("comparisons.top100k", "Top 100K Avg"),
      data: benchmarks.top100k,
    },
    {
      label: t("comparisons.overall", "Overall Avg"),
      data: benchmarks.overall,
    },
  ];

  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-5 theme-transition">
      <h3 className="text-sm font-semibold text-theme-foreground mb-4">
        {t("comparisons.vsBenchmarks", "Your GW vs Benchmarks")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries.map(({ label, data }) => {
          const isPositive = data.diff >= 0;
          return (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs font-medium text-theme-text-secondary mb-2 uppercase tracking-wide">
                {label}
              </p>

              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold text-theme-foreground">
                    {data.yourPoints}
                  </p>
                  <p className="text-xs text-theme-text-secondary">
                    {t("comparisons.yourPoints", "Your pts")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-theme-text-secondary">
                    {data.avgPoints}
                  </p>
                  <p className="text-xs text-theme-text-secondary">
                    {t("comparisons.avg", "Avg")}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  isPositive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {isPositive ? (
                  <MdArrowUpward className="text-sm" />
                ) : (
                  <MdArrowDownward className="text-sm" />
                )}
                {isPositive ? "+" : ""}
                {data.diff}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Points Needed for Ranks Table                                       */
/* ------------------------------------------------------------------ */

interface RanksNeededSectionProps {
  ranksNeeded: RankEntry[];
  t: any;
}

const RanksNeededSection = React.memo(function RanksNeededSection({
  ranksNeeded,
  t,
}: RanksNeededSectionProps) {
  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-5 theme-transition">
      <h3 className="text-sm font-semibold text-theme-foreground mb-4">
        {t("comparisons.ranksNeeded", "Points Needed for Ranks")}
      </h3>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left py-2 pr-4 text-theme-text-secondary font-medium">
                {t("comparisons.rank", "Rank")}
              </th>
              <th className="text-right py-2 px-4 text-theme-text-secondary font-medium">
                {t("comparisons.pointsNeeded", "Pts Needed")}
              </th>
              <th className="text-right py-2 px-4 text-theme-text-secondary font-medium">
                {t("comparisons.yourTotal", "Your Total")}
              </th>
              <th className="text-right py-2 pl-4 text-theme-text-secondary font-medium">
                {t("comparisons.gap", "Gap")}
              </th>
            </tr>
          </thead>
          <tbody>
            {ranksNeeded.map((entry) => {
              const isAhead = entry.gap <= 0;
              return (
                <tr
                  key={entry.rank}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium text-theme-foreground whitespace-nowrap">
                    {entry.rank}
                  </td>
                  <td className="py-2.5 px-4 text-right text-theme-text-secondary tabular-nums">
                    {entry.pointsNeeded.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-theme-foreground font-medium tabular-nums">
                    {entry.yourPoints.toLocaleString()}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                        isAhead
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isAhead ? (
                        <MdArrowUpward className="text-xs" />
                      ) : (
                        <MdArrowDownward className="text-xs" />
                      )}
                      {Math.abs(entry.gap).toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Team Ratings                                                        */
/* ------------------------------------------------------------------ */

interface TeamRatingsSectionProps {
  teamRatings: ComparisonsData["teamRatings"];
  t: any;
}

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

const positionColors: Record<(typeof POSITIONS)[number], string> = {
  GK: "bg-yellow-500",
  DEF: "bg-green-500",
  MID: "bg-blue-500",
  FWD: "bg-red-500",
};

const TeamRatingsSection = React.memo(function TeamRatingsSection({
  teamRatings,
  t,
}: TeamRatingsSectionProps) {
  const circumference = 2 * Math.PI * 40;
  const strokeOffset =
    circumference - (teamRatings.templatePct / 100) * circumference;

  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-5 theme-transition">
      <h3 className="text-sm font-semibold text-theme-foreground mb-4">
        {t("comparisons.teamRatings", "Team Ratings")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Match Circular Progress */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-theme-text-secondary mb-3">
            {t(
              "comparisons.templateMatch",
              "Template Match (vs Top 10K)"
            )}
          </p>
          <div className="relative w-28 h-28">
            <svg
              className="w-28 h-28 -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-theme-foreground">
                {teamRatings.templatePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Position Bars */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-theme-text-secondary">
            {t("comparisons.byPosition", "By Position vs Top 10K")}
          </p>

          {POSITIONS.map((pos) => {
            const rating = teamRatings.byPosition[pos];
            const maxVal = Math.max(rating.yours, rating.top10k, 1);

            return (
              <div key={pos} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`${positionColors[pos]} text-white px-1.5 py-0.5 rounded font-semibold`}
                  >
                    {pos}
                  </span>
                  <span className="text-theme-text-secondary">
                    {t("comparisons.you", "You")}: {rating.yours} |{" "}
                    {t("comparisons.top10kLabel", "10K")}: {rating.top10k}
                  </span>
                </div>

                {/* Your bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-8 text-theme-text-secondary">
                    {t("comparisons.you", "You")}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(rating.yours / maxVal) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Top 10K bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-8 text-theme-text-secondary">
                    {t("comparisons.top10kLabel", "10K")}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(rating.top10k / maxVal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Comparisons;
