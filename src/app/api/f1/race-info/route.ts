import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const SEASON_TABLES: Record<string, string> = {
  "25": "f1_race_info",
  "26": "f1_race_info_26",
};

export async function GET(req: NextRequest) {
  try {
    const season = req.nextUrl.searchParams.get("season") || "26";
    const tableName = SEASON_TABLES[season];

    if (!tableName) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from(tableName)
      .select("next_race, last_race, updated_at")
      .eq("id", 1)
      .single();

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch race info" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Race info not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        nextRace: data.next_race,
        lastRace: data.last_race,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("Error in race-info GET:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
