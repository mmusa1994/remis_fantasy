import { NextRequest, NextResponse } from "next/server";
import { FPLPlayerService } from "@/services/fpl";

// Initialize FPL services
const playerService = FPLPlayerService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { player_id: string } }
) {
  const startTime = Date.now();
  console.log('👤 FPL Element Summary API - Request started');
  
  try {
    const playerId = parseInt(params.player_id, 10);
    
    console.log('📥 Request parameters:', { player_id: params.player_id });

    if (isNaN(playerId) || playerId <= 0) {
      console.log('❌ Validation failed: Invalid player ID');
      return NextResponse.json(
        {
          success: false,
          error: "Invalid player ID parameter",
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed:', { playerId });
    
    console.log('🔍 Phase 1: Fetching player summary data');
    
    // Get player summary using service
    const summaryResponse = await playerService.getPlayerSummary(playerId);
    
    if (!summaryResponse.success || !summaryResponse.data) {
      console.log('❌ Failed to get player summary');
      throw new Error(`Player with ID ${playerId} not found`);
    }
    
    const data = summaryResponse.data;
    
    console.log('✅ Player summary loaded:', {
      player_id: playerId,
      web_name: data.web_name || 'Unknown',
      fixtures_count: data.fixtures?.length || 0,
      history_count: data.history?.length || 0,
      history_past_count: data.history_past?.length || 0,
      cache_hit: summaryResponse.cache_hit
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Element Summary API completed successfully:', {
      player_id: playerId,
      response_time_ms: responseTime
    });
    
    return NextResponse.json({
      success: true,
      data,
      player_id: playerId,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: summaryResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Element Summary API failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
      player_id: params.player_id
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