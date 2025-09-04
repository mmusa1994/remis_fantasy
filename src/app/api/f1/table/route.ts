import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("f1_table_25")
      .select("rank, team_name, manager_name, points, last_rank, updated_at")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Error fetching f1_table_25:", error);
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

