import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leagueIdParam = searchParams.get("leagueId");
    const managerIdParam = searchParams.get("managerId");
    const pageParam = searchParams.get("page") || "1";
    const pageSizeParam = searchParams.get("pageSize") || "10";

    if (!leagueIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "leagueId parameter is required",
        },
        { status: 400 }
      );
    }

    if (!managerIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId parameter is required",
        },
        { status: 400 }
      );
    }

    const leagueId = parseInt(leagueIdParam, 10);
    const managerId = parseInt(managerIdParam, 10);
    const page = parseInt(pageParam, 10);
    const pageSize = parseInt(pageSizeParam, 10);

    if (isNaN(leagueId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid leagueId parameter",
        },
        { status: 400 }
      );
    }

    if (isNaN(managerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId parameter",
        },
        { status: 400 }
      );
    }

    // Fetch H2H league standings with FPL native pagination
    const h2hStandings = await fplApi.getH2HLeague(leagueId, page);

    const standings = h2hStandings.standings?.results || [];

    // Calculate manager position correctly
    let managerPosition = null;
    const managerIndex = standings.findIndex(
      (entry: any) => entry.entry === managerId
    );

    if (managerIndex !== -1) {
      // Manager found on this page - calculate actual position
      managerPosition = managerIndex + 1 + (page - 1) * pageSize;
    } else {
      // Manager not on this page - try to get position from league data
      // The FPL API sometimes includes overall position data in the league response
      const overallPosition = h2hStandings.standings?.results?.find(
        (entry: any) => entry.entry === managerId
      )?.rank;
      if (overallPosition) {
        managerPosition = overallPosition;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        standings: standings,
        manager_position: managerPosition,
        total_entries: h2hStandings.league?.size || 0,
        current_page: page,
        page_size: pageSize,
        total_pages: Math.ceil((h2hStandings.league?.size || 0) / pageSize),
        league_info: {
          id: leagueId,
          name: h2hStandings.league?.name || "Unknown H2H League",
        },
        user_found: managerIndex !== -1, // Indicate if user was found on this page
      },
      league_id: leagueId,
      manager_id: managerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching H2H league data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
