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

    // Fetch classic league standings with FPL native pagination
    const leagueStandings = await fplApi.getLeagueStandings(leagueId, page);
    
    const standings = leagueStandings.standings?.results || [];
    const managerPosition = leagueStandings.standings?.results?.findIndex(
      (entry: any) => entry.entry === managerId
    ) + 1 + ((page - 1) * pageSize) || null;

    return NextResponse.json({
      success: true,
      data: {
        standings: standings,
        manager_position: managerPosition,
        total_entries: leagueStandings.league?.size || 0,
        current_page: page,
        page_size: pageSize,
        total_pages: Math.ceil((leagueStandings.league?.size || 0) / pageSize),
        league_info: {
          id: leagueId,
          name: leagueStandings.league?.name || "Unknown League",
        },
      },
      league_id: leagueId,
      manager_id: managerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching classic league data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}