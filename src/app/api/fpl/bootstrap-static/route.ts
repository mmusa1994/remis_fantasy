import { NextResponse } from "next/server";
import { FPLBootstrapService } from "@/services/fpl";

// Initialize FPL services
const bootstrapService = FPLBootstrapService.getInstance();

export async function GET() {
  const startTime = Date.now();

  try {
    // Get complete bootstrap data using service
    const bootstrapResponse = await bootstrapService.getBootstrapStatic();

    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error("Failed to fetch bootstrap static data");
    }

    const data = bootstrapResponse.data;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      cache_hit: bootstrapResponse.cache_hit,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Bootstrap Static API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
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
