"use client";

import React from "react";
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
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Status vašeg Gameweek {gameweek}
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Učitavam status gameweek-a...
        </div>
      </div>
    );
  }

  if (!gameweekStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Status vašeg Gameweek {gameweek}
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Učitajte tim da vidite status gameweek-a
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
        return `Zelena strelica sa marginom od ${Math.abs(
          rankChange
        ).toLocaleString()} bodova 👏`;
      case "red":
        return `Crvena strelica sa marginom od ${Math.abs(
          rankChange
        ).toLocaleString()} bodova 😔`;
      default:
        return "Nema promjene ranga u ovom gameweek-u";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Status vašeg Gameweek {gameweek}
      </h3>

      {/* Arrow Status */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
            Nalazite se na
          </span>
          {getArrowIcon(gameweekStatus.arrow_direction)}
          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
            {gameweekStatus.arrow_direction === "green"
              ? "Zelenoj strelici"
              : gameweekStatus.arrow_direction === "red"
              ? "Crvenoj strelici"
              : "Bez promjene"}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getArrowText(
            gameweekStatus.arrow_direction,
            gameweekStatus.rank_change
          )}
        </p>
      </div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <MdScoreboard className="text-blue-600 text-2xl mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">
              Gameweek bodovi
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {gameweekStatus.gameweek_points} points
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sigurnosni rezultat: {gameweekStatus.safety_score} bodova
          </div>
        </div>

        <div
          className={`text-center p-4 rounded-lg ${
            gameweekStatus.gameweek_points >= gameweekStatus.safety_score
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-orange-50 dark:bg-orange-900/20"
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
            <span className="font-medium text-gray-900 dark:text-white">
              Performanse
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
              ? "Iznad"
              : "Ispod"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sigurnosnog praga
          </div>
        </div>
      </div>

      {/* Differentials */}
      {gameweekStatus.differentials.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <MdCasino className="text-purple-600 text-xl mr-2" />
            Diferencijali
          </h4>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            % predstavlja uticaj. Primjer uticaja: +80% znači da za svaki 1 bod,
            dobijate 0.8 bodova
          </div>
          <div className="space-y-2">
            {gameweekStatus.differentials.map((differential) => (
              <div
                key={differential.player_id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-sm mr-3 text-xs text-white flex items-center justify-center">
                    <MdSports className="text-white text-sm" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {differential.web_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {differential.points} bodova
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      +{differential.impact_percentage.toFixed(1)}%
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
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <MdWarning className="text-red-500 text-xl mr-2" />
            Propušteni igrači
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
                    <div className="font-medium text-gray-900 dark:text-white">
                      {threat.web_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {threat.points} bodova
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <div className="font-medium text-red-600 dark:text-red-400">
                      -{threat.impact_percentage.toFixed(1)}%
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
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <MdStars className="text-yellow-500 text-xl mr-2" />
            Kapiten
          </h4>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {gameweekStatus.captain_analysis.web_name} završio sa{" "}
                  {gameweekStatus.captain_analysis.points} bodova
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {Math.abs(
                    gameweekStatus.captain_analysis.points_above_average
                  ).toFixed(1)}{" "}
                  bodova{" "}
                  {gameweekStatus.captain_analysis.is_above_average
                    ? "više"
                    : "manje"}{" "}
                  od prosječnog elite kapitena
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
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <MdGroups className="text-blue-500 text-xl mr-2" />
          Vaši klonovi u Top 1 milion
          <button className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Sakrij info o klonovima
          </button>
        </h4>
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          {gameweekStatus.clone_count} Igrača
        </div>
      </div>
    </div>
  );
});

export default GameweekStatus;
