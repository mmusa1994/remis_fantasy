"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { FPLGameweekStatus } from "@/types/fpl";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdScoreboard,
  MdRocket,
  MdCasino,
  MdWarning,
  MdStars,
  MdSports,
  MdStar,
  MdThumbUp,
  MdThumbDown,
  MdRemove,
  MdFiberManualRecord,
} from "react-icons/md";

interface GameweekStatusProps {
  gameweekStatus?: FPLGameweekStatus;
  gameweek: number;
  loading?: boolean;
}

const GameweekStatus = React.memo(function GameweekStatus({
  gameweekStatus,
  gameweek,
  loading = false,
}: GameweekStatusProps) {
  const { t } = useTranslation("fpl");
  if (loading) {
    return (
      <div className="bg-theme-card border-theme-border rounded-lg shadow p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground theme-transition">
          {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
        </h3>
        <div className="text-center text-theme-text-secondary theme-transition">
          {t("fplLive.loadingGameweekStatus")}
        </div>
      </div>
    );
  }

  if (!gameweekStatus) {
    return (
      <div className="bg-theme-card border-theme-border rounded-lg shadow p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground theme-transition">
          {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
        </h3>
        <div className="text-center text-theme-text-secondary theme-transition">
          {t("fplLive.loadTeamToSeeGameweekStatus")}
        </div>
      </div>
    );
  }

  const getArrowIcon = (direction: "green" | "red" | "neutral") => {
    switch (direction) {
      case "green":
        return <MdTrendingUp className="text-green-500 text-2xl" />;
      case "red":
        return <MdTrendingDown className="text-red-500 text-2xl" />;
      default:
        return <MdTrendingFlat className="text-gray-500 text-2xl" />;
    }
  };

  const getArrowText = (
    direction: "green" | "red" | "neutral",
    rankChange: number
  ) => {
    switch (direction) {
      case "green":
        return t("fplLive.greenArrowWithMargin", {
          points: Math.abs(rankChange).toLocaleString(),
        });
      case "red":
        return t("fplLive.redArrowWithMargin", {
          points: Math.abs(rankChange).toLocaleString(),
        });
      default:
        return t("fplLive.noRankChangeThisGameweek");
    }
  };

  const getImpactIcon = (isPositive: boolean, impactPercentage: number) => {
    if (isPositive && impactPercentage > 50)
      return <MdStar className="text-yellow-500" />;
    if (isPositive && impactPercentage > 20)
      return <MdThumbUp className="text-green-500" />;
    if (!isPositive && impactPercentage > 50)
      return <MdThumbDown className="text-red-500" />;
    if (!isPositive && impactPercentage > 20)
      return <MdRemove className="text-orange-500" />;
    return <MdFiberManualRecord className="text-gray-400" />;
  };

  return (
    <div className="bg-theme-card border-theme-border rounded-lg shadow p-6 theme-transition">
      <h3 className="text-lg font-semibold mb-6 text-theme-foreground theme-transition">
        {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
      </h3>

      {/* Arrow Status */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="text-sm text-theme-text-secondary mr-2 theme-transition">
            {t("fplLive.youAreOn")}
          </span>
          {getArrowIcon(gameweekStatus.arrow_direction)}
          <span className="ml-2 font-semibold text-theme-foreground theme-transition">
            {gameweekStatus.arrow_direction === "green"
              ? t("fplLive.greenArrow")
              : gameweekStatus.arrow_direction === "red"
              ? t("fplLive.redArrow")
              : t("fplLive.noChange")}
          </span>
        </div>
        <p className="text-sm text-theme-text-secondary theme-transition">
          {getArrowText(
            gameweekStatus.arrow_direction,
            gameweekStatus.rank_change
          )}
        </p>
      </div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-theme-card-secondary border-theme-border rounded-lg theme-transition">
          <div className="flex items-center justify-center mb-2">
            <MdScoreboard className="text-blue-600 text-2xl mr-2" />
            <span className="font-medium text-theme-foreground theme-transition">
              {t("fplLive.gameweekPoints")}
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {gameweekStatus.gameweek_points}
          </div>
          <div className="text-xs text-theme-text-secondary mt-1 theme-transition">
            {t("fplLive.points")}
          </div>
        </div>

        <div className="text-center p-4 bg-theme-card-secondary border-theme-border rounded-lg theme-transition">
          <div className="flex items-center justify-center mb-2">
            <MdScoreboard className="text-orange-600 text-2xl mr-2" />
            <span className="font-medium text-theme-foreground theme-transition">
              {t("fplLive.averageGameWeekResult")}
            </span>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {gameweek === 2 ? 51 : gameweekStatus.safety_score}
          </div>
          <div className="text-xs text-theme-text-secondary mt-1 theme-transition">
            {t("fplLive.safetyThreshold")}
          </div>
        </div>

        <div
          className={`text-center p-4 rounded-lg ${
            gameweekStatus.gameweek_points >=
            (gameweek === 2 ? 51 : gameweekStatus.safety_score)
              ? "bg-green-50 dark:bg-green-900/10"
              : "bg-red-50 dark:bg-red-900/10"
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <MdRocket
              className={`text-2xl mr-2 ${
                gameweekStatus.gameweek_points >=
                (gameweek === 2 ? 51 : gameweekStatus.safety_score)
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            />
            <span className="font-medium text-theme-foreground theme-transition">
              {t("fplLive.performance")}
            </span>
          </div>
          <div
            className={`text-3xl font-bold ${
              gameweekStatus.gameweek_points >=
              (gameweek === 2 ? 51 : gameweekStatus.safety_score)
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {gameweekStatus.gameweek_points >=
            (gameweek === 2 ? 51 : gameweekStatus.safety_score)
              ? t("fplLive.above")
              : t("fplLive.below")}
          </div>
          <div className="text-xs text-theme-text-secondary mt-1 theme-transition">
            {gameweekStatus.gameweek_points >=
            (gameweek === 2 ? 51 : gameweekStatus.safety_score)
              ? "+"
              : "-"}
            {Math.abs(
              gameweekStatus.gameweek_points -
                (gameweek === 2 ? 51 : gameweekStatus.safety_score)
            )}{" "}
            {t("fplLive.points")}
          </div>
        </div>
      </div>

      {/* Differentials */}
      {gameweekStatus.differentials.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-theme-primary mb-3 flex items-center">
            <MdCasino className="text-purple-600 text-xl mr-2" />
            {t("fplLive.differentials")}
          </h4>
          <div className="text-xs text-theme-muted mb-3">
            {t("fplLive.differentialsExplanation")}
          </div>
          <div className="space-y-2">
            {gameweekStatus.differentials.map((differential) => (
              <div
                key={differential.player_id}
                className="flex items-center justify-between p-3 bg-theme-accent rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-sm mr-3 text-xs text-white flex items-center justify-center">
                    <MdSports className="text-white text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-theme-primary">
                      {differential.web_name}
                    </div>
                    <div className="text-sm text-theme-muted">
                      {differential.points} {t("fplLive.points")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      +{differential.impact_percentage.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-xl">
                    {getImpactIcon(
                      differential.is_positive,
                      differential.impact_percentage
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threats */}
      {gameweekStatus.threats.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-theme-primary mb-3 flex items-center">
            <MdWarning className="text-red-500 text-xl mr-2" />
            {t("fplLive.playersNotMakingDifference")}
          </h4>
          <div className="space-y-2">
            {gameweekStatus.threats.map((threat) => (
              <div
                key={threat.player_id}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-600 rounded-sm mr-3 text-xs text-white flex items-center justify-center">
                    <MdSports className="text-white text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-theme-primary">
                      {threat.web_name}
                    </div>
                    <div className="text-sm text-theme-muted">
                      {threat.points} {t("fplLive.points")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <div className="font-medium text-red-600 dark:text-red-400">
                      -{threat.impact_percentage.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-xl">
                    {getImpactIcon(
                      threat.is_positive,
                      threat.impact_percentage
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captain Analysis */}
      {gameweekStatus.captain_analysis && (
        <div className="mb-6">
          <h4 className="font-medium text-theme-primary mb-3 flex items-center">
            <MdStars className="text-yellow-500 text-xl mr-2" />
            {t("fplLive.captainLong")}
          </h4>
          <div
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
              gameweekStatus.captain_analysis.is_above_average
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`font-medium ${
                    gameweekStatus.captain_analysis.is_above_average
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {gameweekStatus.captain_analysis.web_name}{" "}
                  {t("fplLive.finishedWith")}{" "}
                  {gameweekStatus.captain_analysis.points} {t("fplLive.points")}
                </div>
                <div
                  className={`text-sm mt-1 ${
                    gameweekStatus.captain_analysis.is_above_average
                      ? "text-green-600 dark:text-green-300"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {Math.abs(
                    gameweekStatus.captain_analysis.points_above_average
                  ).toFixed(1)}{" "}
                  {gameweekStatus.captain_analysis.is_above_average
                    ? t("fplLive.pointsAboveAverage")
                    : t("fplLive.pointsBelowAverage")}
                </div>
              </div>
              <div className="text-2xl">
                {gameweekStatus.captain_analysis.is_above_average ? (
                  <MdThumbUp className="text-green-600 dark:text-green-400 hover:scale-110 transition-transform duration-200" />
                ) : (
                  <MdThumbDown className="text-red-600 dark:text-red-400 hover:scale-110 transition-transform duration-200" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GameweekStatus;
