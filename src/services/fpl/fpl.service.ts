import { FPLBootstrapService } from './bootstrap.service';
import { FPLPlayerService } from './player.service';
import { FPLTeamService } from './team.service';
import { FPLLeagueService } from './league.service';
import { FPLFixtureService } from './fixture.service';
import { FPLLiveService } from './live.service';
import { FPLStatsService } from './stats.service';
import { FPLServiceError } from './errors';
import type {
  FPLServiceResponse,
} from '../../types/fpl';

/**
 * Main orchestrator service that coordinates all FPL services
 * Provides a unified interface for all FPL API operations
 */
export class FPLService {
  private static instance: FPLService;
  
  public readonly bootstrap: FPLBootstrapService;
  public readonly player: FPLPlayerService;
  public readonly team: FPLTeamService;
  public readonly league: FPLLeagueService;
  public readonly fixture: FPLFixtureService;
  public readonly live: FPLLiveService;
  public readonly stats: FPLStatsService;

  private constructor() {
    // Initialize all service singletons
    this.bootstrap = FPLBootstrapService.getInstance();
    this.player = FPLPlayerService.getInstance();
    this.team = FPLTeamService.getInstance();
    this.league = FPLLeagueService.getInstance();
    this.fixture = FPLFixtureService.getInstance();
    this.live = FPLLiveService.getInstance();
    this.stats = FPLStatsService.getInstance();
  }

