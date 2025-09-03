import { FPLBootstrapService } from './bootstrap.service';
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
 * Singleton manager for sharing bootstrap data across all FPL services
 * Prevents multiple redundant API calls for the same bootstrap data
 */
export class SharedBootstrapManager {
  private static instance: SharedBootstrapManager;
  private bootstrapService: FPLBootstrapService;
  
  // Cached data with timestamps
  private cachedBootstrapData: FPLBootstrapResponse | null = null;
  private lastBootstrapFetch: number = 0;
  private readonly BOOTSTRAP_TTL = 600000; // 10 minutes
  
  // Request deduplication
  private pendingBootstrapRequest: Promise<FPLServiceResponse<FPLBootstrapResponse>> | null = null;
  
  // Derived data caches to avoid repeated processing
  private playersMap: Map<number, FPLPlayer> | null = null;
  private teamsMap: Map<number, FPLTeam> | null = null;
  private elementTypesMap: Map<number, FPLElementType> | null = null;
  private gameweeksMap: Map<number, FPLGameweek> | null = null;

  public static getInstance(): SharedBootstrapManager {
    if (!SharedBootstrapManager.instance) {
      SharedBootstrapManager.instance = new SharedBootstrapManager();
    }
    return SharedBootstrapManager.instance;
  }

  private constructor() {
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get shared bootstrap data with intelligent caching and request deduplication
   */
  public async getSharedBootstrapData(): Promise<FPLServiceResponse<FPLBootstrapResponse>> {
    // Return cached data if still fresh
    if (this.isBootstrapDataFresh()) {
      return {
        success: true,
        data: this.cachedBootstrapData!,
        timestamp: new Date().toISOString(),
        cache_hit: true,
      };
    }

    // If request is already in progress, return the pending promise
    if (this.pendingBootstrapRequest) {
      return this.pendingBootstrapRequest;
    }

    // Start new request
    this.pendingBootstrapRequest = this.fetchFreshBootstrapData();

    try {
      const result = await this.pendingBootstrapRequest;
      return result;
    } finally {
      this.pendingBootstrapRequest = null;
    }
  }

  /**
   * Get processed players map (id -> player) for efficient lookups
   */
  public async getPlayersMap(): Promise<Map<number, FPLPlayer>> {
    if (this.playersMap && this.isBootstrapDataFresh()) {
      return this.playersMap;
    }

    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error('Failed to get bootstrap data for players map');
    }

    this.playersMap = new Map(
      bootstrapResponse.data.elements.map(player => [player.id, player])
    );

    return this.playersMap;
  }

  /**
   * Get processed teams map (id -> team) for efficient lookups
   */
  public async getTeamsMap(): Promise<Map<number, FPLTeam>> {
    if (this.teamsMap && this.isBootstrapDataFresh()) {
      return this.teamsMap;
    }

    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error('Failed to get bootstrap data for teams map');
    }

    this.teamsMap = new Map(
      bootstrapResponse.data.teams.map(team => [team.id, team])
    );

