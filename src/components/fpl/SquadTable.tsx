"use client";

import React from "react";
import { PiTShirtLight, PiTShirtFill } from "react-icons/pi";
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
  const { t } = useTranslation();
  if (!teamData || teamData.length === 0) {
    return (
      <div className="bg-theme-card shadow border border-theme-border p-6">
        <h3 className="text-lg font-semibold mb-4">{t("fplLive.squad")}</h3>
        <div className="text-center text-theme-muted">
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
        className={`group ${
          !isStarter ? "bg-theme-accent" : ""
        } hover:bg-theme-accent transition-colors`}
      >
        <td className="px-1 sm:px-2 py-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span
              className={`text-xs px-1 py-1 rounded text-center ${
                pick.is_captain || pick.is_vice_captain
                  ? "bg-yellow-200 text-yellow-800"
                  : "bg-theme-accent text-theme-secondary"
              }`}
            >
              {
                POSITION_NAMES[
                  pick.player.element_type as keyof typeof POSITION_NAMES
                ]
              }
            </span>
            {!isStarter && (
              <span className="text-xs text-theme-muted mt-1 sm:mt-0">
                ({t("fplLive.benchShort").toUpperCase()})
              </span>
            )}
          </div>
        </td>
        <td
          className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-theme-primary sticky left-0 z-10 group-hover:bg-theme-accent transition-colors ${
            !isStarter ? "bg-theme-accent" : "bg-theme-card"
          }`}
        >
          <div className="truncate max-w-[120px] sm:max-w-none">
            <span className="font-semibold">{pick.player.web_name}</span>
            {getMultiplierDisplay(pick) && (
              <span className="ml-1 text-xs font-bold text-blue-600">
                {getMultiplierDisplay(pick)}
              </span>
            )}
          </div>
        </td>
        <td className="px-1 sm:px-2 py-2 text-xs text-center">
          <div className="flex items-center justify-center space-x-1">
            <div style={{ color: getTeamColors(pick.player.team).primary }}>
              {getTeamColors(pick.player.team).primary !==
              getTeamColors(pick.player.team).secondary ? (
                <PiTShirtFill size={12} />
              ) : (
                <PiTShirtLight size={12} />
              )}
            </div>
            <span className="text-xs font-medium">
              {getTeamColors(pick.player.team).shortName}
            </span>
          </div>
        </td>
        <td className="px-1 sm:px-2 py-2 text-xs text-center">
          {stats?.minutes || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center font-medium">
          {stats?.goals_scored || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center font-medium">
          {stats?.assists || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center font-medium">
          {stats?.clean_sheets || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center text-yellow-600 font-medium">
          {stats?.yellow_cards || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center text-red-600 font-medium">
          {stats?.red_cards || 0}
        </td>
        <td className="px-1 py-2 text-xs text-center">{stats?.saves || 0}</td>
        <td className="px-1 py-2 text-xs text-center font-medium">
          {stats?.bps || 0}
        </td>
        <td
          className={`px-1 py-2 text-xs text-center font-medium ${
            bonusAdded
              ? "text-green-600 dark:text-green-400"
              : "text-yellow-600 dark:text-yellow-400"
          }`}
        >
          {displayBonus > 0 ? `+${displayBonus}` : "0"}
        </td>
        <td className="px-1 sm:px-2 py-2 text-xs text-center font-bold text-green-600 dark:text-green-400">
          {displayPoints}
        </td>
        <td className="px-1 py-2 text-xs text-center">
          {formatICT(stats?.ict_index || 0)}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-theme-card shadow border border-theme-border overflow-hidden">
      <div className="px-6 py-4 border-b border-theme-border">
        <h3 className="text-lg font-semibold text-theme-primary">
          {t("fplLive.squadTitle")}
        </h3>
        <p className="text-sm text-theme-muted mt-1">
          {bonusAdded
            ? t("fplLive.showingFinalBonus")
            : t("fplLive.showingFinalBonus")}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-theme-secondary">
            <tr>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.position")}
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-theme-muted uppercase sticky left-0 bg-theme-card z-10">
                {t("fplLive.player")}
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                <span className="hidden sm:inline">
                  {t("fplLive.teamColumn")}
                </span>
                <span className="sm:hidden">Team</span>
              </th>
              <th className="px-1 sm:px-2 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                <span className="hidden sm:inline">{t("fplLive.minutes")}</span>
                <span className="sm:hidden">Min</span>
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.goalsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.assistsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.cleanSheetsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.yellowCardsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.redCardsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                <span className="hidden sm:inline">
                  {t("fplLive.savesShort")}
                </span>
                <span className="sm:hidden">Sv</span>
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.bpsShort")}
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                <span className="hidden sm:inline">
                  {t("fplLive.bonusShort")}
                </span>
                <span className="sm:hidden">B</span>
              </th>
              <th className="px-1 sm:px-2 py-2 text-center text-xs font-medium text-theme-muted uppercase font-bold">
                <span className="hidden sm:inline">
                  {t("fplLive.totalShort")}
                </span>
                <span className="sm:hidden">Pts</span>
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                {t("fplLive.ictShort")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-card divide-y divide-theme-border">
            {starters.map((pick) => (
              <PlayerRow key={pick.player_id} pick={pick} isStarter={true} />
            ))}
            {bench.length > 0 && (
              <>
                <tr className="bg-theme-accent border-t-2 border-theme-border">
                  <td
                    colSpan={11}
                    className="px-6 py-3 text-sm font-semibold text-theme-secondary text-left"
                  >
                    {t("fplLive.benchShort")}
                  </td>
                  <td className="px-3 py-3 text-sm text-center bg-theme-accent"></td>
                  <td className="px-3 py-3 text-sm text-center font-bold text-blue-600 bg-theme-accent">
                    {benchTotalPoints}
                  </td>
                  <td className="px-3 py-3 text-sm text-center bg-theme-accent"></td>
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

      <div className="px-6 py-3 bg-theme-secondary text-xs text-theme-muted">
        <div className="flex justify-between items-center">
          <div>(C) = Captain • (VC) = Vice Captain • (TC) = Triple Captain</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Starting XI</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
              <span>Bench</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SquadTable;
