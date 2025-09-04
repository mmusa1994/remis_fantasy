import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Get league ID from query parameters
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("league") || "7206907"; // Default to your league

    console.log(`Fetching F1 Fantasy league from DB: ${leagueId}`);

    const { data: rows, error } = await supabaseServer
      .from("f1_table_25")
      .select("rank, team_name, manager_name, points, last_rank, updated_at")
      .order("rank", { ascending: true });

    if (error) {
      console.error("DB error fetching f1_table_25:", error);
      return NextResponse.json(
        { success: false, error: "Database error" },
        { status: 500 }
      );
    }

    const standings = (rows || []).map((r, idx) => ({
      rank: r.rank ?? idx + 1,
      entry_id: r.rank ?? idx + 1,
      player_name: r.manager_name,
      team_name: r.team_name,
      total_points: r.points ?? 0,
      event_total: 0,
      last_rank: r.last_rank ?? r.rank ?? idx + 1,
    }));

    const lastUpdated = rows && rows.length
      ? rows.reduce((acc, r) => (r.updated_at && r.updated_at > acc ? r.updated_at : acc), rows[0].updated_at)
      : new Date().toISOString();

    const data = {
      league: {
        name: "F1 LIGA",
        code: leagueId,
        lastUpdated,
        totalEntries: standings.length,
      },
      standings,
      prizes: {
        first: "120 KM",
        second: "80 KM",
        third: "60 KM",
      },
      currentGrandPrix: "Zandvoort",
      season: "2025",
    };

    return NextResponse.json({
      success: true,
      data,
      source: "DB",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching F1 Fantasy leaderboard:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch F1 Fantasy leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
