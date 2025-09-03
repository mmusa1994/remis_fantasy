import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';

/**
 * Confidence Scoring System Service
 * Calculates confidence scores for price predictions using multiple factors
 * and historical accuracy data, similar to LiveFPL's approach
 */

export interface PredictionData {
  player_id: number;
  web_name: string;
  progress: number;
  prediction: number;
  net_transfers: number;
  ownership_percentage: number;
  form_score: number;
  flag_status: 'none' | 'yellow' | 'red';
  special_player_status: boolean;
  threshold_data: {
    rise_threshold: number;
    fall_threshold: number;
    adjusted_rise_threshold: number;
    adjusted_fall_threshold: number;
  };
  ml_data: {
    predicted_transfers_24h: number;
    model_uncertainty: number;
    transfer_velocity: number;
  };
  wildcard_data: {
    wildcard_probability: number;
    valid_transfer_confidence: number;
  };
  flag_data: {
    flag_impact_severity: string;
    price_change_locked: boolean;
    confidence_adjustment: number;
  };
}

export interface ConfidenceFactors {
  transfer_volume_confidence: number;
  ownership_stability_confidence: number;
  form_consistency_confidence: number;
  flag_status_confidence: number;
  historical_model_accuracy: number;
  wildcard_detection_confidence: number;
  threshold_calculation_confidence: number;
  data_quality_confidence: number;
  market_condition_confidence: number;
  timing_confidence: number;
}

export interface ConfidenceScore {
  player_id: number;
  overall_confidence: number;
  confidence_tier: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidence_factors: ConfidenceFactors;
  risk_factors: string[];
  confidence_explanation: string;
  prediction_reliability: 'unreliable' | 'somewhat_reliable' | 'reliable' | 'highly_reliable';
  recommended_action: string;
}

export interface AccuracyMetrics {
  overall_accuracy: number;
  rise_prediction_accuracy: number;
  fall_prediction_accuracy: number;
  timing_accuracy: number;
  confidence_calibration: number;
  recent_performance_trend: number;
}

export class ConfidenceScoringService extends BaseFPLService {
  private static instance: ConfidenceScoringService;
  
  // Confidence factor weights
  private readonly CONFIDENCE_WEIGHTS = {
    transfer_volume: 0.20,
    ownership_stability: 0.15,
    form_consistency: 0.12,
    flag_status: 0.10,
    historical_accuracy: 0.15,
    wildcard_detection: 0.08,
    threshold_calculation: 0.10,
    data_quality: 0.05,
    market_conditions: 0.03,
    timing: 0.02,
  };

  // Historical accuracy data (mock - in production from database)
  private readonly HISTORICAL_ACCURACY: AccuracyMetrics = {
    overall_accuracy: 0.923,
    rise_prediction_accuracy: 0.934,
    fall_prediction_accuracy: 0.912,
    timing_accuracy: 0.887,
    confidence_calibration: 0.895,
    recent_performance_trend: 1.02, // 2% improvement trend
  };

  public static getInstance(): ConfidenceScoringService {
    if (!ConfidenceScoringService.instance) {
      ConfidenceScoringService.instance = new ConfidenceScoringService();
    }
    return ConfidenceScoringService.instance;
  }

