import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, rescoreTournament } from "@/lib/predictor";

// POST { tournament_id } -> rescore every prediction in the tournament
// using current is_correct/correct_rank flags on options.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id) return jsonError("tournament_id is required");

  const result = await rescoreTournament(body.tournament_id);
  return NextResponse.json(result);
}

// PUT — manually adjust the points awarded on a single prediction.
// Body:
//   { kind: "category", id, points_awarded, is_scored? }
//   { kind: "match",    id, points_awarded, is_scored? }
//
// Used from the Predictions Explorer when the admin wants to override the
// automatic score on a specific user's pick (e.g. partial credit for a
// free-text answer, or a judgement call on the surprise team).
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("invalid body");

  const { kind, id, points_awarded, is_scored } = body as {
    kind?: "category" | "match";
    id?: string;
    points_awarded?: number;
    is_scored?: boolean;
  };

  if (!id) return jsonError("id is required");
  if (typeof points_awarded !== "number" || Number.isNaN(points_awarded)) {
    return jsonError("points_awarded must be a number");
  }
  if (kind !== "category" && kind !== "match") {
    return jsonError("kind must be 'category' or 'match'");
  }

  const table =
    kind === "category"
      ? "predictor_predictions"
      : "predictor_match_predictions";

  const updates: Record<string, unknown> = {
    points_awarded,
    is_scored: typeof is_scored === "boolean" ? is_scored : true,
  };

  const { data, error } = await supabaseServer
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
