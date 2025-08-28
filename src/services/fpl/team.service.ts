/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseFPLService } from "./base.service";
import { FPLBootstrapService } from "./bootstrap.service";
import { FPLServiceError } from "./errors";
import type {
  FPLManagerEntry,
  FPLManagerPicks,
  FPLManagerHistory,
  FPLTransferHistory,
  FPLServiceResponse,
  FPLPlayer,
  // FPLTeam, // Unused import but kept for future use
} from "../../types/fpl";

/**
 * Service for handling team/manager data
 * Includes team information, picks, transfers, and history
 */
export class FPLTeamService extends BaseFPLService {
  private static instance: FPLTeamService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLTeamService {
    if (!FPLTeamService.instance) {
      FPLTeamService.instance = new FPLTeamService();
    }
    return FPLTeamService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get manager's team information
   */
  public async getManagerInfo(
    managerId: number
  ): Promise<FPLServiceResponse<FPLManagerEntry>> {
    this.validateId(managerId, "managerId");

    try {
      const data = await this.fetchWithRetry<FPLManagerEntry>(
        `/entry/${managerId}/`,
        {
          key: `manager_info_${managerId}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(
          `manager_info_${managerId}`,
          this.config.cache.default_ttl
        ),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch manager info for ${managerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getManagerInfo",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get manager's team picks for a specific gameweek
   */
  public async getManagerPicks(
    managerId: number,
    gameweek: number
  ): Promise<FPLServiceResponse<FPLManagerPicks>> {
    this.validateId(managerId, "managerId");
    this.validateGameweek(gameweek);

    try {
      const data = await this.fetchWithRetry<FPLManagerPicks>(
        `/entry/${managerId}/event/${gameweek}/picks/`,
        {
          key: `manager_picks_${managerId}_gw${gameweek}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(
          `manager_picks_${managerId}_gw${gameweek}`,
          this.config.cache.default_ttl
        ),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch manager picks for ${managerId} GW${gameweek}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getManagerPicks",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get manager's historical data across all gameweeks
   */
  public async getManagerHistory(
    managerId: number
  ): Promise<FPLServiceResponse<FPLManagerHistory>> {
    this.validateId(managerId, "managerId");

    try {
      const data = await this.fetchWithRetry<FPLManagerHistory>(
        `/entry/${managerId}/history/`,
        {
          key: `manager_history_${managerId}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(
          `manager_history_${managerId}`,
          this.config.cache.default_ttl
        ),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch manager history for ${managerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getManagerHistory",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get manager's transfer history
   */
  public async getManagerTransfers(
    managerId: number
  ): Promise<FPLServiceResponse<FPLTransferHistory[]>> {
    this.validateId(managerId, "managerId");

    try {
      const data = await this.fetchWithRetry<FPLTransferHistory[]>(
        `/entry/${managerId}/transfers/`,
        {
          key: `manager_transfers_${managerId}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(
          `manager_transfers_${managerId}`,
          this.config.cache.default_ttl
        ),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch manager transfers for ${managerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getManagerTransfers",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get detailed team analysis with player information
   */
  public async getTeamAnalysis(
    managerId: number,
    gameweek: number
  ): Promise<
    FPLServiceResponse<{
      team_value: number;
      bank_balance: number;
      total_transfers: number;
      points_on_bench: number;
      squad: Array<{
        player: FPLPlayer;
        position: number;
        multiplier: number;
        is_captain: boolean;
        is_vice_captain: boolean;
        points: number;
        is_starting: boolean;
      }>;
      formation: {
        goalkeepers: number;
        defenders: number;
        midfielders: number;
        forwards: number;
      };
      captain_info: {
        player: FPLPlayer | null;
        points: number;
        effective_points: number;
      };
    }>
  > {
    this.validateId(managerId, "managerId");
    this.validateGameweek(gameweek);

    try {
      const [picksResponse, playersResponse] = await Promise.all([
        this.getManagerPicks(managerId, gameweek),
        this.bootstrapService.getAllPlayers(),
      ]);

      if (
        !picksResponse.success ||
        !playersResponse.success ||
        !picksResponse.data ||
        !playersResponse.data
      ) {
        throw new Error("Failed to get required data");
      }

      const picks = picksResponse.data;
      const players = playersResponse.data;
      const playersMap = new Map(players.map((p) => [p.id, p]));

      // Build squad with detailed information
      const squad = picks.picks.map((pick) => {
        const player = playersMap.get(pick.element);
        if (!player) {
          throw new FPLServiceError(
            `Player with ID ${pick.element} not found`,
            "FPLTeamService",
            "getTeamAnalysis"
          );
        }

        return {
          player,
          position: pick.position,
          multiplier: pick.multiplier,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
          points: player.event_points * pick.multiplier,
          is_starting: pick.position <= 11,
        };
      });

      // Calculate formation (starting XI only)
      const startingXI = squad.filter((p) => p.is_starting);
      const formation = startingXI.reduce(
        (acc, player) => {
          switch (player.player.element_type) {
            case 1:
              acc.goalkeepers++;
              break;
            case 2:
              acc.defenders++;
              break;
            case 3:
              acc.midfielders++;
              break;
            case 4:
              acc.forwards++;
              break;
          }
          return acc;
        },
        { goalkeepers: 0, defenders: 0, midfielders: 0, forwards: 0 }
      );

      // Captain analysis
      const captain = squad.find((p) => p.is_captain);
      const captainInfo = {
        player: captain?.player || null,
        points: captain?.player?.event_points || 0,
        effective_points:
          (captain?.player?.event_points || 0) * (captain?.multiplier || 1),
      };

      return {
        success: true,
        data: {
          team_value: picks.entry_history.value,
          bank_balance: picks.entry_history.bank,
          total_transfers: picks.entry_history.event_transfers,
          points_on_bench: picks.entry_history.points_on_bench,
          squad,
          formation,
          captain_info: captainInfo,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to analyze team for manager ${managerId} GW${gameweek}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getTeamAnalysis",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get team's performance over multiple gameweeks
   */
  public async getTeamPerformanceHistory(
    managerId: number,
    gameweeksBack = 5
  ): Promise<
    FPLServiceResponse<
      Array<{
        gameweek: number;
        points: number;
        total_points: number;
        rank: number;
        overall_rank: number;
        transfers_made: number;
        points_on_bench: number;
        captain_points: number;
        captain_name: string;
      }>
    >
  > {
    this.validateId(managerId, "managerId");

    try {
      const historyResponse = await this.getManagerHistory(managerId);
      if (!historyResponse.success || !historyResponse.data) {
        throw new Error("Failed to get manager history");
      }

      const recentHistory = historyResponse.data.current
        .slice(-gameweeksBack)
        .reverse(); // Most recent first

      // Enhance with captain information for each gameweek
      const enhancedHistory = await Promise.all(
        recentHistory.map(async (gw) => {
          try {
            const picksResponse = await this.getManagerPicks(
              managerId,
              gw.event
            );
            let captainPoints = 0;
            let captainName = "Unknown";

            if (picksResponse.success && picksResponse.data) {
              const captain = picksResponse.data.picks.find(
                (p) => p.is_captain
              );
              if (captain) {
                const playersResponse =
                  await this.bootstrapService.getAllPlayers();
                if (playersResponse.success && playersResponse.data) {
                  const captainPlayer = playersResponse.data.find(
                    (p) => p.id === captain.element
                  );
                  if (captainPlayer) {
                    captainPoints =
                      captainPlayer.event_points * captain.multiplier;
                    captainName = captainPlayer.web_name;
                  }
                }
              }
            }

            return {
              gameweek: gw.event,
              points: gw.points,
              total_points: gw.total_points,
              rank: gw.rank,
              overall_rank: gw.overall_rank,
              transfers_made: gw.event_transfers,
              points_on_bench: gw.points_on_bench,
              captain_points: captainPoints,
              captain_name: captainName,
            };
          } catch (error) {
            // If we can't get picks data, return basic info
            return {
              gameweek: gw.event,
              points: gw.points,
              total_points: gw.total_points,
              rank: gw.rank,
              overall_rank: gw.overall_rank,
              transfers_made: gw.event_transfers,
              points_on_bench: gw.points_on_bench,
              captain_points: 0,
              captain_name: "Unknown",
            };
          }
        })
      );

      return {
        success: true,
        data: enhancedHistory,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get team performance history for ${managerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "getTeamPerformanceHistory",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Search for managers by team name
   */
  public async searchManagers(
    query: string,
    limit = 10
  ): Promise<
    FPLServiceResponse<
      Array<{
        id: number;
        name: string;
        player_name: string;
        total_points: number;
        overall_rank: number;
      }>
    >
  > {
    // Note: This is a placeholder implementation
    // FPL API doesn't provide a direct search endpoint for managers
    // This would need to be implemented using external search services
    // or by maintaining a separate index of manager names

    throw new FPLServiceError(
      "Manager search functionality not implemented - requires external search service",
      "FPLTeamService",
      "searchManagers"
    );
  }

  /**
   * Compare multiple teams' performance
   */
  public async compareTeams(
    managerIds: number[],
    gameweek?: number
  ): Promise<
    FPLServiceResponse<
      Array<{
        manager_id: number;
        team_name: string;
        player_name: string;
        gameweek_points: number;
        total_points: number;
        overall_rank: number;
        team_value: number;
        transfers_made: number;
        captain: string;
        performance_metrics: {
          average_score: number;
          consistency: number; // Standard deviation of scores
          best_gameweek: number;
          worst_gameweek: number;
        };
      }>
    >
  > {
    if (managerIds.length === 0) {
      throw new FPLServiceError(
        "Manager IDs array cannot be empty",
        "FPLTeamService",
        "compareTeams"
      );
    }

    if (managerIds.length > 10) {
      throw new FPLServiceError(
        "Cannot compare more than 10 teams at once",
        "FPLTeamService",
        "compareTeams"
      );
    }

    try {
      const currentGameweek =
        gameweek ||
        (await this.bootstrapService.getCurrentGameweek()).data?.id ||
        1;

      const teamComparisons = await Promise.all(
        managerIds.map(async (managerId) => {
          try {
            const [infoResponse, picksResponse, historyResponse] =
              await Promise.all([
                this.getManagerInfo(managerId),
                this.getManagerPicks(managerId, currentGameweek),
                this.getManagerHistory(managerId),
              ]);

            if (!infoResponse.success || !infoResponse.data) {
              throw new Error(`Failed to get info for manager ${managerId}`);
            }

            const managerInfo = infoResponse.data;
            let captainName = "Unknown";
            let gameweekPoints = managerInfo.summary_event_points;
            let teamValue = managerInfo.last_deadline_value;

            // Get captain info if picks are available
            if (picksResponse.success && picksResponse.data) {
              const captain = picksResponse.data.picks.find(
                (p) => p.is_captain
              );
              if (captain) {
                const playersResponse =
                  await this.bootstrapService.getAllPlayers();
                if (playersResponse.success && playersResponse.data) {
                  const captainPlayer = playersResponse.data.find(
                    (p) => p.id === captain.element
                  );
                  if (captainPlayer) {
                    captainName = captainPlayer.web_name;
                  }
                }
              }
              gameweekPoints = picksResponse.data.entry_history.points;
              teamValue = picksResponse.data.entry_history.value;
            }

            // Calculate performance metrics from history
            let performanceMetrics = {
              average_score: 0,
              consistency: 0,
              best_gameweek: 0,
              worst_gameweek: 0,
            };

            if (historyResponse.success && historyResponse?.data?.current) {
              const scores = historyResponse.data.current.map(
                (gw) => gw.points
              );
              const averageScore =
                scores.reduce((sum, score) => sum + score, 0) / scores.length;
              const variance =
                scores.reduce(
                  (sum, score) => sum + Math.pow(score - averageScore, 2),
                  0
                ) / scores.length;
              const standardDeviation = Math.sqrt(variance);

              performanceMetrics = {
                average_score: Number(averageScore.toFixed(1)),
                consistency: Number(
                  (100 - (standardDeviation / averageScore) * 100).toFixed(1)
                ), // Higher is more consistent
                best_gameweek: Math.max(...scores),
                worst_gameweek: Math.min(...scores),
              };
            }

            return {
              manager_id: managerId,
              team_name: managerInfo.name,
              player_name: `${managerInfo.player_first_name} ${managerInfo.player_last_name}`,
              gameweek_points: gameweekPoints,
              total_points: managerInfo.summary_overall_points,
              overall_rank: managerInfo.summary_overall_rank,
              team_value: teamValue,
              transfers_made: managerInfo.last_deadline_total_transfers,
              captain: captainName,
              performance_metrics: performanceMetrics,
            };
          } catch (error) {
            // Return partial data if we can't get everything
            return {
              manager_id: managerId,
              team_name: "Unknown",
              player_name: "Unknown",
              gameweek_points: 0,
              total_points: 0,
              overall_rank: 0,
              team_value: 0,
              transfers_made: 0,
              captain: "Unknown",
              performance_metrics: {
                average_score: 0,
                consistency: 0,
                best_gameweek: 0,
                worst_gameweek: 0,
              },
            };
          }
        })
      );

      return {
        success: true,
        data: teamComparisons,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to compare teams: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLTeamService",
        "compareTeams",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear team-specific caches
   */
  public clearTeamCache(managerId?: number): void {
    if (managerId) {
      this.clearCache(`manager.*${managerId}.*`);
    } else {
      this.clearCache("manager.*");
    }
  }
}
