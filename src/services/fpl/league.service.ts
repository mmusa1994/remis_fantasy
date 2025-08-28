import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type {
  FPLClassicLeagueResponse,
  FPLH2HLeagueResponse,
  FPLH2HMatches,
  FPLServiceResponse,
  FPLPaginatedResponse,
  FPLClassicLeagueEntry,
  FPLH2HLeagueEntry,
} from '../../types/fpl';

/**
 * Service for handling league data (Classic and H2H)
 * Provides methods for league standings, matches, and statistics
 */
export class FPLLeagueService extends BaseFPLService {
  private static instance: FPLLeagueService;

  public static getInstance(): FPLLeagueService {
    if (!FPLLeagueService.instance) {
      FPLLeagueService.instance = new FPLLeagueService();
    }
    return FPLLeagueService.instance;
  }

  /**
   * Get classic league standings with pagination
   */
  public async getClassicLeagueStandings(
    leagueId: number,
    page = 1,
    pageSize = 50
  ): Promise<FPLPaginatedResponse<FPLClassicLeagueResponse>> {
    this.validateId(leagueId, 'leagueId');
    
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new FPLServiceError(
        'Invalid pagination parameters',
        'FPLLeagueService',
        'getClassicLeagueStandings'
      );
    }

    try {
      // Use longer cache for league data (10 minutes instead of 5)
      const data = await this.fetchWithRetry<FPLClassicLeagueResponse>(
        `/leagues-classic/${leagueId}/standings/?page_standings=${page}&page_new_entries=1`,
        {
          key: `classic_league_${leagueId}_page_${page}`,
          ttl: this.config.cache.bootstrap_ttl, // 10 minutes
        }
      );

      const totalCount = data.league.size || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`classic_league_${leagueId}_page_${page}`, this.config.cache.default_ttl),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          page_size: pageSize,
          total_count: totalCount,
          has_next: data.standings.has_next,
          has_previous: page > 1,
        },
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch classic league standings for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getClassicLeagueStandings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get top N classic league standings (optimized for small counts)
   */
  public async getTopClassicLeagueStandings(
    leagueId: number,
    count = 50
  ): Promise<FPLServiceResponse<{
    league_info: any;
    standings: FPLClassicLeagueEntry[];
    total_entries: number;
  }>> {
    this.validateId(leagueId, 'leagueId');

    // Check cache first for the exact count requested
    const cacheKey = `top_classic_league_${leagueId}_${count}`;
    if (this.isCacheValid(cacheKey, this.config.cache.bootstrap_ttl)) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData as { league_info: any; standings: FPLClassicLeagueEntry[]; total_entries: number; },
          timestamp: new Date().toISOString(),
        };
      }
    }

    try {
      // For top 50 or less, just get first page
      if (count <= 50) {
        const firstPageResponse = await this.getClassicLeagueStandings(leagueId, 1);
        if (!firstPageResponse.success || !firstPageResponse.data) {
          throw new Error('Failed to get first page');
        }

        const firstPageData = firstPageResponse.data;
        const result = {
          league_info: firstPageData.league,
          standings: firstPageData.standings.results.slice(0, count),
          total_entries: firstPageData.league.size || 0,
        };

        // Cache the result
        this.setCache(cacheKey, result, this.config.cache.bootstrap_ttl);

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      }

      // For larger counts, use the original getAllClassicLeagueStandings logic
      return this.getAllClassicLeagueStandings(leagueId, count);
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch top ${count} classic league standings for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getTopClassicLeagueStandings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all classic league standings (up to a maximum)
   */
  public async getAllClassicLeagueStandings(
    leagueId: number,
    maxEntries = 1000
  ): Promise<FPLServiceResponse<{
    league_info: any;
    standings: FPLClassicLeagueEntry[];
    total_entries: number;
  }>> {
    this.validateId(leagueId, 'leagueId');

    try {
      const firstPageResponse = await this.getClassicLeagueStandings(leagueId, 1);
      if (!firstPageResponse.success || !firstPageResponse.data) {
        throw new Error('Failed to get first page');
      }

      const firstPageData = firstPageResponse.data;
      const totalEntries = Math.min(firstPageData.league.size || 0, maxEntries);
      const pageSize = 50; // FPL default page size
      const totalPages = Math.ceil(totalEntries / pageSize);

      if (totalPages <= 1) {
        return {
          success: true,
          data: {
            league_info: firstPageData.league,
            standings: firstPageData.standings.results.slice(0, maxEntries),
            total_entries: totalEntries,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch remaining pages with limited concurrency to avoid overwhelming the API
      const allStandings: FPLClassicLeagueEntry[] = [...firstPageData.standings.results];
      const batchSize = 5; // Process 5 pages at a time
      
      for (let i = 2; i <= totalPages; i += batchSize) {
        const batch = [];
        for (let j = i; j < i + batchSize && j <= totalPages; j++) {
          batch.push(this.getClassicLeagueStandings(leagueId, j));
        }
        
        const batchResults = await Promise.all(batch);
        for (const pageResponse of batchResults) {
          if (pageResponse.success && pageResponse.data?.standings?.results) {
            allStandings.push(...pageResponse.data.standings.results);
          }
        }
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize <= totalPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: true,
        data: {
          league_info: firstPageData.league,
          standings: allStandings.slice(0, maxEntries),
          total_entries: Math.min(allStandings.length, maxEntries),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch all classic league standings for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getAllClassicLeagueStandings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find a specific manager in classic league standings
   */
  public async findManagerInClassicLeague(
    leagueId: number,
    managerId: number
  ): Promise<FPLServiceResponse<{
    manager_entry: FPLClassicLeagueEntry | null;
    page: number | null;
    rank: number | null;
  }>> {
    this.validateId(leagueId, 'leagueId');
    this.validateId(managerId, 'managerId');

    try {
      let currentPage = 1;
      let maxPages = 100; // Safety limit

      while (currentPage <= maxPages) {
        const pageResponse = await this.getClassicLeagueStandings(leagueId, currentPage);
        if (!pageResponse.success || !pageResponse.data?.standings?.results) {
          break;
        }

        const managerEntry = pageResponse.data.standings.results.find(
          entry => entry.entry === managerId
        );

        if (managerEntry) {
          return {
            success: true,
            data: {
              manager_entry: managerEntry,
              page: currentPage,
              rank: managerEntry.rank,
            },
            timestamp: new Date().toISOString(),
          };
        }

        if (!pageResponse.data.standings.has_next) {
          break;
        }

        currentPage++;
        
        // Update maxPages based on league size
        if (currentPage === 2 && pageResponse.pagination?.total_pages) {
          maxPages = Math.min(pageResponse.pagination.total_pages, 100);
        }
      }

      return {
        success: true,
        data: {
          manager_entry: null,
          page: null,
          rank: null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to find manager ${managerId} in classic league ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'findManagerInClassicLeague',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get H2H league standings with pagination
   */
  public async getH2HLeagueStandings(
    leagueId: number,
    page = 1
  ): Promise<FPLPaginatedResponse<FPLH2HLeagueResponse>> {
    this.validateId(leagueId, 'leagueId');

    try {
      const data = await this.fetchWithRetry<FPLH2HLeagueResponse>(
        `/leagues-h2h/${leagueId}/standings/?page_standings=${page}&page_new_entries=1`,
        {
          key: `h2h_league_${leagueId}_page_${page}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      const pageSize = 50; // FPL default
      const totalCount = data.league.size || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`h2h_league_${leagueId}_page_${page}`, this.config.cache.default_ttl),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          page_size: pageSize,
          total_count: totalCount,
          has_next: data.standings.has_next,
          has_previous: page > 1,
        },
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch H2H league standings for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getH2HLeagueStandings',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get H2H league fixtures/matches for a specific gameweek
   */
  public async getH2HLeagueMatches(
    leagueId: number,
    gameweek?: number,
    page = 1
  ): Promise<FPLPaginatedResponse<FPLH2HMatches>> {
    this.validateId(leagueId, 'leagueId');
    
    if (gameweek) {
      this.validateGameweek(gameweek);
    }

    try {
      const endpoint = gameweek
        ? `/leagues-h2h-matches/league/${leagueId}/?page=${page}&event=${gameweek}`
        : `/leagues-h2h-matches/league/${leagueId}/?page=${page}`;

      const data = await this.fetchWithRetry<FPLH2HMatches>(
        endpoint,
        {
          key: `h2h_matches_${leagueId}_gw${gameweek || 'all'}_page_${page}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`h2h_matches_${leagueId}_gw${gameweek || 'all'}_page_${page}`, this.config.cache.default_ttl),
        pagination: {
          current_page: data.page,
          total_pages: 0, // Not provided by FPL API for matches
          page_size: 25, // FPL default for matches
          total_count: 0,
          has_next: data.has_next,
          has_previous: data.page > 1,
        },
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch H2H league matches for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getH2HLeagueMatches',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get league summary statistics
   */
  public async getLeagueStats(leagueId: number, isH2H = false): Promise<FPLServiceResponse<{
    league_info: any;
    total_entries: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    top_performers: Array<{ name: string; score: number; rank: number }>;
  }>> {
    this.validateId(leagueId, 'leagueId');

    try {
      const standingsResponse = isH2H
        ? await this.getH2HLeagueStandings(leagueId, 1)
        : await this.getClassicLeagueStandings(leagueId, 1);

      if (!standingsResponse.success || !standingsResponse.data) {
        throw new Error('Failed to get league standings');
      }

      const leagueData = standingsResponse.data;
      const standings = leagueData.standings.results;
      
      if (standings.length === 0) {
        throw new FPLServiceError(
          'League has no entries',
          'FPLLeagueService',
          'getLeagueStats'
        );
      }

      let totalScore = 0;
      let highestScore = 0;
      let lowestScore = Infinity;

      standings.forEach(entry => {
        const score = isH2H ? (entry as FPLH2HLeagueEntry).total : (entry as FPLClassicLeagueEntry).total;
        totalScore += score;
        highestScore = Math.max(highestScore, score);
        lowestScore = Math.min(lowestScore, score);
      });

      const averageScore = totalScore / standings.length;
      const topPerformers = standings.slice(0, 5).map(entry => ({
        name: entry.player_name,
        score: isH2H ? (entry as FPLH2HLeagueEntry).total : (entry as FPLClassicLeagueEntry).total,
        rank: entry.rank,
      }));

      return {
        success: true,
        data: {
          league_info: leagueData.league,
          total_entries: leagueData.league.size || standings.length,
          average_score: Number(averageScore.toFixed(1)),
          highest_score: highestScore,
          lowest_score: lowestScore === Infinity ? 0 : lowestScore,
          top_performers: topPerformers,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get league stats for ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getLeagueStats',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get manager's performance in a league
   */
  public async getManagerLeaguePerformance(
    leagueId: number,
    managerId: number,
    isH2H = false
  ): Promise<FPLServiceResponse<{
    current_rank: number | null;
    previous_rank: number | null;
    rank_change: number | null;
    total_points: number | null;
    league_position_percentile: number | null;
    matches_data?: any; // For H2H leagues
  }>> {
    this.validateId(leagueId, 'leagueId');
    this.validateId(managerId, 'managerId');

    try {
      if (isH2H) {
        const h2hResponse = await this.getH2HLeagueStandings(leagueId, 1);
        if (!h2hResponse.success || !h2hResponse.data) {
          throw new Error('Failed to get H2H standings');
        }

        const managerEntry = h2hResponse.data.standings.results.find(
          entry => entry.entry === managerId
        ) as FPLH2HLeagueEntry;

        if (!managerEntry) {
          return {
            success: true,
            data: {
              current_rank: null,
              previous_rank: null,
              rank_change: null,
              total_points: null,
              league_position_percentile: null,
            },
            timestamp: new Date().toISOString(),
          };
        }

        const totalEntries = h2hResponse.data.league.size || h2hResponse.data.standings.results.length;
        const percentile = ((totalEntries - managerEntry.rank + 1) / totalEntries) * 100;

        return {
          success: true,
          data: {
            current_rank: managerEntry.rank,
            previous_rank: managerEntry.last_rank,
            rank_change: managerEntry.last_rank ? managerEntry.last_rank - managerEntry.rank : null,
            total_points: managerEntry.total,
            league_position_percentile: Number(percentile.toFixed(1)),
            matches_data: {
              played: managerEntry.played,
              wins: managerEntry.wins,
              draws: managerEntry.draws,
              losses: managerEntry.losses,
              points_for: managerEntry.points_for,
              points_against: managerEntry.points_against,
            },
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        const managerSearchResponse = await this.findManagerInClassicLeague(leagueId, managerId);
        if (!managerSearchResponse.success || !managerSearchResponse.data?.manager_entry) {
          return {
            success: true,
            data: {
              current_rank: null,
              previous_rank: null,
              rank_change: null,
              total_points: null,
              league_position_percentile: null,
            },
            timestamp: new Date().toISOString(),
          };
        }

        const managerEntry = managerSearchResponse.data.manager_entry;
        const leagueStatsResponse = await this.getLeagueStats(leagueId, false);
        
        const totalEntries = leagueStatsResponse.success && leagueStatsResponse.data
          ? leagueStatsResponse.data.total_entries
          : 0;
          
        const percentile = totalEntries > 0
          ? ((totalEntries - managerEntry.rank + 1) / totalEntries) * 100
          : 0;

        return {
          success: true,
          data: {
            current_rank: managerEntry.rank,
            previous_rank: managerEntry.last_rank,
            rank_change: managerEntry.last_rank ? managerEntry.last_rank - managerEntry.rank : null,
            total_points: managerEntry.total,
            league_position_percentile: Number(percentile.toFixed(1)),
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get manager league performance for manager ${managerId} in league ${leagueId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLLeagueService',
        'getManagerLeaguePerformance',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear league caches
   */
  public clearLeagueCache(leagueId?: number): void {
    if (leagueId) {
      this.clearCache(`.*league_${leagueId}.*`);
    } else {
      this.clearCache('.*league.*');
    }
  }
}