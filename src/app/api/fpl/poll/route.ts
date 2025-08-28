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
  try {
    const body = await request.json();
    const { gameweek, secret } = body;

    // Optional secret check (can be disabled for live mode)
    if (secret && secret !== "manual-fetch" && secret !== "auto-poll") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid secret",
        },
        { status: 401 }
      );
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

    // Fetch live data from API using services - no database storage
    const [fixturesResponse, liveDataResponse, eventStatusResponse] =
      await Promise.all([
        fixtureService.getAllFixtures(),
        liveService.getLiveData(gw),
        liveService.getEventStatus(),
      ]);

    // Update bootstrap data (players/teams) using service
    const bootstrapResponse = await bootstrapService.getBootstrapStatic();

    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error("Failed to fetch bootstrap static data");
    }

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
