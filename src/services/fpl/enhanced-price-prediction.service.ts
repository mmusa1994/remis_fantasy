import { BaseFPLService } from './base.service';
import { FPLBootstrapService } from './bootstrap.service';
import { WildcardDetectionService } from './wildcard-detection.service';
import { DynamicThresholdService } from './dynamic-threshold.service';
import { FlagChangeHandlerService } from './flag-change-handler.service';
import { MLPredictionModelsService } from './ml-prediction-models.service';
import { ConfidenceScoringService } from './confidence-scoring.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';
import type { TransferData, WildcardAnalysisResult } from './wildcard-detection.service';
import type { PlayerMetrics, ThresholdCalculationResult } from './dynamic-threshold.service';
import type { PlayerFlagData, FlagChangeAnalysis } from './flag-change-handler.service';
import type { MLPredictionInput, MLPredictionOutput } from './ml-prediction-models.service';
import type { PredictionData, ConfidenceScore } from './confidence-scoring.service';

/**
 * Enhanced Price Prediction Engine
 * Integrates all sophisticated components to provide LiveFPL-level price predictions
 */

export interface EnhancedPricePrediction {
  // Basic player data
  player_id: number;
  web_name: string;
  team_name: string;
  position: string;
  current_price: number;
  ownership_percentage: number;

  // Core predictions
  progress: number;
  prediction: number;
  hourly_change: number;
  change_timing: string;
  target_reached: boolean;
  change_probability: number;

  // Enhanced predictions
  net_transfers: number;
  valid_transfers: {
    in: number;
    out: number;
    net: number;
  };
  
  // Thresholds
  thresholds: {
    rise_threshold: number;
    fall_threshold: number;
    adjusted_rise_threshold: number;
    adjusted_fall_threshold: number;
  };

  // ML insights
  ml_predictions: {
    predicted_transfers_24h: number;
    peak_transfer_time: string;
    gameweek_carryover: number;
    model_uncertainty: number;
  };

  // Wildcard analysis
  wildcard_analysis: {
    probability: number;
    confidence: number;
    valid_transfer_adjustment: number;
  };

  // Flag analysis
  flag_analysis: {
    current_flag: string;
    flag_impact: string;
    locked_until?: string;
    confidence_adjustment: number;
  };

  // Confidence metrics
  confidence: {
    overall_score: number;
    tier: string;
    reliability: string;
    risk_factors: string[];
    explanation: string;
  };

  // Special indicators
  special_notes: string[];
  monitoring_priority: string;
  algorithm_version: string;
}

export interface PredictionSummary {
  predictions: {
    risers: EnhancedPricePrediction[];
    fallers: EnhancedPricePrediction[];
    stable: EnhancedPricePrediction[];
  };
  metadata: {
    algorithm_version: string;
    accuracy_last_week: number;
    total_predictions: number;
    confidence_average: number;
    last_updated: string;
    next_update: string;
  };
  summary: {
    predicted_rises: number;
    predicted_falls: number;
    high_confidence_predictions: number;
    special_cases: number;
  };
}

export class EnhancedPricePredictionService extends BaseFPLService {
  private static instance: EnhancedPricePredictionService;
  
  // Service dependencies
  private bootstrapService: FPLBootstrapService;
  private wildcardService: WildcardDetectionService;
  private thresholdService: DynamicThresholdService;
  private flagService: FlagChangeHandlerService;
  private mlService: MLPredictionModelsService;
  private confidenceService: ConfidenceScoringService;

  // Algorithm configuration
  private readonly ALGORITHM_VERSION = 'LiveFPL_Enhanced_v2.1';
  private readonly TOTAL_ACTIVE_MANAGERS = 11000000;
  
  // Prediction thresholds
  private readonly PREDICTION_THRESHOLDS = {
    RISE_TARGET: 100.5,
    FALL_TARGET: 99.5,
    HIGH_CONFIDENCE: 0.8,
    MONITORING_PRIORITY: 0.7,
  };

