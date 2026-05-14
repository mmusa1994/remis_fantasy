import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, rescoreMatch } from "@/lib/predictor";

// POST { match_id, home_score, away_score, status? }
// Upisuje rezultat i automatski boduje sve korisničke predikcije.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.match_id) return jsonError("match_id je obavezan");
  if (body.home_score == null || body.away_score == null) {
    return jsonError("home_score i away_score su obavezni");
  }

  // upiši rezultat
  const { error: upErr } = await supabaseServer
    .from("predictor_matches")
    .update({
      home_score: Number(body.home_score),
      away_score: Number(body.away_score),
      status: body.status ?? "finished",
    })
    .eq("id", body.match_id);

  if (upErr) return jsonError(upErr.message, 500);

  // automatski boduj sve predikcije za ovu utakmicu
  const result = await rescoreMatch(body.match_id);
  return NextResponse.json({ ok: true, ...result });
}
