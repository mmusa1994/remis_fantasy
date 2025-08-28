import { NextRequest, NextResponse } from "next/server";
import {
  FPLLiveService,
  FPLBootstrapService,
  FPLFixtureService,
} from "@/services/fpl";

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

// Initialize FPL services
const bootstrapService = FPLBootstrapService.getInstance();
const fixtureService = FPLFixtureService.getInstance();

// In-memory cache for fixture stats comparison
const fixtureStatsCache: { [key: string]: any } = {};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

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
    // Fetch fixtures using service
    const fixturesResponse = await fixtureService.getAllFixtures();

    if (!fixturesResponse.success || !fixturesResponse.data) {
      throw new Error("Failed to fetch fixtures data");
    }

    // Filter fixtures for the specified gameweek
    const fixtures = fixturesResponse.data.filter(
      (f: any) => f.event === gameweek
    );

    // Get unique player IDs from active fixtures
    const activeFixtures = fixtures.filter((f: any) => f.started);
    const playerIds = new Set<number>();

    activeFixtures.forEach((fixture: any) => {
      fixture.stats?.forEach((stat: any) => {
        stat.h?.forEach((p: any) => playerIds.add(p.element));
        stat.a?.forEach((p: any) => playerIds.add(p.element));
      });
    });

    // Get players and teams data using services
    const [playersResponse, teamsResponse] = await Promise.all([
      bootstrapService.getAllPlayers(),
      bootstrapService.getAllTeams(),
    ]);

    if (
      !playersResponse.success ||
      !teamsResponse.success ||
      !playersResponse.data ||
      !teamsResponse.data
    ) {
      throw new Error("Failed to fetch players or teams data");
    }

    // Create lookup maps for O(1) access
    const playersCache: { [key: number]: any } = {};
    const teamsCache: { [key: number]: any } = {};

    playersResponse.data.forEach((player) => {
      playersCache[player.id] = player;
    });

    teamsResponse.data.forEach((team) => {
      teamsCache[team.id] = team;
    });

    const events: LiveEvent[] = [];
    const cacheKey = `gw_${gameweek}`;
    const previousStats = fixtureStatsCache[cacheKey] || {};
    const currentStats: any = {};

    let totalChangesDetected = 0;

    // Generate events from fixture stats changes
    for (const fixture of fixtures) {
      if (!fixture.started) continue;

      const fixtureKey = `fixture_${fixture.id}`;
      currentStats[fixtureKey] = {};

      if (!fixture.stats || !Array.isArray(fixture.stats)) {
        continue;
      }

      for (const stat of fixture.stats) {
        const statKey = stat.identifier;

        // Process home team stats
        if (stat.h && Array.isArray(stat.h)) {
          stat.h.forEach((playerStat: any) => {
            const playerKey = `${statKey}_${playerStat.element}_H`;
            const currentValue = playerStat.value;
            const previousValue = previousStats[fixtureKey]?.[playerKey] || 0;
            const delta = currentValue - previousValue;

            currentStats[fixtureKey][playerKey] = currentValue;

            if (delta > 0) {
              totalChangesDetected++;
              const player = playersCache[playerStat.element];
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
                  team_h_data: {
                    short_name:
                      teamsCache[fixture.team_h]?.short_name ||
                      `Team${fixture.team_h}`,
                  },
                  team_a_data: {
                    short_name:
                      teamsCache[fixture.team_a]?.short_name ||
                      `Team${fixture.team_a}`,
                  },
                },
              };
              events.push(event);
            }
          });
        }

        // Process away team stats
        if (stat.a && Array.isArray(stat.a)) {
          stat.a.forEach((playerStat: any) => {
            const playerKey = `${statKey}_${playerStat.element}_A`;
            const currentValue = playerStat.value;
            const previousValue = previousStats[fixtureKey]?.[playerKey] || 0;
            const delta = currentValue - previousValue;

            currentStats[fixtureKey][playerKey] = currentValue;

            if (delta > 0) {
              totalChangesDetected++;
              const player = playersCache[playerStat.element];
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
                  team_h_data: {
                    short_name:
                      teamsCache[fixture.team_h]?.short_name ||
                      `Team${fixture.team_h}`,
                  },
                  team_a_data: {
                    short_name:
                      teamsCache[fixture.team_a]?.short_name ||
                      `Team${fixture.team_a}`,
                  },
                },
              };
              events.push(event);
            }
          });
        }
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

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: sortedEvents,
      count: sortedEvents.length,
      gameweek,
      limit: eventLimit,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Live events generation failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      gameweek,
    });

    // Return empty events list to keep frontend functional
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      gameweek: gameweek,
      limit: eventLimit,
      error: "Failed to generate live events",
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
    });
  }
}