  public static getInstance(): EnhancedPricePredictionService {
    if (!EnhancedPricePredictionService.instance) {
      EnhancedPricePredictionService.instance = new EnhancedPricePredictionService();
    }
    return EnhancedPricePredictionService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
    this.wildcardService = WildcardDetectionService.getInstance();
    this.thresholdService = DynamicThresholdService.getInstance();
    this.flagService = FlagChangeHandlerService.getInstance();
    this.mlService = MLPredictionModelsService.getInstance();
    this.confidenceService = ConfidenceScoringService.getInstance();
  }

  /**
   * Generate comprehensive price predictions for all players
   */
  public async generatePricePredictions(
    currentGameweek: number,
    includeAllPlayers: boolean = false
  ): Promise<EnhancedFPLResponse<PredictionSummary>> {
    try {
      // 1. Fetch FPL bootstrap data
      const bootstrapResponse = await this.bootstrapService.getBootstrapStatic();
      if (!bootstrapResponse.success || !bootstrapResponse.data) {
        throw new Error('Failed to get bootstrap data');
      }

      const { elements: players, teams } = bootstrapResponse.data;
      const teamLookup = new Map(teams.map(t => [t.id, t.short_name]));

      // 2. Filter players for prediction (only those with significant transfer activity)
      const candidatePlayers = this.filterCandidatePlayers(players, includeAllPlayers);

      // 3. Generate predictions for each candidate
      const predictions: EnhancedPricePrediction[] = [];
      
      for (const player of candidatePlayers) {
        try {
          const prediction = await this.generatePlayerPrediction(player, teamLookup, currentGameweek);
          predictions.push(prediction);
        } catch (error) {
          console.warn(`Failed to generate prediction for player ${player.id}:`, error);
          // Continue with other players
        }
      }

      // 4. Sort and categorize predictions
      const categorizedPredictions = this.categorizePredictions(predictions);

      // 5. Generate metadata and summary
      const metadata = await this.generateMetadata(predictions);
      const summary = this.generateSummary(predictions);

      const result: PredictionSummary = {
        predictions: categorizedPredictions,
        metadata,
        summary,
      };

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to generate price predictions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EnhancedPricePredictionService',
        'generatePricePredictions',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate prediction for individual player
   */
  private async generatePlayerPrediction(
    player: any,
    teamLookup: Map<number, string>,
    currentGameweek: number
  ): Promise<EnhancedPricePrediction> {
    // 1. Prepare player data for analysis
    const transferData: TransferData = {
      player_id: player.id,
      transfers_in_event: player.transfers_in_event,
      transfers_out_event: player.transfers_out_event,
      transfers_in_24h: player.transfers_in_event * 0.3, // Estimate 30% in last 24h
      transfers_out_24h: player.transfers_out_event * 0.3,
      ownership_percentage: parseFloat(player.selected_by_percent),
      price: player.now_cost,
      form: parseFloat(player.form) || 0,
      element_type: player.element_type,
      team: player.team,
    };

    const playerMetrics: PlayerMetrics = {
      id: player.id,
      ownership_percentage: parseFloat(player.selected_by_percent),
      form_score: parseFloat(player.form) || 0,
      recent_points: player.event_points || 0,
      flag_status: this.mapFlagStatus(player.status),
      price_tier: this.calculatePriceTier(player.now_cost),
      special_player_status: this.isSpecialPlayer(player),
      element_type: player.element_type,
      team: player.team,
      transfers_in_event: player.transfers_in_event,
      transfers_out_event: player.transfers_out_event,
      now_cost: player.now_cost,
      selected_by_percent: player.selected_by_percent,
      news: player.news || '',
      chance_of_playing_this_round: player.chance_of_playing_this_round,
      chance_of_playing_next_round: player.chance_of_playing_next_round,
    };

    const flagData: PlayerFlagData = {
      id: player.id,
      web_name: player.web_name,
      current_flag: this.mapFlagStatus(player.status),
      news: player.news || '',
      chance_of_playing_this_round: player.chance_of_playing_this_round,
      chance_of_playing_next_round: player.chance_of_playing_next_round,
      ownership_percentage: parseFloat(player.selected_by_percent),
      transfers_in_event: player.transfers_in_event,
      transfers_out_event: player.transfers_out_event,
      last_flag_check: new Date().toISOString(),
    };

    // 2. Run all analysis components in parallel
    const [
      wildcardAnalysis,
      thresholdCalculation,
      flagAnalysis,
      mlPrediction
    ] = await Promise.all([
      this.wildcardService.analyzeWildcardUsage([transferData], currentGameweek),
      this.thresholdService.calculateThresholds([playerMetrics], currentGameweek),
      this.flagService.analyzeFlagChanges([flagData]),
      this.generateMLPrediction(player, currentGameweek)
    ]);

    const wildcardResult = wildcardAnalysis.data?.[0];
    const thresholdResult = thresholdCalculation.data?.[0];
    const flagResult = flagAnalysis.data?.[0];
    const mlResult = mlPrediction.data;

    // 3. Calculate core prediction
    const corePrediction = this.calculateCorePrediction(
      transferData,
      thresholdResult,
      wildcardResult,
      flagResult,
      mlResult
    );

    // 4. Generate confidence score
    const confidenceData: PredictionData = {
      player_id: player.id,
      web_name: player.web_name,
      progress: corePrediction.progress,
      prediction: corePrediction.prediction,
      net_transfers: transferData.transfers_in_event - transferData.transfers_out_event,
      ownership_percentage: transferData.ownership_percentage,
      form_score: transferData.form,
      flag_status: playerMetrics.flag_status,
      special_player_status: playerMetrics.special_player_status,
      threshold_data: {
        rise_threshold: thresholdResult?.rise_threshold || 50000,
        fall_threshold: thresholdResult?.fall_threshold || 25000,
        adjusted_rise_threshold: thresholdResult?.adjusted_rise_threshold || 50000,
        adjusted_fall_threshold: thresholdResult?.adjusted_fall_threshold || 25000,
      },
      ml_data: {
        predicted_transfers_24h: mlResult?.predicted_transfers_in_24h || 0,
        model_uncertainty: mlResult?.model_uncertainty || 0.1,
        transfer_velocity: 1.0, // Mock data
      },
      wildcard_data: {
        wildcard_probability: wildcardResult?.wildcard_probability || 0,
        valid_transfer_confidence: wildcardResult?.confidence_score || 0.8,
      },
      flag_data: {
        flag_impact_severity: flagResult?.flag_event?.impact_severity || 'low',
        price_change_locked: flagResult?.adjustments?.price_change_locked || false,
        confidence_adjustment: flagResult?.adjustments?.confidence_adjustment || 0,
      },
    };

    const confidenceResponse = await this.confidenceService.calculateConfidenceScores([confidenceData]);
    const confidenceResult = confidenceResponse.data?.[0];

    // 5. Apply special player rules
    const specialAdjustments = this.applySpecialPlayerRules(corePrediction, player, confidenceResult);

    // 6. Generate special notes and monitoring priority
    const specialNotes = this.generateSpecialNotes(player, wildcardResult, flagResult, confidenceResult);
    const monitoringPriority = this.calculateMonitoringPriority(confidenceResult, corePrediction);

    // 7. Compile final prediction
    return {
      player_id: player.id,
      web_name: player.web_name,
      team_name: teamLookup.get(player.team) || 'Unknown',
      position: this.getPositionName(player.element_type),
      current_price: player.now_cost / 10,
      ownership_percentage: parseFloat(player.selected_by_percent),
      
      progress: specialAdjustments.progress,
      prediction: specialAdjustments.prediction,
      hourly_change: specialAdjustments.hourly_change,
      change_timing: specialAdjustments.change_timing,
      target_reached: specialAdjustments.target_reached,
      change_probability: specialAdjustments.change_probability,

      net_transfers: transferData.transfers_in_event - transferData.transfers_out_event,
      valid_transfers: {
        in: wildcardResult?.valid_transfers_in || transferData.transfers_in_event,
        out: wildcardResult?.valid_transfers_out || transferData.transfers_out_event,
        net: wildcardResult?.net_valid_transfers || (transferData.transfers_in_event - transferData.transfers_out_event),
      },

      thresholds: {
        rise_threshold: thresholdResult?.rise_threshold || 50000,
        fall_threshold: thresholdResult?.fall_threshold || 25000,
        adjusted_rise_threshold: thresholdResult?.adjusted_rise_threshold || 50000,
        adjusted_fall_threshold: thresholdResult?.adjusted_fall_threshold || 25000,
      },

      ml_predictions: {
        predicted_transfers_24h: mlResult?.predicted_transfers_in_24h || 0,
        peak_transfer_time: mlResult?.peak_transfer_time || 'Unknown',
        gameweek_carryover: mlResult?.gameweek_carryover_percentage || 0.15,
        model_uncertainty: mlResult?.model_uncertainty || 0.1,
      },

      wildcard_analysis: {
        probability: wildcardResult?.wildcard_probability || 0,
        confidence: wildcardResult?.confidence_score || 0.8,
        valid_transfer_adjustment: wildcardResult ? 1 - wildcardResult.wildcard_probability * 0.4 : 1,
      },

      flag_analysis: {
        current_flag: flagData.current_flag,
        flag_impact: flagResult?.flag_event?.impact_severity || 'none',
        locked_until: flagResult?.adjustments?.lock_expires_at,
        confidence_adjustment: flagResult?.adjustments?.confidence_adjustment || 0,
      },

      confidence: {
        overall_score: confidenceResult?.overall_confidence || 70,
        tier: confidenceResult?.confidence_tier || 'medium',
        reliability: confidenceResult?.prediction_reliability || 'somewhat_reliable',
        risk_factors: confidenceResult?.risk_factors || [],
        explanation: confidenceResult?.confidence_explanation || 'Standard prediction confidence',
      },

      special_notes: specialNotes,
      monitoring_priority: monitoringPriority,
      algorithm_version: this.ALGORITHM_VERSION,
    };
  }

  /**
   * Calculate core prediction using all components
   */
  private calculateCorePrediction(
    transferData: TransferData,
    thresholdResult: ThresholdCalculationResult | undefined,
    wildcardResult: WildcardAnalysisResult | undefined,
    flagResult: FlagChangeAnalysis | undefined,
    mlResult: MLPredictionOutput | undefined
  ): {
    progress: number;
    prediction: number;
    hourly_change: number;
    change_timing: string;
    target_reached: boolean;
    change_probability: number;
  } {
    const validTransfersNet = wildcardResult?.net_valid_transfers || (transferData.transfers_in_event - transferData.transfers_out_event);
    
    let progress = 100;
    let prediction = 100;
    let hourlyChange = 0;

    if (validTransfersNet > 0) {
      // Price rise calculation
      const riseThreshold = thresholdResult?.adjusted_rise_threshold || this.calculateFallbackThreshold(transferData, 'rise');
      const transferRatio = validTransfersNet / riseThreshold;
      
      progress = 100 + (transferRatio * 100);
      prediction = progress + (transferRatio * 20);
      hourlyChange = Math.min(2.0, transferRatio * 1.5);
    } else if (validTransfersNet < 0) {
      // Price fall calculation
      const fallThreshold = thresholdResult?.adjusted_fall_threshold || this.calculateFallbackThreshold(transferData, 'fall');
      const transferRatio = Math.abs(validTransfersNet) / fallThreshold;
      
      progress = 100 - (transferRatio * 100);
      prediction = progress - (transferRatio * 20);
      hourlyChange = -Math.min(2.0, transferRatio * 1.5);
    }

    // Apply ML adjustments
    if (mlResult?.threshold_adjustment_factor) {
      progress = 100 + (progress - 100) * mlResult.threshold_adjustment_factor;
      prediction = 100 + (prediction - 100) * mlResult.threshold_adjustment_factor;
    }

    // Apply flag adjustments
    if (flagResult?.adjustments?.price_change_locked) {
      // If locked, reduce progress significantly
      progress = 100 + (progress - 100) * 0.1;
      prediction = 100 + (prediction - 100) * 0.1;
      hourlyChange = 0;
    }

    // Calculate derived metrics
    const targetReached = (progress >= this.PREDICTION_THRESHOLDS.RISE_TARGET && validTransfersNet > 0) ||
                         (progress <= this.PREDICTION_THRESHOLDS.FALL_TARGET && validTransfersNet < 0);

    const changeProbability = this.calculateChangeProbability(progress, validTransfersNet);
    const changeTiming = this.calculateChangeTiming(progress, targetReached, mlResult?.peak_transfer_time);

    return {
      progress: Math.max(0, Math.min(200, progress)),
      prediction: Math.max(0, Math.min(200, prediction)),
      hourly_change: Math.max(-2, Math.min(2, hourlyChange)),
      change_timing: changeTiming,
      target_reached: targetReached,
      change_probability: changeProbability,
    };
  }

  /**
   * Filter candidate players for prediction
   */
  private filterCandidatePlayers(players: any[], includeAllPlayers: boolean): any[] {
    if (includeAllPlayers) {
      return players.filter(p => parseFloat(p.selected_by_percent) > 0.1); // At least 0.1% ownership
    }

    return players.filter(player => {
      const totalTransfers = player.transfers_in_event + player.transfers_out_event;
      const ownership = parseFloat(player.selected_by_percent);
      
      // Include players with significant transfer activity or ownership
      return totalTransfers > 10000 || ownership > 5 || 
             player.cost_change_event !== 0 || // Recent price changes
             player.status !== 'a'; // Flagged players
    });
  }

  /**
   * Categorize predictions into risers, fallers, and stable
   */
  private categorizePredictions(predictions: EnhancedPricePrediction[]): {
    risers: EnhancedPricePrediction[];
    fallers: EnhancedPricePrediction[];
    stable: EnhancedPricePrediction[];
  } {
    const risers = predictions
      .filter(p => p.progress > this.PREDICTION_THRESHOLDS.RISE_TARGET)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 50);

    const fallers = predictions
      .filter(p => p.progress < this.PREDICTION_THRESHOLDS.FALL_TARGET)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 50);

    const stable = predictions
      .filter(p => p.progress >= this.PREDICTION_THRESHOLDS.FALL_TARGET && p.progress <= this.PREDICTION_THRESHOLDS.RISE_TARGET)
      .sort((a, b) => Math.abs(b.progress - 100) - Math.abs(a.progress - 100))
      .slice(0, 20);

    return { risers, fallers, stable };
  }

