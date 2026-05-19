import { NextRequest, NextResponse } from "next/server";
import { FPLChipUsageService } from "@/services/fpl";

const chipUsageService = FPLChipUsageService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gwParam = searchParams.get("gw");
    const sampleParam = searchParams.get("sampleSize");

    if (!gwParam) {
      return NextResponse.json(
        { success: false, error: "Missing gw query parameter" },
        { status: 400 }
      );
    }
    const gameweek = parseInt(gwParam, 10);
    const sampleSize = sampleParam ? parseInt(sampleParam, 10) : undefined;

    const result = await chipUsageService.computeChipUsageForGameweek(
      gameweek,
      sampleSize
    );
    return NextResponse.json({
      success: result.success,
      data: result.data,
      cache_hit: result.cache_hit ?? false,
      last_updated: result.timestamp,
    });
  } catch (error) {
    console.error("Chip usage error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
