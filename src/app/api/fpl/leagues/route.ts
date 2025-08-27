import { NextRequest, NextResponse } from "next/server";
import {
  FPLService,
  FPLTeamService,
  FPLLeagueService,
} from "@/services/fpl";

// Initialize FPL services
const fplService = FPLService.getInstance();
const teamService = FPLTeamService.getInstance();
const leagueService = FPLLeagueService.getInstance();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🏆 FPL Leagues API - Request started');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get("managerId");
    
    console.log('📥 Request parameters:', { managerIdParam });

    if (!managerIdParam) {
      console.log('❌ Validation failed: Missing managerId parameter');
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
      console.log('❌ Validation failed: Invalid managerId format');
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
      console.log('❌ Validation failed: Invalid managerId value');
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId parameter",
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed:', { managerId });

    console.log('📊 Phase 1: Fetching manager entry and league information');
    
    // Fetch manager entry using service
    const managerResponse = await teamService.getManagerInfo(managerId);
    
    if (!managerResponse.success || !managerResponse.data) {
      console.log('❌ Failed to get manager entry');
      throw new Error('Manager not found');
    }
    
    const managerEntry = managerResponse.data;
    
    console.log('✅ Manager info loaded:', {
      manager_name: managerEntry.name,
      player_name: `${managerEntry.player_first_name} ${managerEntry.player_last_name}`,
      total_points: managerEntry.summary_overall_points,
      overall_rank: managerEntry.summary_overall_rank,
      cache_hit: managerResponse.cache_hit
    });

    if (!managerEntry.leagues) {
      console.log('⚠️ Manager has no leagues');
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
          database_free: true
        }
      });
    }

    console.log('🏅 Phase 2: Processing league data');
    
    // Return all leagues without fetching standings (lazy loading for performance)
    const classicLeagues = managerEntry.leagues.classic || [];
    const h2hLeagues = managerEntry.leagues.h2h || [];
    
    console.log('🏆 League data processed:', {
      classic_leagues: classicLeagues.length,
      h2h_leagues: h2hLeagues.length,
      total_leagues: classicLeagues.length + h2hLeagues.length
    });
    
    // Log league details for visibility
    if (classicLeagues.length > 0) {
      console.log('🏅 Classic leagues:', classicLeagues.map((league: any) => ({
        id: league.id,
        name: league.name,
        rank: league.entry_rank,
        entries: league.league_entries
      })));
    }
    
    if (h2hLeagues.length > 0) {
      console.log('⚔️ H2H leagues:', h2hLeagues.map((league: any) => ({
        id: league.id,
        name: league.name,
        rank: league.entry_rank,
        entries: league.league_entries
      })));
    }
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Leagues API completed successfully:', {
      manager_id: managerId,
      response_time_ms: responseTime,
      leagues_returned: classicLeagues.length + h2hLeagues.length
    });

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
        database_free: true
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Leagues API failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
      managerId: request.nextUrl.searchParams.get("managerId")
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
