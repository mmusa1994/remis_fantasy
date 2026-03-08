"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── Types ──────────────────────────────────────────────────────────────────

type ChipType = "wildcard" | "freehit" | "benchboost" | "triplecaptain";

interface GWScore {
  gw: number;
  score: number;
  reason: string;
}

interface ChipStrategy {
  type: ChipType;
  bestWeeks: GWScore[];
  status: "available" | "used";
}

interface ChipStrategyData {
  currentGW: number;
  totalGWs: number;
  remainingGWs: number;
  chips: ChipStrategy[];
  topRecommendation: {
    chip: ChipType;
    gw: number;
    score: number;
    reason: string;
  } | null;
}

interface ChipStrategiesWidgetProps {
  refreshInterval?: number;
  showRecommendations?: boolean;
  maxWeeksShown?: number;
  currentGameweek?: number;
}

// ─── Fixture Difficulty Analysis ────────────────────────────────────────────

function analyzeFixtureDifficulty(
  fixtures: any[],
  teams: any[],
  currentGW: number,
  totalGWs: number,
): Map<number, { avgDifficulty: number; fixtureCount: number; hasDouble: boolean }> {
  const gwMap = new Map<number, { avgDifficulty: number; fixtureCount: number; hasDouble: boolean }>();

  for (let gw = currentGW; gw <= totalGWs; gw++) {
    const gwFixtures = fixtures.filter((f: any) => f.event === gw);
    if (gwFixtures.length === 0) continue;

    // Count how many fixtures each team has (detect DGWs)
    const teamFixtureCounts = new Map<number, number>();
    for (const f of gwFixtures) {
      teamFixtureCounts.set(f.team_h, (teamFixtureCounts.get(f.team_h) || 0) + 1);
      teamFixtureCounts.set(f.team_a, (teamFixtureCounts.get(f.team_a) || 0) + 1);
    }

    const hasDouble = Array.from(teamFixtureCounts.values()).some((c) => c > 1);
    const totalDifficulty = gwFixtures.reduce(
      (sum: number, f: any) => sum + (f.team_h_difficulty || 3) + (f.team_a_difficulty || 3),
      0,
    );
    const avgDifficulty = totalDifficulty / (gwFixtures.length * 2);

    gwMap.set(gw, {
      avgDifficulty,
      fixtureCount: gwFixtures.length,
      hasDouble,
    });
  }

  return gwMap;
}