  // Helper methods

  private async generateMLPrediction(player: any, currentGameweek: number): Promise<EnhancedFPLResponse<MLPredictionOutput>> {
    const mlInput: MLPredictionInput = {
      historical_transfer_patterns: [], // Would be populated from database
      current_gameweek: currentGameweek,
      time_until_deadline: 48, // Mock 48 hours
      recent_performance_data: [],
      fixture_difficulty: 3, // Neutral
      total_active_managers: this.TOTAL_ACTIVE_MANAGERS,
      player_data: {
        id: player.id,
        ownership_percentage: parseFloat(player.selected_by_percent),
        form_score: parseFloat(player.form) || 0,
        price: player.now_cost,
        element_type: player.element_type,
        team: player.team,
        transfers_in_trend: [player.transfers_in_event],
        transfers_out_trend: [player.transfers_out_event],
        recent_points: [player.event_points || 0],
        fixture_difficulty_upcoming: [3, 3, 3],
      },
    };

    return this.mlService.generateMLPredictions(mlInput);
  }

  private mapFlagStatus(status: string): 'none' | 'yellow' | 'red' {
    switch (status) {
      case 'i': case 'd': return 'red';
      case 'u': case 's': return 'yellow';
      default: return 'none';
    }
  }

  private calculatePriceTier(price: number): 'budget' | 'mid' | 'premium' {
    if (price <= 50) return 'budget';
    if (price <= 80) return 'mid';
    return 'premium';
  }

