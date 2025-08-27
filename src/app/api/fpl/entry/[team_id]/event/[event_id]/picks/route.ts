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
  { params }: { params: { team_id: string; event_id: string } }
) {
  const startTime = Date.now();
  console.log('⚽ FPL Entry Picks API - Request started');
  
  try {
    const teamId = parseInt(params.team_id, 10);
    const eventId = parseInt(params.event_id, 10);
    
    console.log('📥 Request parameters:', { 
      team_id: params.team_id,
      event_id: params.event_id
    });

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

    if (isNaN(eventId) || eventId <= 0 || eventId > 38) {
      console.log('❌ Validation failed: Invalid event ID');
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID parameter",
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed:', { teamId, eventId });
    
    console.log('📊 Phase 1: Fetching team picks');
    
    // Get manager picks using service
    const picksResponse = await teamService.getManagerPicks(teamId, eventId);
    
    if (!picksResponse.success || !picksResponse.data) {
      console.log('❌ Failed to get manager picks');
      throw new Error(`Picks for team ${teamId} in gameweek ${eventId} not found`);
    }
    
    const data = picksResponse.data;
    
    console.log('✅ Manager picks loaded:', {
      team_id: teamId,
      event_id: eventId,
      picks_count: data.picks?.length || 0,
      active_chip: data.active_chip || 'None',
      captain_id: data.picks?.find(p => p.is_captain)?.element || 'None',
      vice_captain_id: data.picks?.find(p => p.is_vice_captain)?.element || 'None',
      transfers: data.entry_history?.event_transfers || 0,
      points: data.entry_history?.points || 0,
      cache_hit: picksResponse.cache_hit
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Entry Picks API completed successfully:', {
      team_id: teamId,
      event_id: eventId,
      response_time_ms: responseTime
    });
    
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
        database_free: true
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Entry Picks API failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
      team_id: params.team_id,
      event_id: params.event_id
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