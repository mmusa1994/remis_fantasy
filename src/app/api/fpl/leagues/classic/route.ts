import { NextRequest, NextResponse } from "next/server";
import { FPLService } from "@/services/fpl";

const fplService = FPLService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leagueIdParam = searchParams.get("leagueId");
    const managerIdParam = searchParams.get("managerId");
    const pageParam = searchParams.get("page") || "1";

    if (!leagueIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "leagueId parameter is required",
        },
        { status: 400 }
      );
    }

    const leagueId = parseInt(leagueIdParam, 10);
    const page = parseInt(pageParam, 10);
    let managerId: number | undefined;

    if (managerIdParam) {
      managerId = parseInt(managerIdParam, 10);
      if (isNaN(managerId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid managerId parameter",
          },
          { status: 400 }
        );
      }
    }

    if (isNaN(leagueId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid leagueId parameter",
        },
        { status: 400 }
      );
    }

    // Get league standings using optimized service
    // If requesting first page (most common), use optimized top 50 method
    const leagueResponse = page === 1 
      ? await fplService.league.getTopClassicLeagueStandings(leagueId, 50)
        .then(response => ({
          ...response,
          pagination: {
            current_page: 1,
            total_pages: Math.ceil((response.data?.total_entries || 0) / 50),
            page_size: 50,
            total_count: response.data?.total_entries || 0,
            has_next: (response.data?.total_entries || 0) > 50,
            has_previous: false,
          },
          data: response.data ? {
            league: response.data.league_info,
            standings: {
              results: response.data.standings,
              has_next: (response.data?.total_entries || 0) > 50,
            },
          } : null,
        }))
      : await fplService.league.getClassicLeagueStandings(leagueId, page);
    
    if (!leagueResponse.success) {
      return NextResponse.json(leagueResponse);
    }

    // If manager ID provided, get their performance in the league
    let managerPerformance = null;
    if (managerId) {
      try {
        const performanceResponse = await fplService.league.getManagerLeaguePerformance(
          leagueId,
          managerId,
          false
        );
        if (performanceResponse.success) {
          managerPerformance = performanceResponse.data;
        }
      } catch (error) {
        console.warn("Could not get manager performance:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        league: leagueResponse.data,
        pagination: leagueResponse.pagination,
        manager_performance: managerPerformance,
        manager_id: managerId,
      },
      timestamp: new Date().toISOString(),
      cache_hit: leagueResponse.cache_hit,
    });
  } catch (error) {
    console.error("Error fetching classic league data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
