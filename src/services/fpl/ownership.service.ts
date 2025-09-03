import { BaseFPLService } from "./base.service";
import { SharedBootstrapManager } from "./shared-bootstrap-manager";
import { OwnershipAnalyticsCache } from "./ownership-analytics-cache";
import { FPLServiceError } from "./errors";
import type {
  OwnershipAnalytics,
  OwnershipChange,
  EnhancedFPLResponse,
} from "../../types/fpl-enhanced";
import type { FPLPlayer } from "../../types/fpl";

/**
 * Optimized service for tracking ownership changes and trends
 * Uses shared bootstrap manager and analytics cache to prevent infinite loops
 */
export class FPLOwnershipService extends BaseFPLService {
  private static instance: FPLOwnershipService;
  private sharedBootstrapManager: SharedBootstrapManager;
  private analyticsCache: OwnershipAnalyticsCache;

  public static getInstance(): FPLOwnershipService {
    if (!FPLOwnershipService.instance) {
      FPLOwnershipService.instance = new FPLOwnershipService();
    }
    return FPLOwnershipService.instance;
  }

  constructor() {
    super();
    this.sharedBootstrapManager = SharedBootstrapManager.getInstance();
    this.analyticsCache = OwnershipAnalyticsCache.getInstance();
  }

  /**
   * Get ownership changes and trends with intelligent caching
   */
  public async getOwnershipAnalytics(
    timeframe: "1h" | "24h" | "week" = "1h"
  ): Promise<EnhancedFPLResponse<OwnershipAnalytics>> {
    try {
      // Check cache first to avoid redundant calculations
      const cachedAnalytics = this.analyticsCache.getCachedAnalytics(timeframe);
      if (cachedAnalytics) {
        return {
          success: true,
          data: cachedAnalytics,
          timestamp: new Date().toISOString(),
          cache_hit: true,
        };
      }

      // Get shared bootstrap data (will use cached version if available)
      const bootstrapResponse = await this.sharedBootstrapManager.getSharedBootstrapData();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error("Failed to get bootstrap data");
      }

      const { elements: players } = bootstrapResponse.data;
      
      // Get teams map efficiently
      const teamsMap = await this.sharedBootstrapManager.getTeamsMap();

      // Calculate ownership changes directly without intermediate method calls
      const ownershipChanges = await this.calculateOwnershipChangesOptimized(
        players,
        teamsMap,
        timeframe
      );

      // Get top risers and fallers
      const top_risers = ownershipChanges
        .filter((change) => change.ownership_trend === "rising")
        .sort((a, b) => b.momentum_score - a.momentum_score)
        .slice(0, 10);

      const top_fallers = ownershipChanges
        .filter((change) => change.ownership_trend === "falling")
        .sort((a, b) => b.momentum_score - a.momentum_score)
        .slice(0, 10);

      // Find trending differentials (low ownership but rising)
      const trending_differentials = ownershipChanges
        .filter(
          (change) =>
            change.current_ownership < 5 && // Low ownership
            change.ownership_trend === "rising" &&
            change.momentum_score > 0.1
        )
        .sort((a, b) => b.momentum_score - a.momentum_score)
        .slice(0, 10);

      const analytics: OwnershipAnalytics = {
        top_risers,
        top_fallers,
        trending_differentials,
        ownership_analysis: {
          total_active_managers: 8500000, // Mock data
          average_ownership_change:
            this.calculateAverageOwnershipChange(ownershipChanges),
          volatile_players: ownershipChanges.filter(
            (change) => Math.abs(change.momentum_score) > 0.5
          ).length,
        },
        last_update: new Date().toISOString(),
      };

      // Cache the computed analytics
      this.analyticsCache.setCachedAnalytics(timeframe, analytics);

      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit || false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch ownership analytics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLOwnershipService",
        "getOwnershipAnalytics",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get ownership changes for specific players WITHOUT calling getOwnershipAnalytics
   * This eliminates the infinite loop by processing data directly
   */
  public async getPlayerOwnershipTrends(
    playerIds: number[],
    timeframe: "1h" | "24h" | "week" = "1h"
  ): Promise<EnhancedFPLResponse<OwnershipChange[]>> {
    try {
      // First check if we have cached player trends
      const cachedTrends = this.analyticsCache.getCachedPlayerTrends(playerIds, timeframe);
      if (cachedTrends) {
        return {
          success: true,
          data: cachedTrends,
          timestamp: new Date().toISOString(),
          cache_hit: true,
        };
      }

      // Try to get from cached analytics without triggering new calculation
      const filteredFromCache = this.analyticsCache.filterOwnershipChangesByPlayerIds(
        playerIds,
        timeframe
      );
      
      if (filteredFromCache) {
        // Cache the player-specific trends
        this.analyticsCache.setCachedPlayerTrends(playerIds, timeframe, filteredFromCache);
        
        return {
          success: true,
          data: filteredFromCache,
          timestamp: new Date().toISOString(),
          cache_hit: true,
        };
      }

      // If no cache available, calculate directly without going through getOwnershipAnalytics
      const playerTrends = await this.calculatePlayerTrendsDirectly(playerIds, timeframe);

      // Cache the calculated trends
      this.analyticsCache.setCachedPlayerTrends(playerIds, timeframe, playerTrends);

      return {
        success: true,
        data: playerTrends,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player ownership trends: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLOwnershipService",
        "getPlayerOwnershipTrends",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get differential players (low ownership, high potential) using shared data
   */
  public async getDifferentialPlayers(
    maxOwnership: number = 5,
    minPoints: number = 30
  ): Promise<
    EnhancedFPLResponse<
      Array<{
        player_id: number;
        web_name: string;
        team_name: string;
        position: string;
        ownership: number;
        total_points: number;
        differential_score: number;
        form: number;
      }>
    >
  > {
    try {
      // Get shared bootstrap data
      const bootstrapResponse = await this.sharedBootstrapManager.getSharedBootstrapData();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error("Failed to get bootstrap data");
      }

      const { elements: players } = bootstrapResponse.data;
      
      // Get maps efficiently
      const [teamsMap, elementTypesMap] = await Promise.all([
        this.sharedBootstrapManager.getTeamsMap(),
        this.sharedBootstrapManager.getElementTypesMap(),
      ]);

      const differentials = players
        .filter(
          (player) =>
            parseFloat(player.selected_by_percent) <= maxOwnership &&
            player.total_points >= minPoints &&
            player.status === "a" // Available only
        )
        .map((player) => {
          const ownership = parseFloat(player.selected_by_percent);
          const differential_score = this.calculateDifferentialScore(
            player,
            ownership
          );

          return {
            player_id: player.id,
            web_name: player.web_name,
            team_name: teamsMap.get(player.team)?.short_name || "Unknown",
            position: elementTypesMap.get(player.element_type)?.singular_name_short || "Unknown",
            ownership,
            total_points: player.total_points,
            differential_score,
            form: parseFloat(player.form),
          };
        })
        .sort((a, b) => b.differential_score - a.differential_score)
        .slice(0, 20);

      return {
        success: true,
        data: differentials,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit || false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch differential players: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLOwnershipService",
        "getDifferentialPlayers",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculate ownership changes directly for specific players (optimized version)
   */
  private async calculatePlayerTrendsDirectly(
    playerIds: number[],
    timeframe: "1h" | "24h" | "week"
  ): Promise<OwnershipChange[]> {
    // Get shared bootstrap data
    const bootstrapResponse = await this.sharedBootstrapManager.getSharedBootstrapData();
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error("Failed to get bootstrap data for player trends");
    }

    const { elements: players } = bootstrapResponse.data;
    const teamsMap = await this.sharedBootstrapManager.getTeamsMap();

    // Filter to only requested players
    const requestedPlayers = players.filter(player => playerIds.includes(player.id));
    
    return this.calculateOwnershipChangesOptimized(requestedPlayers, teamsMap, timeframe);
  }

  /**
   * Optimized ownership changes calculation with async team/position lookups
   */
  private async calculateOwnershipChangesOptimized(
    players: FPLPlayer[],
    teamsMap: Map<number, any>,
    timeframe: "1h" | "24h" | "week"
  ): Promise<OwnershipChange[]> {
    const ownershipChanges: OwnershipChange[] = [];
    
    for (const player of players) {
      if (player.total_points <= 10) continue; // Filter out low-performing players
      
      const current_ownership = parseFloat(player.selected_by_percent);

      // Mock ownership changes based on transfer activity and form
      const transferActivity =
        (player.transfers_in_event - player.transfers_out_event) / 100000;
      const formFactor = parseFloat(player.form) / 10;

      // Generate mock changes
      const baseChange = transferActivity * formFactor;
      const ownership_change_1h =
        timeframe === "1h" ? baseChange * 0.1 : baseChange * 0.05;
      const ownership_change_24h =
        timeframe === "24h" ? baseChange : baseChange * 0.5;
      const ownership_change_week = baseChange * 2; // rough weekly aggregation mock

      const relevantChange =
        timeframe === "1h"
          ? ownership_change_1h
          : timeframe === "24h"
          ? ownership_change_24h
          : ownership_change_week;

      const ownershipTrend: "rising" | "falling" | "stable" =
        relevantChange > 0.05
          ? "rising"
          : relevantChange < -0.05
          ? "falling"
          : "stable";

      // Get team name and position efficiently
      const teamName = teamsMap.get(player.team)?.short_name || "Unknown";
      const positionName = await this.sharedBootstrapManager.getPositionName(player.element_type);

      const change: OwnershipChange = {
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamName,
        position: positionName,
        current_ownership,
        ownership_change_1h,
        ownership_change_24h,
        ownership_trend: ownershipTrend,
        momentum_score: Math.abs(relevantChange),
      };

      if (change.momentum_score > 0.01) {
        ownershipChanges.push(change);
      }
    }
    
    return ownershipChanges;
  }

  /**
   * Calculate mock ownership changes (legacy method for backward compatibility)
   */
  private async calculateOwnershipChanges(
    players: FPLPlayer[],
    teamsMap: Map<number, any>,
    timeframe: "1h" | "24h" | "week"
  ): Promise<OwnershipChange[]> {
    return this.calculateOwnershipChangesOptimized(players, teamsMap, timeframe);
  }

  /**
   * Calculate differential score for a player
   */
  private calculateDifferentialScore(player: any, ownership: number): number {
    const points = player.total_points;
    const form = parseFloat(player.form);
    const value = player.total_points / (player.now_cost / 10); // Points per million

    // Higher score for lower ownership, higher points, and better form
    const ownershipScore = Math.max(0, 10 - ownership); // 0-10 scale
    const pointsScore = Math.min(10, points / 20); // 0-10 scale
    const formScore = Math.min(10, form); // 0-10 scale
    const valueScore = Math.min(10, value / 10); // 0-10 scale

    return (
      ownershipScore * 0.4 +
      pointsScore * 0.3 +
      formScore * 0.2 +
      valueScore * 0.1
    );
  }

  /**
   * Calculate average ownership change
   */
  private calculateAverageOwnershipChange(changes: OwnershipChange[]): number {
    if (changes.length === 0) return 0;

    // Use momentum_score to reflect the active timeframe used
    const totalChange = changes.reduce(
      (sum, change) => sum + change.momentum_score,
      0
    );

    return totalChange / changes.length;
  }

  private getPositionName(elementType: number): string {
    const positions = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
    return positions[elementType as keyof typeof positions] || "Unknown";
  }

  /**
   * Clear all caches (useful for gameweek rollover)
   */
  public clearAllCaches(): void {
    this.analyticsCache.clearAllCache();
    this.sharedBootstrapManager.clearCache();
  }

  /**
   * Get ownership-specific cache statistics for monitoring
   */
  public getOwnershipCacheStats(): {
    bootstrap_cache: any;
    analytics_cache: any;
  } {
    return {
      bootstrap_cache: this.sharedBootstrapManager.getCacheStats(),
      analytics_cache: this.analyticsCache.getCacheStats(),
    };
  }
}
