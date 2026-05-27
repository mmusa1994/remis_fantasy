import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Public Eternal Table read. Returns columns + entries for any visible
// tournament. Each entry's `total` is computed server-side from `values`.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const { data: tournament, error: tErr } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, visibility")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (tErr || !tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (tournament.visibility === "private" || tournament.status === "draft") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [colsRes, entriesRes] = await Promise.all([
    supabaseServer
      .from("predictor_eternal_columns")
      .select("id, label, logo_url, sort_order")
      .eq("tournament_id", tournament.id)
      .order("sort_order", { ascending: true }),
    supabaseServer
      .from("predictor_eternal_entries")
      .select("id, player_name, values, sort_order")
      .eq("tournament_id", tournament.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (colsRes.error || entriesRes.error) {
    return NextResponse.json(
      { error: colsRes.error?.message || entriesRes.error?.message },
      { status: 500 }
    );
  }

  const columns = colsRes.data ?? [];
  const entries = (entriesRes.data ?? []).map((e) => {
    const values = (e.values as Record<string, number | null>) ?? {};
    const total = columns.reduce((sum, c) => {
      const v = values[c.id];
      return sum + (typeof v === "number" ? v : 0);
    }, 0);
    return {
      id: e.id,
      player_name: e.player_name,
      values,
      total,
      sort_order: e.sort_order,
    };
  });

  // Sort by total desc, then by manual sort_order as tiebreaker
  entries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return NextResponse.json({ columns, entries });
}
