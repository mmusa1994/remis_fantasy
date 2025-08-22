import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";
import { fplDb } from "@/lib/fpl-db";

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

    // Optional secret check (can be disabled for live mode)
    if (secret && secret !== "manual-fetch" && secret !== "auto-poll") {
      const settings = await fplDb.getSettings();
      if (settings?.cron_secret && settings.cron_secret !== secret) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid secret",
          },
          { status: 401 }
        );
      }
    }

    if (!gameweek) {
      return NextResponse.json(
        {
          success: false,
          error: "Gameweek is required",
        },
        { status: 400 }
      );
    }

    // Validate gameweek is an integer within valid range
    if (!/^\d+$/.test(gameweek)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek",
        },
        { status: 400 }
      );
    }

    const gw = Number(gameweek);

    if (!Number.isInteger(gw) || gw < 1 || gw > 38) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek",
        },
        { status: 400 }
      );
    }

    // Fetch live data from API - no database storage
    const [fixtures, liveData, eventStatus] = await Promise.all([
      fplApi.getFixtures(gw),
      fplApi.getLiveData(gw),
      fplApi.getEventStatus(),
    ]);

    // Update bootstrap data (players/teams) and league standings
    await fplDb.upsertBootstrapData(await fplApi.getBootstrapStatic());

    // Get settings to determine which leagues to update
    const settings = await fplDb.getSettings();
    
    // Update league standings if configured
    const leagueUpdates: Promise<any>[] = [];
    
    if (settings?.standard_league_id) {
      leagueUpdates.push(
        fplApi.getAllLeagueStandings(settings.standard_league_id, 110)
          .then(standingsData => {
            if (standingsData.standings?.results) {
              return fplDb.updateLeagueStandings(
                standingsData.standings.results.map((entry: any) => ({
                  entry_id: entry.entry,
                  entry_name: entry.entry_name,
                  player_name: entry.player_name,
                  total: entry.total,
                  rank: entry.rank
                })),
                "standard"
              );
            }
          })
          .catch(error => console.error("Error updating standard league:", error))
      );
    }
    
    if (settings?.premium_league_id) {
      leagueUpdates.push(
        fplApi.getAllLeagueStandings(settings.premium_league_id, 50)
          .then(standingsData => {
            if (standingsData.standings?.results) {
              return fplDb.updateLeagueStandings(
                standingsData.standings.results.map((entry: any) => ({
                  entry_id: entry.entry,
                  entry_name: entry.entry_name,
                  player_name: entry.player_name,
                  total: entry.total,
                  rank: entry.rank
                })),
                "premium"
              );
            }
          })
          .catch(error => console.error("Error updating premium league:", error))
      );
    }
    
    if (settings?.h2h_league_id) {
      leagueUpdates.push(
        fplApi.getH2HLeague(settings.h2h_league_id, 1)
          .then(standingsData => {
            if (standingsData.standings?.results) {
              return fplDb.updateLeagueStandings(
                standingsData.standings.results.map((entry: any) => ({
                  entry_id: entry.entry,
                  entry_name: entry.entry_name,
                  player_name: entry.player_name,
                  total: entry.total,
                  rank: entry.rank
                })),
                "h2h"
              );
            }
          })
          .catch(error => console.error("Error updating h2h league:", error))
      );
    }
    
    if (settings?.h2h2_league_id) {
      leagueUpdates.push(
        fplApi.getH2HLeague(settings.h2h2_league_id, 1)
          .then(standingsData => {
            if (standingsData.standings?.results) {
              return fplDb.updateLeagueStandings(
                standingsData.standings.results.map((entry: any) => ({
                  entry_id: entry.entry,
                  entry_name: entry.entry_name,
                  player_name: entry.player_name,
                  total: entry.total,
                  rank: entry.rank
                })),
                "h2h2"
              );
            }
          })
          .catch(error => console.error("Error updating h2h2 league:", error))
      );
    }
    
    // Execute all league updates concurrently
    await Promise.all(leagueUpdates);

    // Count new events without storing them
    const newEvents: any[] = [];
    const currentFixtureStats: PreviousFixtureStats = {};

    for (const fixture of fixtures) {
      if (!fixture.started) continue;

      const fixtureKey = fixture.id.toString();
      currentFixtureStats[fixtureKey] = {};

      for (const stat of fixture.stats) {
        const statKey = `${stat.identifier}`;

        // Guard against missing stat arrays
        const homeStats = stat.h || [];
        const awayStats = stat.a || [];

        // Ensure previousFixtureStats[fixtureKey] exists
        if (!previousFixtureStats[fixtureKey]) {
          previousFixtureStats[fixtureKey] = {};
        }

        [...homeStats, ...awayStats].forEach((playerStat) => {
          // Skip if playerStat.value is undefined
          if (playerStat.value === undefined) return;

          const playerKey = `${playerStat.element}`;
          const currentValue = playerStat.value;

          currentFixtureStats[fixtureKey][`${statKey}_${playerKey}`] =
            currentValue;

          const previousValue =
            previousFixtureStats[fixtureKey][`${statKey}_${playerKey}`] || 0;
          const delta = currentValue - previousValue;

          // Compute side by comparing player element id
          const isHomePlayer = homeStats.some(
            (p) => p.element === playerStat.element
          );
          const side = isHomePlayer ? "H" : "A";

          if (delta > 0) {
            newEvents.push({
              gw,
              fixture_id: fixture.id,
              event_type: stat.identifier,
              player_id: playerStat.element,
              delta_value: delta,
              side,
            });
          }
        });
      }
    }

    // Update in-memory stats for next comparison
    previousFixtureStats = currentFixtureStats;

    const bonusStatus = eventStatus.status.find((s) => s.event === gw);

    return NextResponse.json({
      success: true,
      data: {
        new_events: newEvents.length,
        fixtures_total: fixtures.length,
        fixtures_started: fixtures.filter((f) => f.started).length,
        fixtures_finished: fixtures.filter((f) => f.finished).length,
        players_updated: liveData.elements.length,
        players_active: liveData.elements.filter((e) => e.stats.minutes > 0)
          .length,
        bonus_added: bonusStatus?.bonus_added || false,
        leagues_updated: [
          settings?.premium_league_id && "premium",
          settings?.standard_league_id && "standard (110 teams)",
          settings?.h2h_league_id && "h2h",
          settings?.h2h2_league_id && "h2h2"
        ].filter(Boolean),
      },
      gameweek: gw,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error polling FPL data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
