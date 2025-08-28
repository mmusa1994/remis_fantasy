import { NextRequest, NextResponse } from "next/server";
import { FPLTeamService } from "@/services/fpl";

// Initialize FPL services
const teamService = FPLTeamService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { team_id: string; event_id: string } }
) {
  const startTime = Date.now();

  try {
    const teamId = parseInt(params.team_id, 10);
    const eventId = parseInt(params.event_id, 10);

    if (isNaN(teamId) || teamId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team ID parameter",
        },
        { status: 400 }
      );
    }

    if (isNaN(eventId) || eventId <= 0 || eventId > 38) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID parameter",
        },
        { status: 400 }
      );
    }

    // Get manager picks using service
    const picksResponse = await teamService.getManagerPicks(teamId, eventId);

    if (!picksResponse.success || !picksResponse.data) {
      throw new Error(
        `Picks for team ${teamId} in gameweek ${eventId} not found`
      );
    }

    const data = picksResponse.data;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data,
      team_id: teamId,
      event_id: eventId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: picksResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Entry Picks API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      team_id: params.team_id,
      event_id: params.event_id,
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
