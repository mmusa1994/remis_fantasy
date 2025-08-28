import { NextRequest, NextResponse } from "next/server";
import {
  FPLLiveService,
  FPLFixtureService,
  FPLBootstrapService,
} from "@/services/fpl";

interface PreviousFixtureStats {
  [key: string]: {
    [key: string]: number;
  };
}

// Initialize FPL services
const liveService = FPLLiveService.getInstance();
const fixtureService = FPLFixtureService.getInstance();
const bootstrapService = FPLBootstrapService.getInstance();

export async function POST(request: NextRequest) {
  console.log("🔄 FPL Poll API - Request started");

  try {
    const body = await request.json();
    const { gameweek, secret } = body;

    console.log("📥 Request parameters:", { gameweek, secret });

    // Optional secret check (can be disabled for live mode)
    if (secret && secret !== "manual-fetch" && secret !== "auto-poll") {
      console.log("⚠️ Secret validation failed");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid secret",
        },
        { status: 401 }
      );
    }

    if (!gameweek) {
      console.log("❌ Validation failed: Missing gameweek");
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
      console.log("❌ Validation failed: Invalid gameweek format");
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
      console.log("❌ Validation failed: Gameweek out of range");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek",
        },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed:", { gameweek: gw });

    console.log("📊 Phase 1: Fetching live data from FPL API");

    // Fetch live data from API using services - no database storage
    const [fixturesResponse, liveDataResponse, eventStatusResponse] =
      await Promise.all([
        fixtureService.getAllFixtures(),
        liveService.getLiveData(gw),
        liveService.getEventStatus(),
      ]);

    console.log("✅ Live data fetched:", {
      fixtures_count: fixturesResponse.data?.length || 0,
      live_elements: liveDataResponse.data?.elements?.length || 0,
      event_status: eventStatusResponse.data?.status?.length || 0,
      fixtures_cache_hit: fixturesResponse.cache_hit,
      live_cache_hit: liveDataResponse.cache_hit,
      status_cache_hit: eventStatusResponse.cache_hit,
    });

    console.log("📊 Phase 2: Updating bootstrap data");

    // Update bootstrap data (players/teams) using service
    const bootstrapResponse = await bootstrapService.getBootstrapStatic();

    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      console.log("❌ Failed to get bootstrap data");
      throw new Error("Failed to fetch bootstrap static data");
    }

    console.log("✅ Bootstrap data updated:", {
      players_count: bootstrapResponse.data.elements?.length || 0,
      teams_count: bootstrapResponse.data.teams?.length || 0,
      cache_hit: bootstrapResponse.cache_hit,
    });

    console.log("📊 Phase 3: Processing league updates (if configured)");

    // Note: Since we're using live data only, we don't store league standings
    // The league data will be fetched live when needed
    console.log("✅ League updates skipped - using live data approach");

    console.log("✅ FPL Poll API completed successfully");

    return NextResponse.json({
      success: true,
      message: `Successfully polled gameweek ${gw} data`,
      gameweek: gw,
      timestamp: new Date().toISOString(),
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
      cache_info: {
        fixtures_cache_hit: fixturesResponse.cache_hit,
        live_cache_hit: liveDataResponse.cache_hit,
        status_cache_hit: eventStatusResponse.cache_hit,
        bootstrap_cache_hit: bootstrapResponse.cache_hit,
      },
    });
  } catch (error) {
    console.error("❌ FPL Poll API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