  /**
   * Calculate confidence scores for multiple predictions
   */
  public async calculateConfidenceScores(
    predictions: PredictionData[]
  ): Promise<EnhancedFPLResponse<ConfidenceScore[]>> {
    try {
      const confidenceScores: ConfidenceScore[] = [];

      for (const prediction of predictions) {
        const confidenceScore = await this.calculatePredictionConfidence(prediction);
        confidenceScores.push(confidenceScore);
      }

      return {
        success: true,
        data: confidenceScores,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to calculate confidence scores: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ConfidenceScoringService',
        'calculateConfidenceScores',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculate confidence score for individual prediction
   */
  private async calculatePredictionConfidence(prediction: PredictionData): Promise<ConfidenceScore> {
    // 1. Calculate individual confidence factors
    const factors = this.calculateConfidenceFactors(prediction);
    
    // 2. Calculate weighted overall confidence
    const overallConfidence = this.calculateWeightedConfidence(factors);
    
    // 3. Determine confidence tier
    const confidenceTier = this.determineConfidenceTier(overallConfidence);
    
    // 4. Identify risk factors
    const riskFactors = this.identifyRiskFactors(prediction, factors);
    
    // 5. Generate confidence explanation
    const confidenceExplanation = this.generateConfidenceExplanation(factors, overallConfidence);
    
    // 6. Determine prediction reliability
    const predictionReliability = this.determinePredictionReliability(overallConfidence, factors);
    
    // 7. Generate recommended action
    const recommendedAction = this.generateRecommendedAction(overallConfidence, prediction, riskFactors);

    return {
      player_id: prediction.player_id,
      overall_confidence: Math.round(overallConfidence * 100),
      confidence_tier: confidenceTier,
      confidence_factors: factors,
      risk_factors: riskFactors,
      confidence_explanation: confidenceExplanation,
      prediction_reliability: predictionReliability,
      recommended_action: recommendedAction,
    };
  }

  /**
   * Calculate all confidence factors
   */
  private calculateConfidenceFactors(prediction: PredictionData): ConfidenceFactors {
    return {
      transfer_volume_confidence: this.calculateTransferVolumeConfidence(prediction),
      ownership_stability_confidence: this.calculateOwnershipStabilityConfidence(prediction),
      form_consistency_confidence: this.calculateFormConsistencyConfidence(prediction),
      flag_status_confidence: this.calculateFlagStatusConfidence(prediction),
      historical_model_accuracy: this.HISTORICAL_ACCURACY.overall_accuracy,
      wildcard_detection_confidence: this.calculateWildcardDetectionConfidence(prediction),
      threshold_calculation_confidence: this.calculateThresholdCalculationConfidence(prediction),
      data_quality_confidence: this.calculateDataQualityConfidence(prediction),
      market_condition_confidence: this.calculateMarketConditionConfidence(prediction),
      timing_confidence: this.calculateTimingConfidence(prediction),
    };
  }

  /**
   * Transfer Volume Confidence
   */
  private calculateTransferVolumeConfidence(prediction: PredictionData): number {
    const netTransfers = Math.abs(prediction.net_transfers);
    let confidence = 0.8; // Base confidence

    // Higher transfer volumes generally increase confidence
    if (netTransfers > 100000) {
      confidence += 0.15;
    } else if (netTransfers > 50000) {
      confidence += 0.1;
    } else if (netTransfers > 20000) {
      confidence += 0.05;
    } else if (netTransfers < 5000) {
      confidence -= 0.2; // Low transfer volumes reduce confidence
    }

    // Factor in ML model uncertainty
    confidence -= prediction.ml_data.model_uncertainty;

    // Factor in transfer velocity consistency
    if (prediction.ml_data.transfer_velocity > 0.8 && prediction.ml_data.transfer_velocity < 1.2) {
      confidence += 0.05; // Stable velocity increases confidence
    } else if (prediction.ml_data.transfer_velocity > 2 || prediction.ml_data.transfer_velocity < 0.5) {
      confidence -= 0.1; // Extreme velocity reduces confidence
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Ownership Stability Confidence
   */
  private calculateOwnershipStabilityConfidence(prediction: PredictionData): number {
    const ownership = prediction.ownership_percentage;
    let confidence = 0.8;

    // Ownership ranges that affect confidence
    if (ownership >= 5 && ownership <= 35) {
      confidence += 0.1; // Sweet spot for predictability
    } else if (ownership < 2) {
      confidence -= 0.3; // Very low ownership is unpredictable
    } else if (ownership > 40) {
      confidence -= 0.2; // Very high ownership has different dynamics
    }

    // Factor in ownership momentum (derived from transfer patterns)
    const ownershipMomentum = this.calculateOwnershipMomentum(prediction);
    if (Math.abs(ownershipMomentum) < 0.1) {
      confidence += 0.05; // Stable ownership increases confidence
    } else if (Math.abs(ownershipMomentum) > 0.3) {
      confidence -= 0.1; // High momentum reduces confidence
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Form Consistency Confidence
   */
  private calculateFormConsistencyConfidence(prediction: PredictionData): number {
    let confidence = 0.8;
    const form = prediction.form_score;

    // Form ranges and their confidence impact
    if (form >= 6 && form <= 8) {
      confidence += 0.1; // Good, consistent form
    } else if (form >= 4 && form < 6) {
      confidence += 0.05; // Average form
    } else if (form < 3) {
      confidence -= 0.15; // Poor form creates uncertainty
    } else if (form > 9) {
      confidence -= 0.05; // Exceptional form may not be sustainable
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Flag Status Confidence
   */
  private calculateFlagStatusConfidence(prediction: PredictionData): number {
    let confidence = 1.0; // Start with full confidence

    // Reduce confidence based on flag status
    switch (prediction.flag_status) {
      case 'red':
        confidence -= 0.3; // Significant uncertainty with red flags
        break;
      case 'yellow':
        confidence -= 0.1; // Moderate uncertainty with yellow flags
        break;
      case 'none':
      default:
        // No reduction for no flag
        break;
    }

    // Additional reduction if flag change impact is severe
    if (prediction.flag_data.flag_impact_severity === 'critical') {
      confidence -= 0.2;
    } else if (prediction.flag_data.flag_impact_severity === 'high') {
      confidence -= 0.1;
    }

    // Apply flag-based confidence adjustment from flag handler
    confidence += prediction.flag_data.confidence_adjustment;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Wildcard Detection Confidence
   */
  private calculateWildcardDetectionConfidence(prediction: PredictionData): number {
    const wildcardProbability = prediction.wildcard_data.wildcard_probability;
    const detectionConfidence = prediction.wildcard_data.valid_transfer_confidence;

    let confidence = detectionConfidence;

    // Reduce confidence when wildcard probability is high but uncertain
    if (wildcardProbability > 0.3 && detectionConfidence < 0.8) {
      confidence -= 0.2;
    } else if (wildcardProbability < 0.1 && detectionConfidence > 0.9) {
      confidence += 0.1; // High confidence in low wildcard probability
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Threshold Calculation Confidence
   */
  private calculateThresholdCalculationConfidence(prediction: PredictionData): number {
    let confidence = 0.85; // Base threshold confidence

    // Special players reduce threshold confidence
    if (prediction.special_player_status) {
      confidence -= 0.2;
    }

    // Extreme ownership affects threshold reliability
    if (prediction.ownership_percentage > 40 || prediction.ownership_percentage < 1) {
      confidence -= 0.1;
    }

    // Check if prediction is close to threshold boundaries
    const progressDistance = Math.abs(prediction.progress - 100);
    if (progressDistance < 0.5) {
      confidence -= 0.15; // Very close calls are less reliable
    } else if (progressDistance > 2) {
      confidence += 0.1; // Clear cases are more reliable
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Data Quality Confidence
   */
  private calculateDataQualityConfidence(prediction: PredictionData): number {
    let confidence = 0.9; // High base confidence in data quality

    // Reduce confidence if data seems inconsistent
    const transferThresholdRatio = Math.abs(prediction.net_transfers) / 
      Math.max(prediction.threshold_data.adjusted_rise_threshold, prediction.threshold_data.adjusted_fall_threshold);

    if (transferThresholdRatio > 10) {
      confidence -= 0.2; // Very high ratio suggests data quality issues
    } else if (transferThresholdRatio > 5) {
      confidence -= 0.1;
    }

    // Check for data anomalies
    if (prediction.ml_data.predicted_transfers_24h < 0) {
      confidence -= 0.3; // Negative predictions suggest data issues
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Market Condition Confidence
   */
  private calculateMarketConditionConfidence(prediction: PredictionData): number {
    let confidence = 0.85;

    // Reduce confidence during high volatility periods
    const marketVolatility = this.calculateMarketVolatility();
    
    if (marketVolatility > 0.3) {
      confidence -= 0.2;
    } else if (marketVolatility > 0.15) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Timing Confidence
   */
  private calculateTimingConfidence(prediction: PredictionData): number {
    let confidence = 0.8;

    // Timing is generally less reliable than direction
    const progressExtreme = Math.abs(prediction.progress - 100);
    
    if (progressExtreme > 3) {
      confidence += 0.15; // Very clear cases have better timing prediction
    } else if (progressExtreme < 0.5) {
      confidence -= 0.3; // Borderline cases have poor timing prediction
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate weighted overall confidence
   */
  private calculateWeightedConfidence(factors: ConfidenceFactors): number {
    let weightedSum = 0;
    
    weightedSum += factors.transfer_volume_confidence * this.CONFIDENCE_WEIGHTS.transfer_volume;
    weightedSum += factors.ownership_stability_confidence * this.CONFIDENCE_WEIGHTS.ownership_stability;
    weightedSum += factors.form_consistency_confidence * this.CONFIDENCE_WEIGHTS.form_consistency;
    weightedSum += factors.flag_status_confidence * this.CONFIDENCE_WEIGHTS.flag_status;
    weightedSum += factors.historical_model_accuracy * this.CONFIDENCE_WEIGHTS.historical_accuracy;
    weightedSum += factors.wildcard_detection_confidence * this.CONFIDENCE_WEIGHTS.wildcard_detection;
    weightedSum += factors.threshold_calculation_confidence * this.CONFIDENCE_WEIGHTS.threshold_calculation;
    weightedSum += factors.data_quality_confidence * this.CONFIDENCE_WEIGHTS.data_quality;
    weightedSum += factors.market_condition_confidence * this.CONFIDENCE_WEIGHTS.market_conditions;
    weightedSum += factors.timing_confidence * this.CONFIDENCE_WEIGHTS.timing;

    return Math.max(0, Math.min(1, weightedSum));
  }

  /**
   * Determine confidence tier
   */
  private determineConfidenceTier(confidence: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.65) return 'medium';
    if (confidence >= 0.5) return 'low';
    return 'very_low';
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(prediction: PredictionData, factors: ConfidenceFactors): string[] {
    const riskFactors: string[] = [];

    if (factors.transfer_volume_confidence < 0.6) {
      riskFactors.push('Low transfer volume reliability');
    }

    if (factors.ownership_stability_confidence < 0.6) {
      riskFactors.push('Unstable ownership patterns');
    }

    if (factors.flag_status_confidence < 0.7) {
      riskFactors.push('Flag status uncertainty');
    }

    if (factors.wildcard_detection_confidence < 0.7) {
      riskFactors.push('Wildcard detection uncertainty');
    }

    if (prediction.special_player_status) {
      riskFactors.push('Special player exemption possible');
    }

    if (prediction.ownership_percentage > 35) {
      riskFactors.push('High ownership reduces predictability');
    }

    if (prediction.ownership_percentage < 2) {
      riskFactors.push('Low ownership increases volatility');
    }

    if (Math.abs(prediction.progress - 100) < 1) {
      riskFactors.push('Borderline prediction');
    }

    return riskFactors;
  }

  /**
   * Generate confidence explanation
   */
  private generateConfidenceExplanation(factors: ConfidenceFactors, overallConfidence: number): string {
    const confidencePercent = Math.round(overallConfidence * 100);
    
    const strongFactors = [];
    const weakFactors = [];

    if (factors.transfer_volume_confidence > 0.8) strongFactors.push('strong transfer patterns');
    else if (factors.transfer_volume_confidence < 0.6) weakFactors.push('weak transfer signals');

    if (factors.historical_model_accuracy > 0.9) strongFactors.push('excellent model track record');
    if (factors.ownership_stability_confidence > 0.8) strongFactors.push('stable ownership');
    else if (factors.ownership_stability_confidence < 0.6) weakFactors.push('ownership volatility');

    if (factors.flag_status_confidence < 0.7) weakFactors.push('flag uncertainty');
    if (factors.wildcard_detection_confidence < 0.7) weakFactors.push('wildcard interference');

    let explanation = `${confidencePercent}% confidence based on `;

    if (strongFactors.length > 0) {
      explanation += strongFactors.join(', ');
      if (weakFactors.length > 0) {
        explanation += `, but limited by ${weakFactors.join(', ')}`;
      }
    } else if (weakFactors.length > 0) {
      explanation += `limited confidence due to ${weakFactors.join(', ')}`;
    } else {
      explanation += 'mixed signals from various factors';
    }

    return explanation + '.';
  }

  /**
   * Determine prediction reliability
   */
  private determinePredictionReliability(
    confidence: number,
    factors: ConfidenceFactors
  ): 'unreliable' | 'somewhat_reliable' | 'reliable' | 'highly_reliable' {
    if (confidence >= 0.85 && factors.data_quality_confidence > 0.8) {
      return 'highly_reliable';
    } else if (confidence >= 0.7) {
      return 'reliable';
    } else if (confidence >= 0.55) {
      return 'somewhat_reliable';
    } else {
      return 'unreliable';
    }
  }

  /**
   * Generate recommended action
   */
  private generateRecommendedAction(
    confidence: number,
    prediction: PredictionData,
    riskFactors: string[]
  ): string {
    if (confidence >= 0.85 && Math.abs(prediction.progress - 100) > 2) {
      return 'High confidence - Act on this prediction';
    } else if (confidence >= 0.7 && Math.abs(prediction.progress - 100) > 1) {
      return 'Good confidence - Monitor closely and consider acting';
    } else if (confidence >= 0.55) {
      return 'Moderate confidence - Wait for more data';
    } else if (riskFactors.length > 3) {
      return 'Low confidence - Too many risk factors, avoid acting';
    } else {
      return 'Low confidence - Monitor only';
    }
  }

  // Helper methods

  private calculateOwnershipMomentum(prediction: PredictionData): number {
    // Simplified ownership momentum calculation
    const netTransfers = prediction.net_transfers;
    const ownership = prediction.ownership_percentage;
    
    if (ownership === 0) return 0;
    
    const totalManagers = 11000000;
    const ownedByManagers = (ownership / 100) * totalManagers;
    
    return netTransfers / ownedByManagers;
  }

  private calculateMarketVolatility(): number {
    // Mock market volatility calculation
    // In production, this would analyze overall market transfer patterns
    return 0.12; // 12% volatility (moderate)
  }

  /**
   * Update historical accuracy metrics
   */
  public async updateAccuracyMetrics(
    predictions: any[],
    actualResults: any[]
  ): Promise<EnhancedFPLResponse<AccuracyMetrics>> {
    try {
      let correctPredictions = 0;
      let correctRisePredictions = 0;
      let correctFallPredictions = 0;
      let correctTimingPredictions = 0;
      
      let totalRisePredictions = 0;
      let totalFallPredictions = 0;

      for (let i = 0; i < Math.min(predictions.length, actualResults.length); i++) {
        const prediction = predictions[i];
        const actual = actualResults[i];

        const predictedRise = prediction.progress > 100;
        const predictedFall = prediction.progress < 100;
        const actualRise = actual.price_change > 0;
        const actualFall = actual.price_change < 0;

        // Overall accuracy
        if ((predictedRise && actualRise) || (predictedFall && actualFall) || 
            (!predictedRise && !predictedFall && actual.price_change === 0)) {
          correctPredictions++;
        }

        // Rise prediction accuracy
        if (predictedRise) {
          totalRisePredictions++;
          if (actualRise) correctRisePredictions++;
        }

        // Fall prediction accuracy
        if (predictedFall) {
          totalFallPredictions++;
          if (actualFall) correctFallPredictions++;
        }

        // Timing accuracy (within expected timeframe)
        if (prediction.timing_estimate && actual.change_time) {
          const timingCorrect = this.checkTimingAccuracy(prediction.timing_estimate, actual.change_time);
          if (timingCorrect) correctTimingPredictions++;
        }
      }

      const updatedMetrics: AccuracyMetrics = {
        overall_accuracy: correctPredictions / Math.max(predictions.length, 1),
        rise_prediction_accuracy: correctRisePredictions / Math.max(totalRisePredictions, 1),
        fall_prediction_accuracy: correctFallPredictions / Math.max(totalFallPredictions, 1),
        timing_accuracy: correctTimingPredictions / Math.max(predictions.length, 1),
        confidence_calibration: this.calculateConfidenceCalibration(predictions, actualResults),
        recent_performance_trend: this.calculatePerformanceTrend(),
      };

      return {
        success: true,
        data: updatedMetrics,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to update accuracy metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ConfidenceScoringService',
        'updateAccuracyMetrics',
        error instanceof Error ? error : undefined
      );
    }
  }

  private checkTimingAccuracy(predicted: string, actual: string): boolean {
    // Simplified timing accuracy check
    const timingMap = {
      'Tonight': 0,
      'Soon': 1,
      'Tomorrow': 2,
      'Unlikely': 3,
    };

    const predictedTime = timingMap[predicted as keyof typeof timingMap] || 3;
    const actualTime = timingMap[actual as keyof typeof timingMap] || 3;

    return Math.abs(predictedTime - actualTime) <= 1;
  }

  private calculateConfidenceCalibration(predictions: any[], actualResults: any[]): number {
    // Simplified confidence calibration calculation
    // In production, this would be more sophisticated
    return 0.89; // Mock 89% calibration
  }

  private calculatePerformanceTrend(): number {
    // Mock performance trend calculation
    // In production, this would analyze recent accuracy vs historical
    return 1.02; // 2% improvement trend
  }
}