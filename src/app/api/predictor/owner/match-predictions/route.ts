import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireTournamentOwner,
  jsonError,
  computeMatchPoints,
  resolveDisplayNames,
} from "@/lib/predictor";
import type { Match } from "@/types/predictor";

// POST { match_id, user_id, home_score, away_score }
// Vlasnik upisuje match predikciju u ime igrača (propušten/zakašnjeli tip) i
// odmah je boduje ako utakmica već ima rezultat. Bodovanje preko istog
// computeMatchPoints: tačan rezultat → points_exact (3), tačan ishod →
// points_winner (1), promašaj → 0.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const matchId = body?.match_id;
  const userId = body?.user_id;
  if (!matchId || !userId) return jsonError("match_id i user_id su obavezni");
  if (body.home_score == null || body.away_score == null) {
    return jsonError("home_score i away_score su obavezni");
  }
  const home = Number(body.home_score);
  const away = Number(body.away_score);
  if (
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0
  ) {
    return jsonError("Rezultat mora biti cijeli broj ≥ 0");
  }

  const { data: match, error: mErr } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (mErr || !match) return jsonError("Utakmica nije pronađena", 404);

  // Ownership se provjerava preko turnira utakmice (sprječava unos u tuđi turnir).
  const own = await requireTournamentOwner(match.tournament_id);
  if (!own.ok) return own.response;

  // Razriješi snapshot email/ime igrača za predictor tabele.
  const [memberRes, nameMap] = await Promise.all([
    supabaseServer
      .from("predictor_members")
      .select("user_email, user_display_name")
      .eq("tournament_id", match.tournament_id)
      .eq("user_id", userId)
      .maybeSingle(),
    resolveDisplayNames([userId]),
  ]);
  const userEmail = memberRes.data?.user_email ?? null;
  const userName =
    nameMap.get(userId) ?? memberRes.data?.user_display_name ?? null;

  const hasResult = match.home_score != null && match.away_score != null;
  const points = hasResult
    ? computeMatchPoints(match as Match, { home_score: home, away_score: away })
    : 0;

  const { data, error } = await supabaseServer
    .from("predictor_match_predictions")
    .upsert(
      {
        tournament_id: match.tournament_id,
        match_id: matchId,
        user_id: userId,
        user_email: userEmail,
        user_display_name: userName,
        home_score: home,
        away_score: away,
        points_awarded: points,
        is_scored: hasResult,
      },
      { onConflict: "user_id,match_id" },
    )
    .select()
    .single();
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true, prediction: data, points, scored: hasResult });
}
