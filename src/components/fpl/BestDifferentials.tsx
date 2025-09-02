"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MdTrendingUp } from "react-icons/md";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";
import LoadingCard from "@/components/shared/LoadingCard";

interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  selected_by_percent: number;
  event_points: number;
  total_points: number;
  form: number;
}

export default function BestDifferentials() {
  const { t } = useTranslation("fpl");
  const [loading, setLoading] = useState(false);
  const [topDifferentials, setTopDifferentials] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDiamondData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/bootstrap-static");
      if (!response.ok) {
        throw new Error("Failed to fetch FPL data");
      }

      const data = await response.json();
      if (data.success && data.data) {
        const players = data.data.elements || [];

        // Find best differentials
        const differentials = findBestDifferentials(players);
        setTopDifferentials(differentials);
      }
    } catch (error) {
      console.error("Error fetching differentials data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiamondData();
  }, [fetchDiamondData]);

  const findBestDifferentials = (players: any[]): Player[] => {
    return players
      .filter(
        (player) =>
          player.selected_by_percent < 15 && // Increased to catch Timber/Calafiori (under 15%)
          parseFloat(player.form) >= 5.0 && // Lowered to catch more quality players
          player.total_points >= 12 && // Lowered to catch more options
          player.minutes >= 60 // Lowered minute requirement
      )
      .sort((a, b) => {
        // Enhanced scoring: prioritize form and total points, penalize high ownership
        const scoreA =
          (parseFloat(a.form) * 3 + a.total_points * 0.8) /
          Math.max(1, a.selected_by_percent / 5);
        const scoreB =
          (parseFloat(b.form) * 3 + b.total_points * 0.8) /
          Math.max(1, b.selected_by_percent / 5);

        return scoreB - scoreA;
      })
      .slice(0, 5);
  };

  const getPositionName = (elementType: number) => {
    switch (elementType) {
      case 1:
        return "GKP";
      case 2:
        return "DEF";
      case 3:
        return "MID";
      case 4:
        return "FWD";
      default:
        return "UNK";
    }
  };

  const getPositionColor = (elementType: number) => {
    switch (elementType) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-green-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <LoadingCard title={t("diamond.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("common.error")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (topDifferentials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t("diamond.noDifferentials")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/90 to-blue-600/90 rounded-xl shadow-lg p-6 border border-purple-300/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MdTrendingUp className="text-3xl text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {t("diamond.bestDifferentials")}
            </h2>
            <p className="text-purple-100 text-sm">{t("diamond.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("diamond.bestDifferentials")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("diamond.differentialsDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {topDifferentials.map((player, index) => (
            <div
              key={player.id}
              className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium text-white ${getPositionColor(
                      player.element_type
                    )}`}
                  >
                    {getPositionName(player.element_type)}
                  </span>
                  <PiTShirtFill
                    className="w-5 h-5"
                    style={{ color: getTeamColors(player.team).primary }}
                  />
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  #{index + 1}
                </span>
              </div>

              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {player.web_name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {getTeamColors(player.team).shortName}
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("diamond.ownership")}:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {player.selected_by_percent}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("diamond.form")}:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400 ml-1">
                    {player.form}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("diamond.price")}:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    £{(player.now_cost / 10).toFixed(1)}m
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("diamond.points")}:
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
                    {player.total_points}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
