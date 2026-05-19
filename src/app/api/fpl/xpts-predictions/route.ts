import { NextRequest, NextResponse } from "next/server";
import { FPLPredictionsService } from "@/services/fpl";

const predictionsService = FPLPredictionsService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gwParam = searchParams.get("gw");

    if (!gwParam) {
      return NextResponse.json(
        { success: false, error: "Missing gw query parameter" },
        { status: 400 }
      );
    }
    const gameweek = parseInt(gwParam, 10);
    if (Number.isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return NextResponse.json(
        { success: false, error: "Invalid gameweek" },
        { status: 400 }
      );
    }

    const result = await predictionsService.predictForGameweek(gameweek);
    return NextResponse.json({
      success: result.success,
      data: {
        gameweek,
        predictions: result.data || [],
        last_updated: result.timestamp,
        cache_hit: result.cache_hit ?? false,
      },
    });
  } catch (error) {
    console.error("xPts predictions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