  public static getInstance(): FPLService {
    if (!FPLService.instance) {
      FPLService.instance = new FPLService();
    }
    return FPLService.instance;
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<FPLServiceResponse<{
    overall_status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    }>;
    response_time: number;
  }>> {
    const startTime = Date.now();
    
    try {
      const healthChecks = await Promise.allSettled([
        this.bootstrap.healthCheck().then(result => ({ service: 'bootstrap', ...result })),
        this.player.healthCheck().then(result => ({ service: 'player', ...result })),
        this.team.healthCheck().then(result => ({ service: 'team', ...result })),
        this.league.healthCheck().then(result => ({ service: 'league', ...result })),
        this.fixture.healthCheck().then(result => ({ service: 'fixture', ...result })),
        this.live.healthCheck().then(result => ({ service: 'live', ...result })),
        this.stats.healthCheck().then(result => ({ service: 'stats', ...result })),
      ]);

      const services: Record<string, any> = {};
      let healthyCount = 0;

      healthChecks.forEach((check, index) => {
        const serviceNames = ['bootstrap', 'player', 'team', 'league', 'fixture', 'live', 'stats'];
        const serviceName = serviceNames[index];

        if (check.status === 'fulfilled') {
          services[serviceName] = {
            status: check.value.status,
            latency: check.value.latency,
          };
          if (check.value.status === 'healthy') {
            healthyCount++;
          }
        } else {
          services[serviceName] = {
            status: 'unhealthy',
            error: check.reason?.message || 'Unknown error',
          };
        }
      });

      const totalServices = healthChecks.length;
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
      
      if (healthyCount === totalServices) {
        overallStatus = 'healthy';
      } else if (healthyCount > totalServices / 2) {
        overallStatus = 'degraded';
      }

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          overall_status: overallStatus,
          services,
          response_time: responseTime,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get comprehensive cache statistics across all services
   */
  public getCacheStatistics(): FPLServiceResponse<{
    total_entries: number;
    services: Record<string, {
      size: number;
      entries: Array<{ key: string; age: number; ttl: number }>;
    }>;
    memory_usage_estimate: string;
  }> {
    try {
      const bootstrapStats = this.bootstrap.getCacheStats();
      const playerStats = this.player.getCacheStats();
      const teamStats = this.team.getCacheStats();
      const leagueStats = this.league.getCacheStats();
      const fixtureStats = this.fixture.getCacheStats();
      const liveStats = this.live.getCacheStats();
      const statsServiceStats = this.stats.getCacheStats();

      const totalEntries = bootstrapStats.size + playerStats.size + teamStats.size + 
                          leagueStats.size + fixtureStats.size + liveStats.size + statsServiceStats.size;
      
      // Rough memory usage estimate (assuming average 50KB per cache entry)
      const memoryUsageBytes = totalEntries * 50 * 1024;
      const memoryUsage = memoryUsageBytes > 1024 * 1024
        ? `${(memoryUsageBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${(memoryUsageBytes / 1024).toFixed(1)} KB`;

      return {
        success: true,
        data: {
          total_entries: totalEntries,
          services: {
            bootstrap: bootstrapStats,
            player: playerStats,
            team: teamStats,
            league: leagueStats,
            fixture: fixtureStats,
            live: liveStats,
            stats: statsServiceStats,
          },
          memory_usage_estimate: memoryUsage,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get cache statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clear all caches across all services
   */
  public clearAllCaches(): FPLServiceResponse<{ cleared_services: string[] }> {
    try {
      const clearedServices: string[] = [];

      this.bootstrap.clearBootstrapCache();
      clearedServices.push('bootstrap');

      this.player.clearPlayerCache();
      clearedServices.push('player');

      this.team.clearTeamCache();
      clearedServices.push('team');

      this.league.clearLeagueCache();
      clearedServices.push('league');

      this.fixture.clearFixtureCache();
      clearedServices.push('fixture');

      this.live.clearLiveCache();
      clearedServices.push('live');

      this.stats.clearStatsCache();
      clearedServices.push('stats');

      return {
        success: true,
        data: { cleared_services: clearedServices },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear caches: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * High-level convenience methods combining multiple services
   */

  /**
   * Get a complete overview of a manager's team
   */
  public async getManagerOverview(managerId: number, gameweek?: number) {
    try {
      const currentGameweek = gameweek || (await this.bootstrap.getCurrentGameweek()).data?.id || 1;

      const [managerInfo, teamAnalysis, recentHistory] = await Promise.allSettled([
        this.team.getManagerInfo(managerId),
        this.team.getTeamAnalysis(managerId, currentGameweek),
        this.team.getTeamPerformanceHistory(managerId, 5),
      ]);

      const result: any = {
        manager_id: managerId,
        gameweek: currentGameweek,
        timestamp: new Date().toISOString(),
      };

      if (managerInfo.status === 'fulfilled' && managerInfo.value.success) {
        result.manager_info = managerInfo.value.data;
      }

      if (teamAnalysis.status === 'fulfilled' && teamAnalysis.value.success) {
        result.team_analysis = teamAnalysis.value.data;
      }

      if (recentHistory.status === 'fulfilled' && recentHistory.value.success) {
        result.recent_performance = recentHistory.value.data;
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get manager overview for ${managerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLService',
        'getManagerOverview',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get comprehensive league analysis
   */
  public async getLeagueOverview(leagueId: number, isH2H = false) {
    try {
      const [leagueStandings, leagueStats] = await Promise.allSettled([
        isH2H 
          ? this.league.getH2HLeagueStandings(leagueId, 1)
          : this.league.getClassicLeagueStandings(leagueId, 1),
        this.league.getLeagueStats(leagueId, isH2H),
      ]);

      const result: any = {
        league_id: leagueId,
        league_type: isH2H ? 'h2h' : 'classic',
        timestamp: new Date().toISOString(),
      };

      if (leagueStandings.status === 'fulfilled' && leagueStandings.value.success) {
        result.standings = leagueStandings.value.data;
        result.pagination = leagueStandings.value.pagination;
      }

      if (leagueStats.status === 'fulfilled' && leagueStats.value.success) {
        result.statistics = leagueStats.value.data;
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get league overview for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLService',
        'getLeagueOverview',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get gameweek summary with key statistics
   */
  public async getGameweekSummary(gameweek?: number) {
    try {
      const currentGameweek = gameweek || (await this.bootstrap.getCurrentGameweek()).data?.id || 1;

      const [gameweekInfo, topPlayers] = await Promise.allSettled([
        this.bootstrap.getGameweek(currentGameweek),
        this.bootstrap.getTopPlayers('total_points', 10),
        // Note: Dream team endpoint would need to be implemented in a separate service
        Promise.resolve({ success: false, data: null }),
      ]);

      const result: any = {
        gameweek: currentGameweek,
        timestamp: new Date().toISOString(),
      };

      if (gameweekInfo.status === 'fulfilled' && gameweekInfo.value.success) {
        result.gameweek_info = gameweekInfo.value.data;
      }

      if (topPlayers.status === 'fulfilled' && topPlayers.value.success) {
        result.top_players = topPlayers.value.data;
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get gameweek summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLService',
        'getGameweekSummary',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Search across multiple data types
   */
  public async globalSearch(query: string, types: Array<'players' | 'teams'> = ['players']) {
    try {
      const results: any = {
        query,
        timestamp: new Date().toISOString(),
      };

      const searchPromises: Promise<any>[] = [];

      if (types.includes('players')) {
        searchPromises.push(
          this.bootstrap.searchPlayers(query, 10)
            .then(response => ({ type: 'players', ...response }))
            .catch(error => ({ type: 'players', success: false, error: error.message }))
        );
      }

      if (types.includes('teams')) {
        // Teams search would be implemented similarly
        searchPromises.push(
          Promise.resolve({ type: 'teams', success: false, error: 'Teams search not implemented' })
        );
      }

      const searchResults = await Promise.all(searchPromises);

      searchResults.forEach(result => {
        results[result.type] = {
          success: result.success,
          data: result.data || [],
          error: result.error,
        };
      });

      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to perform global search: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLService',
        'globalSearch',
        error instanceof Error ? error : undefined
      );
    }
  }
}