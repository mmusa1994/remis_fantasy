import { BaseFPLService } from "./base.service";
import { FPLBootstrapService } from "./bootstrap.service";
import { FPLServiceError } from "./errors";
import type {
  FPLPlayerSummaryResponse,
  FPLPlayer,
  FPLPlayerFixture,
  FPLPlayerGameweekHistory,
  FPLServiceResponse,
} from "../../types/fpl";

/**
 * Service for handling player-specific data
 * Includes detailed player statistics, fixtures, and history
 */
export class FPLPlayerService extends BaseFPLService {
  private static instance: FPLPlayerService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLPlayerService {
    if (!FPLPlayerService.instance) {
      FPLPlayerService.instance = new FPLPlayerService();
    }
    return FPLPlayerService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get detailed player summary including fixtures and history
   */
  public async getPlayerSummary(
    playerId: number
  ): Promise<FPLServiceResponse<FPLPlayerSummaryResponse>> {
    this.validateId(playerId, "playerId");

    try {
      const data = await this.fetchWithRetry<FPLPlayerSummaryResponse>(
        `/element-summary/${playerId}/`,
        {
          key: `player_summary_${playerId}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(
          `player_summary_${playerId}`,
          this.config.cache.default_ttl
        ),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player summary for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerSummary",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player basic info with current season stats
   */
  public async getPlayerInfo(
    playerId: number
  ): Promise<FPLServiceResponse<FPLPlayer>> {
    this.validateId(playerId, "playerId");

    try {
      return await this.bootstrapService.getPlayer(playerId);
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player info for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerInfo",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player's upcoming fixtures
   */
  public async getPlayerFixtures(
    playerId: number,
    limit?: number
  ): Promise<FPLServiceResponse<FPLPlayerFixture[]>> {
    this.validateId(playerId, "playerId");

    try {
      const summaryResponse = await this.getPlayerSummary(playerId);
      if (!summaryResponse.success || !summaryResponse.data) {
        throw new Error("Failed to get player summary");
      }

      // Filter for upcoming fixtures (not finished)
      let fixtures = summaryResponse.data.fixtures.filter(
        (fixture) => !fixture.finished
      );

      if (limit && limit > 0) {
        fixtures = fixtures.slice(0, limit);
      }

      return {
        success: true,
        data: fixtures,
        timestamp: new Date().toISOString(),
        cache_hit: summaryResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player fixtures for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerFixtures",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player's gameweek history for current season
   */
  public async getPlayerHistory(
    playerId: number,
    gameweekLimit?: number
  ): Promise<FPLServiceResponse<FPLPlayerGameweekHistory[]>> {
    this.validateId(playerId, "playerId");

    try {
      const summaryResponse = await this.getPlayerSummary(playerId);
      if (!summaryResponse.success || !summaryResponse.data) {
        throw new Error("Failed to get player summary");
      }

      let history = summaryResponse.data.history.sort(
        (a, b) => b.round - a.round
      );

      if (gameweekLimit && gameweekLimit > 0) {
        history = history.slice(0, gameweekLimit);
      }

      return {
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
        cache_hit: summaryResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player history for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerHistory",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player's performance in a specific gameweek
   */
  public async getPlayerGameweekPerformance(
    playerId: number,
    gameweek: number
  ): Promise<FPLServiceResponse<FPLPlayerGameweekHistory | null>> {
    this.validateId(playerId, "playerId");
    this.validateGameweek(gameweek);

    try {
      const historyResponse = await this.getPlayerHistory(playerId);
      if (!historyResponse.success || !historyResponse.data) {
        throw new Error("Failed to get player history");
      }

      const gameweekPerformance = historyResponse.data.find(
        (h) => h.round === gameweek
      );

      return {
        success: true,
        data: gameweekPerformance || null,
        timestamp: new Date().toISOString(),
        cache_hit: historyResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player gameweek performance for ${playerId} GW${gameweek}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerGameweekPerformance",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player's form (average points over last 5 gameweeks)
   */
  public async getPlayerForm(
    playerId: number,
    gameweeks = 5
  ): Promise<
    FPLServiceResponse<{
      form_score: number;
      recent_scores: number[];
      games_played: number;
    }>
  > {
    this.validateId(playerId, "playerId");

    try {
      const historyResponse = await this.getPlayerHistory(playerId, gameweeks);
      if (!historyResponse.success || !historyResponse.data) {
        throw new Error("Failed to get player history");
      }

      const recentScores = historyResponse.data
        .filter((h) => h.minutes > 0) // Only count games where player played
        .slice(0, gameweeks)
        .map((h) => h.total_points);

      const formScore =
        recentScores.length > 0
          ? recentScores.reduce((sum, points) => sum + points, 0) /
            recentScores.length
          : 0;

      return {
        success: true,
        data: {
          form_score: Number(formScore.toFixed(1)),
          recent_scores: recentScores,
          games_played: recentScores.length,
        },
        timestamp: new Date().toISOString(),
        cache_hit: historyResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to calculate player form for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerForm",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player's fixture difficulty rating (FDR) for upcoming games
   */
  public async getPlayerFixtureDifficulty(
    playerId: number,
    fixturesAhead = 5
  ): Promise<
    FPLServiceResponse<{
      average_difficulty: number;
      fixtures: Array<{
        opponent: string;
        difficulty: number;
        is_home: boolean;
        gameweek: number;
      }>;
    }>
  > {
    this.validateId(playerId, "playerId");

    try {
      const [playerResponse, fixturesResponse, teamsResponse] =
        await Promise.all([
          this.getPlayerInfo(playerId),
          this.getPlayerFixtures(playerId, fixturesAhead),
          this.bootstrapService.getAllTeams(),
        ]);

      if (
        !playerResponse.success ||
        !fixturesResponse.success ||
        !teamsResponse.success ||
        !playerResponse.data ||
        !fixturesResponse.data ||
        !teamsResponse.data
      ) {
        throw new Error("Failed to get required data");
      }

      // const playerTeamId = playerResponse.data.team; // Unused but kept for future use
      const teamsMap = new Map(
        teamsResponse.data.map((team) => [team.id, team])
      );

      const fixtures = fixturesResponse.data.map((fixture) => {
        const isHome = fixture.is_home;
        const opponentTeamId = isHome ? fixture.team_a : fixture.team_h;
        const opponent = teamsMap.get(opponentTeamId);

        return {
          opponent: opponent?.short_name || "Unknown",
          difficulty: fixture.difficulty,
          is_home: isHome,
          gameweek: fixture.event,
        };
      });

      const averageDifficulty =
        fixtures.length > 0
          ? fixtures.reduce((sum, fixture) => sum + fixture.difficulty, 0) /
            fixtures.length
          : 0;

      return {
        success: true,
        data: {
          average_difficulty: Number(averageDifficulty.toFixed(1)),
          fixtures,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get fixture difficulty for player ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerFixtureDifficulty",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player comparison data for multiple players
   */
  public async comparePlayerStats(
    playerIds: number[],
    metrics: Array<keyof FPLPlayer> = [
      "total_points",
      "form",
      "selected_by_percent",
      "now_cost",
    ]
  ): Promise<
    FPLServiceResponse<
      Array<{
        player_id: number;
        web_name: string;
        team_name: string;
        position: string;
        stats: Record<string, any>;
      }>
    >
  > {
    if (playerIds.length === 0) {
      throw new FPLServiceError(
        "Player IDs array cannot be empty",
        "FPLPlayerService",
        "comparePlayerStats"
      );
    }

    if (playerIds.length > 10) {
      throw new FPLServiceError(
        "Cannot compare more than 10 players at once",
        "FPLPlayerService",
        "comparePlayerStats"
      );
    }

    try {
      const [playersResponse, teamsResponse, elementTypesResponse] =
        await Promise.all([
          this.bootstrapService.getAllPlayers(),
          this.bootstrapService.getAllTeams(),
          this.bootstrapService.getAllElementTypes(),
        ]);

      if (
        !playersResponse.success ||
        !teamsResponse.success ||
        !elementTypesResponse.success ||
        !playersResponse.data ||
        !teamsResponse.data ||
        !elementTypesResponse.data
      ) {
        throw new Error("Failed to get bootstrap data");
      }

      const teamsMap = new Map(
        teamsResponse.data.map((team) => [team.id, team.short_name])
      );
      const positionsMap = new Map(
        elementTypesResponse.data.map((pos) => [pos.id, pos.singular_name])
      );

      const comparisonData = playerIds.map((playerId) => {
        const player = playersResponse.data?.find((p) => p.id === playerId);
        if (!player) {
          throw new FPLServiceError(
            `Player with ID ${playerId} not found`,
            "FPLPlayerService",
            "comparePlayerStats"
          );
        }

        const stats: Record<string, any> = {};
        metrics.forEach((metric) => {
          stats[metric] = player[metric];
        });

        return {
          player_id: playerId,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || "Unknown",
          position: positionsMap.get(player.element_type) || "Unknown",
          stats,
        };
      });

      return {
        success: true,
        data: comparisonData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to compare player stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "comparePlayerStats",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player value analysis (points per cost)
   */
  public async getPlayerValue(playerId: number): Promise<
    FPLServiceResponse<{
      points_per_million: number;
      value_rank: number;
      total_value_rank: number;
      position_value_rank: number;
    }>
  > {
    this.validateId(playerId, "playerId");

    try {
      const [playerResponse, allPlayersResponse] = await Promise.all([
        this.getPlayerInfo(playerId),
        this.bootstrapService.getAllPlayers(),
      ]);

      if (
        !playerResponse.success ||
        !allPlayersResponse.success ||
        !playerResponse.data ||
        !allPlayersResponse.data
      ) {
        throw new Error("Failed to get players data");
      }

      const player = playerResponse.data;
      const allPlayers = allPlayersResponse.data;

      const pointsPerMillion =
        player.now_cost > 0 ? (player.total_points / player.now_cost) * 10 : 0;

      // Calculate rankings
      const valueRankedPlayers = allPlayers
        .filter((p) => p.total_points > 0 && p.now_cost > 0)
        .map((p) => ({
          id: p.id,
          value: (p.total_points / p.now_cost) * 10,
          element_type: p.element_type,
        }))
        .sort((a, b) => b.value - a.value);

      const valueRank =
        valueRankedPlayers.findIndex((p) => p.id === playerId) + 1;

      const positionValueRankedPlayers = valueRankedPlayers.filter(
        (p) => p.element_type === player.element_type
      );
      const positionValueRank =
        positionValueRankedPlayers.findIndex((p) => p.id === playerId) + 1;

      return {
        success: true,
        data: {
          points_per_million: Number(pointsPerMillion.toFixed(2)),
          value_rank: valueRank,
          total_value_rank: valueRank,
          position_value_rank: positionValueRank,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to calculate player value for ${playerId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPlayerService",
        "getPlayerValue",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear player-specific caches
   */
  public clearPlayerCache(playerId?: number): void {
    if (playerId) {
      this.clearCache(`player_summary_${playerId}`);
    } else {
      this.clearCache("player_");
    }
  }
}
