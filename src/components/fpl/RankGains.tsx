"use client";

import React, { useMemo } from "react";
import { getTeamColors } from "@/lib/team-colors";
import { useTranslation } from "react-i18next";

interface RankGainsProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface PlayerPick {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: {
    id: number;
    web_name: string;
    first_name: string;
    second_name: string;
    team: number;
    element_type: number;
  };
  live_stats: {
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
  } | null;
}

type PlayerStatus = "played" | "playing" | "to_play" | "didnt_play";

const getPlayerStatus = (pick: PlayerPick): PlayerStatus => {
  const minutes = pick.live_stats?.minutes ?? -1;
  if (minutes < 0 || (!pick.live_stats)) return "to_play";
  if (minutes === 0) return "didnt_play";
  // If minutes > 0 and less than 90, could be playing; treat 90 as played
  // Simple heuristic: if minutes > 0, consider "played" (live data is snapshot)
  if (minutes > 0 && minutes < 90) return "playing";
  return "played";
};

const StatusBadge = ({ status }: { status: PlayerStatus }) => {
  const { t } = useTranslation("fpl");

  const config: Record<
    PlayerStatus,
    { label: string; dotClass: string; textClass: string }
  > = {
    played: {
      label: t("gains.played", "Played"),
      dotClass: "bg-green-500",
      textClass: "text-green-700 dark:text-green-400",
    },
    playing: {
      label: t("gains.playing", "Playing"),
      dotClass: "bg-yellow-500 animate-pulse",
      textClass: "text-yellow-700 dark:text-yellow-400",
    },
    to_play: {
      label: t("gains.toPlay", "To Play"),
      dotClass: "bg-gray-400",
      textClass: "text-theme-text-secondary",
    },
    didnt_play: {
      label: t("gains.didntPlay", "Didn't Play"),
      dotClass: "bg-red-500",
      textClass: "text-red-700 dark:text-red-400",
    },
  };

  const { label, dotClass, textClass } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textClass} theme-transition`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
};

const ContributionBar = ({
  points,
  maxPoints,
}: {
  points: number;
  maxPoints: number;
}) => {
  const percentage = maxPoints > 0 ? Math.abs(points) / maxPoints : 0;
  const isNegative = points < 0;
  const width = Math.max(percentage * 100, 2);

  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden theme-transition">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          isNegative
            ? "bg-red-500 dark:bg-red-400"
            : "bg-green-500 dark:bg-green-400"
        }`}
        style={{ width: `${Math.min(width, 100)}%` }}
      />
    </div>
  );
};

