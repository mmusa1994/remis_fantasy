"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PiTShirtFill } from "react-icons/pi";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTeamColors } from "@/lib/team-colors";
import type { OwnershipChangesWidgetData } from "@/types/fpl-enhanced";

// Widget-level cache interface
interface OwnershipCache {
  data: OwnershipChangesWidgetData;
  timestamp: number;
  timeframe: string;
  playerIds: string;
}

// Request deduplication map
const pendingOwnershipRequests = new Map<string, Promise<any>>();

interface OwnershipChangesWidgetProps {
  userTeamPlayerIds?: number[];
  refreshInterval?: number;
  maxItems?: number;
  timeframe?: "1h" | "24h" | "week";
}

const OwnershipChangesWidget = React.memo<OwnershipChangesWidgetProps>(
  function OwnershipChangesWidget({
    userTeamPlayerIds = [],
    refreshInterval = 300000, // 5 minutes
    maxItems = 5,
    timeframe = "1h",
  }: OwnershipChangesWidgetProps) {
    const { theme } = useTheme();
    const { t } = useTranslation("fpl");
    const [data, setData] = useState<OwnershipChangesWidgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentTimeframe, setCurrentTimeframe] = useState<
      "1h" | "24h" | "week"
    >(timeframe);

    // Component-level cache
    const cacheRef = useRef<OwnershipCache | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cache configuration - reduced caching for fresh data
    const CACHE_TTL = 60000; // 1 minute only
    const MIN_REFRESH_INTERVAL = 30000; // 30 seconds minimum between requests

    /**
     * Generate cache key for request deduplication
     */
    const getCacheKey = useCallback((): string => {
      const playerIdsKey = userTeamPlayerIds.sort().join(",");
      return `ownership_changes_${currentTimeframe}_${playerIdsKey}`;
    }, [currentTimeframe, userTeamPlayerIds]);

    /**
     * Check if cached data is still fresh
     */
    const isCacheValid = useCallback(
      (cache: OwnershipCache | null): boolean => {
        if (!cache) return false;

        const now = Date.now();
        const isDataFresh = now - cache.timestamp < CACHE_TTL;
        const isTimeframeSame = cache.timeframe === currentTimeframe;
        const isPlayerIdsSame =
          cache.playerIds === userTeamPlayerIds.sort().join(",");

        return isDataFresh && isTimeframeSame && isPlayerIdsSame;
      },
      [currentTimeframe, userTeamPlayerIds, CACHE_TTL]
    );

    /**
     * Optimized fetch function with request deduplication and caching
     */
    const fetchOwnershipChanges = useCallback(
      async (forceRefresh: boolean = false, gameweek: number = 4) => {
        // Inline handler functions to avoid dependency issues
        const handleSuccessfulResponse = (result: any) => {
          // Helper: pick ownership change based on selected timeframe with safe fallbacks
          const pickChange = (player: any): number => {
            if (currentTimeframe === "1h") {
              return (
                player.ownership_change_1h ??
                player.ownership_change_hour ??
                player.ownership_change ??
                0
              );
            }
            if (currentTimeframe === "24h") {
              return (
                player.ownership_change_24h ??
                player.ownership_change_day ??
                player.ownership_change ??
                0
              );
            }
            // week
            return (
              player.ownership_change_week ??
              player.ownership_change_7d ??
              player.ownership_change ??
              0
            );
          };
          if (result.success && result.data) {
            // Handle two different API response formats:
            // 1. General analytics: { top_risers: [...], top_fallers: [...] }
            // 2. Player-specific trends: [...] (flat array)

            let risers: any[] = [];
            let fallers: any[] = [];

            if (Array.isArray(result.data)) {
              // Player-specific format - separate into risers and fallers
              result.data.forEach((player: any) => {
                // Add team colors for rendering
                const change = pickChange(player);
                const playerWithColors = {
                  ...player,
                  team_colors: getTeamColors(player.team_name),
                  change,
                  ownership: player.current_ownership,
                };

                // Use timeframe-based change to decide direction when available
                if (change > 0 || player.ownership_trend === "rising") {
                  risers.push(playerWithColors);
                } else if (change < 0 || player.ownership_trend === "falling") {
                  fallers.push(playerWithColors);
                }
              });
            } else {
              // General analytics format - add team colors if missing
              risers = (result.data.top_risers || result.data.risers || []).map(
                (player: any) => ({
                  ...player,
                  team_colors:
                    player.team_colors || getTeamColors(player.team_name),
                  change: pickChange(player),
                  ownership: player.current_ownership,
                })
              );
              fallers = (
                result.data.top_fallers ||
                result.data.fallers ||
                []
              ).map((player: any) => ({
                ...player,
                team_colors:
                  player.team_colors || getTeamColors(player.team_name),
                change: pickChange(player),
                ownership: player.current_ownership,
              }));
            }

            const ownershipData = {
              risers,
              fallers,
              timeframe: currentTimeframe,
            };

            setData(ownershipData);
            setLastUpdate(new Date());
            setError(null);

            // Update cache
            cacheRef.current = {
              data: ownershipData,
              timestamp: Date.now(),
              timeframe: currentTimeframe,
              playerIds: userTeamPlayerIds.sort().join(","),
            };
          }
        };

        const handleErrorResponse = (err: any) => {
          console.error("[OwnershipChangesWidget] Error:", err);
          setError(
            "FPL API appears unavailable. Ownership changes could not be loaded."
          );
        };

        // Check cache first
        if (!forceRefresh && isCacheValid(cacheRef.current)) {
          setData(cacheRef.current!.data);
          setLastUpdate(new Date(cacheRef.current!.timestamp));
          setLoading(false);
          return;
        }

        // Prevent too frequent requests
        if (cacheRef.current && !forceRefresh) {
          const timeSinceLastFetch = Date.now() - cacheRef.current.timestamp;
          if (timeSinceLastFetch < MIN_REFRESH_INTERVAL) {
            setLoading(false);
            return;
          }
        }

        const cacheKey = getCacheKey();

        // Check if request is already pending (request deduplication)
        if (pendingOwnershipRequests.has(cacheKey)) {
          try {
            const result = await pendingOwnershipRequests.get(cacheKey);
            handleSuccessfulResponse(result);
          } catch (err) {
            handleErrorResponse(err);
          }
          return;
        }

        try {
          setError(null);
          if (forceRefresh) {
            setLoading(true);
          }

          // Create new abort controller
          abortControllerRef.current = new AbortController();

          const params = new URLSearchParams({
            timeframe: currentTimeframe,
            gameweek: gameweek.toString(),
          });

          if (userTeamPlayerIds.length > 0) {
            params.append("playerIds", userTeamPlayerIds.join(","));
          }

          // Create and cache the request promise
          const requestPromise = fetch(
            `/api/fpl/ownership-analytics?${params}`,
            {
              signal: abortControllerRef.current.signal,
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          ).then(async (response) => {
            if (!response.ok) {
              throw new Error("fpl_unavailable");
            }
            return response.json();
          });

          pendingOwnershipRequests.set(cacheKey, requestPromise);

          const result = await requestPromise;
          handleSuccessfulResponse(result);
        } catch (err) {
          // Handle fallback to previous gameweek if no data
          if (
            err instanceof Error &&
            err.message === "no_data_fallback" &&
            gameweek > 3
          ) {
            return fetchOwnershipChanges(forceRefresh, gameweek - 1);
          }

          // Only handle other errors if request wasn't aborted
          if (err instanceof Error && err.name !== "AbortError") {
            handleErrorResponse(err);
          } else if (err instanceof Error && err.name === "AbortError") {
            console.error("[OwnershipChangesWidget] Request was aborted");
          }
        } finally {
          pendingOwnershipRequests.delete(cacheKey);
          setLoading(false);
        }
      },
      []
    ); // Remove all dependencies to prevent loops

    /**
     * Manual refresh function for user-triggered updates - always fetch fresh data
     */
    const handleManualRefresh = useCallback(() => {
      // Clear all cache and force fresh fetch
      cacheRef.current = null;
      pendingOwnershipRequests.clear();
      setData(null);
      setLoading(true);
      setError(null);
      fetchOwnershipChanges(true);
    }, []); // Remove fetchOwnershipChanges dependency

    // Auto-refresh effect with intelligent caching
    useEffect(() => {
      // Fetch data on mount - force fresh data
      fetchOwnershipChanges(true);

      // Set up interval for automatic refresh
      const interval = setInterval(() => {
        if (!loading) {
          fetchOwnershipChanges();
        }
      }, Math.max(refreshInterval, MIN_REFRESH_INTERVAL));

      return () => {
        clearInterval(interval);
        // Don't abort on cleanup to prevent "signal is aborted without reason"
        // The controller will naturally timeout or complete
      };
    }, [refreshInterval, MIN_REFRESH_INTERVAL]); // Remove fetchOwnershipChanges dependency

    // Cleanup on dependency change
    useEffect(() => {
      // Clear cache when dependencies change
      if (cacheRef.current && !isCacheValid(cacheRef.current)) {
        cacheRef.current = null;
        setData(null);
        setLoading(true);
        fetchOwnershipChanges();
      }
    }, [currentTimeframe, userTeamPlayerIds]); // Remove fetchOwnershipChanges and isCacheValid dependencies

    const formatOwnership = (ownership: number) => {
      return `${ownership.toFixed(1)}%`;
    };

    const formatOwnershipChange = (change: number) => {
      const formatted = Math.abs(change).toFixed(1);
      return change > 0 ? `+${formatted}%` : `-${formatted}%`;
    };

    const getTimeframeLabel = (tf: string) => {
      switch (tf) {
        case "1h":
          return "1h";
        case "24h":
          return "24h";
        case "week":
          return "1w";
        default:
          return "1h";
      }
    };

    if (loading) {
      return (
        <div
          className={`bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="text-theme-text-secondary w-4 h-4" />
              {t("teamPlanner.widgets.ownershipChanges")}
            </h3>
            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="text-theme-text-secondary w-4 h-4" />
              {t("teamPlanner.widgets.ownershipChanges")}
            </h3>
            <button
              onClick={handleManualRefresh}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm py-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 text-center">
            {error}
          </div>
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleManualRefresh}
              className="text-theme-text-secondary hover:text-theme-foreground text-sm underline"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Retry now"}
            </button>
          </div>
        </div>
      );
    }

    if (!data) {
      return null;
    }

    const userTeamSet = new Set(userTeamPlayerIds);

    const OwnershipRow = ({ player, direction, index }: { player: any; direction: "up" | "down"; index: number }) => {
      const colors = player.team_colors || getTeamColors(1);
      const isOwned = userTeamSet.has(player.player_id);
      const isUp = direction === "up";
      return (
        <motion.div
          key={player.player_id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ delay: index * 0.04 }}
          className={`flex items-center gap-2.5 p-2 rounded-lg transition-all border ${
            isOwned
              ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-800/40"
              : "bg-slate-50/60 dark:bg-slate-800/40 border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
          }`}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 relative"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}1a 0%, ${colors.primary}0d 100%)`,
            }}
          >
            <PiTShirtFill
              className="w-5 h-5"
              style={{
                color: colors.primary,
                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
              } as React.CSSProperties}
            />
            {isOwned && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3 h-3 rounded-full bg-indigo-500 text-white text-[7px] shadow-sm">
                ★
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {player.web_name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
              {player.team_name}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatOwnership(player.ownership)}
            </div>
            <div
              className={`mt-0.5 inline-flex items-center gap-0.5 px-1.5 rounded text-[10px] font-bold tabular-nums ${
                isUp
                  ? "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40"
                  : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
              }`}
            >
              {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {formatOwnershipChange(player.change)}
            </div>
          </div>
        </motion.div>
      );
    };

    return (
      <div className="relative overflow-hidden rounded-xl shadow-sm border border-sky-200/40 dark:border-sky-800/30 bg-gradient-to-br from-white via-sky-50/40 to-white dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 theme-transition">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-none">
                  {t("teamPlanner.widgets.ownershipChanges")}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("teamPlanner.widgets.ownershipFromTop10k")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Timeframe Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
                {(["1h", "24h", "week"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setCurrentTimeframe(tf)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${
                      currentTimeframe === tf
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300"
                    }`}
                  >
                    {getTimeframeLabel(tf)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="p-1 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                title={t("teamPlanner.widgets.refresh")}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Risers */}
            {data.risers.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 px-1 mb-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t("teamPlanner.widgets.risers")}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                    {data.risers.length}
                  </span>
                </h4>
                <div className="space-y-1">
                  <AnimatePresence>
                    {data.risers.map((player, index) => (
                      <OwnershipRow key={player.player_id} player={player} direction="up" index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Fallers */}
            {data.fallers.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 px-1 mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{t("teamPlanner.widgets.fallers")}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {data.fallers.length}
                  </span>
                </h4>
                <div className="space-y-1">
                  <AnimatePresence>
                    {data.fallers.map((player, index) => (
                      <OwnershipRow key={player.player_id} player={player} direction="down" index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{t("teamPlanner.widgets.updatedAt", { time: lastUpdate.toLocaleTimeString() })}</span>
                {cacheRef.current && isCacheValid(cacheRef.current) && (
                  <span className="text-emerald-500" title={t("teamPlanner.widgets.fromCache")}>
                    ({t("teamPlanner.widgets.cached")})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default OwnershipChangesWidget;
