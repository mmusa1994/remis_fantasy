import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { parseF1BulkText } from "@/lib/f1-parser";

const SEASON_TABLES: Record<string, string> = {
  "25": "f1_table_25",
  "26": "f1_table_26",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { text, season = "26" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field in body" },
        { status: 400 }
      );
    }

    const tableName = SEASON_TABLES[season];
    if (!tableName) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }

    const entries = parseF1BulkText(text);
    if (!entries.length) {
      return NextResponse.json(
        { error: "No valid entries parsed" },
        { status: 400 }
      );
    }

    // Load existing rows to preserve last_rank
    const { data: existingRows, error: fetchErr } = await supabaseServer
      .from(tableName)
      .select("id, team_name, rank");

    if (fetchErr) {
      console.error(`Error fetching existing ${tableName}:`, fetchErr);
      return NextResponse.json(
        { error: "Database error fetching existing rows" },
        { status: 500 }
      );
    }

    const byTeam = new Map<string, { id: string; rank: number }>();
    (existingRows || []).forEach((r) => byTeam.set(r.team_name, r));

    // Upsert each entry, setting last_rank to previous rank if exists
    const upserts = entries.map((e) => {
      const existing = byTeam.get(e.team_name);
      const record: any = {
        team_name: e.team_name,
        manager_name: e.manager_name,
        points: e.points,
        rank: e.rank,
        last_rank: existing ? existing.rank : e.rank, // if new, same rank (no movement)
        updated_at: new Date().toISOString(),
      };
      if (existing?.id) {
        record.id = existing.id; // only include id when updating existing row
      }
      return record;
    });

    // Use upsert with on conflict team_name unique index
    const { error: upsertErr } = await supabaseServer
      .from(tableName)
      .upsert(upserts, { onConflict: "team_name" });

    if (upsertErr) {
      console.error(`Upsert error ${tableName}:`, upsertErr);
      return NextResponse.json(
        { error: "Failed to upsert F1 table" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: upserts.length });
  } catch (err) {
    console.error("Bulk update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
