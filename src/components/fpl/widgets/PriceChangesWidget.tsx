"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTeamColors } from "@/lib/team-colors";
import type { PriceChangesWidgetData } from "@/types/fpl-enhanced";

interface PriceChangesWidgetProps {
  userTeamPlayerIds?: number[];
  refreshInterval?: number; // in milliseconds
  maxItems?: number;
}

export default function PriceChangesWidget({
  userTeamPlayerIds = [],
  refreshInterval = 60000, // 1 minute
  maxItems = 10,
}: PriceChangesWidgetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation("fpl");
  const [data, setData] = useState<PriceChangesWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPriceChanges = useCallback(
    async (gameweek: number = 4) => {
      try {
        setError(null);

        // Create abort controller
        abortControllerRef.current = new AbortController();

        const params = new URLSearchParams();
        if (userTeamPlayerIds.length > 0) {
          params.append("teamIds", userTeamPlayerIds.join(","));
        }
        params.append("gameweek", gameweek.toString());

        const response = await fetch(`/api/fpl/price-changes?${params}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(
            "FPL API appears unavailable. Price changes could not be loaded."
          );
        }

        const result = await response.json();
        if (result.success) {
          // Transform API data to widget format
          const widgetData: PriceChangesWidgetData = {
            risers: result.data.risers
              .slice(0, maxItems)
              .map((player: any) => ({
                player_id: player.player_id,
                web_name: player.web_name,
                team_name: player.team_name,
                old_price: player.old_price,
                new_price: player.new_price,
                change: player.change_amount,
                team_colors: getTeamColors(player.team_id || 1), // Fallback to team 1
              })),
            fallers: result.data.fallers
              .slice(0, maxItems)
              .map((player: any) => ({
                player_id: player.player_id,
                web_name: player.web_name,
                team_name: player.team_name,
                old_price: player.old_price,
                new_price: player.new_price,
                change: player.change_amount,
                team_colors: getTeamColors(player.team_id || 1),
              })),
            user_team_impact: result.data.user_team_impact,
          };

          setData(widgetData);
          setLastUpdate(new Date());
        } else if (gameweek > 3) {
          // Try fallback to previous gameweek
          return fetchPriceChanges(gameweek - 1);
        } else {
          throw new Error(result.error || "No data available");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          // Try fallback to previous gameweek if current one fails
          if (gameweek > 3) {
            return fetchPriceChanges(gameweek - 1);
          }
          setError(
            "FPL API appears unavailable. Price changes could not be loaded."
          );
        } else if (err instanceof Error && err.name === "AbortError") {
        } else {
          setError(
            "FPL API appears unavailable. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [userTeamPlayerIds, maxItems]
  );

  useEffect(() => {
    fetchPriceChanges();

    // Set up refresh interval
    const interval = setInterval(() => fetchPriceChanges(), refreshInterval);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchPriceChanges, refreshInterval]);

  const formatPrice = (price: number) => {
    return `£${(price / 10).toFixed(1)}`;
  };

  const formatPriceChange = (change: number) => {
    const formatted = (change / 10).toFixed(1);
    return change > 0 ? `+${formatted}` : formatted;
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
            <DollarSign className="text-green-500 w-5 h-5" />
            {t("teamPlanner.widgets.priceChanges")}
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
            <DollarSign className="text-green-500 w-5 h-5" />
            {t("teamPlanner.widgets.priceChanges")}
          </h3>
          <button
            onClick={() => fetchPriceChanges()}
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
            onClick={() => fetchPriceChanges()}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Retry now
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={`${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <DollarSign className="text-green-500 w-5 h-5" />
          Price Changes
        </h3>
        <button
          onClick={() => fetchPriceChanges()}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* User Team Impact */}
      {data.user_team_impact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg ${
            data.user_team_impact.total_value_change >= 0
              ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="text-sm font-medium">
            {t("teamPlanner.widgets.yourTeamImpact")}:{" "}
            {formatPriceChange(data.user_team_impact.total_value_change)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {data.user_team_impact.affected_players} {t("teamPlanner.widgets.playersAffected")}
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Risers */}
        {data.risers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              {t("teamPlanner.widgets.risers")}
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
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">
                        {formatPrice(player.old_price)} →{" "}
                        {formatPrice(player.new_price)}
                      </div>
                      <div className="text-xs text-green-500">
                        {formatPriceChange(player.change)}
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
              {t("teamPlanner.widgets.fallers")}
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
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {formatPrice(player.old_price)} →{" "}
                        {formatPrice(player.new_price)}
                      </div>
                      <div className="text-xs text-red-500">
                        {formatPriceChange(player.change)}
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
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            {t("teamPlanner.widgets.lastUpdated")}: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
