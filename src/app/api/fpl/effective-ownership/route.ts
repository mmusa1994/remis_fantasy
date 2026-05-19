import { NextRequest, NextResponse } from "next/server";
import { FPLEffectiveOwnershipService } from "@/services/fpl";
import type { FPLEOBucket } from "@/types/fpl";

const eoService = FPLEffectiveOwnershipService.getInstance();

const VALID_BUCKETS: FPLEOBucket[] = ["top10k", "top100k", "overall"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gwParam = searchParams.get("gw");
    const bucketParam = (searchParams.get("bucket") || "top10k") as FPLEOBucket;
    const limitParam = searchParams.get("limit");

    if (!gwParam) {
      return NextResponse.json(
        { success: false, error: "Missing gw query parameter" },
        { status: 400 }
      );
    }
    if (!VALID_BUCKETS.includes(bucketParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid bucket" },
        { status: 400 }
      );
    }
    const gameweek = parseInt(gwParam, 10);
    const sampleSize = limitParam ? parseInt(limitParam, 10) : undefined;

    const result = await eoService.computeEOForBucket(
      bucketParam,
      gameweek,
      sampleSize
    );
    return NextResponse.json({
      success: result.success,
      data: {
        gameweek,
        bucket: bucketParam,
        ownership: result.data || [],
        cache_hit: result.cache_hit ?? false,
        last_updated: result.timestamp,
      },
    });
  } catch (error) {
    console.error("Effective ownership error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