function buildChipStrategies(
  gwData: Map<number, { avgDifficulty: number; fixtureCount: number; hasDouble: boolean }>,
  currentGW: number,
  totalGWs: number,
): ChipStrategyData {
  const remainingGWs = totalGWs - currentGW + 1;
  const gws = Array.from(gwData.entries()).sort(([a], [b]) => a - b);

  // Helper: normalize scores within a chip so best=95, worst=25, evenly spread
  const normalizeScores = (weeks: GWScore[]): GWScore[] => {
    if (weeks.length === 0) return weeks;
    const maxRaw = Math.max(...weeks.map((w) => w.score));
    const minRaw = Math.min(...weeks.map((w) => w.score));
    const range = maxRaw - minRaw || 1;
    return weeks.map((w) => ({
      ...w,
      score: Math.round(25 + ((w.score - minRaw) / range) * 70),
    }));
  };

  // ── Wildcard: Best when fixture difficulty swings hard (restructure squad)
  const wildcardWeeks: GWScore[] = normalizeScores(
    gws
      .map(([gw, data], idx) => {
        let score = 0;
        if (idx > 0) {
          const prevDiff = gws[idx - 1][1].avgDifficulty;
          const swing = prevDiff - data.avgDifficulty;
          score += swing * 25;
        }
        const position = (gw - currentGW) / remainingGWs;
        if (position > 0.1 && position < 0.6) score += 15;
        if (data.hasDouble) score += 20;
        score += (5 - data.avgDifficulty) * 8;
        return { gw, score, reason: data.hasDouble ? "DGW fixture swing" : "Fixture swing" };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );

  // ── Free Hit: Best for blank GWs (few fixtures) or isolated DGWs
  const freeHitWeeks: GWScore[] = normalizeScores(
    gws
      .map(([gw, data]) => {
        let score = 0;
        if (data.fixtureCount < 10) score += (10 - data.fixtureCount) * 12;
        if (data.hasDouble) score += 30;
        score += (5 - data.avgDifficulty) * 5;
        return { gw, score, reason: data.fixtureCount < 10 ? "Blank GW" : data.hasDouble ? "DGW opportunity" : "Fixture advantage" };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );

  // ── Bench Boost: Best for DGWs (bench players play twice)
  const benchBoostWeeks: GWScore[] = normalizeScores(
    gws
      .map(([gw, data]) => {
        let score = 0;
        if (data.hasDouble) score += 50;
        score += (data.fixtureCount - 10) * 3;
        score += (5 - data.avgDifficulty) * 8;
        return { gw, score, reason: data.hasDouble ? "DGW - bench plays twice" : "High fixture count" };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );

  // ── Triple Captain: Best for DGWs with easy fixtures for premium players
  const tripleCaptainWeeks: GWScore[] = normalizeScores(
    gws
      .map(([gw, data]) => {
        let score = 0;
        if (data.hasDouble) score += 55;
        score += (5 - data.avgDifficulty) * 12;
        if (data.fixtureCount >= 10) score += 5;
        return { gw, score, reason: data.hasDouble ? "DGW - captain plays twice" : "Easy fixtures" };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );

  const chips: ChipStrategy[] = [
    { type: "wildcard", bestWeeks: wildcardWeeks, status: "available" },
    { type: "freehit", bestWeeks: freeHitWeeks, status: "available" },
    { type: "benchboost", bestWeeks: benchBoostWeeks, status: "available" },
    { type: "triplecaptain", bestWeeks: tripleCaptainWeeks, status: "available" },
  ];

  // Find top recommendation across all chips
  let topRecommendation: ChipStrategyData["topRecommendation"] = null;
  for (const chip of chips) {
    if (chip.bestWeeks.length > 0) {
      const best = chip.bestWeeks[0];
      if (!topRecommendation || best.score > topRecommendation.score) {
        topRecommendation = {
          chip: chip.type,
          gw: best.gw,
          score: best.score,
          reason: best.reason,
        };
      }
    }
  }

  return {
    currentGW,
    totalGWs,
    remainingGWs,
    chips,
    topRecommendation,
  };
}

// ─── Widget Component ───────────────────────────────────────────────────────

export default function ChipStrategiesWidget({
  refreshInterval = 1800000,
  showRecommendations = true,
  maxWeeksShown = 5,
  currentGameweek = 1,
}: ChipStrategiesWidgetProps) {
  const { t } = useTranslation("fpl");
  const [data, setData] = useState<ChipStrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<ChipType>("wildcard");

  const cacheRef = useRef<{ data: ChipStrategyData; timestamp: number } | null>(null);
  const CACHE_TTL = 1800000;

  const fetchData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!forceRefresh && cacheRef.current) {
        const isStale = Date.now() - cacheRef.current.timestamp > CACHE_TTL;
        if (!isStale) {
          setData(cacheRef.current.data);
          setLastUpdate(new Date(cacheRef.current.timestamp));
          setLoading(false);
          return;
        }
      }

      try {
        setError(null);

        const bootstrapRes = await fetch("/api/fpl/bootstrap-static");
        if (!bootstrapRes.ok) throw new Error("Failed to fetch data");

        const bootstrap = await bootstrapRes.json();
        if (!bootstrap.success) throw new Error("Bootstrap API error");

        const events = bootstrap.data.events || [];
        const teams = bootstrap.data.teams || [];

        // Detect current GW from bootstrap
        const currentEvent = events.find((e: any) => e.is_current);
        const detectedGW = currentEvent?.id || currentGameweek;
        const totalGWs = events.length || 38;

        // Fetch fixtures for remaining GWs in parallel (batch of 5 to avoid overload)
        const remainingGWNumbers = Array.from(
          { length: totalGWs - detectedGW + 1 },
          (_, i) => detectedGW + i,
        );

        const fixtures: any[] = [];
        const batchSize = 5;
        for (let i = 0; i < remainingGWNumbers.length; i += batchSize) {
          const batch = remainingGWNumbers.slice(i, i + batchSize);
          const responses = await Promise.all(
            batch.map((gw) =>
              fetch(`/api/fpl/fixtures?event=${gw}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null),
            ),
          );
          for (const res of responses) {
            if (res?.success && Array.isArray(res.data)) {
              fixtures.push(...res.data);
            }
          }
        }

        // Fallback: if no fixtures fetched, build basic data from events
        if (fixtures.length === 0) {
          // Use chip_plays from events to generate approximate scores
          for (let gw = detectedGW; gw <= totalGWs; gw++) {
            const event = events.find((e: any) => e.id === gw);
            if (!event) continue;
            // Create synthetic fixture entries so the analysis has something to work with
            for (let m = 0; m < 10; m++) {
              fixtures.push({
                event: gw,
                team_h: m * 2 + 1,
                team_a: m * 2 + 2,
                team_h_difficulty: 3,
                team_a_difficulty: 3,
              });
            }
          }
        }

        const gwData = analyzeFixtureDifficulty(fixtures, teams, detectedGW, totalGWs);
        const strategies = buildChipStrategies(gwData, detectedGW, totalGWs);

        setData(strategies);
        setLastUpdate(new Date());
        cacheRef.current = { data: strategies, timestamp: Date.now() };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [currentGameweek],
  );

  const handleManualRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // ─── Helpers ──────────────────────────────────────────────────────────

  const getChipIcon = (chipType: string) => {
    switch (chipType) {
      case "wildcard": return <Star className="w-4 h-4" />;
      case "freehit": return <Target className="w-4 h-4" />;
      case "benchboost": return <TrendingUp className="w-4 h-4" />;
      case "triplecaptain": return <Zap className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const formatChipName = (chipType: string) => {
    switch (chipType) {
      case "wildcard": return t("teamPlanner.widgets.wildcard");
      case "freehit": return t("teamPlanner.widgets.freeHit");
      case "benchboost": return t("teamPlanner.widgets.benchBoost");
      case "triplecaptain": return t("teamPlanner.widgets.tripleCaptain");
      default: return chipType;
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Zap className="text-theme-text-secondary w-4 h-4" />
            {t("teamPlanner.widgets.chipStrategies")}
          </h3>
          <RefreshCw className="w-4 h-4 animate-spin text-theme-text-secondary" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-theme-card-secondary rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Zap className="text-theme-text-secondary w-4 h-4" />
            {t("teamPlanner.widgets.chipStrategies")}
          </h3>
          <button onClick={handleManualRefresh} className="text-theme-text-secondary hover:text-theme-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-theme-text-secondary text-center py-4">
          {error}
          <br />
          <button onClick={handleManualRefresh} className="text-theme-text-secondary hover:text-theme-foreground underline mt-2">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeChipData = data.chips.find((c) => c.type === activeChip);

  return (
    <div className="bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Zap className="text-theme-text-secondary w-4 h-4" />
          {t("teamPlanner.widgets.chipStrategies")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-theme-text-secondary">
            GW {data.currentGW} · {data.remainingGWs} left
          </span>
          <button onClick={handleManualRefresh} className="text-theme-text-secondary hover:text-theme-foreground transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Recommendation */}
      {showRecommendations && data.topRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-theme-card-secondary border border-theme-border"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-3.5 h-3.5 text-theme-text-secondary" />
            <span className="text-xs font-semibold text-theme-foreground uppercase tracking-wider">
              {t("teamPlanner.widgets.recommendation")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getChipIcon(data.topRecommendation.chip)}
            <span className="font-medium">
              {formatChipName(data.topRecommendation.chip)}
            </span>
            <span className="text-theme-text-secondary">
              {t("teamPlanner.widgets.inWeek", { week: data.topRecommendation.gw })}
            </span>
          </div>
          <p className="text-xs text-theme-text-secondary mt-1">
            {data.topRecommendation.reason}
          </p>
        </motion.div>
      )}

      {/* Chip Selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {data.chips.map((chip) => (
          <button
            key={chip.type}
            onClick={() => setActiveChip(chip.type)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeChip === chip.type
                ? "bg-theme-foreground/10 text-theme-foreground border border-theme-border"
                : "bg-theme-card-secondary text-theme-text-secondary hover:bg-theme-card-secondary/80"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              {getChipIcon(chip.type)}
              <span>{formatChipName(chip.type)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Chip Strategy */}
      <AnimatePresence mode="wait">
        {activeChipData && (
          <motion.div
            key={activeChip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg text-theme-text-secondary bg-theme-card-secondary">
                {getChipIcon(activeChip)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-theme-foreground">
                  {formatChipName(activeChip)}
                </h4>
                <p className="text-xs text-theme-text-secondary">
                  {activeChipData.bestWeeks.length > 0
                    ? `Best upcoming GWs based on fixtures`
                    : "No upcoming gameweeks to analyze"}
                </p>
              </div>
            </div>

            {activeChipData.bestWeeks.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-xs font-medium flex items-center gap-1 text-theme-text-secondary uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  Recommended GWs
                </h5>
                {activeChipData.bestWeeks.slice(0, maxWeeksShown).map((week, index) => (
                  <motion.div
                    key={week.gw}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-theme-card-secondary hover:bg-theme-card-secondary/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-theme-foreground/10 text-theme-foreground text-xs font-bold flex items-center justify-center">
                        {week.gw}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-theme-foreground">
                          GW {week.gw}
                        </span>
                        <p className="text-xs text-theme-text-secondary">
                          {week.reason}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-theme-text-secondary tabular-nums">
                      {week.score}%
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-theme-text-secondary text-center py-4">
                No data available for remaining gameweeks
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-theme-text-secondary text-center pt-3 border-t border-theme-border mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
