import { NextRequest, NextResponse } from "next/server";
import { FPLTeamService } from "@/services/fpl";

// Initialize FPL services
const teamService = FPLTeamService.getInstance();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ team_id: string }> }
) {
  const params = await context.params;
  const startTime = Date.now();

  try {
    const teamId = parseInt(params.team_id, 10);

    if (isNaN(teamId) || teamId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team ID parameter",
        },
        { status: 400 }
      );
    }

    // Get manager info using service
    const managerResponse = await teamService.getManagerInfo(teamId);

    if (!managerResponse.success || !managerResponse.data) {
      throw new Error(`Manager with ID ${teamId} not found`);
    }

    const data = managerResponse.data;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data,
      team_id: teamId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: managerResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Entry API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      team_id: params.team_id,
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
