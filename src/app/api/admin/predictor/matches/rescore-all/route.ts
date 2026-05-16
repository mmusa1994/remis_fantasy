import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, rescoreMatch } from "@/lib/predictor";

// POST { tournament_id }
// Boduje sve `finished` utakmice u turniru. Vraća { scored_matches, updated_predictions }.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id) return jsonError("tournament_id je obavezan");

  const { data: matches, error } = await supabaseServer
    .from("predictor_matches")
    .select("id")
    .eq("tournament_id", body.tournament_id)
    .eq("status", "finished");

  if (error) return jsonError(error.message, 500);
  if (!matches || matches.length === 0) {
    return NextResponse.json({
      ok: true,
      scored_matches: 0,
      updated_predictions: 0,
    });
  }

  let updated = 0;
  for (const m of matches as Array<{ id: string }>) {
    const r = await rescoreMatch(m.id);
    updated += r.updated;
  }

  return NextResponse.json({
    ok: true,
    scored_matches: matches.length,
    updated_predictions: updated,
  });
}
