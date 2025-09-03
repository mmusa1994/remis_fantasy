import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';

/**
 * Flag Change Impact Handler Service
 * Handles complex logic around player flag changes and their impact on price movements
 * Based on LiveFPL's sophisticated flag change detection and impact system
 */

export interface PlayerFlagData {
  id: number;
  web_name: string;
  current_flag: 'none' | 'yellow' | 'red';
  previous_flag?: 'none' | 'yellow' | 'red';
  flag_change_timestamp?: string;
  news: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  ownership_percentage: number;
  transfers_in_event: number;
  transfers_out_event: number;
  last_flag_check: string;
}

export interface FlagChangeEvent {
  player_id: number;
  from_flag: 'none' | 'yellow' | 'red';
  to_flag: 'none' | 'yellow' | 'red';
  change_timestamp: string;
  lock_duration_hours: number;
  reset_transfer_count: boolean;
  impact_severity: 'low' | 'medium' | 'high' | 'critical';
  expected_transfer_impact: number;
  threshold_adjustment_factor: number;
}

export interface PlayerAdjustments {
  price_change_locked: boolean;
  lock_expires_at?: string;
  transfer_count_reset: boolean;
  threshold_multiplier: number;
  fall_probability_increase: number;
  rise_probability_decrease: number;
  confidence_adjustment: number;
}

export interface FlagChangeAnalysis {
  player_id: number;
  flag_event: FlagChangeEvent | null;
  adjustments: PlayerAdjustments;
  projected_impact: {
    expected_transfers_out_24h: number;
    expected_transfers_in_24h: number;
    price_change_probability: number;
    timing_estimate: string;
  };
  monitoring_priority: 'low' | 'medium' | 'high' | 'critical';
}

export class FlagChangeHandlerService extends BaseFPLService {
  private static instance: FlagChangeHandlerService;
  
  // Flag change rules based on LiveFPL observations
  private readonly FLAG_RULES = {
    LOCK_DURATIONS: {
      'red_to_none': 192, // 8 days (192 hours)
      'red_to_yellow': 48, // 2 days
      'yellow_to_red': 24, // 1 day
      'yellow_to_none': 72, // 3 days
      'none_to_yellow': 12, // 12 hours
      'none_to_red': 48, // 2 days
    },
    TRANSFER_RESET_CONDITIONS: {
      'red_to_none': true,
      'red_to_yellow': false,
      'yellow_to_red': true,
      'yellow_to_none': false,
      'none_to_yellow': false,
      'none_to_red': true,
    },
    THRESHOLD_MULTIPLIERS: {
      'none': 1.0,
      'yellow': 1.5,
      'red': 2.2,
    },
    FALL_PROBABILITY_INCREASES: {
      'none_to_red': 0.4, // 40% increase in fall probability
      'none_to_yellow': 0.15, // 15% increase
      'yellow_to_red': 0.25, // 25% increase
    },
  };

  // Historical flag change patterns for ML prediction
  private readonly HISTORICAL_PATTERNS = [
    {
      flag_change: 'none_to_red',
      avg_transfers_out_24h: 85000,
      avg_transfers_in_24h: 5000,
      price_fall_probability: 0.75,
      timing_hours: 18,
    },
    {
      flag_change: 'red_to_none',
      avg_transfers_out_24h: 15000,
      avg_transfers_in_24h: 45000,
      price_fall_probability: 0.1,
      timing_hours: 48,
    },
    {
      flag_change: 'none_to_yellow',
      avg_transfers_out_24h: 25000,
      avg_transfers_in_24h: 8000,
      price_fall_probability: 0.35,
      timing_hours: 24,
    },
  ];

  public static getInstance(): FlagChangeHandlerService {
    if (!FlagChangeHandlerService.instance) {
      FlagChangeHandlerService.instance = new FlagChangeHandlerService();
    }
    return FlagChangeHandlerService.instance;
  }

