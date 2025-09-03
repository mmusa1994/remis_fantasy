import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  PriceChangesResponse,
  PriceChange,
  EnhancedFPLResponse,
} from '../../types/fpl-enhanced';

/**
 * Enhanced service for tracking price changes and predictions
 * Provides real-time price monitoring and trend analysis
 */
export class FPLPriceTrackingService extends BaseFPLService {
  private static instance: FPLPriceTrackingService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLPriceTrackingService {
    if (!FPLPriceTrackingService.instance) {
      FPLPriceTrackingService.instance = new FPLPriceTrackingService();
    }
    return FPLPriceTrackingService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get current price changes (risers and fallers)
   */
  public async getCurrentPriceChanges(): Promise<EnhancedFPLResponse<PriceChangesResponse>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));

      // Get risers (positive price change in current event)
      const risers: PriceChange[] = players
        .filter(player => player.cost_change_event > 0)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          position: this.getPositionName(player.element_type),
          old_price: player.now_cost - player.cost_change_event,
          new_price: player.now_cost,
          change_amount: player.cost_change_event,
          change_time: new Date().toISOString(), // Would be from actual API
          change_type: 'rise' as const,
          predicted: false,
        }))
        .sort((a, b) => b.change_amount - a.change_amount);

      // Get fallers (negative price change in current event)
      const fallers: PriceChange[] = players
        .filter(player => player.cost_change_event < 0)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          position: this.getPositionName(player.element_type),
          old_price: player.now_cost - player.cost_change_event,
          new_price: player.now_cost,
          change_amount: Math.abs(player.cost_change_event),
          change_time: new Date().toISOString(),
          change_type: 'fall' as const,
          predicted: false,
        }))
        .sort((a, b) => b.change_amount - a.change_amount);

      // Mock predicted changes based on transfer trends
      const predicted_changes: PriceChange[] = await this.getPredictedPriceChanges(players, teamsMap);

      const result: PriceChangesResponse = {
        risers: risers.slice(0, 10),
        fallers: fallers.slice(0, 10),
        predicted_changes: predicted_changes.slice(0, 10),
        last_update: new Date().toISOString(),
        next_update_estimated: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      };

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch price changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLPriceTrackingService',
        'getCurrentPriceChanges',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get price impact on user's team
   */
  public async getTeamPriceImpact(teamPlayerIds: number[]): Promise<EnhancedFPLResponse<{
    affected_players: number;
    total_value_change: number;
    individual_changes: Array<{
      player_id: number;
      web_name: string;
      change: number;
    }>;
  }>> {
    try {
      const priceChangesResponse = await this.getCurrentPriceChanges();
      if (!priceChangesResponse.success) {
        throw new Error('Failed to get price changes');
      }

      const { risers, fallers } = priceChangesResponse.data;
      const allChanges = [...risers, ...fallers];

      const teamChanges = allChanges.filter(change => 
        teamPlayerIds.includes(change.player_id)
      );

      const total_value_change = teamChanges.reduce((sum, change) => {
        return sum + (change.change_type === 'rise' ? change.change_amount : -change.change_amount);
      }, 0);

      return {
        success: true,
        data: {
          affected_players: teamChanges.length,
          total_value_change,
          individual_changes: teamChanges.map(change => ({
            player_id: change.player_id,
            web_name: change.web_name,
            change: change.change_type === 'rise' ? change.change_amount : -change.change_amount,
          })),
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to calculate team price impact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLPriceTrackingService',
        'getTeamPriceImpact',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get predicted price changes based on transfer trends
   */
  private async getPredictedPriceChanges(players: any[], teamsMap: Map<number, string>): Promise<PriceChange[]> {
    // Mock prediction algorithm - in reality this would use transfer trends data
    const highTransferInPlayers = players
      .filter(player => player.transfers_in_event > 50000) // High transfer activity
      .filter(player => player.cost_change_event === 0) // Haven't changed yet
      .slice(0, 5);

    const highTransferOutPlayers = players
      .filter(player => player.transfers_out_event > 50000)
      .filter(player => player.cost_change_event === 0)
      .slice(0, 5);

    const predictions: PriceChange[] = [];

    // Predict rises
    highTransferInPlayers.forEach(player => {
      predictions.push({
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamsMap.get(player.team) || 'Unknown',
        position: this.getPositionName(player.element_type),
        old_price: player.now_cost,
        new_price: player.now_cost + 1,
        change_amount: 1,
        change_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        change_type: 'rise' as const,
        predicted: true,
      });
    });

    // Predict falls
    highTransferOutPlayers.forEach(player => {
      predictions.push({
        player_id: player.id,
        web_name: player.web_name,
        team_name: teamsMap.get(player.team) || 'Unknown',
        position: this.getPositionName(player.element_type),
        old_price: player.now_cost,
        new_price: player.now_cost - 1,
        change_amount: 1,
        change_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        change_type: 'fall' as const,
        predicted: true,
      });
    });

    return predictions;
  }

  private getPositionName(elementType: number): string {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType as keyof typeof positions] || 'Unknown';
  }
}