    return this.teamsMap;
  }

  /**
   * Get processed element types map (id -> position) for efficient lookups
   */
  public async getElementTypesMap(): Promise<Map<number, FPLElementType>> {
    if (this.elementTypesMap && this.isBootstrapDataFresh()) {
      return this.elementTypesMap;
    }

    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error('Failed to get bootstrap data for element types map');
    }

    this.elementTypesMap = new Map(
      bootstrapResponse.data.element_types.map(elementType => [elementType.id, elementType])
    );

    return this.elementTypesMap;
  }

  /**
   * Get processed gameweeks map (id -> gameweek) for efficient lookups
   */
  public async getGameweeksMap(): Promise<Map<number, FPLGameweek>> {
    if (this.gameweeksMap && this.isBootstrapDataFresh()) {
      return this.gameweeksMap;
    }

    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error('Failed to get bootstrap data for gameweeks map');
    }

    this.gameweeksMap = new Map(
      bootstrapResponse.data.events.map(gameweek => [gameweek.id, gameweek])
    );

    return this.gameweeksMap;
  }

  /**
   * Get specific player by ID without fetching full bootstrap
   */
  public async getPlayer(playerId: number): Promise<FPLPlayer | null> {
    const playersMap = await this.getPlayersMap();
    return playersMap.get(playerId) || null;
  }

  /**
   * Get specific team by ID without fetching full bootstrap
   */
  public async getTeam(teamId: number): Promise<FPLTeam | null> {
    const teamsMap = await this.getTeamsMap();
    return teamsMap.get(teamId) || null;
  }

  /**
   * Get team name by ID (common operation for ownership analytics)
   */
  public async getTeamName(teamId: number): Promise<string> {
    const team = await this.getTeam(teamId);
    return team?.short_name || 'Unknown';
  }

  /**
   * Get position name by element type ID
   */
  public async getPositionName(elementType: number): Promise<string> {
    const elementTypesMap = await this.getElementTypesMap();
    const position = elementTypesMap.get(elementType);
    return position?.singular_name_short || 'Unknown';
  }

  /**
   * Get current gameweek without full bootstrap fetch
   */
  public async getCurrentGameweek(): Promise<FPLGameweek | null> {
    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      return null;
    }

    return bootstrapResponse.data.events.find(gw => gw.is_current) || 
           bootstrapResponse.data.events.find(gw => gw.is_next) || 
           null;
  }

  /**
   * Filter players by criteria without multiple bootstrap fetches
   */
  public async filterPlayers(
    criteria: (player: FPLPlayer) => boolean
  ): Promise<FPLPlayer[]> {
    const bootstrapResponse = await this.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      return [];
    }

    return bootstrapResponse.data.elements.filter(criteria);
  }

  /**
   * Clear all cached data (useful for gameweek rollover)
   */
  public clearCache(): void {
    this.cachedBootstrapData = null;
    this.lastBootstrapFetch = 0;
    this.playersMap = null;
    this.teamsMap = null;
    this.elementTypesMap = null;
    this.gameweeksMap = null;
    this.pendingBootstrapRequest = null;
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    bootstrap_cached: boolean;
    bootstrap_age_ms: number;
    derived_caches: {
      players: boolean;
      teams: boolean;
      element_types: boolean;
      gameweeks: boolean;
    };
  } {
    const now = Date.now();
    return {
      bootstrap_cached: this.cachedBootstrapData !== null,
      bootstrap_age_ms: this.lastBootstrapFetch > 0 ? now - this.lastBootstrapFetch : 0,
      derived_caches: {
        players: this.playersMap !== null,
        teams: this.teamsMap !== null,
        element_types: this.elementTypesMap !== null,
        gameweeks: this.gameweeksMap !== null,
      },
    };
  }

  /**
   * Check if bootstrap data is still fresh
   */
  private isBootstrapDataFresh(): boolean {
    if (!this.cachedBootstrapData || this.lastBootstrapFetch === 0) {
      return false;
    }

    const now = Date.now();
    return (now - this.lastBootstrapFetch) < this.BOOTSTRAP_TTL;
  }

  /**
   * Fetch fresh bootstrap data and update cache
   */
  private async fetchFreshBootstrapData(): Promise<FPLServiceResponse<FPLBootstrapResponse>> {
    try {
      const response = await this.bootstrapService.getBootstrapStatic();
      
      if (response.success && response.data) {
        // Update cache
        this.cachedBootstrapData = response.data;
        this.lastBootstrapFetch = Date.now();
        
        // Clear derived caches to force regeneration with new data
        this.playersMap = null;
        this.teamsMap = null;
        this.elementTypesMap = null;
        this.gameweeksMap = null;
      }

      return response;
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch bootstrap data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SharedBootstrapManager',
        'fetchFreshBootstrapData',
        error instanceof Error ? error : undefined
      );
    }
  }
}