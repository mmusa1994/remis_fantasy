import { NextRequest, NextResponse } from "next/server";
import { FPLTeamService } from "@/services/fpl";

// Initialize FPL services
const teamService = FPLTeamService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { team_id: string } }
) {
  const startTime = Date.now();
  console.log('👥 FPL Entry API - Request started');
  
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
    
    console.log('📊 Phase 1: Fetching manager info');
    
    // Get manager info using service
    const managerResponse = await teamService.getManagerInfo(teamId);
    
    if (!managerResponse.success || !managerResponse.data) {
      console.log('❌ Failed to get manager info');
      throw new Error(`Manager with ID ${teamId} not found`);
    }
    
    const data = managerResponse.data;
    
    console.log('✅ Manager info loaded:', {
      team_id: teamId,
      team_name: data.name,
      player_name: `${data.player_first_name} ${data.player_last_name}`,
      total_points: data.summary_overall_points,
      overall_rank: data.summary_overall_rank,
      team_value: data.last_deadline_value,
      cache_hit: managerResponse.cache_hit
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Entry API completed successfully:', {
      team_id: teamId,
      response_time_ms: responseTime
    });
    
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
        database_free: true
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Entry API failed:', {
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