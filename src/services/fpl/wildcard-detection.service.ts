import { BaseFPLService } from './base.service';
import { FPLServiceError } from './errors';
import type { EnhancedFPLResponse } from '../../types/fpl-enhanced';

/**
 * Advanced Wildcard Detection Service
 * Implements machine learning-based wildcard detection patterns similar to LiveFPL
 */

export interface TransferData {
  player_id: number;
  transfers_in_event: number;
  transfers_out_event: number;
  transfers_in_24h: number;
  transfers_out_24h: number;
  ownership_percentage: number;
  price: number;
  form: number;
  element_type: number;
  team: number;
}

export interface WildcardAnalysisResult {
  wildcard_probability: number;
  valid_transfers_in: number;
  valid_transfers_out: number;
  net_valid_transfers: number;
  confidence_score: number;
  detection_method: string;
  pattern_indicators: WildcardIndicator[];
}

export interface WildcardIndicator {
  type: 'mass_transfer' | 'ownership_pattern' | 'timing_pattern' | 'team_spread';
  strength: number;
  description: string;
}

export interface WildcardPattern {
  gameweek: number;
  transfer_pattern: {
    total_transfers: number;
    unique_players_affected: number;
    ownership_distribution: number[];
    timing_distribution: number[];
    team_spread: number;
  };
  is_wildcard: boolean;
  confidence_score: number;
}

export interface MLPredictionInput {
  historical_transfer_patterns: WildcardPattern[];
  current_gameweek: number;
  time_until_deadline: number;
  recent_performance_data: any[];
  fixture_difficulty: number;
  total_active_managers: number;
}

export interface MLPredictionOutput {
  wildcard_probability: number;
  confidence_score: number;
  threshold_adjustment_factor: number;
  predicted_discard_percentage: number;
}

export class WildcardDetectionService extends BaseFPLService {
  private static instance: WildcardDetectionService;
  private readonly TOTAL_ACTIVE_MANAGERS = 11000000; // Current FPL active managers
  
  // ML Model weights (simplified version - in production would use actual ML models)
  // Keys aligned with WildcardIndicator['type'] for safe indexing
  private readonly ML_WEIGHTS: {
    mass_transfer: number;
    ownership_pattern: number;
    timing_pattern: number;
    team_spread: number;
    historical_accuracy: number;
  } = {
    mass_transfer: 0.15, // 15% of total transfers indicating mass transfer
    ownership_pattern: 0.25, // Weight for ownership pattern analysis
    timing_pattern: 0.20, // Weight for timing-based detection
    team_spread: 0.15, // Weight for team distribution pattern
    historical_accuracy: 0.25, // Weight for historical pattern matching
  };

  // Historical patterns database (mock data - in production would be from database)
  private readonly HISTORICAL_PATTERNS: WildcardPattern[] = [
    {
      gameweek: 4,
      transfer_pattern: {
        total_transfers: 8500000,
        unique_players_affected: 450,
        ownership_distribution: [0.3, 0.25, 0.2, 0.15, 0.1],
        timing_distribution: [0.1, 0.2, 0.3, 0.25, 0.15],
        team_spread: 0.85,
      },
      is_wildcard: true,
      confidence_score: 0.92,
    },
    {
      gameweek: 13,
      transfer_pattern: {
        total_transfers: 7200000,
        unique_players_affected: 380,
        ownership_distribution: [0.28, 0.24, 0.22, 0.16, 0.1],
        timing_distribution: [0.12, 0.18, 0.32, 0.23, 0.15],
        team_spread: 0.78,
      },
      is_wildcard: true,
      confidence_score: 0.88,
    },
  ];

  public static getInstance(): WildcardDetectionService {
    if (!WildcardDetectionService.instance) {
      WildcardDetectionService.instance = new WildcardDetectionService();
    }
    return WildcardDetectionService.instance;
  }