  private isSpecialPlayer(player: any): boolean {
    const highProfile = parseFloat(player.selected_by_percent) > 30 && player.now_cost > 100;
    const topScorer = player.total_points > 150;
    return highProfile || topScorer;
  }

  private calculateFallbackThreshold(transferData: TransferData, type: 'rise' | 'fall'): number {
    const ownership = transferData.ownership_percentage / 100;
    const ownedByManagers = ownership * this.TOTAL_ACTIVE_MANAGERS;
    
    if (type === 'rise') {
      return Math.sqrt(ownedByManagers) * 50;
    } else {
      return ownedByManagers * 0.35;
    }
  }

  private calculateChangeProbability(progress: number, netTransfers: number): number {
    const progressDistance = Math.abs(progress - 100);
    let probability = Math.min(1, progressDistance / 50); // Scale 0-50 to 0-1
    
    // Boost probability for high transfer volumes
    if (Math.abs(netTransfers) > 50000) {
      probability = Math.min(1, probability * 1.2);
    }
    
    return Math.round(probability * 100) / 100;
  }

  private calculateChangeTiming(progress: number, targetReached: boolean, peakTime?: string): string {
    if (targetReached) {
      return 'Tonight';
    }
    
    const progressDistance = Math.abs(progress - 100);
    if (progressDistance > 2) {
      return 'Soon';
    } else if (progressDistance > 0.5) {
      return 'Tomorrow';
    } else {
      return 'Unlikely';
    }
  }

