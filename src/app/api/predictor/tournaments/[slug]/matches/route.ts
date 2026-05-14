import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// GET javna lista utakmica za turnir
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, visibility")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (tournament.visibility === "private" || tournament.status === "draft") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data, error } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("kickoff_at", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
