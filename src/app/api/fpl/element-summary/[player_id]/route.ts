import { NextRequest, NextResponse } from "next/server";
import { FPLPlayerService } from "@/services/fpl";

// Initialize FPL services
const playerService = FPLPlayerService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { player_id: string } }
) {
  const startTime = Date.now();

  try {
    const playerId = parseInt(params.player_id, 10);

    if (isNaN(playerId) || playerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid player ID parameter",
        },
        { status: 400 }
      );
    }

    // Get player summary using service
    const summaryResponse = await playerService.getPlayerSummary(playerId);

    if (!summaryResponse.success || !summaryResponse.data) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    const data = summaryResponse.data;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data,
      player_id: playerId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: summaryResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Element Summary API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      player_id: params.player_id,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