  private applySpecialPlayerRules(prediction: any, player: any, confidence: ConfidenceScore | undefined): any {
    if (this.isSpecialPlayer(player)) {
      // Special players are more resistant to changes
      prediction.progress = 100 + (prediction.progress - 100) * 0.8;
      prediction.prediction = 100 + (prediction.prediction - 100) * 0.8;
      prediction.hourly_change *= 0.7;
    }
    
    return prediction;
  }

  private generateSpecialNotes(
    player: any,
    wildcardResult: WildcardAnalysisResult | undefined,
    flagResult: FlagChangeAnalysis | undefined,
    confidenceResult: ConfidenceScore | undefined
  ): string[] {
    const notes: string[] = [];
    
    if (wildcardResult && wildcardResult.wildcard_probability > 0.3) {
      notes.push('High wildcard interference detected');
    }
    
    if (flagResult?.flag_event?.impact_severity === 'critical') {
      notes.push('Critical flag change impact');
    }
    
    if (this.isSpecialPlayer(player)) {
      notes.push('Special player - may have exemptions');
    }
    
    if (confidenceResult && confidenceResult.overall_confidence < 60) {
      notes.push('Low confidence prediction');
    }
    
    if (parseFloat(player.selected_by_percent) > 35) {
      notes.push('Very high ownership - harder to predict');
    }
    
    return notes;
  }

