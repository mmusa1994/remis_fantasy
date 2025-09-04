import { NextRequest, NextResponse } from "next/server";
import { FPLFixtureService } from "@/services/fpl";

const fixtureService = FPLFixtureService.getInstance();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const eventParam = searchParams.get("event");

    if (!eventParam) {
      return NextResponse.json(
        {
          success: false,
          error: "event (gameweek) parameter is required",
        },
        { status: 400 }
      );
    }

    let gameweek = parseInt(eventParam, 10);
    if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek. Must be between 1 and 38",
        },
        { status: 400 }
      );
    }

    // Try to get fixtures with fallback logic (GW4 → GW3 → GW2)
    let fixturesResponse;
    const originalGameweek = gameweek;
    let fallbackApplied = false;

    try {
      fixturesResponse = await fixtureService.getGameweekFixtures(gameweek);

      // If no data found or empty data, try fallback
      if (
        !fixturesResponse.success ||
        !fixturesResponse.data ||
        fixturesResponse.data.length === 0
      ) {
        throw new Error(`No fixtures found for gameweek ${gameweek}`);
      }
    } catch (error) {
      // Apply fallback logic: try previous gameweeks until we find data
      console.log(`⬇️ GW${gameweek} fixtures failed, trying fallback...`);

      const attemptedGameweeks = [gameweek];
      fallbackApplied = true;

      while (gameweek > 1 && attemptedGameweeks.length < 3) {
        gameweek--;
        attemptedGameweeks.push(gameweek);

        console.log(`🔄 Trying fallback to GW${gameweek}`);

        try {
          fixturesResponse = await fixtureService.getGameweekFixtures(gameweek);

          if (
            fixturesResponse.success &&
            fixturesResponse.data &&
            fixturesResponse.data.length > 0
          ) {
            console.log(`✅ Found fixtures data in GW${gameweek}`);
            break;
          }
        } catch (fallbackError) {
          console.log(`❌ GW${gameweek} also failed:`, fallbackError);
          continue;
        }
      }

      // If all fallback attempts failed
      if (
        !fixturesResponse ||
        !fixturesResponse.success ||
        !fixturesResponse.data ||
        fixturesResponse.data.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Gameweek ${originalGameweek} data not available yet. Tried fallback to gameweeks: ${attemptedGameweeks.join(
              ", "
            )}`,
            attempted_gameweeks: attemptedGameweeks,
            original_gameweek: originalGameweek,
          },
          { status: 404 }
        );
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: fixturesResponse.data,
      gameweek: gameweek,
      original_gameweek: originalGameweek,
      fallback_applied: fallbackApplied,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: fixturesResponse.cache_hit || false,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Fixtures API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch fixtures",
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
