import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  TransferAnalytics,
  TransferTrend,
  PlayerTransferData,
  EnhancedFPLResponse,
} from '../../types/fpl-enhanced';

/**
 * Service for tracking transfer trends and analytics
 * Provides insights into current and future transfer patterns
 */
export class FPLTransferAnalyticsService extends BaseFPLService {
  private static instance: FPLTransferAnalyticsService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLTransferAnalyticsService {
    if (!FPLTransferAnalyticsService.instance) {
      FPLTransferAnalyticsService.instance = new FPLTransferAnalyticsService();
    }
    return FPLTransferAnalyticsService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get comprehensive transfer analytics
   */
  public async getTransferAnalytics(currentGameweek: number): Promise<EnhancedFPLResponse<TransferAnalytics>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams, element_types } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(element_types.map(et => [et.id, et.singular_name_short]));

      // Get current week transfer data
      const currentWeekData = this.analyzeCurrentWeekTransfers(players, teamsMap, positionsMap);
      
      // Get future week predictions
      const futureWeeksData = this.analyzeFutureTransfers(players, teamsMap, currentGameweek);
      
      // Get transfer trends
      const transferTrends = this.analyzeTransferTrends(players, positionsMap);

      const analytics: TransferAnalytics = {
        current_week: currentWeekData,
        future_weeks: futureWeeksData,
        transfer_trends: transferTrends,
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
        `Failed to fetch transfer analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLTransferAnalyticsService',
        'getTransferAnalytics',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get popular transfer combinations (swaps)
   */
  public async getPopularTransferSwaps(limit: number = 10): Promise<EnhancedFPLResponse<TransferTrend[]>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players } = bootstrapResponse.data;

      // Mock popular swaps based on transfer activity
      const topTransfersOut = players
        .filter(p => p.transfers_out_event > 10000)
        .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
        .slice(0, 20);

      const topTransfersIn = players
        .filter(p => p.transfers_in_event > 10000)
        .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
        .slice(0, 20);

      const swaps: TransferTrend[] = [];

      // Create mock transfer combinations
      topTransfersOut.forEach((playerOut, index) => {
        if (index < topTransfersIn.length) {
          const playerIn = topTransfersIn[index];
          
          // Only create swaps for same position players
          if (playerOut.element_type === playerIn.element_type) {
            swaps.push({
              player_in_id: playerIn.id,
              player_out_id: playerOut.id,
              player_in_name: playerIn.web_name,
              player_out_name: playerOut.web_name,
              transfer_count: Math.min(playerOut.transfers_out_event, playerIn.transfers_in_event) * 0.3,
              percentage_of_transfers: Math.random() * 5 + 1, // Mock percentage
              gameweek: 4, // Current gameweek
              trend_type: 'current',
            });
          }
        }
      });

      return {
        success: true,
        data: swaps.slice(0, limit),
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch popular transfer swaps: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLTransferAnalyticsService',
        'getPopularTransferSwaps',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get transfer momentum for specific players
   */
  public async getPlayerTransferMomentum(playerIds: number[]): Promise<EnhancedFPLResponse<PlayerTransferData[]>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams, element_types } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(element_types.map(et => [et.id, et.singular_name_short]));

      const playerData = players
        .filter(player => playerIds.includes(player.id))
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          position: positionsMap.get(player.element_type) || 'Unknown',
          transfers_in_count: player.transfers_in_event,
          transfers_out_count: player.transfers_out_event,
          net_transfers: player.transfers_in_event - player.transfers_out_event,
          transfer_momentum: this.calculateTransferMomentum(player),
        }));

      return {
        success: true,
        data: playerData,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch player transfer momentum: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLTransferAnalyticsService',
        'getPlayerTransferMomentum',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze current week transfers
   */
  private analyzeCurrentWeekTransfers(
    players: any[],
    teamsMap: Map<number, string>,
    positionsMap: Map<number, string>
  ) {
    const top_transfers_in: PlayerTransferData[] = players
      .filter(p => p.transfers_in_event > 0)
      .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
      .slice(0, 10)
      .map(player => ({
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamsMap.get(player.team) || 'Unknown',
        position: positionsMap.get(player.element_type) || 'Unknown',
        transfers_in_count: player.transfers_in_event,
        transfers_out_count: player.transfers_out_event,
        net_transfers: player.transfers_in_event - player.transfers_out_event,
        transfer_momentum: this.calculateTransferMomentum(player),
      }));

    const top_transfers_out: PlayerTransferData[] = players
      .filter(p => p.transfers_out_event > 0)
      .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
      .slice(0, 10)
      .map(player => ({
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamsMap.get(player.team) || 'Unknown',
        position: positionsMap.get(player.element_type) || 'Unknown',
        transfers_in_count: player.transfers_in_event,
        transfers_out_count: player.transfers_out_event,
        net_transfers: player.transfers_in_event - player.transfers_out_event,
        transfer_momentum: this.calculateTransferMomentum(player),
      }));

    // Mock popular swaps
    const popular_swaps: TransferTrend[] = this.generateMockSwaps(players);

    return {
      top_transfers_in,
      top_transfers_out,
      popular_swaps,
    };
  }

  /**
   * Analyze future transfers (mock data for demonstration)
   */
  private analyzeFutureTransfers(players: any[], teamsMap: Map<number, string>, currentGameweek: number) {
    const futureWeeks: { [week: number]: any } = {};

    // Generate mock future transfer data for next 5 weeks
    for (let week = currentGameweek + 1; week <= currentGameweek + 5; week++) {
      futureWeeks[week] = {
        planned_transfers: this.generateFutureTransferTrends(players, week),
        target_players: this.generateTargetPlayers(players, teamsMap, week),
      };
    }

    return futureWeeks;
  }

  /**
   * Analyze general transfer trends
   */
  private analyzeTransferTrends(players: any[], positionsMap: Map<number, string>) {
    const totalTransfers = players.reduce((sum, p) => sum + p.transfers_in_event + p.transfers_out_event, 0);
    
    // Most active positions
    const positionActivity = new Map<string, number>();
    players.forEach(player => {
      const position = positionsMap.get(player.element_type) || 'Unknown';
      const activity = player.transfers_in_event + player.transfers_out_event;
      positionActivity.set(position, (positionActivity.get(position) || 0) + activity);
    });

    const most_active_positions = Array.from(positionActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([position]) => position);

    // Popular price ranges
    const priceRanges = [
      { range: '£4.0-5.0m', min: 40, max: 50 },
      { range: '£5.0-7.0m', min: 50, max: 70 },
      { range: '£7.0-10.0m', min: 70, max: 100 },
      { range: '£10.0m+', min: 100, max: 200 },
    ];

    const popular_price_ranges = priceRanges.map(range => ({
      range: range.range,
      transfer_count: players
        .filter(p => p.now_cost >= range.min && p.now_cost < range.max)
        .reduce((sum, p) => sum + p.transfers_in_event, 0),
    }));

    return {
      total_transfers_made: totalTransfers,
      most_active_positions,
      popular_price_ranges,
    };
  }

  /**
   * Calculate transfer momentum for a player
   */
  private calculateTransferMomentum(player: any): 'accelerating' | 'steady' | 'slowing' {
    const netTransfers = player.transfers_in_event - player.transfers_out_event;
    const totalActivity = player.transfers_in_event + player.transfers_out_event;
    
    if (totalActivity > 50000) {
      return 'accelerating';
    } else if (totalActivity > 10000) {
      return 'steady';
    } else {
      return 'slowing';
    }
  }

  /**
   * Generate mock transfer swaps
   */
  private generateMockSwaps(players: any[]): TransferTrend[] {
    const swaps: TransferTrend[] = [];
    
    // Mock some popular swaps based on the data provided
    const mockSwaps = [
      { out: 'Watkins', in: 'Ekitiké', count: 557 },
      { out: 'Watkins', in: 'Mateta', count: 519 },
      { out: 'Wood', in: 'Mateta', count: 468 },
      { out: 'João Pedro', in: 'Mateta', count: 466 },
      { out: 'B.Fernandes', in: 'M.Salah', count: 434 },
    ];

    mockSwaps.forEach((swap, index) => {
      const playerOut = players.find(p => p.web_name.includes(swap.out.split(' ')[0]));
      const playerIn = players.find(p => p.web_name.includes(swap.in.split(' ')[0]));
      
      if (playerOut && playerIn) {
        swaps.push({
          player_in_id: playerIn.id,
          player_out_id: playerOut.id,
          player_in_name: swap.in,
          player_out_name: swap.out,
          transfer_count: swap.count,
          percentage_of_transfers: (swap.count / 10000) * 100, // Mock percentage
          gameweek: 4,
          trend_type: 'current',
        });
      }
    });

    return swaps;
  }

  /**
   * Generate future transfer trends (mock)
   */
  private generateFutureTransferTrends(players: any[], week: number): TransferTrend[] {
    // Mock future transfer patterns
    const futureSwaps: TransferTrend[] = [];
    
    if (week === 5) {
      futureSwaps.push(
        { player_in_id: 0, player_out_id: 0, player_in_name: 'Wood', player_out_name: 'João Pedro', transfer_count: 242, percentage_of_transfers: 2.4, gameweek: week, trend_type: 'planned' },
        { player_in_id: 0, player_out_id: 0, player_in_name: 'Strand Larsen', player_out_name: 'João Pedro', transfer_count: 135, percentage_of_transfers: 1.35, gameweek: week, trend_type: 'planned' }
      );
    } else if (week === 6) {
      futureSwaps.push(
        { player_in_id: 0, player_out_id: 0, player_in_name: 'Haaland', player_out_name: 'Watkins', transfer_count: 720, percentage_of_transfers: 7.2, gameweek: week, trend_type: 'planned' },
        { player_in_id: 0, player_out_id: 0, player_in_name: 'Haaland', player_out_name: 'Mateta', transfer_count: 640, percentage_of_transfers: 6.4, gameweek: week, trend_type: 'planned' }
      );
    }

    return futureSwaps;
  }

  /**
   * Generate target players for future weeks (mock)
   */
  private generateTargetPlayers(players: any[], teamsMap: Map<number, string>, week: number): PlayerTransferData[] {
    // Mock target players based on week
    const targets: string[] = [];
    
    if (week === 5) targets.push('Wood', 'Strand Larsen');
    else if (week === 6) targets.push('Haaland');
    else if (week === 7) targets.push('Gyökeres', 'Gabriel');
    
    return players
      .filter(p => targets.some(target => p.web_name.includes(target)))
      .slice(0, 5)
      .map(player => ({
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamsMap.get(player.team) || 'Unknown',
        position: this.getPositionName(player.element_type),
        transfers_in_count: player.transfers_in_event,
        transfers_out_count: player.transfers_out_event,
        net_transfers: player.transfers_in_event - player.transfers_out_event,
        transfer_momentum: this.calculateTransferMomentum(player),
      }));
  }

  private getPositionName(elementType: number): string {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType as keyof typeof positions] || 'Unknown';
  }
}