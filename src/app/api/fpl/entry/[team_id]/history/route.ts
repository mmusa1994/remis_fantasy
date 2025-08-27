import { NextRequest, NextResponse } from "next/server";
import {
  FPLService,
  FPLTeamService,
} from "@/services/fpl";

// Initialize FPL services
const fplService = FPLService.getInstance();
const teamService = FPLTeamService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { team_id: string } }
) {
  const startTime = Date.now();
  console.log('📈 FPL Entry History API - Request started');
  
  try {
    const teamId = parseInt(params.team_id, 10);
    
    console.log('📥 Request parameters:', { team_id: params.team_id });

    if (isNaN(teamId) || teamId <= 0) {
      console.log('❌ Validation failed: Invalid team ID');
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team ID parameter",
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed:', { teamId });
    
    console.log('📊 Phase 1: Fetching manager history');
    
    // Get manager history using service
    const historyResponse = await teamService.getManagerHistory(teamId);
    
    if (!historyResponse.success || !historyResponse.data) {
      console.log('❌ Failed to get manager history');
      throw new Error(`Manager history for ID ${teamId} not found`);
    }
    
    const data = historyResponse.data;
    
    console.log('✅ Manager history loaded:', {
      team_id: teamId,
      current_season_entries: data.current?.length || 0,
      past_seasons: data.past?.length || 0,
      chips_used: data.chips?.length || 0,
      cache_hit: historyResponse.cache_hit
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Entry History API completed successfully:', {
      team_id: teamId,
      response_time_ms: responseTime
    });
    
    return NextResponse.json({
      success: true,
      data,
      team_id: teamId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: historyResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Entry History API failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
      team_id: params.team_id
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