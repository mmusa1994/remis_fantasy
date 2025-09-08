"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTeamColors } from "@/lib/team-colors";
import type { TransferTrendsWidgetData } from "@/types/fpl-enhanced";

// Widget-level cache to prevent redundant requests
interface WidgetCache {
  data: TransferTrendsWidgetData;
  timestamp: number;
  gameweek: number;
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

interface TransferTrendsWidgetProps {
  currentGameweek?: number;
  refreshInterval?: number;
  maxItems?: number;
  showFutureWeeks?: boolean;
}

const TransferTrendsWidget = React.memo<TransferTrendsWidgetProps>(
  function TransferTrendsWidget({
    currentGameweek = 4,
    refreshInterval = 900000, // 15 minutes
    maxItems = 5,
    showFutureWeeks = true,
  }: TransferTrendsWidgetProps) {
    const { theme } = useTheme();
    const { t } = useTranslation("fpl");
    const [data, setData] = useState<TransferTrendsWidgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<
      "current" | "players_in" | "players_out" | "future"
    >("current");

    // Component-level cache
    const cacheRef = useRef<WidgetCache | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cache configuration
    const CACHE_TTL = 900000; // 15 minutes
    const MIN_REFRESH_INTERVAL = 300000; // 5 minutes minimum between requests

    /**
     * Check if cached data is still fresh
     */
    const isCacheValid = useCallback(
      (cache: WidgetCache | null): boolean => {
        if (!cache) return false;

        const now = Date.now();
        const isDataFresh = now - cache.timestamp < CACHE_TTL;
        const isGameweekSame = cache.gameweek === currentGameweek;

        return isDataFresh && isGameweekSame;
      },
      [currentGameweek, CACHE_TTL]
    );

    /**
     * Generate cache key for request deduplication
     */
    const getCacheKey = useCallback((gameweek: number): string => {
      return `transfer_trends_${gameweek}`;
    }, []);

    /**
     * Optimized fetch function with request deduplication and caching
     */
    const fetchTransferTrends = useCallback(
      async (forceRefresh: boolean = false, gameweek: number = 4) => {
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

        const cacheKey = getCacheKey(currentGameweek);

        // Helper functions for this request
        const processSuccessfulResponse = (
          result: any,
          fallbackGameweek?: number
        ) => {
          if (result.success) {
            // Transform API data to widget format
            const widgetData = {
              current_transfers: result.data.current_week.popular_swaps
                .slice(0, maxItems)
                .map((swap: any) => ({
                  player_in: {
                    id: swap.player_in_id,
                    name: swap.player_in_name,
                    team: "Unknown",
                  },
                  player_out: {
                    id: swap.player_out_id,
                    name: swap.player_out_name,
                    team: "Unknown",
                  },
                  count: swap.transfer_count,
                })),
              top_players_in: result.data.current_week.top_transfers_in
                .slice(0, maxItems)
                .map((player: any) => ({
                  player_id: player.player_id,
                  web_name: player.web_name,
                  team_name: player.team_name,
                  transfers_count: player.transfers_in_count,
                  team_colors: getTeamColors(player.team_id || 1),
                })),
              top_players_out: result.data.current_week.top_transfers_out
                .slice(0, maxItems)
                .map((player: any) => ({
                  player_id: player.player_id,
                  web_name: player.web_name,
                  team_name: player.team_name,
                  transfers_count: player.transfers_out_count,
                  team_colors: getTeamColors(player.team_id || 1),
                })),
              future_transfers: result.data.future_weeks,
            };

            // Update cache
            const now = Date.now();
            cacheRef.current = {
              data: widgetData,
              timestamp: now,
              gameweek: currentGameweek,
            };

            setData(widgetData);
            setLastUpdate(new Date(now));
          } else if (fallbackGameweek) {
            throw new Error("no_data_fallback");
          } else {
            throw new Error(
              result.error || "API returned unsuccessful response"
            );
          }
        };

        const processErrorResponse = (err: any) => {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch data";
          console.error("[TransferTrendsWidget] Fetch error:", errorMessage);
          setError(errorMessage);
        };

        // Check if request is already pending (request deduplication)
        if (pendingRequests.has(cacheKey)) {
          try {
            const result = await pendingRequests.get(cacheKey);
            processSuccessfulResponse(result);
          } catch (err) {
            processErrorResponse(err);
          }
          return;
        }

        try {
          setError(null);
          if (forceRefresh) {
            setLoading(true);
          }

          // Create new abort controller (don't cancel previous to avoid "signal is aborted without reason")
          abortControllerRef.current = new AbortController();

          // Create and cache the request promise
          const requestPromise = fetch(
            `/api/fpl/transfer-analytics?gameweek=${gameweek}`,
            {
              signal: abortControllerRef.current.signal,
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          ).then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }
            return response.json();
          });

          pendingRequests.set(cacheKey, requestPromise);

          const result = await requestPromise;
          processSuccessfulResponse(
            result,
            gameweek > 3 ? gameweek - 1 : undefined
          );
        } catch (err) {
          // Handle fallback to previous gameweek if no data
          if (
            err instanceof Error &&
            err.message === "no_data_fallback" &&
            gameweek > 3
          ) {
            return fetchTransferTrends(forceRefresh, gameweek - 1);
          }

          // Only handle other errors if request wasn't aborted
          if (err instanceof Error && err.name !== "AbortError") {
            processErrorResponse(err);
          } else if (err instanceof Error && err.name === "AbortError") {
            console.error("[TransferTrendsWidget] Request was aborted");
          }
        } finally {
          pendingRequests.delete(cacheKey);
          setLoading(false);
        }
      },
      []
    ); // Remove all dependencies to prevent loops

