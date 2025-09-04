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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ChipStrategiesWidgetData } from "@/types/fpl-enhanced";

interface ChipStrategiesWidgetProps {
  refreshInterval?: number;
  showRecommendations?: boolean;
  maxWeeksShown?: number;
}

export default function ChipStrategiesWidget({
  refreshInterval = 1800000, // 30 minutes
  showRecommendations = true,
  maxWeeksShown = 5,
}: ChipStrategiesWidgetProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<ChipStrategiesWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<
    "wildcard" | "freehit" | "benchboost" | "triplecaptain"
  >("wildcard");

  // Cache to prevent redundant requests
  const cacheRef = useRef<{
    data: ChipStrategiesWidgetData;
    timestamp: number;
  } | null>(null);
  const CACHE_TTL = 1800000; // 30 minutes

  const fetchChipStrategies = useCallback(
    async (forceRefresh: boolean = false) => {
      // Check cache first
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
        const response = await fetch("/api/fpl/chip-analytics");

        if (!response.ok) {
          throw new Error("Failed to fetch chip strategies");
        }

        const result = await response.json();
        if (result.success) {
          // Transform API data to widget format
          const widgetData: ChipStrategiesWidgetData = {
            chips: result.data.strategies.map((strategy: any) => ({
              type: strategy.chip_type,
              optimal_weeks: strategy.current_season_trends
                .slice(0, maxWeeksShown)
                .map((usage: any) => ({
                  week: usage.gameweek,
                  usage_count: usage.usage_count,
                  success_rate: usage.success_rate,
                })),
              current_season_trend: strategy.usage_pattern,
            })),
            recommendations: result.data.personalized_recommendations
              ? {
                  next_chip:
                    result.data.personalized_recommendations.next_optimal_chip,
                  recommended_week:
                    result.data.personalized_recommendations.recommended_week,
                  confidence: 85, // Mock confidence score
                }
              : undefined,
          };

          setData(widgetData);
          setLastUpdate(new Date());

          // Cache the result
          cacheRef.current = {
            data: widgetData,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    []
  ); // Remove all dependencies to prevent loops

  const handleManualRefresh = useCallback(() => {
    fetchChipStrategies(true);
  }, []);

  useEffect(() => {
    // Fetch data on mount
    fetchChipStrategies();

    const interval = setInterval(() => {
      if (!loading) {
        fetchChipStrategies();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]); // Remove fetchChipStrategies dependency

  const getChipIcon = (chipType: string) => {
    switch (chipType) {
      case "wildcard":
        return <Star className="w-4 h-4" />;
      case "freehit":
        return <Target className="w-4 h-4" />;
      case "benchboost":
        return <TrendingUp className="w-4 h-4" />;
      case "triplecaptain":
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getChipColor = (chipType: string) => {
    switch (chipType) {
      case "wildcard":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      case "freehit":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "benchboost":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "triplecaptain":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatChipName = (chipType: string) => {
    switch (chipType) {
      case "wildcard":
        return "Wildcard";
      case "freehit":
        return "Free Hit";
      case "benchboost":
        return "Bench Boost";
      case "triplecaptain":
        return "Triple Captain";
      default:
        return chipType;
    }
  };

  const formatUsageCount = (count: number) => {
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
            <Zap className="text-yellow-500 w-5 h-5" />
            Chip Strategies
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
            <Zap className="text-yellow-500 w-5 h-5" />
            Chip Strategies
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
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    console.error("🔍 ChipStrategiesWidget: No data available", {
      loading,
      error,
    });
    return null;
  }

  const activeChipData = data.chips.find((chip) => chip.type === activeChip);

  return (
    <div
      className={`${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Zap className="text-yellow-500 w-5 h-5" />
          Chip Strategies
        </h3>
        <button
          onClick={handleManualRefresh}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Recommendations */}
      {showRecommendations && data.recommendations && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Recommendation
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">
              {formatChipName(data.recommendations.next_chip)}
            </span>{" "}
            in Week {data.recommendations.recommended_week}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Confidence: {data.recommendations.confidence}%
          </div>
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
                ? getChipColor(chip.type)
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              {getChipIcon(chip.type)}
              <span>{formatChipName(chip.type)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Chip Data */}
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
              <div className={`p-2 rounded-lg ${getChipColor(activeChip)}`}>
                {getChipIcon(activeChip)}
              </div>
              <div>
                <h4 className="text-sm font-semibold">
                  {formatChipName(activeChip)}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeChipData.current_season_trend} usage pattern
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Popular Weeks
              </h5>
              {activeChipData.optimal_weeks.map((week, index) => (
                <motion.div
                  key={week.week}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                      {week.week}
                    </div>
                    <span className="text-sm font-medium">
                      Week {week.week}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {formatUsageCount(week.usage_count)}
                    </div>
                    {week.success_rate && (
                      <div className="text-xs text-green-600">
                        {week.success_rate}% success
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
