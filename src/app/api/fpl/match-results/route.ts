import { NextRequest, NextResponse } from "next/server";
import { matchResultsService } from "@/lib/match-results-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const gameweek = parseInt(url.searchParams.get("gameweek") || "1");
    const fixtureId = url.searchParams.get("fixtureId");
    const statsOnly = url.searchParams.get("stats") === "true";

    if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek. Must be between 1 and 38.",
        },
        { status: 400 }
      );
    }

    // Return stats only if requested
    if (statsOnly) {
      const stats = await matchResultsService.getGameweekStats(gameweek);
      return NextResponse.json({
        success: true,
        data: stats,
        gameweek,
        timestamp: new Date().toISOString(),
      });
    }

    // Return specific fixture if requested
    if (fixtureId) {
      const fixtureIdNum = parseInt(fixtureId);
      if (isNaN(fixtureIdNum)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid fixture ID",
          },
          { status: 400 }
        );
      }

      const matchResult = await matchResultsService.getLiveMatchUpdate(
        fixtureIdNum,
        gameweek
      );

      if (!matchResult) {
        return NextResponse.json(
          {
            success: false,
            error: "Fixture not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: matchResult,
        gameweek,
        timestamp: new Date().toISOString(),
      });
    }

    // Return all match results for the gameweek
    const matchResults = await matchResultsService.getMatchResults(gameweek);

    return NextResponse.json({
      success: true,
      data: matchResults,
      gameweek,
      count: matchResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching match results:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch match results",
      },
      { status: 500 }
    );
  }
}