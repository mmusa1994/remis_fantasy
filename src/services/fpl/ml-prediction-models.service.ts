import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';

/**
 * ML Prediction Models Service
 * Implements machine learning models for transfer volume prediction, gameweek carryover,
 * and threshold adjustments similar to LiveFPL's approach
 */

export interface MLPredictionInput {
  historical_transfer_patterns: TransferPattern[];
  current_gameweek: number;
  time_until_deadline: number;
  recent_performance_data: PerformanceMetrics[];
  fixture_difficulty: number;
  total_active_managers: number;
  player_data: PlayerMLData;
}

export interface TransferPattern {
  gameweek: number;
  total_transfers: number;
  wildcard_usage_percentage: number;
  average_ownership_change: number;
  price_changes_count: number;
  deadline_rush_intensity: number;
  international_break: boolean;
}

export interface PerformanceMetrics {
  player_id: number;
  gameweek: number;
  points: number;
  expected_points: number;
  form_trend: number;
  fixture_difficulty: number;
  captaincy_percentage: number;
}

export interface PlayerMLData {
  id: number;
  ownership_percentage: number;
  form_score: number;
  price: number;
  element_type: number;
  team: number;
  transfers_in_trend: number[];
  transfers_out_trend: number[];
  recent_points: number[];
  fixture_difficulty_upcoming: number[];
}

export interface MLPredictionOutput {
  predicted_transfers_in_24h: number;
  predicted_transfers_out_24h: number;
  predicted_net_transfers: number;
  confidence_score: number;
  threshold_adjustment_factor: number;
  gameweek_carryover_percentage: number;
  peak_transfer_time: string;
  model_uncertainty: number;
}

export interface CarryoverPrediction {
  discard_percentage: number;
  confidence: number;
  factors: {
    gameweek_status: number;
    transfer_volume: number;
    wildcard_impact: number;
    historical_average: number;
  };
}

export interface ThresholdAdjustment {
  rise_multiplier: number;
  fall_multiplier: number;
  confidence: number;
  reasoning: string[];
}

export class MLPredictionModelsService extends BaseFPLService {
  private static instance: MLPredictionModelsService;
  
  // ML Model weights and parameters (in production, these would be learned)
  private readonly MODEL_WEIGHTS = {
    transfer_volume: {
      historical_correlation: 0.35,
      form_impact: 0.25,
      fixture_difficulty: 0.15,
      ownership_momentum: 0.15,
      news_sentiment: 0.1,
    },
    gameweek_carryover: {
      volume_factor: 0.4,
      wildcard_factor: 0.3,
      timing_factor: 0.2,
      historical_pattern: 0.1,
    },
    threshold_adjustment: {
      transfer_velocity: 0.3,
      ownership_change: 0.25,
      form_momentum: 0.2,
      fixture_swing: 0.15,
      market_sentiment: 0.1,
    },
  };

  // Historical data for ML models (mock data - in production from database)
  private readonly HISTORICAL_DATA = {
    transfer_patterns: [
      {
        gameweek: 4,
        avg_transfers_per_player: 156000,
        wildcard_percentage: 0.18,
        carryover_rate: 0.25,
      },
      {
        gameweek: 8,
        avg_transfers_per_player: 134000,
        wildcard_percentage: 0.12,
        carryover_rate: 0.15,
      },
      {
        gameweek: 13,
        avg_transfers_per_player: 178000,
        wildcard_percentage: 0.22,
        carryover_rate: 0.3,
      },
    ],
    seasonal_trends: {
      early_season_multiplier: 1.2,
      mid_season_multiplier: 1.0,
      late_season_multiplier: 0.8,
    },
  };

  public static getInstance(): MLPredictionModelsService {
    if (!MLPredictionModelsService.instance) {
      MLPredictionModelsService.instance = new MLPredictionModelsService();
    }
    return MLPredictionModelsService.instance;
  }