  /**
   * Analyze flag changes and their impact on price predictions
   */
  public async analyzeFlagChanges(
    players: PlayerFlagData[]
  ): Promise<EnhancedFPLResponse<FlagChangeAnalysis[]>> {
    try {
      const analyses: FlagChangeAnalysis[] = [];

      for (const player of players) {
        const analysis = await this.analyzePlayerFlagChange(player);
        analyses.push(analysis);
      }

      return {
        success: true,
        data: analyses,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to analyze flag changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FlagChangeHandlerService',
        'analyzeFlagChanges',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze individual player flag change
   */
  private async analyzePlayerFlagChange(player: PlayerFlagData): Promise<FlagChangeAnalysis> {
    // 1. Detect flag change event
    const flagEvent = this.detectFlagChange(player);
    
    // 2. Calculate adjustments based on flag change
    const adjustments = this.calculateFlagAdjustments(player, flagEvent);
    
    // 3. Project impact on transfers and price changes
    const projectedImpact = this.projectFlagImpact(player, flagEvent);
    
    // 4. Determine monitoring priority
    const monitoringPriority = this.calculateMonitoringPriority(player, flagEvent, projectedImpact);

    return {
      player_id: player.id,
      flag_event: flagEvent,
      adjustments,
      projected_impact: projectedImpact,
      monitoring_priority: monitoringPriority,
    };
  }

  /**
   * Detect flag change event
   */
  public detectFlagChange(player: PlayerFlagData): FlagChangeEvent | null {
    if (!player.previous_flag || player.current_flag === player.previous_flag) {
      return null; // No flag change
    }

    const changeKey = `${player.previous_flag}_to_${player.current_flag}` as keyof typeof this.FLAG_RULES.LOCK_DURATIONS;
    
    const lockDuration = this.FLAG_RULES.LOCK_DURATIONS[changeKey] || 24;
    const resetTransferCount = this.FLAG_RULES.TRANSFER_RESET_CONDITIONS[changeKey] || false;
    
    // Determine impact severity
    const impactSeverity = this.calculateImpactSeverity(player.previous_flag, player.current_flag, player.ownership_percentage);
    
    // Calculate expected transfer impact
    const expectedTransferImpact = this.calculateExpectedTransferImpact(player, changeKey);
    
    // Calculate threshold adjustment factor
    const thresholdAdjustmentFactor = this.FLAG_RULES.THRESHOLD_MULTIPLIERS[player.current_flag];

    return {
      player_id: player.id,
      from_flag: player.previous_flag,
      to_flag: player.current_flag,
      change_timestamp: player.flag_change_timestamp || new Date().toISOString(),
      lock_duration_hours: lockDuration,
      reset_transfer_count: resetTransferCount,
      impact_severity: impactSeverity,
      expected_transfer_impact: expectedTransferImpact,
      threshold_adjustment_factor: thresholdAdjustmentFactor,
    };
  }

  /**
   * Calculate impact severity of flag change
   */
  private calculateImpactSeverity(
    fromFlag: string,
    toFlag: string,
    ownership: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // High ownership players have higher impact
    const ownershipMultiplier = ownership > 20 ? 2 : ownership > 10 ? 1.5 : 1;
    
    let baseSeverity = 1;
    
    if (fromFlag === 'none' && toFlag === 'red') {
      baseSeverity = 4; // Critical impact
    } else if (fromFlag === 'yellow' && toFlag === 'red') {
      baseSeverity = 3; // High impact
    } else if (fromFlag === 'none' && toFlag === 'yellow') {
      baseSeverity = 2; // Medium impact
    } else if (toFlag === 'none') {
      baseSeverity = 1; // Low impact (recovery)
    }
    
    const adjustedSeverity = baseSeverity * ownershipMultiplier;
    
    if (adjustedSeverity >= 6) return 'critical';
    if (adjustedSeverity >= 4) return 'high';
    if (adjustedSeverity >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate expected transfer impact based on historical patterns
   */
  private calculateExpectedTransferImpact(
    player: PlayerFlagData,
    changeKey: string
  ): number {
    const historicalPattern = this.HISTORICAL_PATTERNS.find(
      p => p.flag_change === changeKey
    );

    if (!historicalPattern) {
      return 0; // No historical data available
    }

    // Adjust based on player ownership
    const ownershipMultiplier = (player.ownership_percentage / 100) * 11000000 / 1000000; // Scale to millions
    
    const expectedOutflow = historicalPattern.avg_transfers_out_24h * ownershipMultiplier;
    const expectedInflow = historicalPattern.avg_transfers_in_24h * ownershipMultiplier;
    
    return expectedOutflow - expectedInflow; // Net transfer impact
  }

  /**
   * Calculate flag-based adjustments
   */
  public calculateFlagAdjustments(
    player: PlayerFlagData,
    flagEvent: FlagChangeEvent | null
  ): PlayerAdjustments {
    if (!flagEvent) {
      // No flag change, return standard adjustments
      return {
        price_change_locked: false,
        transfer_count_reset: false,
        threshold_multiplier: this.FLAG_RULES.THRESHOLD_MULTIPLIERS[player.current_flag],
        fall_probability_increase: 0,
        rise_probability_decrease: 0,
        confidence_adjustment: 0,
      };
    }

    const changeKey = `${flagEvent.from_flag}_to_${flagEvent.to_flag}` as keyof typeof this.FLAG_RULES.FALL_PROBABILITY_INCREASES;
    
    // Calculate lock expiry
    const lockExpiresAt = new Date(Date.parse(flagEvent.change_timestamp) + flagEvent.lock_duration_hours * 60 * 60 * 1000);
    const isCurrentlyLocked = new Date() < lockExpiresAt;
    
    // Calculate probability adjustments
    const fallProbabilityIncrease = this.FLAG_RULES.FALL_PROBABILITY_INCREASES[changeKey] || 0;
    const riseProbabilityDecrease = flagEvent.to_flag !== 'none' ? 0.2 : 0; // Flags generally reduce rise probability
    
    // Calculate confidence adjustment
    const confidenceAdjustment = this.calculateConfidenceAdjustment(flagEvent);

    return {
      price_change_locked: isCurrentlyLocked,
      lock_expires_at: lockExpiresAt.toISOString(),
      transfer_count_reset: flagEvent.reset_transfer_count,
      threshold_multiplier: flagEvent.threshold_adjustment_factor,
      fall_probability_increase: fallProbabilityIncrease,
      rise_probability_decrease: riseProbabilityDecrease,
      confidence_adjustment: confidenceAdjustment,
    };
  }

  /**
   * Calculate confidence adjustment based on flag change complexity
   */
  private calculateConfidenceAdjustment(flagEvent: FlagChangeEvent): number {
    // More complex flag changes reduce prediction confidence
    switch (flagEvent.impact_severity) {
      case 'critical':
        return -0.3; // Significant confidence reduction
      case 'high':
        return -0.2;
      case 'medium':
        return -0.1;
      case 'low':
        return -0.05;
      default:
        return 0;
    }
  }

  /**
   * Project impact of flag change on transfers and prices
   */
  private projectFlagImpact(
    player: PlayerFlagData,
    flagEvent: FlagChangeEvent | null
  ): FlagChangeAnalysis['projected_impact'] {
    if (!flagEvent) {
      // No flag change, return current trends
      return {
        expected_transfers_out_24h: player.transfers_out_event * 0.1, // 10% of weekly transfers per day
        expected_transfers_in_24h: player.transfers_in_event * 0.1,
        price_change_probability: 0.1, // Low probability without flag impact
        timing_estimate: '>48h',
      };
    }

    const changeKey = `${flagEvent.from_flag}_to_${flagEvent.to_flag}`;
    const historicalPattern = this.HISTORICAL_PATTERNS.find(p => p.flag_change === changeKey);
    
    if (!historicalPattern) {
      // Fallback estimation
      const isBadNews = flagEvent.to_flag === 'red' || (flagEvent.from_flag === 'none' && flagEvent.to_flag === 'yellow');
      
      return {
        expected_transfers_out_24h: isBadNews ? player.transfers_out_event * 0.3 : player.transfers_out_event * 0.05,
        expected_transfers_in_24h: isBadNews ? player.transfers_in_event * 0.02 : player.transfers_in_event * 0.15,
        price_change_probability: isBadNews ? 0.4 : 0.15,
        timing_estimate: isBadNews ? '12-24h' : '24-48h',
      };
    }

    // Use historical pattern with ownership adjustment
    const ownershipMultiplier = Math.sqrt(player.ownership_percentage / 100);
    
    const timingEstimate = this.calculateTimingEstimate(historicalPattern.timing_hours);

    return {
      expected_transfers_out_24h: Math.round(historicalPattern.avg_transfers_out_24h * ownershipMultiplier),
      expected_transfers_in_24h: Math.round(historicalPattern.avg_transfers_in_24h * ownershipMultiplier),
      price_change_probability: historicalPattern.price_fall_probability * ownershipMultiplier,
      timing_estimate: timingEstimate,
    };
  }

  /**
   * Calculate timing estimate string
   */
  private calculateTimingEstimate(hours: number): string {
    if (hours <= 6) return '<6h';
    if (hours <= 12) return '6-12h';
    if (hours <= 24) return '12-24h';
    if (hours <= 48) return '24-48h';
    return '>48h';
  }

  /**
   * Calculate monitoring priority
   */
  private calculateMonitoringPriority(
    player: PlayerFlagData,
    flagEvent: FlagChangeEvent | null,
    projectedImpact: FlagChangeAnalysis['projected_impact']
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!flagEvent) {
      return 'low'; // No flag change
    }

    // High ownership players get higher priority
    let priority = 0;
    if (player.ownership_percentage > 20) priority += 3;
    else if (player.ownership_percentage > 10) priority += 2;
    else if (player.ownership_percentage > 5) priority += 1;

    // Flag change severity
    switch (flagEvent.impact_severity) {
      case 'critical': priority += 4; break;
      case 'high': priority += 3; break;
      case 'medium': priority += 2; break;
      case 'low': priority += 1; break;
    }

    // Price change probability
    if (projectedImpact.price_change_probability > 0.6) priority += 2;
    else if (projectedImpact.price_change_probability > 0.3) priority += 1;

    if (priority >= 7) return 'critical';
    if (priority >= 5) return 'high';
    if (priority >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get flag change lock status for player
   */
  public async getFlagLockStatus(playerId: number): Promise<EnhancedFPLResponse<{
    is_locked: boolean;
    lock_expires_at?: string;
    reason?: string;
    remaining_hours?: number;
  }>> {
    try {
      // In production, this would query the database for flag change history
      // For now, we'll return a mock response
      const mockFlagData: PlayerFlagData = {
        id: playerId,
        web_name: 'Mock Player',
        current_flag: 'none',
        previous_flag: 'red',
        flag_change_timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        news: '',
        chance_of_playing_this_round: 100,
        chance_of_playing_next_round: 100,
        ownership_percentage: 15,
        transfers_in_event: 50000,
        transfers_out_event: 80000,
        last_flag_check: new Date().toISOString(),
      };

      const flagEvent = this.detectFlagChange(mockFlagData);
      const adjustments = this.calculateFlagAdjustments(mockFlagData, flagEvent);

      let remainingHours = 0;
      if (adjustments.price_change_locked && adjustments.lock_expires_at) {
        const lockExpiry = new Date(adjustments.lock_expires_at);
        remainingHours = Math.max(0, (lockExpiry.getTime() - Date.now()) / (1000 * 60 * 60));
      }

      return {
        success: true,
        data: {
          is_locked: adjustments.price_change_locked,
          lock_expires_at: adjustments.lock_expires_at,
          reason: flagEvent ? `Flag change from ${flagEvent.from_flag} to ${flagEvent.to_flag}` : undefined,
          remaining_hours: remainingHours > 0 ? Math.round(remainingHours * 10) / 10 : undefined,
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to get flag lock status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FlagChangeHandlerService',
        'getFlagLockStatus',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update flag change rules based on new observations
   */
  public async updateFlagRules(
    observations: Array<{
      player_id: number;
      flag_change: string;
      actual_lock_duration: number;
      actual_transfer_reset: boolean;
      prediction_accuracy: number;
    }>
  ): Promise<EnhancedFPLResponse<{ updated_rules: any; accuracy_improvement: number }>> {
    try {
      // In production, this would use machine learning to update rules
      // For now, we'll simulate rule updates based on observations
      
      const updatedRules = { ...this.FLAG_RULES };
      let totalAccuracyImprovement = 0;

      for (const observation of observations) {
        const [fromFlag, toFlag] = observation.flag_change.split('_to_');
        const changeKey = observation.flag_change as keyof typeof this.FLAG_RULES.LOCK_DURATIONS;
        
        // Update lock duration if significantly different
        const currentDuration = this.FLAG_RULES.LOCK_DURATIONS[changeKey];
        const actualDuration = observation.actual_lock_duration;
        
        if (Math.abs(currentDuration - actualDuration) > 12) { // More than 12 hours difference
          updatedRules.LOCK_DURATIONS[changeKey] = Math.round((currentDuration + actualDuration) / 2);
        }
        
        // Update transfer reset rules if accuracy is low
        if (observation.prediction_accuracy < 0.8) {
          updatedRules.TRANSFER_RESET_CONDITIONS[changeKey] = observation.actual_transfer_reset;
        }
        
        totalAccuracyImprovement += Math.max(0, observation.prediction_accuracy - 0.8);
      }

      const averageAccuracyImprovement = totalAccuracyImprovement / Math.max(observations.length, 1);

      return {
        success: true,
        data: {
          updated_rules: updatedRules,
          accuracy_improvement: averageAccuracyImprovement,
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to update flag rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FlagChangeHandlerService',
        'updateFlagRules',
        error instanceof Error ? error : undefined
      );
    }
  }
}