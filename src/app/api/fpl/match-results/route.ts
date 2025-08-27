import { NextRequest, NextResponse } from "next/server";
import { FPLService, FPLFixtureService, FPLLiveService } from "@/services/fpl";

// Initialize FPL services
const fplService = FPLService.getInstance();
const fixtureService = FPLFixtureService.getInstance();
const liveService = FPLLiveService.getInstance();

export async function GET(request: NextRequest) {
  console.log("⚽ FPL Match Results API - Request started");

  try {
    const url = new URL(request.url);
    const gameweek = parseInt(url.searchParams.get("gameweek") || "1");
    const fixtureId = url.searchParams.get("fixtureId");
    const statsOnly = url.searchParams.get("stats") === "true";

    console.log("📥 Request parameters:", { gameweek, fixtureId, statsOnly });

    if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      console.log("❌ Validation failed: Invalid gameweek");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek. Must be between 1 and 38.",
        },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed:", { gameweek });

    console.log("📊 Phase 1: Fetching fixtures and live data");

    // Fetch fixtures and live data using services
    const [fixturesResponse, liveDataResponse] = await Promise.all([
      fixtureService.getAllFixtures(),
      liveService.getLiveData(gameweek),
    ]);

    if (
      !fixturesResponse.success ||
      !liveDataResponse.success ||
      !fixturesResponse.data ||
      !liveDataResponse.data
    ) {
      throw new Error("Failed to fetch fixtures or live data");
    }

    // Filter fixtures for the specified gameweek
    const gameweekFixtures = fixturesResponse.data.filter(
      (f: any) => f.event === gameweek
    );

    console.log("✅ Data loaded:", {
      total_fixtures: fixturesResponse.data.length,
      gameweek_fixtures: gameweekFixtures.length,
      live_elements: liveDataResponse.data.elements?.length || 0,
      fixtures_cache_hit: fixturesResponse.cache_hit,
      live_cache_hit: liveDataResponse.cache_hit,
    });

    // Return stats only if requested
    if (statsOnly) {
      console.log("📊 Returning gameweek stats");

      const stats = {
        total_fixtures: gameweekFixtures.length,
        started_fixtures: gameweekFixtures.filter((f: any) => f.started).length,
        finished_fixtures: gameweekFixtures.filter((f: any) => f.finished)
          .length,
        total_players: liveDataResponse.data.elements?.length || 0,
        active_players:
          liveDataResponse.data.elements?.filter(
            (e: any) => e.stats?.minutes > 0
          ).length || 0,
        gameweek: gameweek,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: stats,
        gameweek,
        timestamp: new Date().toISOString(),
        cache_info: {
          fixtures_cache_hit: fixturesResponse.cache_hit,
          live_cache_hit: liveDataResponse.cache_hit,
        },
      });
    }

    // Return specific fixture if requested
    if (fixtureId) {
      console.log("🎯 Returning specific fixture:", fixtureId);

      const fixtureIdNum = parseInt(fixtureId);
      if (isNaN(fixtureIdNum)) {
        console.log("❌ Validation failed: Invalid fixture ID");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid fixture ID",
          },
          { status: 400 }
        );
      }

      const fixture = gameweekFixtures.find((f: any) => f.id === fixtureIdNum);

      if (!fixture) {
        console.log("❌ Fixture not found:", fixtureIdNum);
        return NextResponse.json(
          {
            success: false,
            error: "Fixture not found",
          },
          { status: 404 }
        );
      }

      // Get live stats for this fixture
      const fixtureStats =
        liveDataResponse.data.elements?.filter((e: any) =>
          e.explain?.some((explain: any) => explain.fixture === fixtureIdNum)
        ) || [];

      const matchResult = {
        ...fixture,
        live_stats: fixtureStats,
        gameweek: gameweek,
        timestamp: new Date().toISOString(),
      };

      console.log("✅ Fixture data prepared:", {
        fixture_id: fixtureIdNum,
        live_stats_count: fixtureStats.length,
      });

      return NextResponse.json({
        success: true,
        data: matchResult,
        gameweek,
        timestamp: new Date().toISOString(),
        cache_info: {
          fixtures_cache_hit: fixturesResponse.cache_hit,
          live_cache_hit: liveDataResponse.cache_hit,
        },
      });
    }

    // Return all match results for the gameweek
    console.log("📋 Returning all match results for gameweek:", gameweek);

    const matchResults = gameweekFixtures.map((fixture: any) => {
      // Get live stats for this fixture
      const fixtureStats =
        liveDataResponse.data.elements?.filter((e: any) =>
          e.explain?.some((explain: any) => explain.fixture === fixture.id)
        ) || [];

      return {
        ...fixture,
        live_stats: fixtureStats,
        gameweek: gameweek,
      };
    });

    console.log("✅ Match results prepared:", {
      gameweek: gameweek,
      fixtures_count: matchResults.length,
      total_live_stats: matchResults.reduce(
        (sum: number, fixture: any) => sum + fixture.live_stats.length,
        0
      ),
    });

    return NextResponse.json({
      success: true,
      data: matchResults,
      gameweek,
      count: matchResults.length,
      timestamp: new Date().toISOString(),
      cache_info: {
        fixtures_cache_hit: fixturesResponse.cache_hit,
        live_cache_hit: liveDataResponse.cache_hit,
      },
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching match results:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch match results",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