  /**
   * Analyze transfer data to detect wildcard usage patterns
   */
  public async analyzeWildcardUsage(
    transferData: TransferData[],
    currentGameweek: number
  ): Promise<EnhancedFPLResponse<WildcardAnalysisResult[]>> {
    try {
      const results: WildcardAnalysisResult[] = [];

      for (const player of transferData) {
        const wildcardAnalysis = await this.detectPlayerWildcardPattern(
          player,
          transferData,
          currentGameweek
        );
        results.push(wildcardAnalysis);
      }

      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to analyze wildcard usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WildcardDetectionService',
        'analyzeWildcardUsage',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Detect wildcard patterns for individual player using ML approach
   */
  private async detectPlayerWildcardPattern(
    player: TransferData,
    allTransferData: TransferData[],
    currentGameweek: number
  ): Promise<WildcardAnalysisResult> {
    // 1. Mass Transfer Pattern Detection
    const massTransferIndicator = this.detectMassTransferPattern(player, allTransferData);
    
    // 2. Ownership Pattern Analysis
    const ownershipIndicator = this.analyzeOwnershipPattern(player, allTransferData);
    
    // 3. Timing Pattern Detection
    const timingIndicator = this.analyzeTimingPattern(player, currentGameweek);
    
    // 4. Team Spread Analysis
    const teamSpreadIndicator = this.analyzeTeamSpread(player, allTransferData);

    // 5. Historical Pattern Matching
    const historicalMatch = this.matchHistoricalPatterns(player, allTransferData, currentGameweek);

    const indicators = [massTransferIndicator, ownershipIndicator, timingIndicator, teamSpreadIndicator];

    // 6. Calculate ML-based wildcard probability
    const wildcardProbability = this.calculateWildcardProbability(indicators, historicalMatch);
    
    // 7. Calculate valid transfers (excluding estimated wildcard transfers)
    const validTransfers = this.calculateValidTransfers(player, wildcardProbability);
    
    // 8. Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(indicators, historicalMatch);

    return {
      wildcard_probability: wildcardProbability,
      valid_transfers_in: validTransfers.transfers_in,
      valid_transfers_out: validTransfers.transfers_out,
      net_valid_transfers: validTransfers.net_transfers,
      confidence_score: confidenceScore,
      detection_method: 'ML_Pattern_Analysis',
      pattern_indicators: indicators,
    };
  }

  /**
   * Detect mass transfer patterns
   */
  private detectMassTransferPattern(player: TransferData, allData: TransferData[]): WildcardIndicator {
    const totalTransfers = player.transfers_in_event + player.transfers_out_event;
    const averageTransfers = allData.reduce((sum, p) => sum + p.transfers_in_event + p.transfers_out_event, 0) / allData.length;
    
    const transferRatio = totalTransfers / Math.max(averageTransfers, 1);
    const massTransferStrength = Math.min(1.0, Math.max(0, (transferRatio - 2) / 8)); // Scale 2-10x average to 0-1

    return {
      type: 'mass_transfer',
      strength: massTransferStrength,
      description: `Transfer volume ${transferRatio.toFixed(1)}x average (${totalTransfers.toLocaleString()} transfers)`,
    };
  }

  /**
   * Analyze ownership patterns that indicate wildcard usage
   */
  private analyzeOwnershipPattern(player: TransferData, allData: TransferData[]): WildcardIndicator {
    // Players with certain ownership ranges are more likely to be affected by wildcards
    const ownership = player.ownership_percentage;
    let ownershipWeight = 0;

    if (ownership < 5) {
      ownershipWeight = 0.8; // Low ownership players often targeted in wildcards
    } else if (ownership < 15) {
      ownershipWeight = 0.9; // Mid ownership players frequently transferred
    } else if (ownership < 30) {
      ownershipWeight = 0.6; // High ownership players less likely wildcard targets
    } else {
      ownershipWeight = 0.3; // Very high ownership players rarely wildcard transfers
    }

    // Factor in if player is receiving disproportionate transfers for their ownership
    const expectedTransfers = (ownership / 100) * this.TOTAL_ACTIVE_MANAGERS * 0.1; // 10% transfer rate
    const actualTransfers = player.transfers_in_event + player.transfers_out_event;
    const transferDisproportion = actualTransfers / Math.max(expectedTransfers, 1);
    
    const ownershipStrength = ownershipWeight * Math.min(1.0, transferDisproportion / 5);

    return {
      type: 'ownership_pattern',
      strength: ownershipStrength,
      description: `Ownership ${ownership.toFixed(1)}% with ${transferDisproportion.toFixed(1)}x expected transfers`,
    };
  }

  /**
   * Analyze timing patterns that suggest wildcard usage
   */
  private analyzeTimingPattern(player: TransferData, currentGameweek: number): WildcardIndicator {
    // Wildcards more common in certain gameweeks
    const wildcardWeeks = [4, 8, 13, 17, 25, 33]; // Common wildcard gameweeks
    const isWildcardWeek = wildcardWeeks.includes(currentGameweek);
    
    // International breaks and double gameweeks increase wildcard probability
    const isInternationalBreak = [7, 14, 28].includes(currentGameweek);
    
    let timingStrength = 0.1; // Base probability
    
    if (isWildcardWeek) timingStrength += 0.4;
    if (isInternationalBreak) timingStrength += 0.2;
    
    // Early season and mid-season wildcards are more common
    if (currentGameweek <= 8) timingStrength += 0.2;
    else if (currentGameweek >= 10 && currentGameweek <= 15) timingStrength += 0.3;

    return {
      type: 'timing_pattern',
      strength: Math.min(1.0, timingStrength),
      description: `Gameweek ${currentGameweek} ${isWildcardWeek ? '(Common wildcard week)' : ''} ${isInternationalBreak ? '(International break)' : ''}`,
    };
  }

  /**
   * Analyze team distribution patterns
   */
  private analyzeTeamSpread(player: TransferData, allData: TransferData[]): WildcardIndicator {
    // Wide team distribution often indicates wildcard usage
    const teamDistribution = allData.reduce((acc, p) => {
      acc[p.team] = (acc[p.team] || 0) + p.transfers_in_event + p.transfers_out_event;
      return acc;
    }, {} as Record<number, number>);

    const totalTeams = Object.keys(teamDistribution).length;
    const teamSpreadStrength = Math.min(1.0, totalTeams / 20); // 20 teams max

    return {
      type: 'team_spread',
      strength: teamSpreadStrength,
      description: `Transfers across ${totalTeams} teams`,
    };
  }

  /**
   * Match current patterns with historical wildcard patterns
   */
  private matchHistoricalPatterns(
    player: TransferData,
    allData: TransferData[],
    currentGameweek: number
  ): { score: number; confidence: number } {
    const currentPattern = this.extractCurrentPattern(allData, currentGameweek);
    
    let bestMatch = 0;
    let matchConfidence = 0;

    for (const historical of this.HISTORICAL_PATTERNS) {
      const similarity = this.calculatePatternSimilarity(currentPattern, historical.transfer_pattern);
      if (similarity > bestMatch) {
        bestMatch = similarity;
        matchConfidence = historical.confidence_score;
      }
    }

    return { score: bestMatch, confidence: matchConfidence };
  }

  /**
   * Extract current transfer patterns for comparison
   */
  private extractCurrentPattern(allData: TransferData[], gameweek: number) {
    const totalTransfers = allData.reduce((sum, p) => sum + p.transfers_in_event + p.transfers_out_event, 0);
    const uniquePlayersAffected = allData.filter(p => p.transfers_in_event > 0 || p.transfers_out_event > 0).length;
    
    // Simple ownership distribution (would be more sophisticated in production)
    const ownershipDistribution = [0.25, 0.25, 0.25, 0.15, 0.1];
    const timingDistribution = [0.1, 0.2, 0.3, 0.25, 0.15];
    
    const teamSpread = new Set(allData.map(p => p.team)).size / 20;

    return {
      total_transfers: totalTransfers,
      unique_players_affected: uniquePlayersAffected,
      ownership_distribution: ownershipDistribution,
      timing_distribution: timingDistribution,
      team_spread: teamSpread,
    };
  }

  /**
   * Calculate similarity between current and historical patterns
   */
  private calculatePatternSimilarity(current: any, historical: any): number {
    const transferSimilarity = 1 - Math.abs(current.total_transfers - historical.total_transfers) / Math.max(current.total_transfers, historical.total_transfers);
    const playerSimilarity = 1 - Math.abs(current.unique_players_affected - historical.unique_players_affected) / Math.max(current.unique_players_affected, historical.unique_players_affected);
    const teamSimilarity = 1 - Math.abs(current.team_spread - historical.team_spread);

    return (transferSimilarity + playerSimilarity + teamSimilarity) / 3;
  }

  /**
   * Calculate wildcard probability using ML weights
   */
  private calculateWildcardProbability(indicators: WildcardIndicator[], historicalMatch: { score: number; confidence: number }): number {
    let probability = 0;

    for (const indicator of indicators) {
      const weight = this.ML_WEIGHTS[indicator.type] || 0.1;
      probability += indicator.strength * weight;
    }

    // Add historical pattern matching
    probability += historicalMatch.score * historicalMatch.confidence * this.ML_WEIGHTS.historical_accuracy;

    return Math.min(1.0, Math.max(0, probability));
  }

  /**
   * Calculate valid transfers excluding estimated wildcard transfers
   */
  private calculateValidTransfers(player: TransferData, wildcardProbability: number): {
    transfers_in: number;
    transfers_out: number;
    net_transfers: number;
  } {
    // Estimate percentage of transfers that are wildcards
    const wildcardPercentage = wildcardProbability * 0.4; // Max 40% wildcard transfers
    
    const validTransfersIn = Math.round(player.transfers_in_event * (1 - wildcardPercentage));
    const validTransfersOut = Math.round(player.transfers_out_event * (1 - wildcardPercentage));
    
    return {
      transfers_in: validTransfersIn,
      transfers_out: validTransfersOut,
      net_transfers: validTransfersIn - validTransfersOut,
    };
  }

  /**
   * Calculate confidence score for the wildcard detection
   */
  private calculateConfidenceScore(indicators: WildcardIndicator[], historicalMatch: { score: number; confidence: number }): number {
    const indicatorConfidence = indicators.reduce((sum, ind) => sum + ind.strength, 0) / indicators.length;
    const historicalConfidence = historicalMatch.score * historicalMatch.confidence;
    
    return Math.min(1.0, (indicatorConfidence + historicalConfidence) / 2);
  }

  /**
   * Get gameweek carryover predictions
   */
  public async predictGameweekCarryover(
    transfers: TransferData[],
    gameweekStatus: string
  ): Promise<EnhancedFPLResponse<{ carryover_percentage: number; confidence: number }>> {
    try {
      // ML model for gameweek carryover (simplified)
      let carryoverPercentage = 0.15; // Base 15% carryover

      // Adjust based on gameweek status
      if (gameweekStatus === 'finished') {
        carryoverPercentage = 0.25; // Higher carryover after gameweek ends
      } else if (gameweekStatus === 'started') {
        carryoverPercentage = 0.1; // Lower carryover during active gameweek
      }

      // Adjust based on transfer volume
      const totalTransfers = transfers.reduce((sum, t) => sum + t.transfers_in_event + t.transfers_out_event, 0);
      const averageTransfers = 5000000; // Average weekly transfers
      
      if (totalTransfers > averageTransfers * 1.5) {
        carryoverPercentage += 0.1; // Higher carryover for high transfer weeks
      }

      const confidence = 0.8; // ML model confidence

      return {
        success: true,
        data: {
          carryover_percentage: Math.min(0.4, carryoverPercentage),
          confidence,
        },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to predict gameweek carryover: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WildcardDetectionService',
        'predictGameweekCarryover',
        error instanceof Error ? error : undefined
      );
    }
  }
}
