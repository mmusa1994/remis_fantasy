import { NextResponse } from "next/server";
import { FPLBootstrapService } from "@/services/fpl";

// Initialize FPL services
const bootstrapService = FPLBootstrapService.getInstance();

export async function GET() {
  const startTime = Date.now();
  console.log('📊 FPL Bootstrap Static API - Request started');
  
  try {
    console.log('🚀 Phase 1: Fetching bootstrap static data');
    
    // Get complete bootstrap data using service
    const bootstrapResponse = await bootstrapService.getBootstrapStatic();
    
    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      console.log('❌ Failed to get bootstrap static data');
      throw new Error('Failed to fetch bootstrap static data');
    }
    
    const data = bootstrapResponse.data;
    
    console.log('✅ Bootstrap static data loaded:', {
      players_count: data.elements?.length || 0,
      teams_count: data.teams?.length || 0,
      gameweeks_count: data.events?.length || 0,
      element_types_count: data.element_types?.length || 0,
      cache_hit: bootstrapResponse.cache_hit
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Bootstrap Static API completed successfully:', {
      response_time_ms: responseTime,
      data_size: JSON.stringify(data).length
    });
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: bootstrapResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Bootstrap Static API failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime
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