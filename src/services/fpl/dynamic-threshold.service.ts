import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';

/**
 * Dynamic Threshold Calculation System
 * Implements LiveFPL-style sophisticated threshold calculations for price changes
 */

export interface PlayerMetrics {
  id: number;
  ownership_percentage: number;
  form_score: number;
  recent_points: number;
  flag_status: 'none' | 'yellow' | 'red';
  flag_change_timestamp?: string;
  price_tier: 'budget' | 'mid' | 'premium';
  special_player_status: boolean;
  element_type: number;
  team: number;
  transfers_in_event: number;
  transfers_out_event: number;
  now_cost: number;
  selected_by_percent: string;
  news: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
}

export interface ThresholdCalculationResult {
  player_id: number;
  rise_threshold: number;
  fall_threshold: number;
  adjusted_rise_threshold: number;
  adjusted_fall_threshold: number;
  threshold_multipliers: {
    gameweek_multiplier: number;
    ownership_multiplier: number;
    form_multiplier: number;
    price_tier_multiplier: number;
    flag_multiplier: number;
    special_player_multiplier: number;
  };
  confidence: number;
}

export interface ThresholdConstants {
  TOTAL_ACTIVE_MANAGERS: number;
  FALL_PERCENTAGE_BASE: number;
  RISE_BASE_MULTIPLIER: number;
  GAMEWEEK_DECAY_RATE: number;
  FORM_IMPACT_FACTOR: number;
  FLAG_MULTIPLIERS: {
    none: number;
    yellow: number;
    red: number;
  };
  PRICE_TIER_MULTIPLIERS: {
    budget: number;
    mid: number;
    premium: number;
  };
}

export class DynamicThresholdService extends BaseFPLService {
  private static instance: DynamicThresholdService;
  
  // LiveFPL-style constants (based on reverse engineering)
  private readonly CONSTANTS: ThresholdConstants = {
    TOTAL_ACTIVE_MANAGERS: 11000000,
    FALL_PERCENTAGE_BASE: 0.35, // 35% of owned managers need to transfer out
    RISE_BASE_MULTIPLIER: 50,
    GAMEWEEK_DECAY_RATE: 0.02, // 2% reduction per gameweek
    FORM_IMPACT_FACTOR: 0.4,
    FLAG_MULTIPLIERS: {
      none: 1.0,
      yellow: 1.5,
      red: 2.2,
    },
    PRICE_TIER_MULTIPLIERS: {
      budget: 1.15, // Easier for budget players to move
      mid: 1.0,
      premium: 0.85, // Harder for premium players to move
    },
  };

  // Special players list (would be dynamically updated)
  private readonly SPECIAL_PLAYERS = new Set([
    // High profile players who may have special rules
    427, // Haaland
    313, // Salah  
    355, // Son
    // Would be expanded based on observation
  ]);

  public static getInstance(): DynamicThresholdService {
    if (!DynamicThresholdService.instance) {
      DynamicThresholdService.instance = new DynamicThresholdService();
    }
    return DynamicThresholdService.instance;
  }

