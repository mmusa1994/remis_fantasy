/**
 * Live Bonus Point System (BPS) Calculator
 * 
 * This library provides real-time calculation of BPS scores based on 
 * live match events and player statistics during active gameweeks.
 */

export interface LivePlayerStats {
  player_id: number;
  web_name: string;
  team_id: number;
  position: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  saves: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  big_chances_created: number;
  big_chances_missed: number;
  key_passes: number;
  recoveries: number;
  successful_dribbles: number;
  tackles: number;
  clearances_blocks_interceptions: number;
  errors_leading_to_goal: number;
  errors_leading_to_goal_attempt: number;
  winning_goals: number;
  attempted_passes: number;
  completed_passes: number;
}

export interface BPSCalculationResult {
  player_id: number;
  web_name: string;
  team_id: number;
  total_bps: number;
  breakdown: {
    attacking_bps: number;
    defending_bps: number;
    general_bps: number;
    negative_bps: number;
  };
  predicted_bonus: number; // 0, 1, 2, or 3 points
  live_rank: number; // Position in BPS ranking for this match
}

export interface MatchBPSData {
  fixture_id: number;
  home_team_id: number;
  away_team_id: number;
  players: BPSCalculationResult[];
  last_updated: string;
}

export class LiveBPSCalculator {
  private static readonly BPS_SCORING = {
    // Attacking
    GOAL_SCORED: 24,
    ASSIST: 18,
    BIG_CHANCE_CREATED: 3,
    KEY_PASS: 1,
    SUCCESSFUL_DRIBBLE: 1,
    WINNING_GOAL: 6,
    
    // Defending
    CLEAN_SHEET_GK: 12,
    CLEAN_SHEET_DEF: 12,
    CLEAN_SHEET_MID: 6,
    SAVE: 2,
    PENALTY_SAVE: 15,
    RECOVERY: 1,
    TACKLE: 2,
    CLEARANCE_BLOCK_INTERCEPTION: 1,
    
    // General
    MINUTES_0_59: 0,
    MINUTES_60_PLUS: 6,
    PASS_COMPLETION_70_79: 2,
    PASS_COMPLETION_80_89: 4,
    PASS_COMPLETION_90_PLUS: 6,
    
    // Negative
    YELLOW_CARD: -3,
    RED_CARD: -9,
    OWN_GOAL: -6,
    PENALTY_MISS: -6,
    BIG_CHANCE_MISSED: -3,
    ERROR_LEADING_TO_GOAL: -6,
    ERROR_LEADING_TO_GOAL_ATTEMPT: -3,
  };

  /**
   * Calculate BPS for a single player
   */
  public static calculatePlayerBPS(stats: LivePlayerStats): BPSCalculationResult {
    let attacking_bps = 0;
    let defending_bps = 0;
    let general_bps = 0;
    let negative_bps = 0;

    // Attacking BPS
    attacking_bps += stats.goals_scored * this.BPS_SCORING.GOAL_SCORED;
    attacking_bps += stats.assists * this.BPS_SCORING.ASSIST;
    attacking_bps += stats.big_chances_created * this.BPS_SCORING.BIG_CHANCE_CREATED;
    attacking_bps += stats.key_passes * this.BPS_SCORING.KEY_PASS;
    attacking_bps += stats.successful_dribbles * this.BPS_SCORING.SUCCESSFUL_DRIBBLE;
    attacking_bps += stats.winning_goals * this.BPS_SCORING.WINNING_GOAL;

    // Defending BPS
    if (stats.clean_sheets > 0) {
      if (stats.position === 'GK') {
        defending_bps += this.BPS_SCORING.CLEAN_SHEET_GK;
      } else if (stats.position === 'DEF') {
        defending_bps += this.BPS_SCORING.CLEAN_SHEET_DEF;
      } else if (stats.position === 'MID') {
        defending_bps += this.BPS_SCORING.CLEAN_SHEET_MID;
      }
    }
    
    defending_bps += stats.saves * this.BPS_SCORING.SAVE;
    defending_bps += stats.penalties_saved * this.BPS_SCORING.PENALTY_SAVE;
    defending_bps += stats.recoveries * this.BPS_SCORING.RECOVERY;
    defending_bps += stats.tackles * this.BPS_SCORING.TACKLE;
    defending_bps += stats.clearances_blocks_interceptions * this.BPS_SCORING.CLEARANCE_BLOCK_INTERCEPTION;

    // General BPS
    if (stats.minutes >= 60) {
      general_bps += this.BPS_SCORING.MINUTES_60_PLUS;
    }

    // Pass completion bonus
    if (stats.attempted_passes > 10) { // Minimum passes for bonus
      const pass_completion_rate = (stats.completed_passes / stats.attempted_passes) * 100;
      if (pass_completion_rate >= 90) {
        general_bps += this.BPS_SCORING.PASS_COMPLETION_90_PLUS;
      } else if (pass_completion_rate >= 80) {
        general_bps += this.BPS_SCORING.PASS_COMPLETION_80_89;
      } else if (pass_completion_rate >= 70) {
        general_bps += this.BPS_SCORING.PASS_COMPLETION_70_79;
      }
    }

    // Negative BPS
    negative_bps += stats.yellow_cards * this.BPS_SCORING.YELLOW_CARD;
    negative_bps += stats.red_cards * this.BPS_SCORING.RED_CARD;
    negative_bps += stats.own_goals * this.BPS_SCORING.OWN_GOAL;
    negative_bps += stats.penalties_missed * this.BPS_SCORING.PENALTY_MISS;
    negative_bps += stats.big_chances_missed * this.BPS_SCORING.BIG_CHANCE_MISSED;
    negative_bps += stats.errors_leading_to_goal * this.BPS_SCORING.ERROR_LEADING_TO_GOAL;
    negative_bps += stats.errors_leading_to_goal_attempt * this.BPS_SCORING.ERROR_LEADING_TO_GOAL_ATTEMPT;

    const total_bps = attacking_bps + defending_bps + general_bps + negative_bps;

    return {
      player_id: stats.player_id,
      web_name: stats.web_name,
      team_id: stats.team_id,
      total_bps,
      breakdown: {
        attacking_bps,
        defending_bps,
        general_bps,
        negative_bps,
      },
      predicted_bonus: 0, // Will be calculated after ranking
      live_rank: 0, // Will be set after sorting
    };
  }

