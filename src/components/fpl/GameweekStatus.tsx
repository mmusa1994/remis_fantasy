"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { GameweekStatus } from "@/lib/fpl-api";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdScoreboard,
  MdRocket,
  MdCasino,
  MdWarning,
  MdStars,
  MdGroups,
  MdSports,
  MdStar,
  MdThumbUp,
  MdThumbDown,
  MdRemove,
  MdFiberManualRecord,
} from "react-icons/md";

interface GameweekStatusProps {
  gameweekStatus?: GameweekStatus;
  gameweek: number;
  loading?: boolean;
}

const GameweekStatus = React.memo(function GameweekStatus({
  gameweekStatus,
  gameweek,
  loading = false,
}: GameweekStatusProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="bg-theme-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-theme-primary">
          {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
        </h3>
        <div className="text-center text-theme-muted">
          {t("fplLive.loadingGameweekStatus")}
        </div>
      </div>
    );
  }

  if (!gameweekStatus) {
    return (
      <div className="bg-theme-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-theme-primary">
          {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
        </h3>
        <div className="text-center text-theme-muted">
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
    <div className="bg-theme-card rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6 text-theme-primary">
        {t("fplLive.gameweekStatusTitle", { gw: gameweek || 1 })}
      </h3>

      {/* Arrow Status */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="text-sm text-theme-muted mr-2">
            {t("fplLive.youAreOn")}
          </span>
          {getArrowIcon(gameweekStatus.arrow_direction)}
          <span className="ml-2 font-semibold text-theme-primary">
            {gameweekStatus.arrow_direction === "green"
              ? t("fplLive.greenArrow")
              : gameweekStatus.arrow_direction === "red"
              ? t("fplLive.redArrow")
              : t("fplLive.noChange")}
          </span>
        </div>
        <p className="text-sm text-theme-muted">
          {getArrowText(
            gameweekStatus.arrow_direction,
            gameweekStatus.rank_change
          )}
        </p>
      </div>

      {/* Points Breakdown */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 text-center p-4 bg-theme-accent rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <MdScoreboard className="text-blue-600 text-2xl mr-2" />
            <span className="font-medium text-theme-primary">
              {t("fplLive.gameweekPoints")}
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {gameweekStatus.gameweek_points} {t("fplLive.points")}
          </div>
          <div className="text-sm text-theme-muted mt-1">
            {t("fplLive.averageResult", {
              points: gameweekStatus.safety_score,
            })}
          </div>
        </div>

        <div
          className={`flex-1 text-center p-4 rounded-lg ${
            gameweekStatus.gameweek_points >= gameweekStatus.safety_score
              ? "bg-theme-accent"
              : "bg-theme-accent"
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <MdRocket
              className={`text-2xl mr-2 ${
                gameweekStatus.gameweek_points >= gameweekStatus.safety_score
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            />
            <span className="font-medium text-theme-primary">
              {t("fplLive.performance")}
            </span>
          </div>
          <div
            className={`text-3xl font-bold ${
              gameweekStatus.gameweek_points >= gameweekStatus.safety_score
                ? "text-green-600 dark:text-green-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {gameweekStatus.gameweek_points >= gameweekStatus.safety_score
              ? t("fplLive.above")
              : t("fplLive.below")}
          </div>
          <div className="text-sm text-theme-muted mt-1">
            {t("fplLive.safetyThreshold")}
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
          <div className="p-4 bg-theme-accent rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-primary">
                  {gameweekStatus.captain_analysis.web_name}{" "}
                  {t("fplLive.finishedWith")}{" "}
                  {gameweekStatus.captain_analysis.points} {t("fplLive.points")}
                </div>
                <div className="text-sm text-theme-muted mt-1">
                  {t("fplLive.pointsAboveAverage", {
                    points: Math.abs(
                      gameweekStatus.captain_analysis.points_above_average
                    ).toFixed(2),
                    direction: gameweekStatus.captain_analysis.is_above_average
                      ? t("fplLive.higher")
                      : t("fplLive.lower"),
                  })}
                </div>
              </div>
              <div className="text-2xl">
                {gameweekStatus.captain_analysis.is_above_average ? (
                  <MdThumbUp className="text-green-500" />
                ) : (
                  <MdThumbDown className="text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clone Information */}
      <div>
        <h4 className="font-medium text-theme-primary mb-3 flex items-center">
          <MdGroups className="text-blue-500 text-xl mr-2" />
          {t("fplLive.yourClonesInTop1Million")}
          <button className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {t("fplLive.hideClonesInfo")}
          </button>
        </h4>
        <div className="text-center text-theme-muted py-4">
          {gameweekStatus.clone_count} {t("fplLive.players")}
        </div>
      </div>
    </div>
  );
});

export default GameweekStatus;