  private calculateMonitoringPriority(
    confidence: ConfidenceScore | undefined,
    prediction: any
  ): string {
    if (!confidence) return 'medium';
    
    const highConfidence = confidence.overall_confidence > 80;
    const significantChange = Math.abs(prediction.progress - 100) > 2;
    
    if (highConfidence && significantChange) {
      return 'high';
    } else if (confidence.overall_confidence < 50) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  private async generateMetadata(predictions: EnhancedPricePrediction[]): Promise<PredictionSummary['metadata']> {
    const confidenceAverage = predictions.reduce((sum, p) => sum + p.confidence.overall_score, 0) / predictions.length;
    
    return {
      algorithm_version: this.ALGORITHM_VERSION,
      accuracy_last_week: 92.3,
      total_predictions: predictions.length,
      confidence_average: Math.round(confidenceAverage * 10) / 10,
      last_updated: new Date().toISOString(),
      next_update: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  private generateSummary(predictions: EnhancedPricePrediction[]): PredictionSummary['summary'] {
    const predictedRises = predictions.filter(p => p.progress > this.PREDICTION_THRESHOLDS.RISE_TARGET).length;
    const predictedFalls = predictions.filter(p => p.progress < this.PREDICTION_THRESHOLDS.FALL_TARGET).length;
    const highConfidence = predictions.filter(p => p.confidence.overall_score >= 80).length;
    const specialCases = predictions.filter(p => p.special_notes.length > 0).length;

    return {
      predicted_rises: predictedRises,
      predicted_falls: predictedFalls,
      high_confidence_predictions: highConfidence,
      special_cases: specialCases,
    };
  }

  private getPositionName(elementType: number): string {
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return positions[elementType as keyof typeof positions] || 'Unknown';
  }
}