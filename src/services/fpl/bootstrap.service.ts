import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type {
  FPLBootstrapResponse,
  FPLPlayer,
  FPLTeam,
  FPLElementType,
  FPLGameweek,
  FPLServiceResponse,
} from '../../types/fpl';

/**
 * Service for handling bootstrap-static data (players, teams, gameweeks, etc.)
 * This is the core data that rarely changes during a gameweek
 */
export class FPLBootstrapService extends BaseFPLService {
  private static instance: FPLBootstrapService;

  public static getInstance(): FPLBootstrapService {
    if (!FPLBootstrapService.instance) {
      FPLBootstrapService.instance = new FPLBootstrapService();
    }
    return FPLBootstrapService.instance;
  }

  /**
   * Get all bootstrap data (players, teams, gameweeks, etc.)
   */
  public async getBootstrapStatic(): Promise<FPLServiceResponse<FPLBootstrapResponse>> {
    try {
      const data = await this.fetchWithRetry<FPLBootstrapResponse>(
        '/bootstrap-static/',
        {
          key: 'bootstrap_static',
          ttl: this.config.cache.bootstrap_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid('bootstrap_static', this.config.cache.bootstrap_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch bootstrap data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getBootstrapStatic',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all players data
   */
  public async getAllPlayers(): Promise<FPLServiceResponse<FPLPlayer[]>> {
    try {
      const bootstrap = await this.getBootstrapStatic();
      if (!bootstrap.success || !bootstrap.data) {
        throw new Error('Failed to get bootstrap data');
      }

      return {
        success: true,
        data: bootstrap.data.elements,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrap.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch players data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getAllPlayers',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get player by ID
   */
  public async getPlayer(playerId: number): Promise<FPLServiceResponse<FPLPlayer>> {
    this.validateId(playerId, 'playerId');

    try {
      const playersResponse = await this.getAllPlayers();
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error('Failed to get players data');
      }

      const player = playersResponse.data.find(p => p.id === playerId);
      if (!player) {
        throw new FPLServiceError(
          `Player with ID ${playerId} not found`,
          'FPLBootstrapService',
          'getPlayer'
        );
      }

      return {
        success: true,
        data: player,
        timestamp: new Date().toISOString(),
        cache_hit: playersResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player ${playerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getPlayer',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get players by team
   */
  public async getPlayersByTeam(teamId: number): Promise<FPLServiceResponse<FPLPlayer[]>> {
    this.validateId(teamId, 'teamId');

    try {
      const playersResponse = await this.getAllPlayers();
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error('Failed to get players data');
      }

      const teamPlayers = playersResponse.data.filter(p => p.team === teamId);

      return {
        success: true,
        data: teamPlayers,
        timestamp: new Date().toISOString(),
        cache_hit: playersResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch players for team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getPlayersByTeam',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get players by position
   */
  public async getPlayersByPosition(elementType: number): Promise<FPLServiceResponse<FPLPlayer[]>> {
    this.validateId(elementType, 'elementType');

    try {
      const playersResponse = await this.getAllPlayers();
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error('Failed to get players data');
      }

      const positionPlayers = playersResponse.data.filter(p => p.element_type === elementType);

      return {
        success: true,
        data: positionPlayers,
        timestamp: new Date().toISOString(),
        cache_hit: playersResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch players for position ${elementType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getPlayersByPosition',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all teams data
   */
  public async getAllTeams(): Promise<FPLServiceResponse<FPLTeam[]>> {
    try {
      const bootstrap = await this.getBootstrapStatic();
      if (!bootstrap.success || !bootstrap.data) {
        throw new Error('Failed to get bootstrap data');
      }

      return {
        success: true,
        data: bootstrap.data.teams,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrap.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch teams data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getAllTeams',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get team by ID
   */
  public async getTeam(teamId: number): Promise<FPLServiceResponse<FPLTeam>> {
    this.validateId(teamId, 'teamId');

    try {
      const teamsResponse = await this.getAllTeams();
      if (!teamsResponse.success || !teamsResponse.data) {
        throw new Error('Failed to get teams data');
      }

      const team = teamsResponse.data.find(t => t.id === teamId);
      if (!team) {
        throw new FPLServiceError(
          `Team with ID ${teamId} not found`,
          'FPLBootstrapService',
          'getTeam'
        );
      }

      return {
        success: true,
        data: team,
        timestamp: new Date().toISOString(),
        cache_hit: teamsResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getTeam',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all element types (positions)
   */
  public async getAllElementTypes(): Promise<FPLServiceResponse<FPLElementType[]>> {
    try {
      const bootstrap = await this.getBootstrapStatic();
      if (!bootstrap.success || !bootstrap.data) {
        throw new Error('Failed to get bootstrap data');
      }

      return {
        success: true,
        data: bootstrap.data.element_types,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrap.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch element types: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getAllElementTypes',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all gameweeks data
   */
  public async getAllGameweeks(): Promise<FPLServiceResponse<FPLGameweek[]>> {
    try {
      const bootstrap = await this.getBootstrapStatic();
      if (!bootstrap.success || !bootstrap.data) {
        throw new Error('Failed to get bootstrap data');
      }

      return {
        success: true,
        data: bootstrap.data.events,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrap.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch gameweeks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getAllGameweeks',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current gameweek
   */
  public async getCurrentGameweek(): Promise<FPLServiceResponse<FPLGameweek>> {
    try {
      const gameweeksResponse = await this.getAllGameweeks();
      if (!gameweeksResponse.success || !gameweeksResponse.data) {
        throw new Error('Failed to get gameweeks data');
      }

      const currentGameweek = gameweeksResponse.data.find(gw => gw.is_current);
      if (!currentGameweek) {
        // If no current gameweek, find the next one
        const nextGameweek = gameweeksResponse.data.find(gw => gw.is_next);
        if (!nextGameweek) {
          throw new FPLServiceError(
            'No current or next gameweek found',
            'FPLBootstrapService',
            'getCurrentGameweek'
          );
        }
        
        return {
          success: true,
          data: nextGameweek,
          timestamp: new Date().toISOString(),
          cache_hit: gameweeksResponse.cache_hit,
        };
      }

      return {
        success: true,
        data: currentGameweek,
        timestamp: new Date().toISOString(),
        cache_hit: gameweeksResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch current gameweek: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getCurrentGameweek',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get gameweek by ID
   */
  public async getGameweek(gameweekId: number): Promise<FPLServiceResponse<FPLGameweek>> {
    this.validateGameweek(gameweekId);

    try {
      const gameweeksResponse = await this.getAllGameweeks();
      if (!gameweeksResponse.success || !gameweeksResponse.data) {
        throw new Error('Failed to get gameweeks data');
      }

      const gameweek = gameweeksResponse.data.find(gw => gw.id === gameweekId);
      if (!gameweek) {
        throw new FPLServiceError(
          `Gameweek ${gameweekId} not found`,
          'FPLBootstrapService',
          'getGameweek'
        );
      }

      return {
        success: true,
        data: gameweek,
        timestamp: new Date().toISOString(),
        cache_hit: gameweeksResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch gameweek ${gameweekId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getGameweek',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Search players by name
   */
  public async searchPlayers(query: string, limit = 10): Promise<FPLServiceResponse<FPLPlayer[]>> {
    if (!query || query.trim().length < 2) {
      throw new FPLServiceError(
        'Search query must be at least 2 characters long',
        'FPLBootstrapService',
        'searchPlayers'
      );
    }

    try {
      const playersResponse = await this.getAllPlayers();
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error('Failed to get players data');
      }

      const normalizedQuery = query.toLowerCase().trim();
      const filteredPlayers = playersResponse.data
        .filter(player => 
          player.web_name.toLowerCase().includes(normalizedQuery) ||
          player.first_name.toLowerCase().includes(normalizedQuery) ||
          player.second_name.toLowerCase().includes(normalizedQuery) ||
          `${player.first_name} ${player.second_name}`.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, limit);

      return {
        success: true,
        data: filteredPlayers,
        timestamp: new Date().toISOString(),
        cache_hit: playersResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to search players: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'searchPlayers',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get top players by specific criteria
   */
  public async getTopPlayers(
    criteria: 'total_points' | 'form' | 'selected_by_percent' | 'transfers_in',
    limit = 10,
    elementType?: number
  ): Promise<FPLServiceResponse<FPLPlayer[]>> {
    try {
      const playersResponse = await this.getAllPlayers();
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error('Failed to get players data');
      }

      let players = playersResponse.data;
      
      // Filter by position if specified
      if (elementType) {
        this.validateId(elementType, 'elementType');
        players = players.filter(p => p.element_type === elementType);
      }

      // Sort by criteria
      const sortedPlayers = players.sort((a, b) => {
        switch (criteria) {
          case 'total_points':
            return b.total_points - a.total_points;
          case 'form':
            return parseFloat(b.form) - parseFloat(a.form);
          case 'selected_by_percent':
            return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
          case 'transfers_in':
            return b.transfers_in - a.transfers_in;
          default:
            return 0;
        }
      }).slice(0, limit);

      return {
        success: true,
        data: sortedPlayers,
        timestamp: new Date().toISOString(),
        cache_hit: playersResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get top players: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLBootstrapService',
        'getTopPlayers',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear bootstrap cache (useful after gameweek rollover)
   */
  public clearBootstrapCache(): void {
    this.clearCache('bootstrap');
  }
}