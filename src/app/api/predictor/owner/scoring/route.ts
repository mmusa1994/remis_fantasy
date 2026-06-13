import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireTournamentOwner,
  jsonError,
  rescoreTournament,
  resolveDisplayNames,
} from "@/lib/predictor";

// GET ?tournament_id=...&category_id=... — list all predictions for a tournament/category
// Used by the owner manual-scoring UI.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const categoryId = searchParams.get("category_id");
  if (!tournamentId) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  let q = supabaseServer
    .from("predictor_predictions")
    .select(
      "id, category_id, user_id, user_email, user_display_name, selected_option_ids, text_value, numeric_value, score_home, score_away, points_awarded, is_scored, locked, updated_at",
    )
    .eq("tournament_id", tournamentId)
    .order("updated_at", { ascending: false });
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q.limit(500);
  if (error) return jsonError(error.message, 500);

  // Override the denormalized snapshot with the current profile name so a
  // rename in /profile reflects in the manual-scoring UI immediately.
  const nameMap = await resolveDisplayNames(
    (data ?? []).map((p: any) => p.user_id),
  );
  const rows = (data ?? []).map((p: any) => ({
    ...p,
    user_display_name: nameMap.get(p.user_id) ?? p.user_display_name,
  }));
  return NextResponse.json(rows);
}

// PUT — owner overrides points_awarded / is_scored / locked for one prediction.
// Body: { prediction_id, points_awarded?, is_scored?, locked? }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body?.prediction_id) return jsonError("prediction_id is required");

  const { data: pred } = await supabaseServer
    .from("predictor_predictions")
    .select("tournament_id")
    .eq("id", body.prediction_id)
    .maybeSingle();
  if (!pred?.tournament_id) return jsonError("Prediction not found", 404);
  const own = await requireTournamentOwner(pred.tournament_id);
  if (!own.ok) return own.response;

  const updates: Record<string, unknown> = {};
  if (typeof body.points_awarded === "number") {
    updates.points_awarded = Math.max(0, Math.floor(body.points_awarded));
    updates.is_scored = true;
  }
  if (typeof body.is_scored === "boolean") updates.is_scored = body.is_scored;
  if (typeof body.locked === "boolean") updates.locked = body.locked;

  if (Object.keys(updates).length === 0)
    return jsonError("Ništa za ažurirati");

  const { data, error } = await supabaseServer
    .from("predictor_predictions")
    .update(updates)
    .eq("id", body.prediction_id)
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

// POST { tournament_id, action: 'rescore' } — auto-rescore the tournament
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.tournament_id) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(body.tournament_id);
  if (!own.ok) return own.response;

  if (body.action === "rescore") {
    const result = await rescoreTournament(body.tournament_id);
    return NextResponse.json({ ok: true, ...result });
  }
  return jsonError("Nepoznata akcija");
}
