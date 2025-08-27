"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import FlagLoader from "@/components/shared/FlagLoader";

interface ManagerSummaryProps {
  manager?: {
    id: number;
    player_first_name: string;
    player_last_name: string;
    name: string;
    summary_overall_points: number;
    summary_overall_rank: number;
    summary_event_points: number;
    summary_event_rank: number;
    player_region_iso_code_short?: string;
    player_region_name?: string;
    club_badge_src?: string;
    current_event?: number;
    entered_events?: number[];
    favourite_team?: number;
    joined_time?: string;
    last_deadline_bank?: number;
    last_deadline_total_transfers?: number;
    last_deadline_value?: number;
    started_event?: number;
    years_active?: number;
  };
  teamTotals?: {
    goals: number;
    assists: number;
    clean_sheets: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    total_points_no_bonus: number;
    total_points_final: number;
    predicted_bonus: number;
    final_bonus: number;
    active_points_no_bonus: number;
    active_points_final: number;
    bench_points_no_bonus: number;
    bench_points_final: number;
  };
  captain?: {
    player_id?: number;
    stats?: any;
  };
  viceCaptain?: {
    player_id?: number;
    stats?: any;
  };
  bonusAdded: boolean;
  gameweek: number;
  lastUpdated?: string;
}

const ManagerSummary = React.memo(function ManagerSummary({
  manager,
  teamTotals,
  captain,
  bonusAdded,
  gameweek,
  lastUpdated,
}: ManagerSummaryProps) {
  const { t } = useTranslation();
  if (!manager || !teamTotals) {
    return (
      <div className="bg-theme-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t("fplLive.managerOverview")}
        </h3>
        <div className="text-center text-theme-muted">
          {t("fplLive.loadTeamToSeeManagerOverview")}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatRank = (rank: number) => {
    if (rank === 0) return "N/A";
    return `#${formatNumber(rank)}`;
  };

  const activePoints = bonusAdded
    ? teamTotals.active_points_final
    : teamTotals.active_points_no_bonus;
  const benchPoints = bonusAdded
    ? teamTotals.bench_points_final
    : teamTotals.bench_points_no_bonus;
  const bonusPoints = bonusAdded
    ? teamTotals.final_bonus
    : teamTotals.predicted_bonus;
  const bonusLabel = bonusAdded ? "Final Bonus" : "Predicted Bonus";

  return (
    <div className="bg-theme-card rounded-lg shadow p-6">
      <FlagLoader />
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-primary">
          {t("fplLive.managerOverview")} - GW{gameweek}
        </h3>
        {lastUpdated && (
          <p className="text-sm text-theme-muted mt-1">
            {t("fplLive.lastUpdated")}{" "}
            {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-theme-primary mb-3">
            {t("fplLive.managerInfo")}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-theme-muted">{t("fplLive.name")}</span>
              <div className="flex items-center space-x-2">
                {manager.player_region_iso_code_short && (
                  <span 
                    className={`fi fi-${manager.player_region_iso_code_short.toLowerCase()} w-4 h-3 rounded-sm`}
                    title={manager.player_region_name}
                  ></span>
                )}
                <span className="font-medium text-theme-primary">
                  {manager.player_first_name} {manager.player_last_name}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.team")}</span>
              <span className="font-medium text-theme-primary">
                {manager.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.country")}</span>
              <span className="font-medium text-theme-primary">
                {manager.player_region_name || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.yearsActive")}</span>
              <span className="font-medium text-theme-primary">
                {manager.years_active || 0} {t("fplLive.years")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.joinedDate")}</span>
              <span className="font-medium text-theme-primary">
                {manager.joined_time ? new Date(manager.joined_time).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.startedEvent")}</span>
              <span className="font-medium text-theme-primary">
                {t("fplLive.gw")} {manager.started_event || 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">
                {t("fplLive.overallPoints")}
              </span>
              <span className="font-medium text-theme-primary">
                {formatNumber(manager.summary_overall_points)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">
                {t("fplLive.overallRank")}
              </span>
              <span className="font-medium text-theme-primary">
                {formatRank(manager.summary_overall_rank)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.lastDeadlineBank")}</span>
              <span className="font-medium text-theme-primary">
                £{(manager.last_deadline_bank || 0).toFixed(1)}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.lastDeadlineValue")}</span>
              <span className="font-medium text-theme-primary">
                £{(manager.last_deadline_value || 0).toFixed(1)}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.totalTransfers")}</span>
              <span className="font-medium text-theme-primary">
                {manager.last_deadline_total_transfers || 0}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-theme-primary mb-3">
            {t("fplLive.gwPerformance", { gw: gameweek })}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.gameweekPoints")}</span>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {manager.summary_event_points} {t("fplLive.points")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{t("fplLive.gameweekRank")}</span>
              <span className="font-medium text-theme-primary">
                {formatRank(manager.summary_event_rank)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">
                {t("fplLive.activePoints")}
              </span>
              <div className="text-right">
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {activePoints}
                </span>
                {!bonusAdded && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    ({t("fplLive.provisional")})
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">
                {t("fplLive.benchPointsLong")}
              </span>
              <span className="font-medium text-theme-secondary">
                {benchPoints}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">{bonusLabel}:</span>
              <span
                className={`font-medium ${
                  bonusAdded
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                +{bonusPoints}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">
                {t("fplLive.captainPointsLong")}
              </span>
              <span className="font-medium text-theme-primary">
                {captain?.stats?.total_points
                  ? captain.stats.total_points * 2
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-theme-border">
        <h4 className="font-medium text-theme-primary mb-3">
          {t("fplLive.teamStats")}
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamTotals.goals}
            </div>
            <div className="text-xs text-theme-muted">{t("fplLive.goals")}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {teamTotals.assists}
            </div>
            <div className="text-xs text-theme-muted">
              {t("fplLive.assists")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {teamTotals.clean_sheets}
            </div>
            <div className="text-xs text-theme-muted">
              {t("fplLive.cleanSheets")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {teamTotals.yellow_cards}
            </div>
            <div className="text-xs text-theme-muted">
              {t("fplLive.yellowCards")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {teamTotals.red_cards}
            </div>
            <div className="text-xs text-theme-muted">
              {t("fplLive.redCards")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {teamTotals.saves}
            </div>
            <div className="text-xs text-theme-muted">{t("fplLive.saves")}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-theme-muted">
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              bonusAdded ? "bg-green-500" : "bg-yellow-500"
            }`}
          ></div>
          {bonusAdded ? t("fplLive.bonusFinalized") : t("fplLive.bonusPredicted")}
        </div>
        <div>{t("fplLive.managerId")} {manager.id}</div>
      </div>
    </div>
  );
});

export default ManagerSummary;
