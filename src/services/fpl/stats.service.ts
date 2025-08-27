import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { FPLServiceError } from './errors';
import type {
  FPLDreamTeam,
  FPLServiceResponse,
} from '../../types/fpl';

/**
 * Service for handling statistics and market data
 * Provides methods for dream teams, top stats, and transfer data
 */
export class FPLStatsService extends BaseFPLService {
  private static instance: FPLStatsService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLStatsService {
    if (!FPLStatsService.instance) {
      FPLStatsService.instance = new FPLStatsService();
    }
    return FPLStatsService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  /**
   * Get dream team for a specific gameweek
   */
  public async getDreamTeam(gameweek: number): Promise<FPLServiceResponse<FPLDreamTeam>> {
    this.validateGameweek(gameweek);

    try {
      const data = await this.fetchWithRetry<FPLDreamTeam>(
        `/dream-team/${gameweek}/`,
        {
          key: `dream_team_gw${gameweek}`,
          ttl: this.config.cache.default_ttl,
        }
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        cache_hit: this.isCacheValid(`dream_team_gw${gameweek}`, this.config.cache.default_ttl),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to fetch dream team for gameweek ${gameweek}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getDreamTeam',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get top statistics for various categories
   */
  public async getTopStats(
    statType: 'most_selected' | 'most_transferred_in' | 'most_captained' | 'most_vice_captained'
  ): Promise<FPLServiceResponse<Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    position: string;
    value: number;
    percentage?: number;
  }>>> {
    try {
      // Note: FPL API doesn't have a direct endpoint for all top stats
      // This implementation uses the bootstrap data which contains some of this information
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams, element_types } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(element_types.map(et => [et.id, et.singular_name]));

      let sortedPlayers: Array<any> = [];

      switch (statType) {
        case 'most_selected':
          sortedPlayers = players
            .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
            .slice(0, 20)
            .map(player => ({
              player_id: player.id,
              web_name: player.web_name,
              team_name: teamsMap.get(player.team) || 'Unknown',
              position: positionsMap.get(player.element_type) || 'Unknown',
              value: parseFloat(player.selected_by_percent),
              percentage: parseFloat(player.selected_by_percent),
            }));
          break;

        case 'most_transferred_in':
          sortedPlayers = players
            .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
            .slice(0, 20)
            .map(player => ({
              player_id: player.id,
              web_name: player.web_name,
              team_name: teamsMap.get(player.team) || 'Unknown',
              position: positionsMap.get(player.element_type) || 'Unknown',
              value: player.transfers_in_event,
            }));
          break;

        default:
          // For captain stats, we'd need live data which isn't available in bootstrap
          throw new FPLServiceError(
            `Stat type ${statType} requires live gameweek data`,
            'FPLStatsService',
            'getTopStats'
          );
      }

      return {
        success: true,
        data: sortedPlayers,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get top stats for ${statType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getTopStats',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get transfer market trends
   */
  public async getTransferTrends(): Promise<FPLServiceResponse<{
    most_transferred_in: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      transfers_in: number;
      net_transfers: number;
    }>;
    most_transferred_out: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      transfers_out: number;
      net_transfers: number;
    }>;
    biggest_risers: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      cost_change: number;
      new_cost: number;
    }>;
    biggest_fallers: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      cost_change: number;
      new_cost: number;
    }>;
  }>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));

