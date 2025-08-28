"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, LineChart, PieChart, ScatterChart } from "@mui/x-charts";
import { MdStar, MdTrendingDown, MdDangerous } from "react-icons/md";

interface AdvancedStatisticsProps {
  managerId?: number;
  gameweek: number;
  loading?: boolean;
  managerData?: any;
}

interface PlayerPerformance {
  player_id: number;
  web_name: string;
  points: number;
  differential: number;
  category: "star" | "flop" | "killer";
}

const AdvancedStatistics = React.memo(function AdvancedStatistics({
  gameweek,
  loading = false,
  managerData,
}: AdvancedStatisticsProps) {
  const { t } = useTranslation("fpl");

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition animate-pulse"
          >
            <div className="h-6 bg-theme-text-secondary/20 rounded w-32 mb-4 theme-transition"></div>
            <div className="h-48 bg-theme-text-secondary/10 rounded theme-transition"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!managerData?.manager || !managerData?.team_with_stats) {
    return (
      <div className="text-center text-theme-text-secondary p-8 theme-transition">
        {t("fplLive.loadTeamForAdvancedStats")}
      </div>
    );
  }

  // Sample data - replace with real analytics from your data
  const manager = managerData.manager;
  const teamStats = managerData.team_with_stats || [];
  const teamTotals = managerData.team_totals || {};

  // Generate analytics data
  const getPlayerPositionDistribution = () => {
    const positions = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };

    // Only count starting XI (positions 1-11)
    teamStats
      .filter((player: any) => player.position <= 11)
      .forEach((player: any) => {
        const positionType = player.player?.element_type;
        if (positionType === 1) positions.GKP++;
        else if (positionType === 2) positions.DEF++;
        else if (positionType === 3) positions.MID++;
        else if (positionType === 4) positions.FWD++;
      });

    return [
      {
        id: 0,
        value: positions.GKP,
        label: `GKP (${positions.GKP})`,
        color: "#ef4444",
      },
      {
        id: 1,
        value: positions.DEF,
        label: `DEF (${positions.DEF})`,
        color: "#3b82f6",
      },
      {
        id: 2,
        value: positions.MID,
        label: `MID (${positions.MID})`,
        color: "#10b981",
      },
      {
        id: 3,
        value: positions.FWD,
        label: `FWD (${positions.FWD})`,
        color: "#f59e0b",
      },
    ];
  };

  const getPointsDistribution = () => {
    const activePointsTotal = teamTotals.active_points_final || 0;
    const benchPointsTotal = teamTotals.bench_points_final || 0;
    const captain = teamStats.find((p: any) => p.is_captain);
    const captainBasePoints = captain?.live_stats?.total_points || 0;
    const captainBonusPoints = captainBasePoints; // Captain doubles the points, so bonus = base points
    const regularActivePoints = Math.max(
      0,
      activePointsTotal - captainBonusPoints
    );

    return [
      {
        id: 0,
        value: regularActivePoints,
        label: `${t("fplLive.regularPoints")} (${regularActivePoints})`,
        color: "#3b82f6",
      },
      {
        id: 1,
        value: captainBonusPoints,
        label: `${t("fplLive.captainBonus")} (${captainBonusPoints})`,
        color: "#f59e0b",
      },
      {
        id: 2,
        value: benchPointsTotal,
        label: `${t("fplLive.benchPoints")} (${benchPointsTotal})`,
        color: "#6b7280",
      },
    ];
  };

  const getGameweekTrend = () => {
    // Mock historical data - replace with real data
    const gameweeks = Array.from({ length: gameweek }, (_, i) => i + 1);
    const points = gameweeks.map((gw, i) => {
      if (gw === gameweek) return manager.summary_event_points;
      return Math.floor(Math.random() * 100) + 20; // Mock data
    });
    return { gameweeks, points };
  };

  const getTeamValueHistory = () => {
    // Mock team value progression
    const weeks = Array.from({ length: gameweek }, (_, i) => i + 1);
    const values = weeks.map((_, i) => 100 - i * 0.5 + Math.random() * 2);

    // Determine if team value is rising or falling overall
    const isRising = values.length > 1 && values[values.length - 1] > values[0];
    const color = isRising ? "#10b981" : "#ef4444"; // Green if rising, red if falling

    return { weeks, values, color };
  };

  const getPlayerMinutes = () => {
    return teamStats
      .filter((player: any) => player.position <= 11)
      .map((player: any) => ({
        player: player.player?.web_name || "Unknown",
        minutes: player.live_stats?.minutes || 0,
      }))
      .sort((a: any, b: any) => b.minutes - a.minutes)
      .slice(0, 11);
  };

  const getPlayerPerformance = (): {
    stars: PlayerPerformance[];
    flops: PlayerPerformance[];
    killers: PlayerPerformance[];
  } => {
    // Only include starting XI players
    const startingPlayers = teamStats
      .filter((player: any) => player.position <= 11)
      .map((player: any) => {
        const points = player.live_stats?.total_points || 0;
        const minutes = player.live_stats?.minutes || 0;
        const cost = player.player?.now_cost || 50; // Cost in 0.1m units

        // Calculate value per million (points per cost)
        const valuePerMillion = cost > 0 ? points / (cost / 10) : 0;

        // Calculate points per minute efficiency
        const efficiency = minutes > 0 ? (points / minutes) * 90 : 0;

        return {
          player_id: player.player_id,
          web_name: player.player?.web_name || "Unknown",
          points: points,
          minutes: minutes,
          cost: cost / 10, // Convert to millions
          valuePerMillion: valuePerMillion,
          efficiency: efficiency,
          category: "star" as const,
        };
      });

    // Stars: High points (8+) OR high efficiency with decent points (5+)
    const stars = startingPlayers
      .filter(
        (p: { points: number; efficiency: number }) =>
          p.points >= 8 || (p.points >= 5 && p.efficiency > 0.15)
      )
      .sort(
        (a: { points: number }, b: { points: number }) => b.points - a.points
      )
      .slice(0, 3)
      .map(
        (p: {
          player_id: any;
          web_name: any;
          points: any;
          valuePerMillion: any;
        }) => ({
          player_id: p.player_id,
          web_name: p.web_name,
          points: p.points,
          differential: p.valuePerMillion,
          category: "star" as const,
        })
      );

    // Flops: Low points (0-2) with decent minutes (30+) OR negative points
    const flops = startingPlayers
      .filter(
        (p: { points: number; minutes: number }) =>
          (p.points <= 2 && p.minutes >= 30) || p.points < 0
      )
      .sort(
        (a: { points: number }, b: { points: number }) => a.points - b.points
      )
      .slice(0, 3)
      .map(
        (p: {
          player_id: any;
          web_name: any;
          points: any;
          valuePerMillion: any;
        }) => ({
          player_id: p.player_id,
          web_name: p.web_name,
          points: p.points,
          differential: p.valuePerMillion,
          category: "flop" as const,
        })
      );

    // Killers: Players with very poor value (expensive but low points)
    const killers = startingPlayers
      .filter(
        (p: { cost: number; points: number }) => p.cost >= 8 && p.points <= 3
      ) // Expensive (8m+) but low points
      .sort(
        (a: { valuePerMillion: number }, b: { valuePerMillion: number }) =>
          a.valuePerMillion - b.valuePerMillion
      ) // Worst value first
      .slice(0, 2)
      .map((p: { player_id: any; web_name: any; points: any; cost: any }) => ({
        player_id: p.player_id,
        web_name: p.web_name,
        points: p.points,
        differential: p.cost, // Show cost instead of differential for killers
        category: "killer" as const,
      }));

    return { stars, flops, killers };
  };

  const positionData = getPlayerPositionDistribution();
  const pointsData = getPointsDistribution();
  const trendData = getGameweekTrend();
  const valueData = getTeamValueHistory();
  // Removed unused minutesData
  const performanceData = getPlayerPerformance();

  return (
    <div className="space-y-6">
      {/* Player Performance Analysis */}
      <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <MdStar className="w-4 h-4 sm:w-5 sm:h-5 text-theme-primary-foreground theme-transition" />
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-theme-foreground theme-transition">
              {t("fplLive.playerPerformanceAnalysis")}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-theme-text-secondary theme-transition">
              Stars, flops, and differential threats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stars */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
              <MdStar className="w-4 h-4" />
              {t("fplLive.stars")}
            </h4>
            {performanceData.stars.map((player) => (
              <div
                key={player.player_id}
                className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
              >
                <div className="font-medium text-theme-foreground theme-transition">
                  {player.web_name}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {player.points} {t("fplLive.points")} •{" "}
                  {player.differential.toFixed(2)} value/£m
                </div>
              </div>
            ))}
          </div>

          {/* Flops */}
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <MdTrendingDown className="w-4 h-4" />
              {t("fplLive.flops")}
            </h4>
            {performanceData.flops.map((player) => (
              <div
                key={player.player_id}
                className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
              >
                <div className="font-medium text-theme-foreground theme-transition">
                  {player.web_name}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {player.points} {t("fplLive.points")} •{" "}
                  {player.differential.toFixed(2)} value/£m
                </div>
              </div>
            ))}
          </div>

          {/* Killers */}
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <MdDangerous className="w-4 h-4" />
              {t("fplLive.killers")}
            </h4>
            {performanceData.killers.map((player) => (
              <div
                key={player.player_id}
                className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
              >
                <div className="font-medium text-theme-foreground theme-transition">
                  {player.web_name}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  {player.points} {t("fplLive.points")} • £
                  {player.differential.toFixed(1)}m cost
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts - Structured layout as requested */}
      <div className="space-y-4 lg:space-y-6">
        {/* Row 1: Position Distribution + Points Breakdown (2 pie charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* 1. Position Distribution */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.positionDistribution")}
            </h4>
            <div className="chart-container">
              <PieChart
                series={[
                  {
                    data: positionData,
                    highlightScope: { faded: "global", highlighted: "item" },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                  },
                ]}
                height={350}
                margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                  },
                }}
              />
            </div>
          </div>

          {/* 2. Points Breakdown */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.pointsBreakdown")}
            </h4>
            <div className="chart-container">
              <PieChart
                series={[
                  {
                    data: pointsData,
                    innerRadius: 40,
                    outerRadius: 100,
                    paddingAngle: 3,
                    cornerRadius: 5,
                  },
                ]}
                height={350}
                margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Goals/Assists + Defensive Stats + Card Distribution (3 bar charts) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Goals & Assists */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.goalsAssists")}
            </h4>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: ["Goals", "Assists"],
                },
              ]}
              series={[
                {
                  data: [teamTotals.goals || 0, teamTotals.assists || 0],
                  color: "#f59e0b",
                },
              ]}
              height={300}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            />
          </div>

          {/* Defensive Stats */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.defensiveStats")}
            </h4>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: ["Clean Sheets", "Saves"],
                },
              ]}
              series={[
                {
                  data: [teamTotals.clean_sheets || 0, teamTotals.saves || 0],
                  color: "#06b6d4",
                },
              ]}
              height={300}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            />
          </div>

          {/* Card Distribution with correct colors */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.cardDistribution")}
            </h4>
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: ["Yellow Cards", "Red Cards"],
                },
              ]}
              series={[
                {
                  data: [
                    teamTotals.yellow_cards || 0,
                    teamTotals.red_cards || 0,
                  ],
                  color: "#eab308", // Use yellow for the bar, since BarChart expects a string not an array
                },
              ]}
              height={300}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            />
          </div>
        </div>

        {/* Row 3: Performance Matrix + Gameweek Trend (2 charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Performance Matrix */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.performanceMatrix")}
            </h4>
            <ScatterChart
              height={350}
              series={[
                {
                  data: teamStats
                    .filter((p: any) => p.position <= 11)
                    .map((p: any) => ({
                      x: p.live_stats?.minutes || 0,
                      y: p.live_stats?.total_points || 0,
                      id: p.player_id,
                    })),
                  color: "#3b82f6",
                },
              ]}
              margin={{ top: 20, right: 40, bottom: 60, left: 60 }}
            />
          </div>

          {/* Gameweek Trend */}
          <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.gameweekTrend")}
            </h4>
            <LineChart
              xAxis={[{ data: trendData.gameweeks }]}
              series={[
                {
                  data: trendData.points,
                  color: "#3b82f6",
                  curve: "monotoneX",
                },
              ]}
              height={350}
              margin={{ top: 20, right: 40, bottom: 60, left: 60 }}
            />
          </div>
        </div>

        {/* 4. Team Value History */}
        <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.teamValueHistory")}
          </h4>
          <LineChart
            xAxis={[{ data: valueData.weeks }]}
            series={[
              {
                data: valueData.values,
                color: valueData.color,
                area: true,
              },
            ]}
            height={400}
            margin={{ top: 20, right: 40, bottom: 60, left: 60 }}
          />
        </div>

        {/* 5. Player Minutes - Starting XI */}
        <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.playerMinutes")}
          </h4>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .map(
                    (p: any) => p.player?.web_name?.slice(0, 8) || "Unknown"
                  ),
              },
            ]}
            series={[
              {
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .map((p: any) => p.live_stats?.minutes || 0),
                color: "#8b5cf6",
              },
            ]}
            height={400}
            margin={{ top: 20, right: 40, bottom: 80, left: 60 }}
          />
        </div>

        {/* 7. BPS Distribution - All Starting XI */}
        <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.bpsDistribution")}
          </h4>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .sort((a: any, b: any) => a.position - b.position)
                  .map(
                    (p: any) => p.player?.web_name?.slice(0, 10) || "Unknown"
                  ),
              },
            ]}
            series={[
              {
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((p: any) => p.live_stats?.bps || 0),
                color: "#10b981",
              },
            ]}
            height={400}
            margin={{ top: 20, right: 40, bottom: 80, left: 60 }}
          />
        </div>

        {/* 8. ICT Index - All Starting XI */}
        <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.ictIndex")}
          </h4>
          <LineChart
            xAxis={[
              {
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .sort((a: any, b: any) => a.position - b.position)
                  .map(
                    (p: any) => p.player?.web_name?.slice(0, 12) || "Unknown"
                  ),
                scaleType: "point",
              },
            ]}
            series={[
              {
                data: teamStats
                  .filter((p: any) => p.position <= 11)
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((p: any) => p.live_stats?.ict_index || 0),
                color: "#f59e0b",
                curve: "monotoneX",
              },
            ]}
            height={400}
            margin={{ top: 20, right: 40, bottom: 80, left: 60 }}
          />
        </div>
      </div>
    </div>
  );
});

export default AdvancedStatistics;
