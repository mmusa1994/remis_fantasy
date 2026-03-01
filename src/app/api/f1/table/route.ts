import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const SEASON_TABLES: Record<string, string> = {
  "25": "f1_table_25",
  "26": "f1_table_26",
};

export async function GET(req: NextRequest) {
  try {
    const season = req.nextUrl.searchParams.get("season") || "26";
    const tableName = SEASON_TABLES[season];

    if (!tableName) {
      return NextResponse.json({ success: false, error: "Invalid season" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from(tableName)
      .select("rank, team_name, manager_name, points, last_rank, updated_at")
      .order("rank", { ascending: true });

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    const lastUpdated = data && data.length
      ? data.reduce((acc, r) => (r.updated_at && r.updated_at > acc ? r.updated_at : acc), data[0].updated_at)
      : null;

    return NextResponse.json({ success: true, data: { standings: data || [], lastUpdated } });
  } catch (err) {
    console.error("F1 table GET error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
