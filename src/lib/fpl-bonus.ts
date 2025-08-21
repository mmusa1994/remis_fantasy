export interface BPSPlayer {
  player_id: number;
  bps: number;
  web_name: string;
  team: number;
  minutes: number;
}

export interface BonusResult {
  player_id: number;
  predicted_bonus: number;
  bps: number;
  rank: number;
  web_name: string;
}

export interface FixtureBonusResult {
  fixture_id: number;
  bonuses: BonusResult[];
  team_h_id: number;
  team_a_id: number;
}

class BonusPredictionService {
  calculateBonusForFixture(
    fixtureId: number,
    teamHId: number,
    teamAId: number,
    players: BPSPlayer[]
  ): FixtureBonusResult {
    const eligiblePlayers = players.filter(player => 
      player.minutes > 0 && 
      (player.team === teamHId || player.team === teamAId)
    );

    if (eligiblePlayers.length === 0) {
      return {
        fixture_id: fixtureId,
        bonuses: [],
        team_h_id: teamHId,
        team_a_id: teamAId,
      };
    }

    const sortedPlayers = eligiblePlayers
      .sort((a, b) => {
        if (b.bps !== a.bps) return b.bps - a.bps;
        return a.player_id - b.player_id;
      });

    const bonusResults = this.assignBonusPoints(sortedPlayers);

    return {
      fixture_id: fixtureId,
      bonuses: bonusResults,
      team_h_id: teamHId,
      team_a_id: teamAId,
    };
  }

  private assignBonusPoints(sortedPlayers: BPSPlayer[]): BonusResult[] {
    if (sortedPlayers.length === 0) return [];

    const results: BonusResult[] = [];
    let rank = 1;
    const bonusPoints = [3, 2, 1];
    let currentBonusIndex = 0;

    for (let i = 0; i < sortedPlayers.length; i++) {
      const currentPlayer = sortedPlayers[i];
      
      const tiedPlayers = [currentPlayer];
      let j = i + 1;
      
      while (j < sortedPlayers.length && sortedPlayers[j].bps === currentPlayer.bps) {
        tiedPlayers.push(sortedPlayers[j]);
        j++;
      }

      const bonus = this.getBonusForRankAndTies(rank, tiedPlayers.length, bonusPoints, currentBonusIndex);
      
      tiedPlayers.forEach(player => {
        results.push({
          player_id: player.player_id,
          predicted_bonus: bonus,
          bps: player.bps,
          rank,
          web_name: player.web_name,
        });
      });

      rank += tiedPlayers.length;
      i = j - 1;

      if (bonus > 0 && tiedPlayers.length === 1) {
        currentBonusIndex++;
      } else if (bonus > 0 && tiedPlayers.length > 1) {
        currentBonusIndex += this.getBonusPositionsUsed(rank - tiedPlayers.length, tiedPlayers.length);
      }

      if (currentBonusIndex >= bonusPoints.length) break;
    }

    return results;
  }

  private getBonusForRankAndTies(
    rank: number, 
    tiedCount: number, 
    bonusPoints: number[], 
    currentBonusIndex: number
  ): number {
    if (currentBonusIndex >= bonusPoints.length) return 0;

    if (rank === 1) {
      if (tiedCount === 1) return bonusPoints[0];
      if (tiedCount === 2) return bonusPoints[1];
      if (tiedCount >= 3) return bonusPoints[2];
    }

    if (rank === 2) {
      if (tiedCount === 1) return bonusPoints[1];
      if (tiedCount >= 2) return bonusPoints[2];
    }

    if (rank === 3) {
      if (tiedCount >= 1) return bonusPoints[2];
    }

    return 0;
  }

  private getBonusPositionsUsed(startRank: number, tiedCount: number): number {
    if (startRank === 1) {
      if (tiedCount === 2) return 2;
      if (tiedCount >= 3) return 3;
      return 1;
    }
    if (startRank === 2) {
      if (tiedCount >= 2) return 2;
      return 1;
    }
    if (startRank === 3) return 1;
    return 0;
  }

  calculateAllFixturesBonuses(
    fixtures: Array<{
      id: number;
      team_h: number;
      team_a: number;
      started: boolean;
      finished: boolean;
    }>,
    livePlayerStats: Array<{
      player_id: number;
      bps: number;
      minutes: number;
      player?: {
        web_name: string;
        team: number;
      };
    }>
  ): FixtureBonusResult[] {
    const activeFixtures = fixtures.filter(f => f.started && !f.finished);
    
    return activeFixtures.map(fixture => {
      const fixturePlayers = livePlayerStats
        .filter(stats => 
          stats.player?.team === fixture.team_h || 
          stats.player?.team === fixture.team_a
        )
        .map(stats => ({
          player_id: stats.player_id,
          bps: stats.bps,
          web_name: stats.player?.web_name || '',
          team: stats.player?.team || 0,
          minutes: stats.minutes,
        }));

      return this.calculateBonusForFixture(
        fixture.id,
        fixture.team_h,
        fixture.team_a,
        fixturePlayers
      );
    });
  }

  getTotalPredictedBonus(
    managerPicks: Array<{
      player_id: number;
      multiplier: number;
      is_captain: boolean;
    }>,
    fixturesBonuses: FixtureBonusResult[]
  ): number {
    let totalBonus = 0;

    managerPicks.forEach(pick => {
      fixturesBonuses.forEach(fixture => {
        const playerBonus = fixture.bonuses.find(b => b.player_id === pick.player_id);
        if (playerBonus) {
          totalBonus += playerBonus.predicted_bonus * pick.multiplier;
        }
      });
    });

    return totalBonus;
  }

  getPlayerPredictedBonus(
    playerId: number,
    fixturesBonuses: FixtureBonusResult[]
  ): number {
    for (const fixture of fixturesBonuses) {
      const playerBonus = fixture.bonuses.find(b => b.player_id === playerId);
      if (playerBonus) {
        return playerBonus.predicted_bonus;
      }
    }
    return 0;
  }

  formatBonusDisplay(bonus: number): string {
    return bonus > 0 ? `+${bonus}` : '0';
  }

  getBonusRankDisplay(bonusResult: BonusResult): string {
    const { predicted_bonus, rank, bps } = bonusResult;
    
    if (predicted_bonus > 0) {
      return `${rank}${this.getOrdinalSuffix(rank)} (${bps} BPS) - ${predicted_bonus} pts`;
    }
    
    return `${rank}${this.getOrdinalSuffix(rank)} (${bps} BPS)`;
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    
    return 'th';
  }

  validateBPSConsistency(
    fixtureStats: Array<{
      fixture_id: number;
      identifier: string;
      player_id: number;
      value: number;
    }>,
    liveStats: Array<{
      player_id: number;
      bps: number;
    }>
  ): boolean {
    const liveBPSMap = new Map(liveStats.map(stat => [stat.player_id, stat.bps]));
    
    const calculatedBPS = new Map<number, number>();
    
    fixtureStats
      .filter(stat => stat.identifier === 'bps')
      .forEach(stat => {
        calculatedBPS.set(stat.player_id, stat.value);
      });

    for (const [playerId, liveBPS] of liveBPSMap) {
      const calculatedValue = calculatedBPS.get(playerId) || 0;
      if (Math.abs(liveBPS - calculatedValue) > 1) {
        console.warn(`BPS mismatch for player ${playerId}: live=${liveBPS}, calculated=${calculatedValue}`);
        return false;
      }
    }

    return true;
  }
}

export const bonusPredictor = new BonusPredictionService();