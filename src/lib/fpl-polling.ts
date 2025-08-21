import { fplApi } from './fpl-api';
import { fplDb } from './fpl-db';

interface PollConfig {
  gameweek: number;
  intervalMs: number;
  onEvent?: (event: any) => void;
  onError?: (error: Error) => void;
}

class FPLPollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private previousFixtureStats: Map<string, any> = new Map();

  async startPolling(config: PollConfig): Promise<string> {
    const pollId = `gw${config.gameweek}_${Date.now()}`;
    
    if (this.intervals.has(pollId)) {
      throw new Error(`Polling already active for ${pollId}`);
    }

    const pollFunction = async () => {
      try {
        await this.pollGameweekData(config);
      } catch (error) {
        console.error(`Polling error for ${pollId}:`, error);
        if (config.onError) {
          config.onError(error instanceof Error ? error : new Error('Unknown polling error'));
        }
      }
    };

    await pollFunction();

    const interval = setInterval(pollFunction, config.intervalMs);
    this.intervals.set(pollId, interval);

    console.log(`Started polling for gameweek ${config.gameweek} with ID ${pollId}`);
    return pollId;
  }

  stopPolling(pollId: string): boolean {
    const interval = this.intervals.get(pollId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(pollId);
      this.previousFixtureStats.delete(pollId);
      console.log(`Stopped polling for ${pollId}`);
      return true;
    }
    return false;
  }

  stopAllPolling(): void {
    for (const [pollId, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped polling for ${pollId}`);
    }
    this.intervals.clear();
    this.previousFixtureStats.clear();
  }

  getActivePolls(): string[] {
    return Array.from(this.intervals.keys());
  }

  private async pollGameweekData(config: PollConfig): Promise<void> {
    const { gameweek } = config;
    
    const [fixtures, liveData, eventStatus] = await Promise.all([
      fplApi.getFixtures(gameweek),
      fplApi.getLiveData(gameweek),
      fplApi.getEventStatus(),
    ]);

    await Promise.all([
      fplDb.upsertFixtures(fixtures),
      fplDb.upsertLivePlayers(gameweek, liveData.elements),
    ]);

    const activeFixtures = fixtures.filter(f => f.started && !f.finished);
    const events = [];

    for (const fixture of activeFixtures) {
      const fixtureKey = `${gameweek}_${fixture.id}`;
      const previousStats = this.previousFixtureStats.get(fixtureKey) || {};

      for (const stat of fixture.stats) {
        const allPlayers = [...stat.h, ...stat.a];
        
        for (const playerStat of allPlayers) {
          const statKey = `${stat.identifier}_${playerStat.element}`;
          const currentValue = playerStat.value;
          const previousValue = previousStats[statKey] || 0;
          const delta = currentValue - previousValue;

          if (delta > 0) {
            const event = {
              gw: gameweek,
              fixture_id: fixture.id,
              event_type: stat.identifier,
              player_id: playerStat.element,
              delta_value: delta,
              side: stat.h.includes(playerStat) ? 'H' : 'A' as 'H' | 'A',
            };

            events.push(event);
            
            if (config.onEvent) {
              config.onEvent(event);
            }
          }

          previousStats[statKey] = currentValue;
        }
      }

      this.previousFixtureStats.set(fixtureKey, previousStats);
    }

    if (events.length > 0) {
      await Promise.all(
        events.map(event => fplDb.addEvent(event))
      );
    }

    await fplDb.upsertFixtureStats(fixtures);

    const bonusStatus = eventStatus.status.find(s => s.event === gameweek);
    if (bonusStatus) {
      await fplDb.setGameweekStatus(gameweek, bonusStatus.bonus_added, true);
    }

    console.log(`Poll completed for GW${gameweek}: ${events.length} new events, ${activeFixtures.length} active fixtures`);
  }

  async getGameweekSummary(gameweek: number) {
    const [fixtures, gwStatus, recentEvents] = await Promise.all([
      fplDb.getFixturesForGameweek(gameweek),
      fplDb.getGameweekStatus(gameweek),
      fplDb.getRecentEvents(gameweek, 10),
    ]);

    const activeFixtures = fixtures.filter(f => f.started && !f.finished);
    const finishedFixtures = fixtures.filter(f => f.finished);

    return {
      gameweek,
      total_fixtures: fixtures.length,
      active_fixtures: activeFixtures.length,
      finished_fixtures: finishedFixtures.length,
      bonus_added: gwStatus?.bonus_added || false,
      recent_events: recentEvents.length,
      last_updated: new Date().toISOString(),
    };
  }

  async validateDataConsistency(gameweek: number): Promise<{
    consistent: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const [fixtures, liveData] = await Promise.all([
        fplDb.getFixturesForGameweek(gameweek),
        fplDb.getLivePlayerStats(gameweek, [])
      ]);

      const activeFixtures = fixtures.filter(f => f.started);
      if (activeFixtures.length === 0 && liveData.length > 0) {
        issues.push('Live player data exists but no active fixtures found');
      }

      const playersWithMinutes = liveData.filter(p => p.minutes > 0);
      if (playersWithMinutes.length === 0 && activeFixtures.length > 0) {
        issues.push('Active fixtures exist but no players with minutes played');
      }

    } catch (error) {
      issues.push(`Data validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  }
}

export const fplPoller = new FPLPollingService();