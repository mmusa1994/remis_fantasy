"use client";

import React from "react";
import { PiTShirtLight, PiTShirtFill } from "react-icons/pi";
import { TbUsers } from "react-icons/tb";
import { GiSoccerKick } from "react-icons/gi";
import { getTeamColors } from "@/lib/team-colors";
import { useTranslation } from "react-i18next";

interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
}

interface LiveStats {
  player_id: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  total_points: number;
  influence: number;
  creativity: number;
  threat: number;
  ict_index: number;
}

interface TeamPick {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: Player;
  live_stats: LiveStats | null;
}

interface PredictedBonus {
  player_id: number;
  predicted_bonus: number;
}

interface SquadTableProps {
  teamData: TeamPick[];
  predictedBonuses: PredictedBonus[];
  bonusAdded: boolean;
}

const POSITION_NAMES = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

const SquadTable = React.memo(function SquadTable({
  teamData,
  predictedBonuses,
  bonusAdded,
}: SquadTableProps) {
  const { t } = useTranslation("fpl");
  if (!teamData || teamData.length === 0) {
    return (
      <div className="bg-theme-card border-theme-border rounded-lg p-4 sm:p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground theme-transition">
          {t("fplLive.squad")}
        </h3>
        <div className="text-center text-theme-text-secondary theme-transition">
          {t("fplLive.loadTeamToSeeSquad")}
        </div>
      </div>
    );
  }

  const starters = teamData
    .filter((pick) => pick.position <= 11)
    .sort((a, b) => a.position - b.position);
  const bench = teamData
    .filter((pick) => pick.position > 11)
    .sort((a, b) => a.position - b.position);

  // Calculate starting XI totals (with multipliers)
  const startingXITotalPoints = starters.reduce((sum, pick) => {
    const stats = pick.live_stats;
    const totalPoints = stats?.total_points || 0;
    return sum + totalPoints * pick.multiplier;
  }, 0);

  // Calculate bench totals
  const benchTotalPoints = bench.reduce((sum, pick) => {
    const stats = pick.live_stats;
    const totalPoints = stats?.total_points || 0;
    return sum + totalPoints; // No multiplier for bench players
  }, 0);

  const getPredictedBonus = (playerId: number) => {
    const bonus = predictedBonuses.find((b) => b.player_id === playerId);
    return bonus ? bonus.predicted_bonus : 0;
  };

  const formatICT = (value: number) => {
    return value ? value.toFixed(2) : "0.00";
  };

  const getMultiplierDisplay = (pick: TeamPick) => {
    if (pick.is_captain) return t("fplLive.captain");
    if (pick.is_vice_captain) return t("fplLive.viceCaptain");
    if (pick.multiplier === 3) return t("fplLive.tripleCaptain");
    return pick.multiplier > 1 ? `x${pick.multiplier}` : "";
  };

  const getPointsColorClass = (points: number) => {
    if (points > 0) return "text-green-600 dark:text-green-400 font-bold";
    if (points < 0) return "text-red-600 dark:text-red-400 font-bold";
    return "text-gray-500 dark:text-gray-400";
  };

  const getMinutesColorClass = (minutes: number) => {
    if (minutes >= 60) return "text-green-600 dark:text-green-400";
    if (minutes > 0) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const PlayerRow = ({
    pick,
    isStarter,
  }: {
    pick: TeamPick;
    isStarter: boolean;
  }) => {
    const stats = pick.live_stats;
    const predictedBonus = getPredictedBonus(pick.player_id);
    const displayBonus = bonusAdded ? stats?.bonus || 0 : predictedBonus;
    const totalPoints = stats?.total_points || 0;
    // For table display: show actual points for bench, multiplied for starters
    const displayPoints = isStarter
      ? totalPoints * pick.multiplier
      : totalPoints;

    return (
      <tr
        className={`group border-b border-theme-border ${
          !isStarter
            ? "bg-gray-100 dark:bg-gray-800"
            : "hover:bg-theme-card-secondary/30"
        } transition-colors theme-transition`}
      >
        <td className="px-3 py-3 text-sm">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs px-2 py-1 rounded-md font-bold ${
                pick.is_captain
                  ? "bg-yellow-500 text-white"
                  : pick.is_vice_captain
                  ? "bg-blue-500 text-white"
                  : "bg-theme-card-secondary text-theme-text-primary border border-theme-border"
              } theme-transition`}
            >
              {
                POSITION_NAMES[
                  pick.player.element_type as keyof typeof POSITION_NAMES
                ]
              }
            </span>
            {!isStarter && (
              <span className="text-xs text-gray-600 dark:text-gray-300 px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 theme-transition">
                {t("fplLive.benchShort").toUpperCase()}
              </span>
            )}
          </div>
        </td>
        <td
          className={`px-3 py-3 text-sm font-semibold text-theme-foreground sticky left-0 z-10 transition-colors ${
            !isStarter ? "bg-gray-100 dark:bg-gray-800" : "bg-theme-card"
          } theme-transition`}
        >
          <div className="flex items-center space-x-2">
            <span className="truncate max-w-[120px] sm:max-w-none font-bold">
              {pick.player.web_name}
            </span>
            {getMultiplierDisplay(pick) && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                  pick.is_captain
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : pick.is_vice_captain
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-theme-card-secondary text-theme-text-primary"
                } theme-transition`}
              >
                {getMultiplierDisplay(pick)}
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <div style={{ color: getTeamColors(pick.player.team).primary }}>
              {getTeamColors(pick.player.team).primary !==
              getTeamColors(pick.player.team).secondary ? (
                <PiTShirtFill size={16} />
              ) : (
                <PiTShirtLight size={16} />
              )}
            </div>
            <span className="text-xs font-bold text-theme-text-primary theme-transition">
              {getTeamColors(pick.player.team).shortName}
            </span>
          </div>
        </td>
        <td
          className={`px-2 py-3 text-center text-sm font-medium ${getMinutesColorClass(
            stats?.minutes || 0
          )} theme-transition`}
        >
          {stats?.minutes || 0}&apos;
        </td>
        <td
          className={`px-3 py-3 text-center text-lg font-bold ${getPointsColorClass(
            displayPoints
          )} bg-green-50 dark:bg-green-900/20 theme-transition`}
        >
          {displayPoints}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.goals_scored || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.assists || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.clean_sheets || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.yellow_cards || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.red_cards || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.saves || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-medium text-theme-text-primary theme-transition">
          {stats?.bps || 0}
        </td>
        <td className="px-2 py-3 text-center text-sm font-bold text-theme-text-primary theme-transition">
          {displayBonus > 0 ? `+${displayBonus}` : "0"}
        </td>
        <td className="px-2 py-3 text-center text-sm text-theme-text-primary theme-transition">
          {formatICT(stats?.ict_index || 0)}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-theme-card border-theme-border rounded-lg overflow-hidden shadow-lg theme-transition">
      <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold">{t("fplLive.squadTitle")}</h3>
            <p className="text-sm text-white/90 mt-1">
              {bonusAdded
                ? t("fplLive.showingFinalBonus")
                : t("fplLive.showingPredictedBonus")}
            </p>
          </div>
          <div className="mt-3 md:mt-0 text-right">
            <div className="text-2xl font-bold text-green-300">
              {startingXITotalPoints} pts
            </div>
            <div className="text-sm text-white/80">Starting XI Total</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-theme-card-secondary border-b-2 border-theme-border theme-transition">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.position")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold text-theme-text-primary uppercase sticky left-0 bg-theme-card-secondary z-10 theme-transition">
                {t("fplLive.player")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.teamColumn")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.minutes")}
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 uppercase theme-transition">
                {t("fplLive.totalShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.goalsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.assistsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.cleanSheetsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.yellowCardsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.redCardsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.savesShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.bpsShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.bonusShort")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                {t("fplLive.ictShort")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-card theme-transition">
            {/* Starting XI Section */}
            <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <td
                colSpan={4}
                className="px-4 py-3 text-sm font-bold text-start uppercase tracking-wide"
              >
                <GiSoccerKick className="inline-block" size={24} />{" "}
                {t("fplLive.startingXI")}
              </td>
              <td className="px-3 py-3 text-sm font-bold text-center text-white">
                {startingXITotalPoints} pts
              </td>
              <td
                colSpan={9}
                className="px-4 py-3 text-sm font-bold text-start uppercase tracking-wide"
              ></td>
            </tr>
            {starters.map((pick) => (
              <PlayerRow key={pick.player_id} pick={pick} isStarter={true} />
            ))}

            {bench.length > 0 && (
              <>
                {/* Bench Section */}
                <tr className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-sm font-bold text-left uppercase tracking-wide"
                  >
                    <TbUsers className="inline-block" size={24} />{" "}
                    {t("fplLive.bench")}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-center text-white">
                    {benchTotalPoints} pts
                  </td>
                  <td
                    colSpan={9}
                    className="px-4 py-3 text-sm font-bold text-left uppercase tracking-wide"
                  ></td>
                </tr>
                {bench.map((pick) => (
                  <PlayerRow
                    key={pick.player_id}
                    pick={pick}
                    isStarter={false}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-xs text-theme-text-secondary border-t border-theme-border theme-transition">
        <div className="flex justify-between items-center">
          <div>(C) = Captain • (VC) = Vice Captain • (TC) = Triple Captain</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Starting XI</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
              <span>Bench</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SquadTable;
