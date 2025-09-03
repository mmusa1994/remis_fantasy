import type {
  OwnershipAnalytics,
  OwnershipChange,
  EnhancedFPLResponse,
} from '../../types/fpl-enhanced';

/**
 * Cache for pre-computed ownership analytics to avoid redundant calculations
 * Stores analytics by timeframe with intelligent cache invalidation
 */
export class OwnershipAnalyticsCache {
  private static instance: OwnershipAnalyticsCache;
  
  private analyticsCache = new Map<
    string,
    {
      data: OwnershipAnalytics;
      timestamp: number;
      ttl: number;
    }
  >();

  // Player-specific trends cache
  private playerTrendsCache = new Map<
    string,
    {
      data: OwnershipChange[];
      timestamp: number;
      ttl: number;
    }
  >();

  // Cache TTL configurations
  private readonly CACHE_TTL = {
    '1h': 300000,    // 5 minutes for 1h timeframe
    '24h': 900000,   // 15 minutes for 24h timeframe
    'week': 1800000, // 30 minutes for week timeframe
  };

  public static getInstance(): OwnershipAnalyticsCache {
    if (!OwnershipAnalyticsCache.instance) {
      OwnershipAnalyticsCache.instance = new OwnershipAnalyticsCache();
    }
    return OwnershipAnalyticsCache.instance;
  }

  private constructor() {}

  /**
   * Get cached ownership analytics for a specific timeframe
   */
  public getCachedAnalytics(timeframe: '1h' | '24h' | 'week'): OwnershipAnalytics | null {
    const cacheKey = `analytics_${timeframe}`;
    const cached = this.analyticsCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    if (this.isCacheExpired(cached.timestamp, cached.ttl)) {
      this.analyticsCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached ownership analytics for a specific timeframe
   */
  public setCachedAnalytics(
    timeframe: '1h' | '24h' | 'week',
    analytics: OwnershipAnalytics
  ): void {
    const cacheKey = `analytics_${timeframe}`;
    const ttl = this.CACHE_TTL[timeframe];

    this.analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached player ownership trends for specific player IDs
   */
  public getCachedPlayerTrends(
    playerIds: number[],
    timeframe: '1h' | '24h' | 'week'
  ): OwnershipChange[] | null {
    const cacheKey = this.getPlayerTrendsCacheKey(playerIds, timeframe);
    const cached = this.playerTrendsCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    if (this.isCacheExpired(cached.timestamp, cached.ttl)) {
      this.playerTrendsCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached player ownership trends for specific player IDs
   */
  public setCachedPlayerTrends(
    playerIds: number[],
    timeframe: '1h' | '24h' | 'week',
    trends: OwnershipChange[]
  ): void {
    const cacheKey = this.getPlayerTrendsCacheKey(playerIds, timeframe);
    const ttl = this.CACHE_TTL[timeframe];

    this.playerTrendsCache.set(cacheKey, {
      data: trends,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get ownership changes from cached analytics without refetching
   */
  public getOwnershipChangesFromCache(
    timeframe: '1h' | '24h' | 'week'
  ): OwnershipChange[] | null {
    const analytics = this.getCachedAnalytics(timeframe);
    if (!analytics) {
      return null;
    }

    // Combine all ownership changes from analytics
    const allChanges = [
      ...analytics.top_risers,
      ...analytics.top_fallers,
      ...analytics.trending_differentials,
    ];

    return allChanges;
  }

  /**
   * Filter cached ownership changes by player IDs without analytics recalculation
   */
  public filterOwnershipChangesByPlayerIds(
    playerIds: number[],
    timeframe: '1h' | '24h' | 'week'
  ): OwnershipChange[] | null {
    const allChanges = this.getOwnershipChangesFromCache(timeframe);
    if (!allChanges) {
      return null;
    }

    return allChanges.filter(change => playerIds.includes(change.player_id));
  }

  /**
   * Check if cache contains fresh data for all requested operations
   */
  public hasFreshAnalytics(timeframe: '1h' | '24h' | 'week'): boolean {
    return this.getCachedAnalytics(timeframe) !== null;
  }

  /**
   * Invalidate cache for specific timeframe
   */
  public invalidateTimeframe(timeframe: '1h' | '24h' | 'week'): void {
    const analyticsKey = `analytics_${timeframe}`;
    this.analyticsCache.delete(analyticsKey);

    // Clear related player trends caches
    const keysToDelete: string[] = [];
    for (const key of this.playerTrendsCache.keys()) {
      if (key.includes(`_${timeframe}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.playerTrendsCache.delete(key));
  }

  /**
   * Clear all cached analytics (useful for gameweek rollover)
   */
  public clearAllCache(): void {
    this.analyticsCache.clear();
    this.playerTrendsCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    analytics_cache_size: number;
    player_trends_cache_size: number;
    cache_entries: {
      timeframe: string;
      age_ms: number;
      expired: boolean;
    }[];
  } {
    const now = Date.now();
    const cacheEntries: Array<{
      timeframe: string;
      age_ms: number;
      expired: boolean;
    }> = [];

    // Analytics cache stats
    for (const [key, value] of this.analyticsCache.entries()) {
      cacheEntries.push({
        timeframe: key,
        age_ms: now - value.timestamp,
        expired: this.isCacheExpired(value.timestamp, value.ttl),
      });
    }

    return {
      analytics_cache_size: this.analyticsCache.size,
      player_trends_cache_size: this.playerTrendsCache.size,
      cache_entries: cacheEntries,
    };
  }

  /**
   * Preload cache with computed analytics to optimize subsequent requests
   */
  public preloadAnalytics(
    timeframes: Array<'1h' | '24h' | 'week'>,
    analytics: Record<string, OwnershipAnalytics>
  ): void {
    timeframes.forEach(timeframe => {
      if (analytics[timeframe]) {
        this.setCachedAnalytics(timeframe, analytics[timeframe]);
      }
    });
  }

  /**
   * Generate cache key for player trends
   */
  private getPlayerTrendsCacheKey(
    playerIds: number[],
    timeframe: '1h' | '24h' | 'week'
  ): string {
    const sortedIds = [...playerIds].sort((a, b) => a - b);
    return `player_trends_${sortedIds.join(',')}_${timeframe}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Clean up expired cache entries (called periodically)
   */
  public cleanupExpiredEntries(): void {
    const now = Date.now();

    // Clean analytics cache
    for (const [key, value] of this.analyticsCache.entries()) {
      if (this.isCacheExpired(value.timestamp, value.ttl)) {
        this.analyticsCache.delete(key);
      }
    }

    // Clean player trends cache
    for (const [key, value] of this.playerTrendsCache.entries()) {
      if (this.isCacheExpired(value.timestamp, value.ttl)) {
        this.playerTrendsCache.delete(key);
      }
    }
  }
}