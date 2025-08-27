import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  FPLFixture,
  FPLServiceResponse,
} from '../../types/fpl';

/**
 * Service for handling fixture data
 * Provides methods for getting fixtures, match schedules, and results
 */
export class FPLFixtureService extends BaseFPLService {
  private static instance: FPLFixtureService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLFixtureService {
    if (!FPLFixtureService.instance) {
      FPLFixtureService.instance = new FPLFixtureService();
    }
    return FPLFixtureService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get all fixtures
   */
  public async getAllFixtures(): Promise<FPLServiceResponse<FPLFixture[]>> {
    try {
      const data = await this.fetchWithRetry<FPLFixture[]>(
        '/fixtures/',
        {
          key: 'all_fixtures',
          ttl: this.config.cache.static_data_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid('all_fixtures', this.config.cache.static_data_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getAllFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get fixtures for a specific gameweek
   */
  public async getGameweekFixtures(gameweek: number): Promise<FPLServiceResponse<FPLFixture[]>> {
    this.validateGameweek(gameweek);

    try {
      const data = await this.fetchWithRetry<FPLFixture[]>(
        `/fixtures/?event=${gameweek}`,
        {
          key: `fixtures_gw${gameweek}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`fixtures_gw${gameweek}`, this.config.cache.default_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch fixtures for gameweek ${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getGameweekFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get fixtures for a specific team
   */
  public async getTeamFixtures(teamId: number): Promise<FPLServiceResponse<FPLFixture[]>> {
    this.validateId(teamId, 'teamId');

    try {
      const allFixturesResponse = await this.getAllFixtures();
      if (!allFixturesResponse.success || !allFixturesResponse.data) {
        throw new Error('Failed to get fixtures data');
      }

      const teamFixtures = allFixturesResponse.data.filter(
        fixture => fixture.team_h === teamId || fixture.team_a === teamId
      );

      return {
        success: true,
        data: teamFixtures,
        timestamp: new Date().toISOString(),
        cache_hit: allFixturesResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch fixtures for team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getTeamFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get live fixtures (started but not finished)
   */
  public async getLiveFixtures(gameweek?: number): Promise<FPLServiceResponse<FPLFixture[]>> {
    try {
      const currentGameweek = gameweek || (await this.bootstrapService.getCurrentGameweek()).data?.id || 1;
      const fixturesResponse = await this.getGameweekFixtures(currentGameweek);
      
      if (!fixturesResponse.success || !fixturesResponse.data) {
        throw new Error('Failed to get gameweek fixtures');
      }

      const liveFixtures = fixturesResponse.data.filter(
        fixture => fixture.started && !fixture.finished
      );

      return {
        success: true,
        data: liveFixtures,
        timestamp: new Date().toISOString(),
        cache_hit: fixturesResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch live fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getLiveFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get finished fixtures for a gameweek
   */
  public async getFinishedFixtures(gameweek: number): Promise<FPLServiceResponse<FPLFixture[]>> {
    this.validateGameweek(gameweek);

    try {
      const fixturesResponse = await this.getGameweekFixtures(gameweek);
      
      if (!fixturesResponse.success || !fixturesResponse.data) {
        throw new Error('Failed to get gameweek fixtures');
      }

      const finishedFixtures = fixturesResponse.data.filter(fixture => fixture.finished);

      return {
        success: true,
        data: finishedFixtures,
        timestamp: new Date().toISOString(),
        cache_hit: fixturesResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch finished fixtures for gameweek ${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getFinishedFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get upcoming fixtures for a team
   */
  public async getUpcomingTeamFixtures(
    teamId: number,
    limit = 5
  ): Promise<FPLServiceResponse<FPLFixture[]>> {
    this.validateId(teamId, 'teamId');

    try {
      const teamFixturesResponse = await this.getTeamFixtures(teamId);
      
      if (!teamFixturesResponse.success || !teamFixturesResponse.data) {
        throw new Error('Failed to get team fixtures');
      }

      const upcomingFixtures = teamFixturesResponse.data
        .filter(fixture => !fixture.finished)
        .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
        .slice(0, limit);

      return {
        success: true,
        data: upcomingFixtures,
        timestamp: new Date().toISOString(),
        cache_hit: teamFixturesResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch upcoming fixtures for team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getUpcomingTeamFixtures',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get fixture difficulty analysis for a team
   */
  public async getTeamFixtureDifficulty(
    teamId: number,
    gameweeksAhead = 5
  ): Promise<FPLServiceResponse<{
    team_id: number;
    team_name: string;
    fixtures: Array<{
      gameweek: number;
      opponent: string;
      is_home: boolean;
      difficulty: number;
      kickoff_time: string;
    }>;
    average_difficulty: number;
    home_fixtures: number;
    away_fixtures: number;
  }>> {
    this.validateId(teamId, 'teamId');

    try {
      const [upcomingFixtures, teamsResponse] = await Promise.all([
        this.getUpcomingTeamFixtures(teamId, gameweeksAhead),
        this.bootstrapService.getAllTeams(),
      ]);

      if (!upcomingFixtures.success || !teamsResponse.success ||
          !upcomingFixtures.data || !teamsResponse.data) {
        throw new Error('Failed to get required data');
      }

      const teamsMap = new Map(teamsResponse.data.map(team => [team.id, team]));
      const team = teamsMap.get(teamId);
      
      if (!team) {
        throw new FPLServiceError(
          `Team with ID ${teamId} not found`,
          'FPLFixtureService',
          'getTeamFixtureDifficulty'
        );
      }

      const fixtures = upcomingFixtures.data.map(fixture => {
        const isHome = fixture.team_h === teamId;
        const opponentId = isHome ? fixture.team_a : fixture.team_h;
        const opponent = teamsMap.get(opponentId);
        
        return {
          gameweek: fixture.event,
          opponent: opponent?.short_name || 'Unknown',
          is_home: isHome,
          difficulty: isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty,
          kickoff_time: fixture.kickoff_time,
        };
      });

      const averageDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, fixture) => sum + fixture.difficulty, 0) / fixtures.length
        : 0;

      const homeFixtures = fixtures.filter(f => f.is_home).length;
      const awayFixtures = fixtures.filter(f => !f.is_home).length;

      return {
        success: true,
        data: {
          team_id: teamId,
          team_name: team.name,
          fixtures,
          average_difficulty: Number(averageDifficulty.toFixed(1)),
          home_fixtures: homeFixtures,
          away_fixtures: awayFixtures,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get fixture difficulty for team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'getTeamFixtureDifficulty',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if gameweek is finished
   */
  public async isGameweekFinished(gameweek: number): Promise<FPLServiceResponse<{
    gameweek: number;
    is_finished: boolean;
    total_fixtures: number;
    finished_fixtures: number;
    live_fixtures: number;
    remaining_fixtures: number;
  }>> {
    this.validateGameweek(gameweek);

    try {
      const fixturesResponse = await this.getGameweekFixtures(gameweek);
      
      if (!fixturesResponse.success || !fixturesResponse.data) {
        throw new Error('Failed to get gameweek fixtures');
      }

      const fixtures = fixturesResponse.data;
      const totalFixtures = fixtures.length;
      const finishedFixtures = fixtures.filter(f => f.finished).length;
      const liveFixtures = fixtures.filter(f => f.started && !f.finished).length;
      const remainingFixtures = fixtures.filter(f => !f.started).length;

      const isFinished = finishedFixtures === totalFixtures;

      return {
        success: true,
        data: {
          gameweek,
          is_finished: isFinished,
          total_fixtures: totalFixtures,
          finished_fixtures: finishedFixtures,
          live_fixtures: liveFixtures,
          remaining_fixtures: remainingFixtures,
        },
        timestamp: new Date().toISOString(),
        cache_hit: fixturesResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to check if gameweek ${gameweek} is finished: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLFixtureService',
        'isGameweekFinished',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear fixture caches
   */
  public clearFixtureCache(gameweek?: number): void {
    if (gameweek) {
      this.clearCache(`fixtures_gw${gameweek}`);
    } else {
      this.clearCache('fixtures');
    }
  }
}