    /**
     * Manual refresh function for user-triggered updates
     */
    const handleManualRefresh = useCallback(() => {
      fetchTransferTrends(true);
    }, []); // Remove fetchTransferTrends dependency

    // Auto-refresh effect with intelligent caching
    useEffect(() => {
      // Fetch data on mount
      fetchTransferTrends();

      // Set up interval for automatic refresh
      const interval = setInterval(() => {
        if (!loading) {
          fetchTransferTrends();
        }
      }, Math.max(refreshInterval, MIN_REFRESH_INTERVAL));

      return () => {
        clearInterval(interval);
        // Don't abort on cleanup to prevent "signal is aborted without reason"
        // The controller will naturally timeout or complete
      };
    }, [refreshInterval, MIN_REFRESH_INTERVAL]); // Remove fetchTransferTrends dependency

    // Cleanup on gameweek change
    useEffect(() => {
      // Clear cache when gameweek changes
      if (cacheRef.current && cacheRef.current.gameweek !== currentGameweek) {
        cacheRef.current = null;
        setData(null);
        setLoading(true);
        fetchTransferTrends();
      }
    }, [currentGameweek]); // Remove fetchTransferTrends dependency

    const formatTransferCount = (count: number) => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(0)}k`;
      }
      return count.toString();
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
              <ArrowRightLeft className="text-purple-500 w-5 h-5" />
              {t("teamPlanner.widgets.transferTrends")}
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
              <ArrowRightLeft className="text-purple-500 w-5 h-5" />
              {t("teamPlanner.widgets.transferTrends")}
            </h3>
            <button
              onClick={handleManualRefresh}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="text-red-500 text-sm text-center py-4">
            {error}
            <br />
            <button
              onClick={handleManualRefresh}
              className="text-blue-500 hover:text-blue-600 underline mt-2"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Try again"}
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
            <ArrowRightLeft className="text-purple-500 w-5 h-5" />
            Transfer Trends
          </h3>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 ${
              loading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            title="Refresh transfer trends"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1 mb-4 text-xs">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 px-2 py-1 rounded transition-colors ${
              activeTab === "current"
                ? "bg-purple-500 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("teamPlanner.widgets.swaps")}
          </button>
          <button
            onClick={() => setActiveTab("players_in")}
            className={`flex-1 px-2 py-1 rounded transition-colors ${
              activeTab === "players_in"
                ? "bg-purple-500 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("teamPlanner.widgets.in")}
          </button>
          <button
            onClick={() => setActiveTab("players_out")}
            className={`flex-1 px-2 py-1 rounded transition-colors ${
              activeTab === "players_out"
                ? "bg-purple-500 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("teamPlanner.widgets.out")}
          </button>
          {showFutureWeeks && (
            <button
              onClick={() => setActiveTab("future")}
              className={`flex-1 px-2 py-1 rounded transition-colors ${
                activeTab === "future"
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("teamPlanner.widgets.future")}
            </button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {/* Current Transfers (Swaps) */}
            {activeTab === "current" && (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("teamPlanner.widgets.topTransfers", { gw: currentGameweek })}
                </h4>
                {data.current_transfers.map((transfer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium truncate">
                        {transfer.player_out.name}
                      </span>
                      <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                      <span className="font-medium truncate">
                        {transfer.player_in.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-purple-600">
                      {formatTransferCount(transfer.count)}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Top Players In */}
            {activeTab === "players_in" && (
              <motion.div
                key="players_in"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {t("teamPlanner.widgets.topTransfers", { gw: currentGameweek })} {t("teamPlanner.widgets.in")}
                </h4>
                {data.top_players_in.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: player.team_colors.primary }}
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
                    <div className="text-sm font-bold text-green-600">
                      {formatTransferCount(player.transfers_count)}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Top Players Out */}
            {activeTab === "players_out" && (
              <motion.div
                key="players_out"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  {t("teamPlanner.widgets.topTransfers", { gw: currentGameweek })} {t("teamPlanner.widgets.out")}
                </h4>
                {data.top_players_out.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: player.team_colors.primary }}
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
                    <div className="text-sm font-bold text-red-600">
                      {formatTransferCount(player.transfers_count)}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Future Transfers */}
            {activeTab === "future" &&
              showFutureWeeks &&
              data.future_transfers && (
                <motion.div
                  key="future"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {t("teamPlanner.widgets.future")} Transfers
                  </h4>
                  {Object.entries(data.future_transfers)
                    .slice(0, 3)
                    .map(([week, transfers]) => (
                      <div key={week} className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Week {week}
                        </div>
                        {(transfers as any).planned_transfers
                          ?.slice(0, 3)
                          .map((transfer: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="truncate">
                                  {transfer.player_out_name}
                                </span>
                                <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                                <span className="truncate">
                                  {transfer.player_in_name}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-blue-600">
                                {transfer.transfer_count}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1">
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

export default TransferTrendsWidget;
