import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// GET ?tournament_id=...
// Vraća sve match prediction-e turnira sa pridruženim podacima utakmice
// (timovi, datum, stage, rezultat) — koristi se u admin "Predictions Explorer"
// pregledu (day-by-day, po korisniku, po stage-u).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id je obavezan");

  const [{ data: predictions, error: pErr }, { data: matches, error: mErr }] =
    await Promise.all([
      supabaseServer
        .from("predictor_match_predictions")
        .select("*")
        .eq("tournament_id", tournamentId),
      supabaseServer
        .from("predictor_matches")
        .select(
          "id, stage, stage_label, stage_label_en, match_label, match_label_en, home_team, home_team_en, away_team, away_team_en, home_logo_url, away_logo_url, home_team_code, away_team_code, kickoff_at, status, home_score, away_score, points_exact, points_diff, points_winner",
        )
        .eq("tournament_id", tournamentId),
    ]);

  if (pErr) return jsonError(pErr.message, 500);
  if (mErr) return jsonError(mErr.message, 500);

  const matchMap = new Map((matches ?? []).map((m: any) => [m.id, m]));

  const rows = (predictions ?? []).map((p: any) => {
    const m = matchMap.get(p.match_id) as any;
    return {
      id: p.id,
      match_id: p.match_id,
      user_id: p.user_id,
      user_email: p.user_email,
      user_display_name: p.user_display_name,
      home_score: p.home_score,
      away_score: p.away_score,
      points_awarded: p.points_awarded ?? 0,
      is_scored: !!p.is_scored,
      created_at: p.created_at,
      updated_at: p.updated_at,
      // utakmica
      match_stage: m?.stage ?? null,
      match_stage_label: m?.stage_label ?? null,
      match_stage_label_en: m?.stage_label_en ?? null,
      match_label: m?.match_label ?? null,
      match_label_en: m?.match_label_en ?? null,
      match_kickoff_at: m?.kickoff_at ?? null,
      match_status: m?.status ?? null,
      home_team: m?.home_team ?? null,
      home_team_en: m?.home_team_en ?? null,
      away_team: m?.away_team ?? null,
      away_team_en: m?.away_team_en ?? null,
      home_logo_url: m?.home_logo_url ?? null,
      away_logo_url: m?.away_logo_url ?? null,
      home_team_code: m?.home_team_code ?? null,
      away_team_code: m?.away_team_code ?? null,
      actual_home: m?.home_score ?? null,
      actual_away: m?.away_score ?? null,
    };
  });

  return NextResponse.json(rows);
}
