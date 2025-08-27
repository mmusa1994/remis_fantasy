import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  FPLLiveResponse,
  FPLEventStatus,
  FPLServiceResponse,
} from '../../types/fpl';

/**
 * Service for handling live gameweek data
 * Provides real-time player scores, bonus points, and event status
 */
export class FPLLiveService extends BaseFPLService {
  private static instance: FPLLiveService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLLiveService {
    if (!FPLLiveService.instance) {
      FPLLiveService.instance = new FPLLiveService();
    }
    return FPLLiveService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get live data for a specific gameweek
   */
  public async getLiveData(gameweek: number): Promise<FPLServiceResponse<FPLLiveResponse>> {
    this.validateGameweek(gameweek);

    try {
      const data = await this.fetchWithRetry<FPLLiveResponse>(
        `/event/${gameweek}/live/`,
        {
          key: `live_data_gw${gameweek}`,
          ttl: this.config.cache.live_data_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`live_data_gw${gameweek}`, this.config.cache.live_data_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch live data for gameweek ${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'getLiveData',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current gameweek live data
   */
  public async getCurrentLiveData(): Promise<FPLServiceResponse<FPLLiveResponse>> {
    try {
      const currentGameweekResponse = await this.bootstrapService.getCurrentGameweek();
      if (!currentGameweekResponse.success || !currentGameweekResponse.data) {
        throw new Error('Failed to get current gameweek');
      }

      return await this.getLiveData(currentGameweekResponse.data.id);
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch current live data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'getCurrentLiveData',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get event status (bonus points, etc.)
   */
  public async getEventStatus(): Promise<FPLServiceResponse<FPLEventStatus>> {
    try {
      const data = await this.fetchWithRetry<FPLEventStatus>(
        '/event-status/',
        {
          key: 'event_status',
          ttl: this.config.cache.live_data_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid('event_status', this.config.cache.live_data_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch event status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'getEventStatus',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if bonus points have been added for a gameweek
   */
  public async areBonusPointsAdded(gameweek?: number): Promise<FPLServiceResponse<{
    gameweek: number;
    bonus_added: boolean;
    last_updated: string;
  }>> {
    try {
      const currentGameweek = gameweek || (await this.bootstrapService.getCurrentGameweek()).data?.id || 1;
      const eventStatusResponse = await this.getEventStatus();
      
      if (!eventStatusResponse.success || !eventStatusResponse.data) {
        throw new Error('Failed to get event status');
      }

      const gameweekStatus = eventStatusResponse.data.status.find(
        status => status.event === currentGameweek
      );

      return {
        success: true,
        data: {
          gameweek: currentGameweek,
          bonus_added: gameweekStatus?.bonus_added || false,
          last_updated: gameweekStatus?.date || new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        cache_hit: eventStatusResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to check bonus points status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'areBonusPointsAdded',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get live player scores for specific players
   */
  public async getPlayerLiveScores(
    playerIds: number[],
    gameweek?: number
  ): Promise<FPLServiceResponse<Array<{
    player_id: number;
    web_name: string;
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    bonus: number;
    bps: number;
    in_dreamteam: boolean;
  }>>> {
    if (playerIds.length === 0) {
      throw new FPLServiceError(
        'Player IDs array cannot be empty',
        'FPLLiveService',
        'getPlayerLiveScores'
      );
    }

    try {
      const currentGameweek = gameweek || (await this.bootstrapService.getCurrentGameweek()).data?.id || 1;
      
      const [liveDataResponse, playersResponse] = await Promise.all([
        this.getLiveData(currentGameweek),
        this.bootstrapService.getAllPlayers(),
      ]);

      if (!liveDataResponse.success || !playersResponse.success ||
          !liveDataResponse.data || !playersResponse.data) {
        throw new Error('Failed to get required data');
      }

      const liveElements = new Map(
        liveDataResponse.data.elements.map(element => [element.id, element])
      );
      const playersMap = new Map(
        playersResponse.data.map(player => [player.id, player])
      );

      const playerScores = playerIds.map(playerId => {
        const player = playersMap.get(playerId);
        const liveElement = liveElements.get(playerId);
        
        if (!player) {
          throw new FPLServiceError(
            `Player with ID ${playerId} not found`,
            'FPLLiveService',
            'getPlayerLiveScores'
          );
        }

        const liveStats = liveElement?.stats || {
          total_points: 0,
          minutes: 0,
          goals_scored: 0,
          assists: 0,
          bonus: 0,
          bps: 0,
          in_dreamteam: false,
        };

        return {
          player_id: playerId,
          web_name: player.web_name,
          total_points: liveStats.total_points,
          minutes: liveStats.minutes,
          goals_scored: liveStats.goals_scored,
          assists: liveStats.assists,
          bonus: liveStats.bonus,
          bps: liveStats.bps,
          in_dreamteam: liveStats.in_dreamteam,
        };
      });

      return {
        success: true,
        data: playerScores,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get live player scores: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'getPlayerLiveScores',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get top performers in current gameweek
   */
  public async getTopPerformers(
    limit = 10,
    gameweek?: number
  ): Promise<FPLServiceResponse<Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    position: string;
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    bonus: number;
    in_dreamteam: boolean;
  }>>> {
    try {
      const currentGameweek = gameweek || (await this.bootstrapService.getCurrentGameweek()).data?.id || 1;
      
      const [liveDataResponse, playersResponse, teamsResponse, elementTypesResponse] = await Promise.all([
        this.getLiveData(currentGameweek),
        this.bootstrapService.getAllPlayers(),
        this.bootstrapService.getAllTeams(),
        this.bootstrapService.getAllElementTypes(),
      ]);

      if (!liveDataResponse.success || !playersResponse.success ||
          !teamsResponse.success || !elementTypesResponse.success ||
          !liveDataResponse.data || !playersResponse.data ||
          !teamsResponse.data || !elementTypesResponse.data) {
        throw new Error('Failed to get required data');
      }

      const playersMap = new Map(playersResponse.data.map(p => [p.id, p]));
      const teamsMap = new Map(teamsResponse.data.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(elementTypesResponse.data.map(et => [et.id, et.singular_name]));

      // Sort live elements by total points and take top performers
      const topPerformers = liveDataResponse.data.elements
        .filter(element => element.stats.minutes > 0) // Only include players who played
        .sort((a, b) => b.stats.total_points - a.stats.total_points)
        .slice(0, limit)
        .map(element => {
          const player = playersMap.get(element.id);
          if (!player) return null;

          return {
            player_id: element.id,
            web_name: player.web_name,
            team_name: teamsMap.get(player.team) || 'Unknown',
            position: positionsMap.get(player.element_type) || 'Unknown',
            total_points: element.stats.total_points,
            minutes: element.stats.minutes,
            goals_scored: element.stats.goals_scored,
            assists: element.stats.assists,
            bonus: element.stats.bonus,
            in_dreamteam: element.stats.in_dreamteam,
          };
        })
        .filter(Boolean) as Array<any>;

      return {
        success: true,
        data: topPerformers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get top performers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLiveService',
        'getTopPerformers',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear live data caches
   */
  public clearLiveCache(gameweek?: number): void {
    if (gameweek) {
      this.clearCache(`live_data_gw${gameweek}`);
    } else {
      this.clearCache('live_data');
      this.clearCache('event_status');
    }
  }
}