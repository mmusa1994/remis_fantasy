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

  // Use select("*") so missing optional i18n columns don't 500 the whole
  // route on databases where the i18n migration hasn't been applied yet.
  // Paginate predictions so the default 1000-row cap doesn't silently hide
  // users' picks once the tournament gets popular.
  const PAGE = 1000;
  const predictions: any[] = [];
  let pErr: { message: string } | null = null;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseServer
      .from("predictor_match_predictions")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      pErr = error;
      break;
    }
    if (!data || data.length === 0) break;
    predictions.push(...data);
    if (data.length < PAGE) break;
  }
  if (pErr) {
    console.error("[admin/match-predictions] predictions error:", pErr);
    return jsonError(pErr.message, 500);
  }

  const { data: matches, error: mErr } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (mErr) {
    console.error("[admin/match-predictions] matches error:", mErr);
    return jsonError(mErr.message, 500);
  }

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
