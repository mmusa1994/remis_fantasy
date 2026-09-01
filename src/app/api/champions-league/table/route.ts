import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SEPARATE TABLES PER SEASON (same principle as premier-league-tables)
const SEASON_TABLES: Record<string, string> = {
  "25_26": "cl_table_25_26",
  "26_27": "cl_table_26_27",
};

export async function GET(req: NextRequest) {
  try {
    const season = req.nextUrl.searchParams.get("season") || "26_27";
    const tableName = SEASON_TABLES[season];
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: "Invalid season" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("rank", { ascending: true });

    // A season whose table doesn't exist yet (42P01) renders as an empty
    // standing instead of an error — the pre-season state of a new season.
    if (error && error.code !== "42P01") {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      season,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Champions League table API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { players, season = "26_27" } = body;

    const tableName = SEASON_TABLES[season];
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: "Invalid season" },
        { status: 400 }
      );
    }

    if (!players || !Array.isArray(players)) {
      return NextResponse.json(
        { success: false, error: "Invalid players data" },
        { status: 400 }
      );
    }

    // Clear existing data
    await supabase.from(tableName).delete().neq("id", 0);

    // Insert new data
    const { data, error } = await supabase
      .from(tableName)
      .insert(players)
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      season,
      message: `Successfully updated ${players.length} players`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Champions League table POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