  /**
   * Generate comprehensive ML predictions for player
   */
  public async generateMLPredictions(
    input: MLPredictionInput
  ): Promise<EnhancedFPLResponse<MLPredictionOutput>> {
    try {
      // 1. Predict transfer volumes
      const transferVolumePrediction = await this.predictTransferVolume(input);
      
      // 2. Predict gameweek carryover
      const carryoverPrediction = await this.predictGameweekCarryover(input);
      
      // 3. Calculate threshold adjustments
      const thresholdAdjustment = await this.calculateThresholdAdjustment(input);
      
      // 4. Predict peak transfer timing
      const peakTiming = this.predictPeakTransferTime(input);
      
      // 5. Calculate model uncertainty
      const modelUncertainty = this.calculateModelUncertainty(input);

      const mlOutput: MLPredictionOutput = {
        predicted_transfers_in_24h: transferVolumePrediction.transfers_in,
        predicted_transfers_out_24h: transferVolumePrediction.transfers_out,
        predicted_net_transfers: transferVolumePrediction.transfers_in - transferVolumePrediction.transfers_out,
        confidence_score: Math.min(transferVolumePrediction.confidence, carryoverPrediction.confidence),
        threshold_adjustment_factor: thresholdAdjustment.rise_multiplier,
        gameweek_carryover_percentage: carryoverPrediction.discard_percentage,
        peak_transfer_time: peakTiming,
        model_uncertainty: modelUncertainty,
      };

      return {
        success: true,
        data: mlOutput,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to generate ML predictions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MLPredictionModelsService',
        'generateMLPredictions',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Transfer Volume Predictor Model
   */
  public async predictTransferVolume(
    input: MLPredictionInput
  ): Promise<{ transfers_in: number; transfers_out: number; confidence: number }> {
    const player = input.player_data;
    
    // Feature extraction for ML model
    const features = {
      ownership_momentum: this.calculateOwnershipMomentum(player),
      form_trend: this.calculateFormTrend(player),
      fixture_appeal: this.calculateFixtureAppeal(player),
      price_value: this.calculatePriceValue(player),
      recent_performance: this.calculateRecentPerformance(player),
      market_sentiment: this.calculateMarketSentiment(input),
    };

    // Base prediction using historical correlation
    const baseTransfersIn = this.getHistoricalBaseline(player.ownership_percentage, 'transfers_in');
    const baseTransfersOut = this.getHistoricalBaseline(player.ownership_percentage, 'transfers_out');

    // Apply ML feature weights
    let transfersInMultiplier = 1.0;
    let transfersOutMultiplier = 1.0;

    // Ownership momentum impact
    transfersInMultiplier += features.ownership_momentum * this.MODEL_WEIGHTS.transfer_volume.ownership_momentum;
    transfersOutMultiplier -= features.ownership_momentum * this.MODEL_WEIGHTS.transfer_volume.ownership_momentum;

    // Form trend impact
    transfersInMultiplier += features.form_trend * this.MODEL_WEIGHTS.transfer_volume.form_impact;
    transfersOutMultiplier -= features.form_trend * this.MODEL_WEIGHTS.transfer_volume.form_impact;

    // Fixture difficulty impact
    transfersInMultiplier += features.fixture_appeal * this.MODEL_WEIGHTS.transfer_volume.fixture_difficulty;
    transfersOutMultiplier -= features.fixture_appeal * this.MODEL_WEIGHTS.transfer_volume.fixture_difficulty;

    // Apply seasonal adjustments
    const seasonalMultiplier = this.getSeasonalMultiplier(input.current_gameweek);
    transfersInMultiplier *= seasonalMultiplier;
    transfersOutMultiplier *= seasonalMultiplier;

    // Calculate final predictions
    const predictedTransfersIn = Math.round(baseTransfersIn * Math.max(0.1, transfersInMultiplier));
    const predictedTransfersOut = Math.round(baseTransfersOut * Math.max(0.1, transfersOutMultiplier));

    // Calculate confidence based on feature reliability
    const confidence = this.calculateTransferVolumeConfidence(features, input);

    return {
      transfers_in: predictedTransfersIn,
      transfers_out: predictedTransfersOut,
      confidence,
    };
  }

  /**
   * Gameweek Carryover Model
   */
  public async predictGameweekCarryover(
    input: MLPredictionInput
  ): Promise<CarryoverPrediction> {
    const factors = {
      gameweek_status: this.calculateGameweekStatusFactor(input),
      transfer_volume: this.calculateTransferVolumeFactor(input),
      wildcard_impact: this.calculateWildcardImpactFactor(input),
      historical_average: this.getHistoricalCarryoverRate(input.current_gameweek),
    };

    // ML model calculation
    let discardPercentage = factors.historical_average;

    // Apply weighted factors
    discardPercentage += 
      factors.gameweek_status * this.MODEL_WEIGHTS.gameweek_carryover.timing_factor +
      factors.transfer_volume * this.MODEL_WEIGHTS.gameweek_carryover.volume_factor +
      factors.wildcard_impact * this.MODEL_WEIGHTS.gameweek_carryover.wildcard_factor;

    // Ensure reasonable bounds
    discardPercentage = Math.max(0.05, Math.min(0.45, discardPercentage));

    const confidence = this.calculateCarryoverConfidence(factors);

    return {
      discard_percentage: discardPercentage,
      confidence,
      factors,
    };
  }

  /**
   * Threshold Adjustment Calculator
   */
  public async calculateThresholdAdjustment(
    input: MLPredictionInput
  ): Promise<ThresholdAdjustment> {
    const player = input.player_data;
    const reasoning: string[] = [];

    let riseMultiplier = 1.0;
    let fallMultiplier = 1.0;

    // Transfer velocity adjustment
    const transferVelocity = this.calculateTransferVelocity(player);
    if (transferVelocity > 1.5) {
      riseMultiplier *= 0.9; // Easier to rise with high velocity
      reasoning.push('High transfer velocity detected');
    } else if (transferVelocity < 0.5) {
      riseMultiplier *= 1.1; // Harder to rise with low velocity
      reasoning.push('Low transfer velocity detected');
    }

    // Ownership change momentum
    const ownershipMomentum = this.calculateOwnershipMomentum(player);
    if (Math.abs(ownershipMomentum) > 0.3) {
      const adjustment = 1 - (ownershipMomentum * 0.2);
      riseMultiplier *= adjustment;
      fallMultiplier *= (2 - adjustment);
      reasoning.push('Strong ownership momentum detected');
    }

    // Form momentum impact
    const formMomentum = this.calculateFormMomentum(player);
    if (formMomentum > 0.2) {
      riseMultiplier *= 0.95; // Good form makes rises easier
      fallMultiplier *= 1.1;  // Good form makes falls harder
      reasoning.push('Positive form momentum');
    } else if (formMomentum < -0.2) {
      riseMultiplier *= 1.05; // Poor form makes rises harder
      fallMultiplier *= 0.9;  // Poor form makes falls easier
      reasoning.push('Negative form momentum');
    }

    // Fixture swing analysis
    const fixtureDifficultyChange = this.calculateFixtureDifficultyChange(player);
    if (Math.abs(fixtureDifficultyChange) > 1) {
      const adjustment = 1 - (fixtureDifficultyChange * 0.1);
      riseMultiplier *= adjustment;
      reasoning.push(`Fixture difficulty ${fixtureDifficultyChange > 0 ? 'increase' : 'decrease'}`);
    }

    // Market sentiment (simplified)
    const marketSentiment = this.calculateMarketSentiment(input);
    if (Math.abs(marketSentiment) > 0.2) {
      riseMultiplier *= (1 + marketSentiment * 0.1);
      fallMultiplier *= (1 - marketSentiment * 0.1);
      reasoning.push(`Market sentiment: ${marketSentiment > 0 ? 'positive' : 'negative'}`);
    }

    const confidence = this.calculateThresholdAdjustmentConfidence(
      transferVelocity,
      ownershipMomentum,
      formMomentum,
      marketSentiment
    );

    return {
      rise_multiplier: Math.max(0.7, Math.min(1.3, riseMultiplier)),
      fall_multiplier: Math.max(0.7, Math.min(1.3, fallMultiplier)),
      confidence,
      reasoning,
    };
  }

  // Helper methods for ML calculations

  private calculateOwnershipMomentum(player: PlayerMLData): number {
    if (player.transfers_in_trend.length < 3) return 0;
    
    const recent = player.transfers_in_trend.slice(-3);
    const trend = (recent[2] - recent[0]) / Math.max(recent[0], 1);
    return Math.max(-1, Math.min(1, trend));
  }

  private calculateFormTrend(player: PlayerMLData): number {
    if (player.recent_points.length < 3) return 0;
    
    const recentAvg = player.recent_points.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousAvg = player.recent_points.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    
    return Math.max(-1, Math.min(1, (recentAvg - previousAvg) / 10));
  }

  private calculateFixtureAppeal(player: PlayerMLData): number {
    if (player.fixture_difficulty_upcoming.length === 0) return 0;
    
    const avgDifficulty = player.fixture_difficulty_upcoming.reduce((a, b) => a + b, 0) / player.fixture_difficulty_upcoming.length;
    return Math.max(-1, Math.min(1, (3 - avgDifficulty) / 2)); // 3 is neutral difficulty
  }

  private calculatePriceValue(player: PlayerMLData): number {
    const expectedPrice = this.getExpectedPriceForPoints(player.recent_points, player.element_type);
    return Math.max(-1, Math.min(1, (expectedPrice - player.price) / player.price));
  }

  private calculateRecentPerformance(player: PlayerMLData): number {
    if (player.recent_points.length === 0) return 0;
    
    const recentAvg = player.recent_points.slice(-4).reduce((a, b) => a + b, 0) / 4;
    const seasonalExpected = this.getSeasonalExpectedPoints(player.element_type);
    
    return Math.max(-1, Math.min(1, (recentAvg - seasonalExpected) / seasonalExpected));
  }

  private calculateMarketSentiment(input: MLPredictionInput): number {
    // Simplified market sentiment calculation
    const totalTransfers = input.historical_transfer_patterns.slice(-1)[0]?.total_transfers || 5000000;
    const avgTransfers = 5000000; // Historical average
    
    return Math.max(-0.5, Math.min(0.5, (totalTransfers - avgTransfers) / avgTransfers));
  }

  private getHistoricalBaseline(ownership: number, type: 'transfers_in' | 'transfers_out'): number {
    const totalManagers = 11000000;
    const ownedByManagers = (ownership / 100) * totalManagers;
    
    if (type === 'transfers_in') {
      // Base transfer in rate: ~2% of non-owners per day
      const nonOwners = totalManagers - ownedByManagers;
      return nonOwners * 0.02;
    } else {
      // Base transfer out rate: ~1% of owners per day
      return ownedByManagers * 0.01;
    }
  }

  private getSeasonalMultiplier(gameweek: number): number {
    if (gameweek <= 8) {
      return this.HISTORICAL_DATA.seasonal_trends.early_season_multiplier;
    } else if (gameweek <= 28) {
      return this.HISTORICAL_DATA.seasonal_trends.mid_season_multiplier;
    } else {
      return this.HISTORICAL_DATA.seasonal_trends.late_season_multiplier;
    }
  }

  private calculateTransferVolumeConfidence(features: any, input: MLPredictionInput): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for extreme values
    if (Math.abs(features.ownership_momentum) > 0.8) confidence -= 0.1;
    if (Math.abs(features.form_trend) > 0.8) confidence -= 0.05;
    
    // Increase confidence for stable patterns
    if (input.historical_transfer_patterns.length >= 5) confidence += 0.05;
    
    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private calculateGameweekStatusFactor(input: MLPredictionInput): number {
    const hoursUntilDeadline = input.time_until_deadline;
    
    if (hoursUntilDeadline < 6) return 0.4;  // High carryover near deadline
    if (hoursUntilDeadline < 24) return 0.2; // Medium carryover day before
    if (hoursUntilDeadline < 72) return 0.1; // Low carryover early week
    return 0.05; // Very low carryover start of week
  }

  private calculateTransferVolumeFactor(input: MLPredictionInput): number {
    const recentPattern = input.historical_transfer_patterns.slice(-1)[0];
    if (!recentPattern) return 0;
    
    const avgTransfers = 5000000;
    const volumeRatio = recentPattern.total_transfers / avgTransfers;
    
    return Math.max(-0.2, Math.min(0.2, (volumeRatio - 1) * 0.2));
  }

  private calculateWildcardImpactFactor(input: MLPredictionInput): number {
    const recentPattern = input.historical_transfer_patterns.slice(-1)[0];
    if (!recentPattern) return 0;
    
    const wildcardPercentage = recentPattern.wildcard_usage_percentage || 0;
    return Math.min(0.3, wildcardPercentage * 1.5); // Higher wildcard usage = higher carryover
  }

  private getHistoricalCarryoverRate(gameweek: number): number {
    const historicalRate = this.HISTORICAL_DATA.transfer_patterns.find(p => p.gameweek === gameweek)?.carryover_rate;
    return historicalRate || 0.15; // Default 15% carryover
  }

  private calculateCarryoverConfidence(factors: any): number {
    let confidence = 0.75; // Base confidence

    // Higher confidence if all factors align
    const factorVariance = Object.values(factors).reduce((sum: number, val: any) => {
      return sum + Math.abs(val - 0.15);
    }, 0) / Object.keys(factors).length;

    confidence += (0.15 - factorVariance) * 2; // Reward consistent factors
    
    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private calculateTransferVelocity(player: PlayerMLData): number {
    const recentTransfers = player.transfers_in_trend.slice(-2);
    if (recentTransfers.length < 2) return 1;
    
    return recentTransfers[1] / Math.max(recentTransfers[0], 1);
  }

  private calculateFormMomentum(player: PlayerMLData): number {
    if (player.recent_points.length < 4) return 0;
    
    const recent = player.recent_points.slice(-2);
    const previous = player.recent_points.slice(-4, -2);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    return Math.max(-1, Math.min(1, (recentAvg - previousAvg) / 10));
  }

  private calculateFixtureDifficultyChange(player: PlayerMLData): number {
    if (player.fixture_difficulty_upcoming.length < 2) return 0;
    
    const nextFixture = player.fixture_difficulty_upcoming[0];
    const avgUpcoming = player.fixture_difficulty_upcoming.reduce((a, b) => a + b, 0) / player.fixture_difficulty_upcoming.length;
    
    return nextFixture - avgUpcoming;
  }

  private calculateThresholdAdjustmentConfidence(
    transferVelocity: number,
    ownershipMomentum: number,
    formMomentum: number,
    marketSentiment: number
  ): number {
    // Higher confidence when all indicators align
    const indicators = [transferVelocity - 1, ownershipMomentum, formMomentum, marketSentiment];
    const alignment = indicators.reduce((sum, indicator, index) => {
      return sum + indicators.slice(index + 1).reduce((innerSum, otherIndicator) => {
        return innerSum + (Math.sign(indicator) === Math.sign(otherIndicator) ? 1 : 0);
      }, 0);
    }, 0);
    
    const maxAlignment = (indicators.length * (indicators.length - 1)) / 2;
    return 0.6 + (alignment / maxAlignment) * 0.3;
  }

  private predictPeakTransferTime(input: MLPredictionInput): string {
    const hoursUntilDeadline = input.time_until_deadline;
    
    // Peak times based on historical patterns
    if (hoursUntilDeadline > 72) return 'Weekend';
    if (hoursUntilDeadline > 24) return 'Tuesday Evening';
    if (hoursUntilDeadline > 6) return 'Friday Morning';
    return 'Deadline Rush';
  }

  private calculateModelUncertainty(input: MLPredictionInput): number {
    let uncertainty = 0.1; // Base uncertainty
    
    // Increase uncertainty for edge cases
    if (input.player_data.ownership_percentage > 40) uncertainty += 0.05;
    if (input.player_data.ownership_percentage < 2) uncertainty += 0.1;
    if (input.historical_transfer_patterns.length < 3) uncertainty += 0.1;
    
    return Math.min(0.5, uncertainty);
  }

  private getExpectedPriceForPoints(points: number[], elementType: number): number {
    const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
    
    // Simplified price expectation based on position
    const basePrice = elementType === 1 ? 45 : elementType === 2 ? 45 : elementType === 3 ? 55 : 65;
    return basePrice + (avgPoints - 2) * 5;
  }

  private getSeasonalExpectedPoints(elementType: number): number {
    // Average expected points per gameweek by position
    const expectedPoints = { 1: 2.5, 2: 3.0, 3: 3.5, 4: 4.0 };
    return expectedPoints[elementType as keyof typeof expectedPoints] || 3.0;
  }
}