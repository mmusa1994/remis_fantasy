import { NextRequest, NextResponse } from 'next/server';
import { fplApi } from '@/lib/fpl-api';
import { fplDb } from '@/lib/fpl-db';

interface PreviousFixtureStats {
  [key: string]: {
    [key: string]: number;
  };
}

let previousFixtureStats: PreviousFixtureStats = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameweek, secret } = body;

    const settings = await fplDb.getSettings();
    if (settings?.cron_secret && settings.cron_secret !== secret) {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret'
      }, { status: 401 });
    }

    if (!gameweek) {
      return NextResponse.json({
        success: false,
        error: 'Gameweek is required'
      }, { status: 400 });
    }

    const gw = parseInt(gameweek, 10);
    
    if (isNaN(gw)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid gameweek'
      }, { status: 400 });
    }

    const [fixtures, liveData, eventStatus] = await Promise.all([
      fplApi.getFixtures(gw),
      fplApi.getLiveData(gw),
      fplApi.getEventStatus(),
    ]);

    await Promise.all([
      fplDb.upsertFixtures(fixtures),
      fplDb.upsertLivePlayers(gw, liveData.elements),
    ]);

    const newEvents: any[] = [];
    const currentFixtureStats: PreviousFixtureStats = {};

    for (const fixture of fixtures) {
      if (!fixture.started) continue;

      const fixtureKey = fixture.id.toString();
      currentFixtureStats[fixtureKey] = {};

      for (const stat of fixture.stats) {
        const statKey = `${stat.identifier}`;
        
        [...stat.h, ...stat.a].forEach(playerStat => {
          const playerKey = `${playerStat.element}`;
          const currentValue = playerStat.value;
          
          currentFixtureStats[fixtureKey][`${statKey}_${playerKey}`] = currentValue;
          
          const previousValue = previousFixtureStats[fixtureKey]?.[`${statKey}_${playerKey}`] || 0;
          const delta = currentValue - previousValue;

          if (delta > 0) {
            newEvents.push({
              gw,
              fixture_id: fixture.id,
              event_type: stat.identifier,
              player_id: playerStat.element,
              delta_value: delta,
              side: stat.h.includes(playerStat) ? 'H' : 'A',
            });
          }
        });
      }
    }

    for (const event of newEvents) {
      await fplDb.addEvent(event);
    }

    previousFixtureStats = currentFixtureStats;

    await fplDb.upsertFixtureStats(fixtures);

    const bonusStatus = eventStatus.status.find(s => s.event === gw);
    if (bonusStatus) {
      await fplDb.setGameweekStatus(gw, bonusStatus.bonus_added, true);
    }

    return NextResponse.json({
      success: true,
      data: {
        new_events: newEvents.length,
        fixtures_updated: fixtures.length,
        players_updated: liveData.elements.length,
        bonus_added: bonusStatus?.bonus_added || false,
      },
      gameweek: gw,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error polling FPL data:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}