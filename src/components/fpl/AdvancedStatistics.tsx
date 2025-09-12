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
  managerId,
  gameweek,
  loading = false,
  managerData,
}: AdvancedStatisticsProps) {
  const { t } = useTranslation("fpl");
  const [historyData, setHistoryData] = React.useState<any>(null);
  // const [historyLoading, setHistoryLoading] = React.useState(false);
  const [captainHistory, setCaptainHistory] = React.useState<any[]>([]);
  const [captainLoading, setCaptainLoading] = React.useState(false);
  const [allPlayers, setAllPlayers] = React.useState<any[]>([]);

  // Fetch manager history data
  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!managerId) return;

      // setHistoryLoading(true);
      try {
        const response = await fetch(`/api/fpl/entry/${managerId}/history`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHistoryData(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch manager history:", error);
      } finally {
        // setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [managerId]);

  // Fetch all players data from bootstrap
  React.useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        const bootstrapResponse = await fetch("/api/fpl/bootstrap-static");
        if (bootstrapResponse.ok) {
          const bootstrapResult = await bootstrapResponse.json();
          if (bootstrapResult.success) {
            setAllPlayers(bootstrapResult.data.elements || []);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch bootstrap data:", error);
      }
    };

    fetchAllPlayers();
  }, []);

  // Fetch actual captain points for each gameweek
  React.useEffect(() => {
    const fetchCaptainData = async () => {
      if (!managerId || !historyData?.current) return;

      setCaptainLoading(true);
      try {
        const history = historyData.current;
        const captainData = [];

        // Fetch picks for each gameweek to get actual captain points
        for (const gwHistory of history) {
          try {
            // Get picks data for this specific gameweek via our backend API
            const picksResponse = await fetch(
              `/api/fpl/entry/${managerId}/event/${gwHistory.event}/picks`
            );

            if (picksResponse.ok) {
              const picksResult = await picksResponse.json();
              if (picksResult.success) {
                const picksData = picksResult.data;

                // Find the captain from picks
                const captain = picksData.picks?.find(
                  (pick: any) => pick.is_captain
                );

                if (captain) {
                  // Find captain player - first try current team, then all players data
                  const captainPlayer = teamStats.find(
                    (p: any) => p.player_id === captain.element
                  );
                  let playerName = captainPlayer?.player?.web_name;

                  // If not found in current team (player transferred out), get from bootstrap
                  if (!playerName && allPlayers.length > 0) {
                    const bootstrapPlayer = allPlayers.find(
                      (p: any) => p.id === captain.element
                    );
                    playerName =
                      bootstrapPlayer?.web_name || `Player ${captain.element}`;
                  }

                  // Fallback if still not found
                  if (!playerName) {
                    playerName = `Player ${captain.element}`;
                  }

                  // Get exact player points for this gameweek using element-summary API
                  let playerPoints = 0;
                  try {
                    const playerSummaryResponse = await fetch(
                      `/api/fpl/element-summary/${captain.element}`
                    );
                    if (playerSummaryResponse.ok) {
                      const playerSummaryResult =
                        await playerSummaryResponse.json();
                      if (playerSummaryResult.success) {
                        const playerSummaryData = playerSummaryResult.data;
                        const gwHistoryEntry = playerSummaryData.history?.find(
                          (h: any) => h.round === gwHistory.event
                        );
                        if (gwHistoryEntry) {
                          playerPoints = gwHistoryEntry.total_points || 0;
                        } else {
                          console.warn(
                            `GW${gwHistory.event} - No history entry found for ${playerName}, using fallback`
                          );
                          // Fallback to estimation
                          const gwPoints = gwHistory.points || 0;
                          playerPoints = Math.max(
                            4,
                            Math.floor(gwPoints * 0.25)
                          );
                        }
                      }
                    }
                  } catch (error) {
                    console.warn(
                      `Failed to get exact points for ${playerName}:`,
                      error
                    );
                    // Fallback to current logic
                    if (
                      gwHistory.event === gameweek &&
                      captainPlayer?.live_stats
                    ) {
                      playerPoints = captainPlayer.live_stats.total_points || 0;
                    } else {
                      const gwPoints = gwHistory.points || 0;
                      playerPoints = Math.max(4, Math.floor(gwPoints * 0.25));
                    }
                  }

                  const captainPoints = playerPoints * captain.multiplier; // Usually 2 for captain, 3 for TC

                  captainData.push({
                    event: gwHistory.event,
                    captainPoints: captainPoints,
                    basePoints: playerPoints,
                    multiplier: captain.multiplier,
                    element: captain.element,
                    playerName: playerName,
                  });
                } else {
                  console.warn(
                    `GW${gwHistory.event}: No captain found in picks`
                  );
                }
              }
            } else {
              console.warn(`GW${gwHistory.event}: Failed to fetch picks data`);
            }
          } catch (error) {
            console.warn(
              `Failed to fetch captain data for GW${gwHistory.event}:`,
              error
            );
            // Use fallback estimation
            captainData.push({
              event: gwHistory.event,
              captainPoints: Math.max(4, Math.floor(gwHistory.points * 0.35)),
              basePoints: 0,
              multiplier: 2,
            });
          }
        }

        console.table(captainData);
        captainData.forEach((c) => {
          console.log(
            `GW${c.event}: ${c.playerName} (${c.element}) - Base: ${c.basePoints}, Multiplier: ${c.multiplier}, Total: ${c.captainPoints}`
          );
        });
        setCaptainHistory(captainData);
      } catch (error) {
        console.error("Failed to fetch captain history:", error);
      } finally {
        setCaptainLoading(false);
      }
    };

    fetchCaptainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId, historyData, allPlayers, gameweek]);

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

  // Extract player data for use in charts
  const playersData = teamStats.map((t: any) => t.player).filter(Boolean);

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
    // Get actual historical data from manager history
    const history = historyData?.current || [];

    if (history.length === 0) {
      // Fallback to current gameweek data if no history available
      const gameweeks = [gameweek];
      const currentGwPoints = manager.summary_event_points || 0;
      const points = [currentGwPoints];
      return { gameweeks, points };
    }

    // Use actual historical data - sort by event to ensure correct order
    // Show individual gameweek points, not cumulative totals
    const sortedHistory = history.sort((a: any, b: any) => a.event - b.event);
    const gameweeks = sortedHistory.map((h: any) => h.event);
    const points = sortedHistory.map((h: any) => h.points); // Use 'points' instead of 'total_points'

    return { gameweeks, points };
  };

  const getTeamValueHistory = () => {
    // Get actual team value history from manager history data
    const history = historyData?.current || [];

    if (history.length === 0) {
      // Fallback to mock team value progression
      const weeks = Array.from({ length: gameweek }, (_, i) => i + 1);
      const values = weeks.map((_, i) => 100 - i * 0.5 + Math.random() * 2);
      const isRising =
        values.length > 1 && values[values.length - 1] > values[0];
      const color = isRising ? "#10b981" : "#ef4444";
      return { weeks, values, color };
    }

    // Use actual historical data - sort by event and convert value to millions
    const sortedHistory = history.sort((a: any, b: any) => a.event - b.event);
    const weeks = sortedHistory.map((h: any) => h.event);
    const values = sortedHistory.map((h: any) => h.value / 10); // Convert to millions

    // Determine if team value is rising or falling overall
    const isRising = values.length > 1 && values[values.length - 1] > values[0];
    const color = isRising ? "#10b981" : "#ef4444"; // Green if rising, red if falling

    return { weeks, values, color };
  };

  // const getCaptainPointsHistory = () => {
  //   // Use the fetched captain history data
  //   if (captainHistory.length > 0) {
  //     const gameweeks = captainHistory.map((c) => c.event);
  //     const captainPoints = captainHistory.map((c) => c.captainPoints);
  //     return { gameweeks, captainPoints };
  //   }

  //   // Fallback - show current gameweek captain data if available
  //   const gameweeks = [gameweek];
  //   const captain = teamStats.find((p: any) => p.is_captain);
  //   const currentCaptainPoints = captain?.live_stats?.total_points || 0;
  //   const captainPoints = [currentCaptainPoints * 2]; // Captain gets double points

  //   return { gameweeks, captainPoints };
  // };

  const getPointsOnBenchHistory = () => {
    // Get points on bench from history data
    const history = historyData?.current || [];

    if (history.length === 0) {
      return { gameweeks: [], benchPoints: [] };
    }

    const sortedHistory = history.sort((a: any, b: any) => a.event - b.event);
    const gameweeks = sortedHistory.map((h: any) => h.event);
    const benchPoints = sortedHistory.map((h: any) => h.points_on_bench || 0);

    return { gameweeks, benchPoints };
  };

  const getTransfersHistory = () => {
    // Get transfers from history data
    const history = historyData?.current || [];

    if (history.length === 0) {
      return { gameweeks: [], transfers: [] };
    }

    const sortedHistory = history.sort((a: any, b: any) => a.event - b.event);
    const gameweeks = sortedHistory.map((h: any) => h.event);
    const transfers = sortedHistory.map((h: any) => h.event_transfers || 0);

    return { gameweeks, transfers };
  };

  const getSeasonRankings = () => {
    // Get past season rankings
    const pastSeasons = historyData?.past || [];

    if (pastSeasons.length === 0) {
      return { seasons: [], rankings: [], totalPoints: [] };
    }

    // Extract the end year from season_name (e.g., "2014/15" -> "2015")
    const seasons = pastSeasons.map((s: any) => {
      const seasonName = s.season_name; // e.g., "2014/15"
      const endYear = seasonName.split("/")[1]; // Get "15"
      return `20${endYear}`; // Convert to "2015"
    });
    const rankings = pastSeasons.map((s: any) => s.rank);
    const totalPoints = pastSeasons.map((s: any) => s.total_points);

    return { seasons, rankings, totalPoints };
  };

  // const getPlayerMinutes = () => {
  //   return teamStats
  //     .filter((player: any) => player.position <= 11)
  //     .map((player: any) => ({
  //       player: player.player?.web_name || "Unknown",
  //       minutes: player.live_stats?.minutes || 0,
  //     }))
  //     .sort((a: any, b: any) => b.minutes - a.minutes)
  //     .slice(0, 11);
  // };

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
  // const captainData = getCaptainPointsHistory();
  const benchData = getPointsOnBenchHistory();
  const transfersData = getTransfersHistory();
  const seasonData = getSeasonRankings();
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* 1. Position Distribution */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.positionDistribution")}
            </h4>
            <div className="chart-container w-full overflow-x-auto">
              <PieChart
                series={[
                  {
                    data: positionData,
                    highlightScope: { faded: "global", highlighted: "item" },
                    faded: {
                      innerRadius: 20,
                      additionalRadius: -20,
                      color: "gray",
                    },
                  },
                ]}
                height={280}
                margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                    itemMarkWidth: 12,
                    itemMarkHeight: 12,
                    labelStyle: { fontSize: "12px" },
                  },
                }}
              />
            </div>
          </div>

          {/* 2. Points Breakdown */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.pointsBreakdown")}
            </h4>
            <div className="chart-container w-full overflow-x-auto">
              <PieChart
                series={[
                  {
                    data: pointsData,
                    innerRadius: 30,
                    outerRadius: 80,
                    paddingAngle: 2,
                    cornerRadius: 3,
                  },
                ]}
                height={280}
                margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                    itemMarkWidth: 12,
                    itemMarkHeight: 12,
                    labelStyle: { fontSize: "12px" },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Goals/Assists + Defensive Stats + Card Distribution (3 bar charts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Goals & Assists */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.goalsAssists")}
            </h4>
            <div className="w-full overflow-x-auto">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: ["Goals", "Assists"],
                    tickLabelStyle: { fontSize: "11px" },
                  },
                ]}
                series={[
                  {
                    data: [teamTotals.goals || 0, teamTotals.assists || 0],
                    color: "#f59e0b",
                  },
                ]}
                height={240}
                margin={{ top: 20, right: 15, bottom: 50, left: 40 }}
              />
            </div>
          </div>

          {/* Defensive Stats */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.defensiveStats")}
            </h4>
            <div className="w-full overflow-x-auto">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: ["Clean Sheets", "Saves"],
                    tickLabelStyle: { fontSize: "11px" },
                  },
                ]}
                series={[
                  {
                    data: [teamTotals.clean_sheets || 0, teamTotals.saves || 0],
                    color: "#06b6d4",
                  },
                ]}
                height={240}
                margin={{ top: 20, right: 15, bottom: 50, left: 40 }}
              />
            </div>
          </div>

          {/* Card Distribution with correct colors */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.cardDistribution")}
            </h4>
            <div className="w-full overflow-x-auto">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: ["Yellow Cards", "Red Cards"],
                    tickLabelStyle: { fontSize: "11px" },
                  },
                ]}
                series={[
                  {
                    data: [
                      teamTotals.yellow_cards || 0,
                      teamTotals.red_cards || 0,
                    ],
                    color: "#eab308",
                  },
                ]}
                height={240}
                margin={{ top: 20, right: 15, bottom: 50, left: 40 }}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Performance Matrix + Gameweek Trend (2 charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Performance Matrix */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              {t("fplLive.performanceMatrix")}
            </h4>
            <div className="w-full overflow-x-auto">
              <ScatterChart
                height={280}
                series={[
                  {
                    data: teamStats
                      .filter((p: any) => p.position <= 11)
                      .map((p: any) => {
                        const player = playersData.find(
                          (pl: any) => pl.id === p.player_id
                        );
                        return {
                          x: p.live_stats?.minutes || 0,
                          y: p.live_stats?.total_points || 0,
                          id: p.player_id,
                          label: player?.web_name || "Unknown",
                        };
                      }),
                    color: "#3b82f6",
                  },
                ]}
                margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                xAxis={[
                  {
                    tickLabelStyle: { fontSize: "11px" },
                    min: 0,
                    max: 90,
                  },
                ]}
                yAxis={[
                  {
                    tickLabelStyle: { fontSize: "11px" },
                    min: 0,
                  },
                ]}
              />
            </div>
          </div>

          {/* Gameweek Points */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-sm sm:text-base text-theme-foreground mb-3 sm:mb-4 theme-transition">
              Gameweek Points
            </h4>
            <div className="w-full overflow-x-auto">
              <LineChart
                xAxis={[
                  {
                    data: trendData.gameweeks,
                    tickLabelStyle: { fontSize: "11px" },
                  },
                ]}
                series={[
                  {
                    data: trendData.points,
                    color: "#3b82f6",
                    curve: "monotoneX",
                  },
                ]}
                height={280}
                margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                yAxis={[{ tickLabelStyle: { fontSize: "11px" } }]}
              />
            </div>
          </div>
        </div>

        {/* Row 4: Captain Points History + Points on Bench */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Captain Points History */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.captainPoints")}
              {captainLoading && (
                <span className="text-xs text-gray-500 ml-2">(Loading...)</span>
              )}
            </h4>
            <div className="w-full overflow-x-auto">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: captainHistory.map((captain) => {
                      const playerName = captain.playerName || "Unknown";
                      return `GW${captain.event}\n${playerName}`;
                    }),
                    tickLabelStyle: {
                      angle: 0,
                      fontSize: 9,
                    },
                  },
                ]}
                series={[
                  {
                    data: captainHistory.map(
                      (captain) => captain.captainPoints
                    ),
                    color: "#8b5cf6",
                  },
                ]}
                height={280}
                margin={{ top: 20, right: 15, bottom: 60, left: 50 }}
              />
            </div>
          </div>

          {/* Points on Bench */}
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.pointsOnBench")}
            </h4>
            <div className="w-full overflow-x-auto">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: benchData.gameweeks.map((gw: number) => `GW${gw}`),
                    tickLabelStyle: {
                      angle: 0,
                      fontSize: 10,
                    },
                  },
                ]}
                series={[
                  {
                    data: benchData.benchPoints,
                    color: "#f59e0b",
                  },
                ]}
                height={280}
                margin={{ top: 20, right: 15, bottom: 40, left: 50 }}
              />
            </div>
          </div>
        </div>

        {/* Row 5: Transfers History (full width) */}
        <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.transfersByGameweek")}
          </h4>
          <div className="w-full overflow-x-auto">
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: transfersData.gameweeks.map((gw: number) => `GW${gw}`),
                  tickLabelStyle: {
                    angle: 0,
                    fontSize: 10,
                  },
                },
              ]}
              series={[
                {
                  data: transfersData.transfers,
                  color: "#ef4444",
                },
              ]}
              height={280}
              margin={{ top: 20, right: 15, bottom: 40, left: 50 }}
            />
          </div>
        </div>

        {/* 4. Team Value History */}
        <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.teamValueHistory")}
          </h4>
          <div className="w-full overflow-x-auto">
            <LineChart
              xAxis={[
                {
                  data: valueData.weeks,
                  tickLabelStyle: { fontSize: "11px" },
                },
              ]}
              series={[
                {
                  data: valueData.values,
                  color: valueData.color,
                  area: true,
                },
              ]}
              height={300}
              margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
              yAxis={[{ tickLabelStyle: { fontSize: "11px" } }]}
            />
          </div>
        </div>

        {/* 5. Player Minutes - Starting XI */}
        <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.playerMinutes")}
          </h4>
          <div className="w-full overflow-x-auto">
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: teamStats
                    .filter((p: any) => p.position <= 11)
                    .map(
                      (p: any) => p.player?.web_name?.slice(0, 6) || "Unknown"
                    ),
                  tickLabelStyle: {
                    angle: -45,
                    fontSize: 10,
                  },
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
              height={320}
              margin={{ top: 20, right: 30, bottom: 70, left: 50 }}
            />
          </div>
        </div>

        {/* 7. BPS Distribution - All Starting XI */}
        <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.bpsDistribution")}
          </h4>
          <div className="w-full overflow-x-auto">
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: teamStats
                    .filter((p: any) => p.position <= 11)
                    .sort((a: any, b: any) => a.position - b.position)
                    .map(
                      (p: any) => p.player?.web_name?.slice(0, 8) || "Unknown"
                    ),
                  tickLabelStyle: {
                    angle: -35,
                    fontSize: 10,
                  },
                },
              ]}
              series={[
                {
                  data: teamStats
                    .filter((p: any) => p.position <= 11)
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((p: any) => {
                      // Ensure BPS value is properly extracted
                      const bps = p.live_stats?.bps;
                      // If live_stats exists but bps is undefined/null, default to 0
                      // If live_stats doesn't exist, the player likely hasn't played
                      return typeof bps === "number" ? bps : 0;
                    }),
                  color: "#10b981",
                },
              ]}
              height={380}
              margin={{ top: 20, right: 40, bottom: 100, left: 60 }}
              yAxis={[
                {
                  tickLabelStyle: { fontSize: "11px" },
                  min: 0,
                },
              ]}
            />
          </div>
        </div>

        {/* 8. ICT Index - All Starting XI */}
        <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
          <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
            {t("fplLive.ictIndex")}
          </h4>
          <div className="w-full overflow-x-auto">
            <LineChart
              xAxis={[
                {
                  data: teamStats
                    .filter((p: any) => p.position <= 11)
                    .sort((a: any, b: any) => a.position - b.position)
                    .map(
                      (p: any) => p.player?.web_name?.slice(0, 6) || "Unknown"
                    ),
                  scaleType: "point",
                  tickLabelStyle: {
                    angle: -45,
                    fontSize: 10,
                  },
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
              height={320}
              margin={{ top: 20, right: 30, bottom: 70, left: 50 }}
              yAxis={[{ tickLabelStyle: { fontSize: "10px" } }]}
            />
          </div>
        </div>

        {/* Row 6: Season Rankings History (full width) */}
        {seasonData.seasons.length > 0 && (
          <div className="bg-theme-card rounded-md p-3 sm:p-4 lg:p-6 border-theme-border theme-transition">
            <h4 className="font-bold text-theme-foreground mb-4 theme-transition">
              {t("fplLive.seasonRankingsThroughYears")}
            </h4>
            <div className="w-full overflow-x-auto">
              <LineChart
                xAxis={[
                  {
                    data: seasonData.seasons,
                    scaleType: "point",
                    tickLabelStyle: { fontSize: "11px" },
                  },
                ]}
                series={[
                  {
                    data: seasonData.rankings,
                    color: "#10b981",
                    curve: "monotoneX",
                    label: "Rank",
                  },
                ]}
                height={300}
                margin={{ top: 20, right: 30, bottom: 50, left: 80 }}
                yAxis={[
                  {
                    tickLabelStyle: { fontSize: "11px" },
                    reverse: true, // Lower rank number = better position
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default AdvancedStatistics;
