import { NextRequest, NextResponse } from "next/server";
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
