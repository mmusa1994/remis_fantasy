import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isMatchLocked, resolveDisplayNames, selectAllRows } from "@/lib/predictor";
import type { Match } from "@/types/predictor";

/**
 * Returns all match predictions grouped by match, but only for locked matches.
 * Used by the "by matches" sub-tab in standings.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const lockMode = tournament.prediction_lock_mode || "per_match";
  const tournamentLocked =
    tournament.status === "locked" || tournament.status === "finished";

  const [{ data: allMatches }, { data: allPreds }] = await Promise.all([
    supabaseServer
      .from("predictor_matches")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("kickoff_at", { ascending: true }),
    // Page through every prediction — a plain .select() caps at 1000 rows,
    // which silently dropped the newest round's picks once the tournament
    // passed ~1000 total predictions (KOLO 3 showed 2–5 of 19 picks/match).
    selectAllRows<any>((from, to) =>
      supabaseServer
        .from("predictor_match_predictions")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);

  const typedMatches = (allMatches ?? []) as Match[];

  const lockedMatches = typedMatches.filter((m) =>
    tournamentLocked ||
    isMatchLocked(m, { lockMode, allMatches: typedMatches, matchday: m.matchday }),
  );

  // Aktuelno (otključano) kolo: najniže kolo koje još nije zaključano i nema
  // upisan rezultat. Prikazujemo ga u "po utakmicama" listi da bude jasno koje
  // se kolo trenutno pogađa — ali BEZ tuđih tipova (procurili bi prije
  // zaključavanja). Tipuje se na tabu Predikcije; ovdje je samo zaključan
  // pregled fixtura označen kao aktuelno.
  const lockedIds = new Set(lockedMatches.map((m) => m.id));
  const openMatches = typedMatches.filter(
    (m) => !lockedIds.has(m.id) && m.home_score == null && m.matchday != null,
  );
  let activeRound: number | null = null;
  for (const m of openMatches) {
    const md = m.matchday as number;
    if (activeRound == null || md < activeRound) activeRound = md;
  }
  const activeRoundMatches =
    activeRound != null
      ? openMatches.filter((m) => m.matchday === activeRound)
      : [];

  // Override the denormalized snapshot with the current profile name so a
  // rename in /profile reflects in the by-matches view immediately.
  const nameMap = await resolveDisplayNames(
    (allPreds ?? []).map((p: any) => p.user_id),
  );

  const predsByMatch = new Map<string, any[]>();
  for (const p of allPreds ?? []) {
    const arr = predsByMatch.get(p.match_id) ?? [];
    arr.push({
      user_id: p.user_id,
      user_display_name: nameMap.get(p.user_id) ?? p.user_display_name,
      home_score: p.home_score,
      away_score: p.away_score,
      points_awarded: p.points_awarded,
      is_scored: p.is_scored,
    });
    predsByMatch.set(p.match_id, arr);
  }

  const buildRow = (m: Match, locked: boolean) => ({
    id: m.id,
    home_team: m.home_team,
    home_team_en: (m as any).home_team_en ?? null,
    away_team: m.away_team,
    away_team_en: (m as any).away_team_en ?? null,
    home_team_code: m.home_team_code,
    away_team_code: m.away_team_code,
    home_score: m.home_score,
    away_score: m.away_score,
    kickoff_at: m.kickoff_at,
    stage_label: m.stage_label,
    matchday: m.matchday,
    locked,
    // Otključano kolo: nikad ne otkrivamo tipove dok se kolo ne zaključa.
    predictions: locked
      ? (predsByMatch.get(m.id) ?? []).sort(
          (a: any, b: any) => (b.points_awarded ?? 0) - (a.points_awarded ?? 0),
        )
      : [],
  });

  const result = [
    ...lockedMatches.map((m) => buildRow(m, true)),
    ...activeRoundMatches.map((m) => buildRow(m, false)),
  ];

  return NextResponse.json(result);
}
