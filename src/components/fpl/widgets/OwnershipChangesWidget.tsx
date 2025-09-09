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
} from "lucide-react";
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
                const playerWithColors = {
                  ...player,
                  team_colors: getTeamColors(player.team_name),
                  change:
                    player.ownership_change_24h ||
                    player.ownership_change_1h ||
                    0,
                  ownership: player.current_ownership,
                };

                if (player.ownership_trend === "rising") {
                  risers.push(playerWithColors);
                } else if (player.ownership_trend === "falling") {
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
                  change:
                    player.ownership_change_24h ||
                    player.ownership_change_1h ||
                    0,
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
                change:
                  player.ownership_change_24h ||
                  player.ownership_change_1h ||
                  0,
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
          className={`${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="text-blue-500 w-5 h-5" />
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
          className={`${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="text-blue-500 w-5 h-5" />
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
              className="text-blue-600 hover:text-blue-700 text-sm underline"
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

    return (
      <div
        className={`${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="text-blue-500 w-5 h-5" />
            Ownership Changes
          </h3>
          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
              {(["1h", "24h", "week"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setCurrentTimeframe(tf)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    currentTimeframe === tf
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {getTimeframeLabel(tf)}
                </button>
              ))}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 ${
                loading ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              title="Refresh ownership changes"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Risers */}
          {data.risers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                {t("teamPlanner.widgets.risers")} ({getTimeframeLabel(data.timeframe)})
              </h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {data.risers.map((player, index) => (
                    <motion.div
                      key={player.player_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            backgroundColor: player.team_colors.primary,
                          }}
                        >
                          {player.web_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {player.web_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {player.team_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {formatOwnership(player.ownership)}
                        </div>
                        <div className="text-xs text-green-500">
                          {formatOwnershipChange(player.change)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Fallers */}
          {data.fallers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-600">
                <TrendingDown className="w-4 h-4" />
                {t("teamPlanner.widgets.fallers")} ({getTimeframeLabel(data.timeframe)})
              </h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {data.fallers.map((player, index) => (
                    <motion.div
                      key={player.player_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            backgroundColor: player.team_colors.primary,
                          }}
                        >
                          {player.web_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {player.web_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {player.team_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {formatOwnership(player.ownership)}
                        </div>
                        <div className="text-xs text-red-500">
                          {formatOwnershipChange(player.change)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{t("teamPlanner.widgets.lastUpdated")}: {lastUpdate.toLocaleTimeString()}</span>
              {cacheRef.current && isCacheValid(cacheRef.current) && (
                <span className="text-green-500" title="Data from cache">
                  ({t("teamPlanner.widgets.cached")})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default OwnershipChangesWidget;
