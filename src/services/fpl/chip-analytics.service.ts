import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  ChipAnalytics,
  ChipStrategy,
  ChipUsageData,
  EnhancedFPLResponse,
} from '../../types/fpl-enhanced';

/**
 * Service for chip strategy analysis and recommendations
 * Provides insights into optimal chip usage timing and patterns
 */
export class FPLChipAnalyticsService extends BaseFPLService {
  private static instance: FPLChipAnalyticsService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLChipAnalyticsService {
    if (!FPLChipAnalyticsService.instance) {
      FPLChipAnalyticsService.instance = new FPLChipAnalyticsService();
    }
    return FPLChipAnalyticsService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get comprehensive chip analytics and strategies
   */
  public async getChipAnalytics(): Promise<EnhancedFPLResponse<ChipAnalytics>> {
    try {
      // Get current season chip usage data (mock data based on provided information)
      const historicalData = this.getHistoricalChipData();
      
      // Generate strategies based on historical patterns
      const strategies = this.generateChipStrategies(historicalData);

      const analytics: ChipAnalytics = {
        strategies,
        historical_data: historicalData,
        personalized_recommendations: this.generatePersonalizedRecommendations(),
        last_update: new Date().toISOString(),
      };

      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch chip analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLChipAnalyticsService',
        'getChipAnalytics',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get optimal chip usage timing for current season
   */
  public async getOptimalChipTiming(): Promise<EnhancedFPLResponse<{
    wildcard: { optimal_weeks: number[]; reasoning: string[] };
    freehit: { optimal_weeks: number[]; reasoning: string[] };
    benchboost: { optimal_weeks: number[]; reasoning: string[] };
    triplecaptain: { optimal_weeks: number[]; reasoning: string[] };
  }>> {
    try {
      const optimal_timing = {
        wildcard: {
          optimal_weeks: [4, 13], // Most popular weeks from data
          reasoning: [
            'Week 4: Early season adjustment after initial player assessment',
            'Week 13: Mid-season optimization with fixture run analysis',
            'Avoid using too early or during busy periods'
          ]
        },
        freehit: {
          optimal_weeks: [4, 6, 7], // High usage weeks
          reasoning: [
            'Week 4: International break recovery',
            'Week 6: Fixture congestion periods',
            'Week 7: Blank gameweek preparation'
          ]
        },
        benchboost: {
          optimal_weeks: [5, 8, 6], // Good fixture weeks
          reasoning: [
            'Week 5: Double gameweeks for maximum bench impact',
            'Week 8: Favorable fixtures for bench players',
            'Use when you have strong bench options'
          ]
        },
        triplecaptain: {
          optimal_weeks: [6, 14], // High ceiling weeks
          reasoning: [
            'Week 6: Double gameweeks for premium players',
            'Week 14: Favorable home fixtures for top scorers',
            'Target players with high ceiling and good fixtures'
          ]
        }
      };

      return {
        success: true,
        data: optimal_timing,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch optimal chip timing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLChipAnalyticsService',
        'getOptimalChipTiming',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get chip usage success rates and analysis
   */
  public async getChipSuccessAnalysis(): Promise<EnhancedFPLResponse<{
    [chipType: string]: {
      average_success_rate: number;
      best_weeks: number[];
      worst_weeks: number[];
      success_factors: string[];
    };
  }>> {
    try {
      const analysis = {
        wildcard: {
          average_success_rate: 75, // Mock percentage
          best_weeks: [4, 13, 8],
          worst_weeks: [32, 38, 20],
          success_factors: [
            'Use during international breaks',
            'Target fixture swings',
            'Consider price rises and falls',
            'Plan transfer strategy ahead'
          ]
        },
        freehit: {
          average_success_rate: 68,
          best_weeks: [4, 6, 13],
          worst_weeks: [38, 25, 32],
          success_factors: [
            'Target blank gameweeks',
            'Use for fixture rotation',
            'Consider captaincy options',
            'Focus on one-week punts'
          ]
        },
        benchboost: {
          average_success_rate: 82,
          best_weeks: [5, 8, 6],
          worst_weeks: [32, 20, 38],
          success_factors: [
            'Ensure full bench plays',
            'Target double gameweeks',
            'Check rotation policies',
            'Consider defensive assets'
          ]
        },
        triplecaptain: {
          average_success_rate: 71,
          best_weeks: [6, 14, 4],
          worst_weeks: [38, 32, 28],
          success_factors: [
            'Target double gameweeks',
            'Choose in-form premiums',
            'Consider home advantage',
            'Check injury status'
          ]
        }
      };

      return {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch chip success analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLChipAnalyticsService',
        'getChipSuccessAnalysis',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get historical chip usage data (based on provided data)
   */
  private getHistoricalChipData(): { [chip: string]: ChipUsageData[] } {
    return {
      wildcard: [
        { chip_type: 'wildcard', gameweek: 4, usage_count: 1125, percentage_of_active_managers: 13.2, success_rate: 78 },
        { chip_type: 'wildcard', gameweek: 13, usage_count: 547, percentage_of_active_managers: 6.4, success_rate: 82 },
        { chip_type: 'wildcard', gameweek: 8, usage_count: 258, percentage_of_active_managers: 3.0, success_rate: 75 },
        { chip_type: 'wildcard', gameweek: 7, usage_count: 166, percentage_of_active_managers: 1.9, success_rate: 71 },
        { chip_type: 'wildcard', gameweek: 12, usage_count: 111, percentage_of_active_managers: 1.3, success_rate: 76 },
        { chip_type: 'wildcard', gameweek: 6, usage_count: 94, percentage_of_active_managers: 1.1, success_rate: 73 },
        { chip_type: 'wildcard', gameweek: 9, usage_count: 63, percentage_of_active_managers: 0.7, success_rate: 69 },
        { chip_type: 'wildcard', gameweek: 5, usage_count: 34, percentage_of_active_managers: 0.4, success_rate: 65 },
      ],
      freehit: [
        { chip_type: 'freehit', gameweek: 4, usage_count: 1232, percentage_of_active_managers: 14.5, success_rate: 72 },
        { chip_type: 'freehit', gameweek: 6, usage_count: 748, percentage_of_active_managers: 8.8, success_rate: 75 },
        { chip_type: 'freehit', gameweek: 7, usage_count: 166, percentage_of_active_managers: 1.9, success_rate: 68 },
        { chip_type: 'freehit', gameweek: 13, usage_count: 81, percentage_of_active_managers: 0.9, success_rate: 70 },
        { chip_type: 'freehit', gameweek: 5, usage_count: 72, percentage_of_active_managers: 0.8, success_rate: 66 },
        { chip_type: 'freehit', gameweek: 10, usage_count: 36, percentage_of_active_managers: 0.4, success_rate: 64 },
        { chip_type: 'freehit', gameweek: 15, usage_count: 34, percentage_of_active_managers: 0.4, success_rate: 67 },
      ],
      benchboost: [
        { chip_type: 'benchboost', gameweek: 5, usage_count: 464, percentage_of_active_managers: 5.5, success_rate: 85 },
        { chip_type: 'benchboost', gameweek: 8, usage_count: 306, percentage_of_active_managers: 3.6, success_rate: 87 },
        { chip_type: 'benchboost', gameweek: 6, usage_count: 193, percentage_of_active_managers: 2.3, success_rate: 83 },
        { chip_type: 'benchboost', gameweek: 11, usage_count: 100, percentage_of_active_managers: 1.2, success_rate: 81 },
        { chip_type: 'benchboost', gameweek: 9, usage_count: 69, percentage_of_active_managers: 0.8, success_rate: 79 },
        { chip_type: 'benchboost', gameweek: 4, usage_count: 58, percentage_of_active_managers: 0.7, success_rate: 77 },
        { chip_type: 'benchboost', gameweek: 7, usage_count: 58, percentage_of_active_managers: 0.7, success_rate: 78 },
      ],
      triplecaptain: [
        { chip_type: 'triplecaptain', gameweek: 6, usage_count: 579, percentage_of_active_managers: 6.8, success_rate: 74 },
        { chip_type: 'triplecaptain', gameweek: 14, usage_count: 176, percentage_of_active_managers: 2.1, success_rate: 79 },
        { chip_type: 'triplecaptain', gameweek: 4, usage_count: 95, percentage_of_active_managers: 1.1, success_rate: 71 },
        { chip_type: 'triplecaptain', gameweek: 15, usage_count: 91, percentage_of_active_managers: 1.1, success_rate: 73 },
        { chip_type: 'triplecaptain', gameweek: 13, usage_count: 21, percentage_of_active_managers: 0.2, success_rate: 68 },
        { chip_type: 'triplecaptain', gameweek: 9, usage_count: 20, percentage_of_active_managers: 0.2, success_rate: 65 },
        { chip_type: 'triplecaptain', gameweek: 7, usage_count: 9, percentage_of_active_managers: 0.1, success_rate: 62 },
      ]
    };
  }

  /**
   * Generate chip strategies based on historical data
   */
  private generateChipStrategies(historicalData: { [chip: string]: ChipUsageData[] }): ChipStrategy[] {
    const strategies: ChipStrategy[] = [];

    // Wildcard strategy
    strategies.push({
      chip_type: 'wildcard',
      recommended_weeks: [4, 13],
      usage_pattern: 'early',
      success_factors: [
        'Use during international breaks for team assessment',
        'Target fixture swings and price changes',
        'Plan ahead for upcoming difficult periods',
        'Consider team value and future transfers'
      ],
      current_season_trends: historicalData.wildcard
    });

    // Free Hit strategy
    strategies.push({
      chip_type: 'freehit',
      recommended_weeks: [4, 6, 7],
      usage_pattern: 'mid',
      success_factors: [
        'Target blank gameweeks or fixture rotations',
        'Use for one-week punts on form players',
        'Consider captaincy options and differentials',
        'Don\'t overthink - go with gut instinct'
      ],
      current_season_trends: historicalData.freehit
    });

    // Bench Boost strategy
    strategies.push({
      chip_type: 'benchboost',
      recommended_weeks: [5, 8, 6],
      usage_pattern: 'mid',
      success_factors: [
        'Ensure all 15 players are likely to play',
        'Target double gameweeks for maximum impact',
        'Check team rotation policies carefully',
        'Consider cheaper defenders and goalkeepers'
      ],
      current_season_trends: historicalData.benchboost
    });

    // Triple Captain strategy
    strategies.push({
      chip_type: 'triplecaptain',
      recommended_weeks: [6, 14],
      usage_pattern: 'mid',
      success_factors: [
        'Target double gameweeks for premium players',
        'Choose in-form, high-ceiling players',
        'Consider home advantage and fixture difficulty',
        'Check for any injury concerns or rotation risk'
      ],
      current_season_trends: historicalData.triplecaptain
    });

    return strategies;
  }

  /**
   * Generate personalized chip recommendations
   */
  private generatePersonalizedRecommendations() {
    // This would be based on user's current team, chips used, and gameweek
    // For now, returning mock recommendations
    return {
      next_optimal_chip: 'benchboost',
      recommended_week: 8,
      reasoning: [
        'Your bench has strong options with guaranteed minutes',
        'Week 8 has favorable fixtures for your bench players',
        'Good double gameweek potential for maximum points',
        'Save wildcard for later in the season'
      ]
    };
  }
}