const RankGains = React.memo(function RankGains({
  managerId,
  gameweek,
  managerData,
}: RankGainsProps) {
  const { t } = useTranslation("fpl");

  const teamData: PlayerPick[] = managerData?.team_with_stats ?? [];

  const { starters, bench, totalPoints, bestPlayer, worstPlayer, maxPoints } =
    useMemo(() => {
      if (!teamData.length) {
        return {
          starters: [],
          bench: [],
          totalPoints: 0,
          bestPlayer: null as PlayerPick | null,
          worstPlayer: null as PlayerPick | null,
          maxPoints: 0,
        };
      }

      const starterPicks = teamData
        .filter((p) => p.position <= 11)
        .map((p) => ({
          ...p,
          effectivePoints: (p.live_stats?.total_points ?? 0) * p.multiplier,
        }))
        .sort((a, b) => b.effectivePoints - a.effectivePoints);

      const benchPicks = teamData
        .filter((p) => p.position > 11)
        .map((p) => ({
          ...p,
          effectivePoints: p.live_stats?.total_points ?? 0,
        }))
        .sort((a, b) => a.position - b.position);

      const total = starterPicks.reduce(
        (sum, p) => sum + p.effectivePoints,
        0
      );

      const allWithPoints = starterPicks.filter(
        (p) => p.live_stats && p.live_stats.minutes > 0
      );

      const best =
        allWithPoints.length > 0
          ? allWithPoints.reduce((max, p) =>
              p.effectivePoints > max.effectivePoints ? p : max
            )
          : null;

      const worst =
        allWithPoints.length > 0
          ? allWithPoints.reduce((min, p) =>
              p.effectivePoints < min.effectivePoints ? p : min
            )
          : null;

      const maxPts = starterPicks.reduce(
        (max, p) => Math.max(max, Math.abs(p.effectivePoints)),
        1
      );

      return {
        starters: starterPicks,
        bench: benchPicks,
        totalPoints: total,
        bestPlayer: best,
        worstPlayer: worst && worst.effectivePoints < 0 ? worst : null,
        maxPoints: maxPts,
      };
    }, [teamData]);

  if (!teamData.length) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-4 sm:p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground theme-transition">
          {t("gains.title", "Rank Gains")}
        </h3>
        <div className="text-center text-theme-text-secondary theme-transition">
          {t("gains.loadTeamToSeeSquad", "Load a team to see squad breakdown")}
        </div>
      </div>
    );
  }

  const getPointsColorClass = (points: number) => {
    if (points > 0) return "text-green-600 dark:text-green-400";
    if (points < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };

  const PlayerCard = ({
    pick,
    effectivePoints,
    isBench,
  }: {
    pick: PlayerPick;
    effectivePoints: number;
    isBench: boolean;
  }) => {
    const teamColors = getTeamColors(pick.player.team);
    const status = getPlayerStatus(pick);

    return (
      <div
        className={`flex flex-col gap-2 p-3 rounded-lg border border-theme-border theme-transition ${
          isBench
            ? "bg-gray-50 dark:bg-gray-800/50 opacity-70"
            : "bg-theme-card"
        }`}
      >
        {/* Top row: player info and points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: teamColors.primary }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-theme-foreground truncate theme-transition">
                  {pick.player.web_name}
                </span>
                {pick.is_captain && (
                  <span className="text-xs font-bold bg-yellow-500 text-white px-1.5 py-0.5 rounded shrink-0">
                    C
                  </span>
                )}
                {pick.is_vice_captain && (
                  <span className="text-xs font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded shrink-0">
                    V
                  </span>
                )}
                {pick.multiplier === 3 && (
                  <span className="text-xs font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded shrink-0">
                    TC
                  </span>
                )}
              </div>
              <span className="text-xs text-theme-text-secondary theme-transition">
                {teamColors.shortName}
                {pick.multiplier > 1 && !isBench && (
                  <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                    x{pick.multiplier}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={status} />
            <span
              className={`text-lg font-bold ${getPointsColorClass(
                effectivePoints
              )} theme-transition`}
            >
              {effectivePoints > 0 && "+"}
              {effectivePoints}
            </span>
          </div>
        </div>

        {/* Contribution bar */}
        <ContributionBar points={effectivePoints} maxPoints={maxPoints} />
      </div>
    );
  };

  const PlayerTableRow = ({
    pick,
    effectivePoints,
    isBench,
  }: {
    pick: PlayerPick;
    effectivePoints: number;
    isBench: boolean;
  }) => {
    const teamColors = getTeamColors(pick.player.team);
    const status = getPlayerStatus(pick);

    return (
      <tr
        className={`border-b border-theme-border theme-transition transition-colors ${
          isBench
            ? "bg-gray-50 dark:bg-gray-800/50 opacity-70"
            : "hover:bg-theme-card-secondary/30"
        }`}
      >
        <td className="px-3 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: teamColors.primary }}
            />
            <span className="font-bold text-theme-foreground theme-transition">
              {pick.player.web_name}
            </span>
            {pick.is_captain && (
              <span className="text-xs font-bold bg-yellow-500 text-white px-1.5 py-0.5 rounded">
                C
              </span>
            )}
            {pick.is_vice_captain && (
              <span className="text-xs font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">
                V
              </span>
            )}
            {pick.multiplier === 3 && (
              <span className="text-xs font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded">
                TC
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 text-center text-xs text-theme-text-secondary theme-transition">
          {teamColors.shortName}
        </td>
        <td className="px-2 py-3 text-center">
          <StatusBadge status={status} />
        </td>
        <td
          className={`px-3 py-3 text-center text-base font-bold ${getPointsColorClass(
            effectivePoints
          )} theme-transition`}
        >
          {effectivePoints > 0 && "+"}
          {effectivePoints}
        </td>
        <td className="px-3 py-3 w-40">
          <ContributionBar points={effectivePoints} maxPoints={maxPoints} />
        </td>
        <td className="px-2 py-3 text-center text-xs text-theme-text-secondary theme-transition">
          {pick.multiplier > 1 && !isBench ? `x${pick.multiplier}` : "-"}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-lg overflow-hidden theme-transition">
      {/* Header */}
      <div className="px-4 py-4 border-b border-theme-border">
        <h3 className="text-lg font-bold text-theme-foreground">
          {t("gains.title", "Rank Gains")}
        </h3>
        <p className="text-sm text-theme-text-secondary mt-0.5">
          {t(
            "gains.description",
            "Per-player contribution to your GW rank"
          )}
        </p>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 border-b border-theme-border theme-transition">
        {/* Total GW Points */}
        <div className="flex flex-col items-center p-3 bg-theme-card-secondary/50 rounded-lg theme-transition">
          <span className="text-xs text-theme-text-secondary uppercase font-semibold theme-transition">
            {t("gains.totalPoints", "GW Points")}
          </span>
          <span
            className={`text-2xl font-bold mt-1 ${getPointsColorClass(
              totalPoints
            )} theme-transition`}
          >
            {totalPoints}
          </span>
        </div>

        {/* Best Performer */}
        <div className="flex flex-col items-center p-3 bg-theme-card-secondary/50 rounded-lg theme-transition">
          <span className="text-xs text-theme-text-secondary uppercase font-semibold theme-transition">
            {t("gains.bestPerformer", "Best")}
          </span>
          {bestPlayer ? (
            <>
              <span className="text-sm font-bold text-theme-foreground mt-1 truncate max-w-full theme-transition">
                {bestPlayer.player.web_name}
              </span>
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold theme-transition">
                +{(bestPlayer as any).effectivePoints} pts
              </span>
            </>
          ) : (
            <span className="text-xs text-theme-text-secondary mt-1 theme-transition">
              -
            </span>
          )}
        </div>

        {/* Worst Performer (only if negative) */}
        <div className="flex flex-col items-center p-3 bg-theme-card-secondary/50 rounded-lg col-span-2 sm:col-span-1 theme-transition">
          <span className="text-xs text-theme-text-secondary uppercase font-semibold theme-transition">
            {t("gains.worstPerformer", "Worst")}
          </span>
          {worstPlayer ? (
            <>
              <span className="text-sm font-bold text-theme-foreground mt-1 truncate max-w-full theme-transition">
                {worstPlayer.player.web_name}
              </span>
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold theme-transition">
                {(worstPlayer as any).effectivePoints} pts
              </span>
            </>
          ) : (
            <span className="text-xs text-theme-text-secondary mt-1 theme-transition">
              {t("gains.none", "None")}
            </span>
          )}
        </div>
      </div>

      {/* Starting XI - Mobile Cards */}
      <div className="block md:hidden">
        <div className="px-4 py-2 border-b border-theme-border text-sm font-bold uppercase tracking-wide text-theme-text-secondary">
          {t("gains.startingXI", "Starting XI")}
        </div>
        <div className="flex flex-col gap-2 p-3">
          {starters.map((pick) => (
            <PlayerCard
              key={pick.player_id}
              pick={pick}
              effectivePoints={(pick as any).effectivePoints}
              isBench={false}
            />
          ))}
        </div>

        {bench.length > 0 && (
          <>
            <div className="px-4 py-2 border-b border-theme-border text-sm font-bold uppercase tracking-wide text-theme-text-secondary">
              {t("gains.bench", "Bench")}
            </div>
            <div className="flex flex-col gap-2 p-3">
              {bench.map((pick) => (
                <PlayerCard
                  key={pick.player_id}
                  pick={pick}
                  effectivePoints={(pick as any).effectivePoints}
                  isBench={true}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Starting XI - Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-card-secondary border-b-2 border-theme-border theme-transition">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-theme-text-primary uppercase theme-transition">
                  {t("gains.player", "Player")}
                </th>
                <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                  {t("gains.teamColumn", "Team")}
                </th>
                <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                  {t("gains.status", "Status")}
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 uppercase theme-transition">
                  {t("gains.points", "Pts")}
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                  {t("gains.contribution", "Contribution")}
                </th>
                <th className="px-2 py-3 text-center text-xs font-bold text-theme-text-primary uppercase theme-transition">
                  {t("gains.multiplier", "Mult.")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-theme-card theme-transition">
              {/* Starting XI header row */}
              <tr className="border-b border-theme-border">
                <td
                  colSpan={6}
                  className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-theme-text-secondary"
                >
                  {t("gains.startingXI", "Starting XI")}
                </td>
              </tr>
              {starters.map((pick) => (
                <PlayerTableRow
                  key={pick.player_id}
                  pick={pick}
                  effectivePoints={(pick as any).effectivePoints}
                  isBench={false}
                />
              ))}

              {bench.length > 0 && (
                <>
                  <tr className="border-b border-theme-border">
                    <td
                      colSpan={6}
                      className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-theme-text-secondary"
                    >
                      {t("gains.bench", "Bench")}
                    </td>
                  </tr>
                  {bench.map((pick) => (
                    <PlayerTableRow
                      key={pick.player_id}
                      pick={pick}
                      effectivePoints={(pick as any).effectivePoints}
                      isBench={true}
                    />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer legend */}
      <div className="px-4 py-3 text-xs text-theme-text-secondary border-t border-theme-border theme-transition">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>{t("gains.legendCaptain", "(C) = Captain")} &bull; {t("gains.legendVice", "(V) = Vice Captain")} &bull; {t("gains.legendTriple", "(TC) = Triple Captain")}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{t("gains.played", "Played")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span>{t("gains.playing", "Playing")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>{t("gains.toPlay", "To Play")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{t("gains.didntPlay", "Didn't Play")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RankGains;