      const mostTransferredIn = players
        .filter(p => p.transfers_in_event > 0)
        .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
        .slice(0, 10)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          transfers_in: player.transfers_in_event,
          net_transfers: player.transfers_in_event - player.transfers_out_event,
        }));

      const mostTransferredOut = players
        .filter(p => p.transfers_out_event > 0)
        .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
        .slice(0, 10)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          transfers_out: player.transfers_out_event,
          net_transfers: player.transfers_in_event - player.transfers_out_event,
        }));

      const biggestRisers = players
        .filter(p => p.cost_change_event > 0)
        .sort((a, b) => b.cost_change_event - a.cost_change_event)
        .slice(0, 10)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          cost_change: player.cost_change_event,
          new_cost: player.now_cost,
        }));

      const biggestFallers = players
        .filter(p => p.cost_change_event < 0)
        .sort((a, b) => a.cost_change_event - b.cost_change_event)
        .slice(0, 10)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          cost_change: player.cost_change_event,
          new_cost: player.now_cost,
        }));

      return {
        success: true,
        data: {
          most_transferred_in: mostTransferredIn,
          most_transferred_out: mostTransferredOut,
          biggest_risers: biggestRisers,
          biggest_fallers: biggestFallers,
        },
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get transfer trends: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getTransferTrends',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get ownership statistics
   */
  public async getOwnershipStats(): Promise<FPLServiceResponse<{
    most_owned: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      ownership_percent: number;
      cost: number;
    }>;
    least_owned: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      ownership_percent: number;
      cost: number;
    }>;
    differential_picks: Array<{
      player_id: number;
      web_name: string;
      team_name: string;
      ownership_percent: number;
      total_points: number;
      value_rating: number;
    }>;
  }>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));

      const mostOwned = players
        .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
        .slice(0, 20)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          ownership_percent: parseFloat(player.selected_by_percent),
          cost: player.now_cost,
        }));

      const leastOwned = players
        .filter(p => parseFloat(p.selected_by_percent) > 0) // Exclude completely unowned players
        .sort((a, b) => parseFloat(a.selected_by_percent) - parseFloat(b.selected_by_percent))
        .slice(0, 20)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          ownership_percent: parseFloat(player.selected_by_percent),
          cost: player.now_cost,
        }));

      // Differential picks: Low ownership but high points
      const differentialPicks = players
        .filter(p => parseFloat(p.selected_by_percent) < 5 && p.total_points > 50)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          ownership_percent: parseFloat(player.selected_by_percent),
          total_points: player.total_points,
          value_rating: player.total_points / (parseFloat(player.selected_by_percent) + 0.1), // Avoid division by zero
        }))
        .sort((a, b) => b.value_rating - a.value_rating)
        .slice(0, 15);

      return {
        success: true,
        data: {
          most_owned: mostOwned,
          least_owned: leastOwned,
          differential_picks: differentialPicks,
        },
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get ownership stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getOwnershipStats',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get form table (players sorted by recent form)
   */
  public async getFormTable(
    elementType?: number,
    limit = 20
  ): Promise<FPLServiceResponse<Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    position: string;
    form: number;
    total_points: number;
    cost: number;
    points_per_game: number;
  }>>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams, element_types } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(element_types.map(et => [et.id, et.singular_name]));

      let filteredPlayers = players;
      if (elementType) {
        this.validateId(elementType, 'elementType');
        filteredPlayers = players.filter(p => p.element_type === elementType);
      }

      const formTable = filteredPlayers
        .filter(p => parseFloat(p.form) > 0) // Only include players with form data
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
        .slice(0, limit)
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          position: positionsMap.get(player.element_type) || 'Unknown',
          form: parseFloat(player.form),
          total_points: player.total_points,
          cost: player.now_cost,
          points_per_game: parseFloat(player.points_per_game),
        }));

      return {
        success: true,
        data: formTable,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get form table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getFormTable',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get value picks (best points per cost)
   */
  public async getValuePicks(
    elementType?: number,
    limit = 20
  ): Promise<FPLServiceResponse<Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    position: string;
    cost: number;
    total_points: number;
    points_per_million: number;
    value_rank: number;
  }>>> {
    try {
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams, element_types } = bootstrapResponse.data;
      const teamsMap = new Map(teams.map(t => [t.id, t.short_name]));
      const positionsMap = new Map(element_types.map(et => [et.id, et.singular_name]));

      let filteredPlayers = players;
      if (elementType) {
        this.validateId(elementType, 'elementType');
        filteredPlayers = players.filter(p => p.element_type === elementType);
      }

      const valuePicks = filteredPlayers
        .filter(p => p.total_points > 0 && p.now_cost > 0) // Only include players with points and cost
        .map(player => ({
          player_id: player.id,
          web_name: player.web_name,
          team_name: teamsMap.get(player.team) || 'Unknown',
          position: positionsMap.get(player.element_type) || 'Unknown',
          cost: player.now_cost,
          total_points: player.total_points,
          points_per_million: (player.total_points / player.now_cost) * 10,
          value_rank: 0, // Will be set below
        }))
        .sort((a, b) => b.points_per_million - a.points_per_million)
        .slice(0, limit)
        .map((player, index) => ({
          ...player,
          value_rank: index + 1,
          points_per_million: Number(player.points_per_million.toFixed(2)),
        }));

      return {
        success: true,
        data: valuePicks,
        timestamp: new Date().toISOString(),
        cache_hit: bootstrapResponse.cache_hit,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get value picks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FPLStatsService',
        'getValuePicks',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear stats caches
   */
  public clearStatsCache(gameweek?: number): void {
    if (gameweek) {
      this.clearCache(`dream_team_gw${gameweek}`);
    } else {
      this.clearCache('dream_team');
      this.clearCache('stats');
    }
  }
}