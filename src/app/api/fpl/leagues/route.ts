import { NextRequest, NextResponse } from "next/server";
import { FPLTeamService } from "@/services/fpl";

// Initialize FPL services
const teamService = FPLTeamService.getInstance();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get("managerId");

    if (!managerIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate managerId is a positive integer
    if (!/^\d+$/.test(managerIdParam)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId parameter",
        },
        { status: 400 }
      );
    }

    const managerId = Number(managerIdParam);

    if (!Number.isSafeInteger(managerId) || managerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId parameter",
        },
        { status: 400 }
      );
    }

    // Fetch manager entry using service
    const managerResponse = await teamService.getManagerInfo(managerId);

    if (!managerResponse.success || !managerResponse.data) {
      throw new Error("Manager not found");
    }

    const managerEntry = managerResponse.data;

    if (!managerEntry.leagues) {
      const responseTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: {
          classic: [],
          h2h: [],
          manager: managerEntry,
        },
        manager_id: managerId,
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        data_sources: {
          using_services: true,
          database_free: true,
        },
      });
    }

    // Return all leagues without fetching standings (lazy loading for performance)
    const classicLeagues = managerEntry.leagues.classic || [];
    const h2hLeagues = managerEntry.leagues.h2h || [];

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        classic: classicLeagues,
        h2h: h2hLeagues,
        manager: managerEntry,
      },
      manager_id: managerId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      data_sources: {
        using_services: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Leagues API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      managerId: request.nextUrl.searchParams.get("managerId"),
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
