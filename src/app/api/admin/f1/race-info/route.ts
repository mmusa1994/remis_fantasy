import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

const SEASON_TABLES: Record<string, string> = {
  "25": "f1_race_info",
  "26": "f1_race_info_26",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { nextRace, lastRace, season = "26" } = await req.json();

    if (!nextRace || !lastRace) {
      return NextResponse.json(
        { error: "nextRace and lastRace are required" },
        { status: 400 }
      );
    }

    const tableName = SEASON_TABLES[season];
    if (!tableName) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from(tableName)
      .update({
        next_race: nextRace,
        last_race: lastRace,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.error(`Error updating ${tableName}:`, error);
      return NextResponse.json(
        { error: "Failed to update race info" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in race-info POST:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
