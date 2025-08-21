import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gw = searchParams.get("gw");

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

    if (isNaN(gameweek)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek parameter",
        },
        { status: 400 }
      );
    }

    // Fetch live data directly from API - no database storage
    const liveData = await fplApi.getLiveData(gameweek);
    const eventStatus = await fplApi.getEventStatus();
    const currentGWStatus = eventStatus.status.find(
      (s) => s.event === gameweek
    );

    return NextResponse.json({
      success: true,
      data: {
        elements: liveData.elements,
        bonus_added: currentGWStatus?.bonus_added || false,
        total_players: liveData.elements.length,
        active_players: liveData.elements.filter((e) => e.stats.minutes > 0)
          .length,
      },
      gameweek,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching live data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
