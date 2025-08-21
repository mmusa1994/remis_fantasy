import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";
import { fplDb } from "@/lib/fpl-db";

interface LiveEvent {
  id: string;
  gw: number;
  fixture_id: number;
  event_type: string;
  player_id: number;
  delta_value: number;
  side: "H" | "A";
  occurred_at: string;
  player?: {
    web_name: string;
    first_name: string;
    second_name: string;
  };
  fixture?: {
    team_h_data: { short_name: string };
    team_a_data: { short_name: string };
  };
}

// In-memory cache for previous fixture stats
const fixtureStatsCache: { [key: string]: any } = {};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gw = searchParams.get("gw");
  const limit = searchParams.get("limit");

  if (!gw) {
    return NextResponse.json(
      {
        success: false,
        error: "Gameweek parameter is required",
      },
      { status: 400 }
    );
  }

  const gameweek = parseInt(gw, 10);
  const eventLimit = limit ? parseInt(limit, 10) : 50;

  if (isNaN(gameweek)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid gameweek parameter",
      },
      { status: 400 }
    );
  }

  try {
    // Fetch live data from API
    const [fixtures, playersData] = await Promise.all([
      fplApi.getFixtures(gameweek),
      fplDb.getAllPlayers(), // Get player names from DB
    ]);

    const events: LiveEvent[] = [];
    const cacheKey = `gw_${gameweek}`;
    const previousStats = fixtureStatsCache[cacheKey] || {};
    const currentStats: any = {};

    // Generate events from fixture stats changes
    for (const fixture of fixtures) {
      if (!fixture.started) continue;

      const fixtureKey = `fixture_${fixture.id}`;
      currentStats[fixtureKey] = {};

      for (const stat of fixture.stats) {
        const statKey = stat.identifier;

        // Process home team stats
        stat.h.forEach((playerStat: any) => {
          const playerKey = `${statKey}_${playerStat.element}_H`;
          const currentValue = playerStat.value;
          const previousValue = previousStats[fixtureKey]?.[playerKey] || 0;
          const delta = currentValue - previousValue;

          currentStats[fixtureKey][playerKey] = currentValue;

          if (delta > 0) {
            const player = playersData.find((p) => p.id === playerStat.element);
            const event: LiveEvent = {
              id: `${fixture.id}_${
                playerStat.element
              }_${statKey}_${Date.now()}`,
              gw: gameweek,
              fixture_id: fixture.id,
              event_type: statKey,
              player_id: playerStat.element,
              delta_value: delta,
              side: "H" as const,
              occurred_at: new Date().toISOString(),
              player: player
                ? {
                    web_name: player.web_name,
                    first_name: player.first_name,
                    second_name: player.second_name,
                  }
                : undefined,
              fixture: {
                team_h_data: { short_name: `Team${fixture.team_h}` },
                team_a_data: { short_name: `Team${fixture.team_a}` },
              },
            };
            events.push(event);
          }
        });

        // Process away team stats
        stat.a.forEach((playerStat: any) => {
          const playerKey = `${statKey}_${playerStat.element}_A`;
          const currentValue = playerStat.value;
          const previousValue = previousStats[fixtureKey]?.[playerKey] || 0;
          const delta = currentValue - previousValue;

          currentStats[fixtureKey][playerKey] = currentValue;

          if (delta > 0) {
            const player = playersData.find((p) => p.id === playerStat.element);
            const event: LiveEvent = {
              id: `${fixture.id}_${
                playerStat.element
              }_${statKey}_${Date.now()}`,
              gw: gameweek,
              fixture_id: fixture.id,
              event_type: statKey,
              player_id: playerStat.element,
              delta_value: delta,
              side: "A" as const,
              occurred_at: new Date().toISOString(),
              player: player
                ? {
                    web_name: player.web_name,
                    first_name: player.first_name,
                    second_name: player.second_name,
                  }
                : undefined,
              fixture: {
                team_h_data: { short_name: `Team${fixture.team_h}` },
                team_a_data: { short_name: `Team${fixture.team_a}` },
              },
            };
            events.push(event);
          }
        });
      }
    }

    // Update cache with current stats
    fixtureStatsCache[cacheKey] = currentStats;

    // Sort events by timestamp (newest first)
    const sortedEvents = events
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )
      .slice(0, eventLimit);

    return NextResponse.json({
      success: true,
      data: sortedEvents,
      count: sortedEvents.length,
      gameweek,
      limit: eventLimit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating live events:", error);

    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      gameweek: gameweek,
      limit: eventLimit,
      error: "Failed to generate live events",
      timestamp: new Date().toISOString(),
    });
  }
}