  /**
   * Calculate BPS for all players in a match and determine bonus points
   */
  public static calculateMatchBPS(
    fixture_id: number,
    home_team_id: number,
    away_team_id: number,
    playerStats: LivePlayerStats[]
  ): MatchBPSData {
    // Calculate BPS for all players
    const playerResults = playerStats.map(stats => this.calculatePlayerBPS(stats));

    // Sort by BPS (descending) and assign ranks
    playerResults.sort((a, b) => {
      if (b.total_bps !== a.total_bps) {
        return b.total_bps - a.total_bps;
      }
      // Tiebreaker: goals scored, then assists, then minutes played
      const playerA = playerStats.find(p => p.player_id === a.player_id)!;
      const playerB = playerStats.find(p => p.player_id === b.player_id)!;
      
      if (playerB.goals_scored !== playerA.goals_scored) {
        return playerB.goals_scored - playerA.goals_scored;
      }
      if (playerB.assists !== playerA.assists) {
        return playerB.assists - playerA.assists;
      }
      return playerB.minutes - playerA.minutes;
    });

    // Assign ranks and bonus points
    playerResults.forEach((player, index) => {
      player.live_rank = index + 1;
      
      // Bonus points distribution (top 3 unique BPS scores)
      if (index === 0) {
        player.predicted_bonus = 3;
      } else if (index === 1 && player.total_bps !== playerResults[0].total_bps) {
        player.predicted_bonus = 2;
      } else if (index === 2 && 
                 player.total_bps !== playerResults[0].total_bps && 
                 player.total_bps !== playerResults[1].total_bps) {
        player.predicted_bonus = 1;
      }
    });

    // Handle ties for bonus points
    this.handleBonusTies(playerResults);

    return {
      fixture_id,
      home_team_id,
      away_team_id,
      players: playerResults,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Handle ties in BPS for bonus point distribution
   */
  private static handleBonusTies(players: BPSCalculationResult[]): void {
    const bpsGroups = new Map<number, BPSCalculationResult[]>();
    
    // Group players by BPS score
    players.forEach(player => {
      const bps = player.total_bps;
      if (!bpsGroups.has(bps)) {
        bpsGroups.set(bps, []);
      }
      bpsGroups.get(bps)!.push(player);
    });

    // Get unique BPS scores in descending order
    const uniqueBpsScores = Array.from(bpsGroups.keys()).sort((a, b) => b - a);
    
    const bonusPointsRemaining = [3, 2, 1];
    let currentBonusIndex = 0;

    for (const bps of uniqueBpsScores) {
      if (currentBonusIndex >= bonusPointsRemaining.length) break;
      
      const playersWithSameBps = bpsGroups.get(bps)!;
      const bonusPoints = bonusPointsRemaining[currentBonusIndex];
      
      // If there's a tie, all tied players get the same bonus
      playersWithSameBps.forEach(player => {
        player.predicted_bonus = bonusPoints;
      });
      
      // Move to next bonus level
      currentBonusIndex++;
    }
  }

  /**
   * Update BPS calculations with new live data
   */
  public static updateLiveBPS(
    existingData: MatchBPSData,
    updatedPlayerStats: LivePlayerStats[]
  ): MatchBPSData {
    return this.calculateMatchBPS(
      existingData.fixture_id,
      existingData.home_team_id,
      existingData.away_team_id,
      updatedPlayerStats
    );
  }

  /**
   * Get BPS leaders for a specific match
   */
  public static getBPSLeaders(matchData: MatchBPSData, limit: number = 10): BPSCalculationResult[] {
    return matchData.players
      .filter(player => player.total_bps > 0)
      .slice(0, limit);
  }

  /**
   * Get players likely to receive bonus points
   */
  public static getBonusCandidates(matchData: MatchBPSData): BPSCalculationResult[] {
    return matchData.players.filter(player => player.predicted_bonus > 0);
  }

  /**
   * Calculate team BPS totals
   */
  public static getTeamBPSTotals(matchData: MatchBPSData): {
    home_team_bps: number;
    away_team_bps: number;
  } {
    let home_team_bps = 0;
    let away_team_bps = 0;

    matchData.players.forEach(player => {
      if (player.team_id === matchData.home_team_id) {
        home_team_bps += player.total_bps;
      } else if (player.team_id === matchData.away_team_id) {
        away_team_bps += player.total_bps;
      }
    });

    return { home_team_bps, away_team_bps };
  }
}

/**
 * Helper function to create mock player stats for testing
 */
export function createMockPlayerStats(playerId: number, teamId: number): LivePlayerStats {
  return {
    player_id: playerId,
    web_name: `Player ${playerId}`,
    team_id: teamId,
    position: 'MID',
    minutes: 90,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    saves: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    own_goals: 0,
    big_chances_created: 0,
    big_chances_missed: 0,
    key_passes: 0,
    recoveries: 0,
    successful_dribbles: 0,
    tackles: 0,
    clearances_blocks_interceptions: 0,
    errors_leading_to_goal: 0,
    errors_leading_to_goal_attempt: 0,
    winning_goals: 0,
    attempted_passes: 30,
    completed_passes: 25,
  };
}