"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTeamColors } from "@/lib/team-colors";
import type { PriceChangesWidgetData } from "@/types/fpl-enhanced";

interface PriceChangesWidgetProps {
  userTeamPlayerIds?: number[];
  refreshInterval?: number;
  maxItems?: number;
}

export default function PriceChangesWidget({
  userTeamPlayerIds = [],
  refreshInterval = 60000,
  maxItems = 10,
}: PriceChangesWidgetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation("fpl");
  const [data, setData] = useState<PriceChangesWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(5);
  const [risersOpen, setRisersOpen] = useState(true);
  const [fallersOpen, setFallersOpen] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPriceChanges = useCallback(
    async (gameweek: number = 4) => {
      try {
        setError(null);
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
                team_colors: getTeamColors(player.team_id || 1),
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
          return fetchPriceChanges(gameweek - 1);
        } else {
          throw new Error(result.error || "No data available");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          if (gameweek > 3) {
            return fetchPriceChanges(gameweek - 1);
          }
          setError(
            "FPL API appears unavailable. Price changes could not be loaded."
          );
        } else if (!(err instanceof Error) || err.name !== "AbortError") {
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
    const interval = setInterval(() => fetchPriceChanges(), refreshInterval);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchPriceChanges, refreshInterval]);

  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}`;

  const formatPriceChange = (change: number) => {
    const formatted = (change / 10).toFixed(1);
    return change > 0 ? `+${formatted}` : formatted;
  };

  if (loading) {
    return (
      <div className="bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <PoundSterling className="text-theme-text-secondary w-4 h-4" />
            {t("teamPlanner.widgets.priceChanges")}
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
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <PoundSterling className="text-theme-text-secondary w-4 h-4" />
            {t("teamPlanner.widgets.priceChanges")}
          </h3>
          <button
            onClick={() => fetchPriceChanges()}
            className="text-theme-text-secondary hover:text-theme-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-theme-text-secondary text-center py-3">
          {error}
          <br />
          <button
            onClick={() => fetchPriceChanges()}
            className="text-theme-text-secondary hover:text-theme-foreground underline mt-2"
          >
            Retry now
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-theme-card rounded-lg p-4 shadow-sm border border-theme-border theme-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <PoundSterling className="text-theme-text-secondary w-4 h-4" />
          {t("teamPlanner.widgets.priceChanges")}
        </h3>
        <div className="flex items-center gap-2">
          {/* Dropdown: show count */}
          <div className="relative">
            <select
              value={showCount}
              onChange={(e) => setShowCount(Number(e.target.value))}
              className="appearance-none pl-2 pr-6 py-1 bg-theme-card-secondary border border-theme-border rounded text-xs text-theme-foreground focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>All</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text-secondary pointer-events-none" />
          </div>
          <button
            onClick={() => fetchPriceChanges()}
            className="text-theme-text-secondary hover:text-theme-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* User Team Impact */}
      {data.user_team_impact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2.5 rounded-lg bg-theme-card-secondary border border-theme-border"
        >
          <div className="text-xs font-medium text-theme-foreground">
            {t("teamPlanner.widgets.yourTeamImpact")}:{" "}
            <span className={data.user_team_impact.total_value_change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {formatPriceChange(data.user_team_impact.total_value_change)}
            </span>
          </div>
          <div className="text-xs text-theme-text-secondary">
            {data.user_team_impact.affected_players} {t("teamPlanner.widgets.playersAffected")}
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {/* Risers Accordion */}
        {data.risers.length > 0 && (
          <div>
            <button
              onClick={() => setRisersOpen(!risersOpen)}
              className="w-full flex items-center justify-between py-1.5 text-sm font-semibold text-theme-text-secondary hover:text-theme-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {t("teamPlanner.widgets.risers")}
                <span className="text-xs font-normal">({data.risers.length})</span>
              </div>
              {risersOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {risersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1">
                    {data.risers.slice(0, showCount).map((player, index) => (
                      <motion.div
                        key={player.player_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-theme-card-secondary hover:bg-theme-card-secondary/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: player.team_colors.primary }}
                          >
                            {player.web_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-theme-foreground truncate">
                              {player.web_name}
                            </p>
                            <p className="text-xs text-theme-text-secondary truncate">
                              {player.team_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs font-medium text-theme-foreground tabular-nums">
                            {formatPrice(player.old_price)} → {formatPrice(player.new_price)}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 tabular-nums">
                            {formatPriceChange(player.change)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Fallers Accordion */}
        {data.fallers.length > 0 && (
          <div>
            <button
              onClick={() => setFallersOpen(!fallersOpen)}
              className="w-full flex items-center justify-between py-1.5 text-sm font-semibold text-theme-text-secondary hover:text-theme-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {t("teamPlanner.widgets.fallers")}
                <span className="text-xs font-normal">({data.fallers.length})</span>
              </div>
              {fallersOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {fallersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1">
                    {data.fallers.slice(0, showCount).map((player, index) => (
                      <motion.div
                        key={player.player_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-theme-card-secondary hover:bg-theme-card-secondary/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: player.team_colors.primary }}
                          >
                            {player.web_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-theme-foreground truncate">
                              {player.web_name}
                            </p>
                            <p className="text-xs text-theme-text-secondary truncate">
                              {player.team_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs font-medium text-theme-foreground tabular-nums">
                            {formatPrice(player.old_price)} → {formatPrice(player.new_price)}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 tabular-nums">
                            {formatPriceChange(player.change)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-theme-text-secondary text-center pt-2 border-t border-theme-border">
            {t("teamPlanner.widgets.lastUpdated")}: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