  /**
   * Calculate dynamic thresholds for multiple players
   */
  public async calculateThresholds(
    players: PlayerMetrics[],
    currentGameweek: number
  ): Promise<EnhancedFPLResponse<ThresholdCalculationResult[]>> {
    try {
      const results: ThresholdCalculationResult[] = [];

      for (const player of players) {
        const thresholdResult = await this.calculatePlayerThreshold(player, currentGameweek);
        results.push(thresholdResult);
      }

      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to calculate thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DynamicThresholdService',
        'calculateThresholds',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculate threshold for individual player using LiveFPL methodology
   */
  private async calculatePlayerThreshold(
    player: PlayerMetrics,
    currentGameweek: number
  ): Promise<ThresholdCalculationResult> {
    // 1. Calculate base thresholds
    const riseThreshold = this.calculateRiseThreshold(player);
    const fallThreshold = this.calculateFallThreshold(player);

    // 2. Calculate all multipliers
    const multipliers = this.calculateThresholdMultipliers(player, currentGameweek);

    // 3. Apply multipliers to get adjusted thresholds
    const adjustedRiseThreshold = riseThreshold * 
      multipliers.gameweek_multiplier *
      multipliers.ownership_multiplier *
      multipliers.form_multiplier *
      multipliers.price_tier_multiplier *
      multipliers.special_player_multiplier;

    const adjustedFallThreshold = fallThreshold *
      multipliers.flag_multiplier *
      multipliers.ownership_multiplier *
      multipliers.price_tier_multiplier *
      multipliers.special_player_multiplier;

    // 4. Calculate confidence based on data quality
    const confidence = this.calculateThresholdConfidence(player, multipliers);

    return {
      player_id: player.id,
      rise_threshold: riseThreshold,
      fall_threshold: fallThreshold,
      adjusted_rise_threshold: Math.round(adjustedRiseThreshold),
      adjusted_fall_threshold: Math.round(adjustedFallThreshold),
      threshold_multipliers: multipliers,
      confidence,
    };
  }

  /**
   * Calculate base rise threshold using LiveFPL formula
   */
  private calculateRiseThreshold(player: PlayerMetrics): number {
    // LiveFPL formula: sqrt(ownership * total_managers) * base_multiplier
    const ownershipDecimal = player.ownership_percentage / 100;
    const ownedByManagers = ownershipDecimal * this.CONSTANTS.TOTAL_ACTIVE_MANAGERS;
    
    const baseThreshold = Math.sqrt(ownedByManagers) * this.CONSTANTS.RISE_BASE_MULTIPLIER;
    
    return baseThreshold;
  }

  /**
   * Calculate base fall threshold using ownership-based formula
   */
  private calculateFallThreshold(player: PlayerMetrics): number {
    // LiveFPL formula: ownership_in_managers * fall_percentage_base
    const ownershipDecimal = player.ownership_percentage / 100;
    const ownedByManagers = ownershipDecimal * this.CONSTANTS.TOTAL_ACTIVE_MANAGERS;
    
    const baseThreshold = ownedByManagers * this.CONSTANTS.FALL_PERCENTAGE_BASE;
    
    return baseThreshold;
  }

  /**
   * Calculate all threshold multipliers
   */
  private calculateThresholdMultipliers(
    player: PlayerMetrics,
    currentGameweek: number
  ): ThresholdCalculationResult['threshold_multipliers'] {
    // 1. Gameweek multiplier (decreases over time)
    const gameweekMultiplier = Math.max(
      0.7,
      1 - (currentGameweek * this.CONSTANTS.GAMEWEEK_DECAY_RATE)
    );

    // 2. Ownership multiplier (higher ownership = harder to rise, easier to fall)
    const ownershipMultiplier = this.calculateOwnershipMultiplier(player.ownership_percentage);

    // 3. Form multiplier (good form = easier to rise, harder to fall)
    const formMultiplier = this.calculateFormMultiplier(player.form_score);

    // 4. Price tier multiplier
    const priceTierMultiplier = this.CONSTANTS.PRICE_TIER_MULTIPLIERS[player.price_tier];

    // 5. Flag status multiplier (affects falls more than rises)
    const flagMultiplier = this.CONSTANTS.FLAG_MULTIPLIERS[player.flag_status];

    // 6. Special player multiplier
    const specialPlayerMultiplier = this.calculateSpecialPlayerMultiplier(player);

    return {
      gameweek_multiplier: gameweekMultiplier,
      ownership_multiplier: ownershipMultiplier,
      form_multiplier: formMultiplier,
      price_tier_multiplier: priceTierMultiplier,
      flag_multiplier: flagMultiplier,
      special_player_multiplier: specialPlayerMultiplier,
    };
  }

  /**
   * Calculate ownership-based multiplier
   */
  private calculateOwnershipMultiplier(ownership: number): number {
    // Non-linear relationship: higher ownership makes rises harder
    if (ownership < 5) {
      return 0.9; // Low ownership players rise easier
    } else if (ownership < 15) {
      return 1.0; // Normal threshold
    } else if (ownership < 30) {
      return 1.2; // High ownership makes rises harder
    } else {
      return 1.5; // Very high ownership players very hard to rise
    }
  }

  /**
   * Calculate form-based multiplier
   */
  private calculateFormMultiplier(form: number): number {
    // Form affects rise difficulty more than fall difficulty
    const formDifference = form - 5; // 5 is average form
    const formAdjustment = formDifference * this.CONSTANTS.FORM_IMPACT_FACTOR;
    
    // Good form makes rises easier (multiplier < 1)
    // Poor form makes rises harder (multiplier > 1)
    return Math.max(0.6, Math.min(1.4, 1 - (formAdjustment * 0.1)));
  }

  /**
   * Calculate special player multiplier
   */
  private calculateSpecialPlayerMultiplier(player: PlayerMetrics): number {
    if (this.SPECIAL_PLAYERS.has(player.id) || player.special_player_status) {
      // Special players are more resistant to price changes
      return 1.3;
    }

    // High-profile players (expensive + high ownership) may have different rules
    if (player.now_cost > 100 && player.ownership_percentage > 25) {
      return 1.15;
    }

    return 1.0;
  }

  /**
   * Calculate confidence score for threshold calculation
   */
  private calculateThresholdConfidence(
    player: PlayerMetrics,
    multipliers: ThresholdCalculationResult['threshold_multipliers']
  ): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for special cases
    if (player.special_player_status) {
      confidence -= 0.1;
    }

    // Reduce confidence if player has flag changes
    if (player.flag_status !== 'none') {
      confidence -= 0.1;
    }

    // Reduce confidence for extreme ownership
    if (player.ownership_percentage > 40 || player.ownership_percentage < 1) {
      confidence -= 0.1;
    }

    // Increase confidence for stable players
    if (multipliers.form_multiplier > 0.9 && multipliers.form_multiplier < 1.1) {
      confidence += 0.05;
    }

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  /**
   * Calculate price tier based on current cost
   */
  private calculatePriceTier(nowCost: number): 'budget' | 'mid' | 'premium' {
    if (nowCost <= 50) { // 5.0m or less
      return 'budget';
    } else if (nowCost <= 80) { // 5.1m to 8.0m
      return 'mid';
    } else { // 8.1m+
      return 'premium';
    }
  }

  /**
   * Get real-time threshold adjustments based on live data
   */
  public async getRealTimeThresholdAdjustments(
    playerId: number,
    liveTransferData: any
  ): Promise<EnhancedFPLResponse<{
    adjustment_factor: number;
    reason: string;
    confidence: number;
  }>> {
    try {
      let adjustmentFactor = 1.0;
      let reason = 'No adjustments needed';
      let confidence = 0.9;

      // Check for unusual transfer patterns
      if (liveTransferData.net_transfers > 0) {
        const transferVelocity = liveTransferData.transfers_in_24h / Math.max(liveTransferData.transfers_in_event, 1);
        
        if (transferVelocity > 0.3) {
          adjustmentFactor = 0.85; // Reduce threshold if transfers accelerating
          reason = 'High transfer velocity detected';
          confidence = 0.75;
        }
      } else {
        const transferVelocity = liveTransferData.transfers_out_24h / Math.max(liveTransferData.transfers_out_event, 1);
        
        if (transferVelocity > 0.3) {
          adjustmentFactor = 1.15; // Increase threshold if mass exodus slowing
          reason = 'Transfer velocity declining';
          confidence = 0.75;
        }
      }

      // Check for news impact
      if (liveTransferData.news_impact) {
        if (liveTransferData.news_impact === 'positive') {
          adjustmentFactor *= 0.9; // Easier to rise with good news
          reason += ' + Positive news impact';
        } else if (liveTransferData.news_impact === 'negative') {
          adjustmentFactor *= 1.1; // Harder to rise with bad news
          reason += ' + Negative news impact';
        }
      }

      return {
        success: true,
        data: {
          adjustment_factor: adjustmentFactor,
          reason,
          confidence,
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get real-time threshold adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DynamicThresholdService',
        'getRealTimeThresholdAdjustments',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate threshold calculations against historical data
   */
  public async validateThresholds(
    predictions: any[],
    actualResults: any[]
  ): Promise<EnhancedFPLResponse<{
    accuracy: number;
    threshold_adjustments: any[];
    recommendations: string[];
  }>> {
    try {
      let correctPredictions = 0;
      const thresholdAdjustments = [];
      const recommendations = [];

      for (let i = 0; i < Math.min(predictions.length, actualResults.length); i++) {
        const prediction = predictions[i];
        const actual = actualResults[i];

        const wasCorrect = 
          (prediction.predicted_rise && actual.price_change > 0) ||
          (prediction.predicted_fall && actual.price_change < 0) ||
          (!prediction.predicted_rise && !prediction.predicted_fall && actual.price_change === 0);

        if (wasCorrect) {
          correctPredictions++;
        } else {
          // Analyze why prediction was wrong
          const analysis = this.analyzePredictionError(prediction, actual);
          thresholdAdjustments.push(analysis);
        }
      }

      const accuracy = correctPredictions / Math.max(predictions.length, 1);

      // Generate recommendations based on accuracy
      if (accuracy < 0.85) {
        recommendations.push('Consider adjusting base threshold multipliers');
      }
      if (accuracy < 0.9) {
        recommendations.push('Review special player detection logic');
      }
      if (thresholdAdjustments.length > predictions.length * 0.2) {
        recommendations.push('Investigate systematic threshold calculation errors');
      }

      return {
        success: true,
        data: {
          accuracy,
          threshold_adjustments: thresholdAdjustments,
          recommendations,
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to validate thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DynamicThresholdService',
        'validateThresholds',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze why a prediction was incorrect
   */
  private analyzePredictionError(prediction: any, actual: any): any {
    const error_reasons = [];

    if (prediction.predicted_rise && actual.price_change <= 0) {
      error_reasons.push('Predicted rise but no change occurred');
      if (actual.transfers_below_threshold) {
        error_reasons.push('Transfer count fell short of threshold');
      }
    }

    if (prediction.predicted_fall && actual.price_change >= 0) {
      error_reasons.push('Predicted fall but no change occurred');
      if (actual.wildcard_interference) {
        error_reasons.push('Wildcard transfers may have interfered');
      }
    }

    return {
      player_id: prediction.player_id,
      predicted_change: prediction.predicted_rise ? 'rise' : (prediction.predicted_fall ? 'fall' : 'none'),
      actual_change: actual.price_change > 0 ? 'rise' : (actual.price_change < 0 ? 'fall' : 'none'),
      error_reasons,
      suggested_threshold_adjustment: this.suggestThresholdAdjustment(prediction, actual),
    };
  }

  /**
   * Suggest threshold adjustment based on error analysis
   */
  private suggestThresholdAdjustment(prediction: any, actual: any): number {
    if (prediction.predicted_rise && actual.price_change <= 0) {
      return 0.95; // Reduce threshold to make rises easier
    }
    if (prediction.predicted_fall && actual.price_change >= 0) {
      return 1.05; // Increase threshold to make falls harder
    }
    return 1.0; // No adjustment needed
  }
}