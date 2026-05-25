import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isMatchLocked, requireUser } from "@/lib/predictor";
import type { Match } from "@/types/predictor";

/**
 * GET /api/predictor/tournaments/[slug]/user-predictions?user_id=X
 *
 * Returns a user's predictions for this tournament.
 * - Viewing YOUR OWN predictions: shows everything
 * - Viewing SOMEONE ELSE's: only locked categories/matches
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const userId = new URL(req.url).searchParams.get("user_id");
  if (!slug || !userId) {
    return NextResponse.json(
      { error: "slug and user_id required" },
      { status: 400 },
    );
  }

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, registration_lock_at, prediction_lock_mode")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const lockMode = tournament.prediction_lock_mode || "per_match";
  const tournamentLocked =
    tournament.status === "locked" || tournament.status === "finished";

  // Check if viewer is looking at their own predictions
  const viewer = await requireUser();
  const isSelf = viewer.ok && viewer.user.id === userId;
  const skipLockCheck = isSelf || tournamentLocked;

  // Category predictions
  const { data: categories } = await supabaseServer
    .from("predictor_categories")
    .select("id, slug, name, name_en, category_type, lock_at, points_correct")
    .eq("tournament_id", tournament.id)
    .eq("is_active", true)
    .order("sort_order");

  const { data: catPredictions } = await supabaseServer
    .from("predictor_predictions")
    .select(
      "id, category_id, selected_option_ids, text_value, numeric_value, score_home, score_away, points_awarded, is_scored",
    )
    .eq("tournament_id", tournament.id)
    .eq("user_id", userId);

  // Own predictions: show all. Others: only locked.
  const now = new Date();
  const lockedCatPreds = (catPredictions ?? []).filter((p) => {
    if (skipLockCheck) return true;
    const cat = (categories ?? []).find((c: any) => c.id === p.category_id);
    if (!cat) return false;
    if (cat.lock_at && new Date(cat.lock_at) <= now) return true;
    if (tournament.registration_lock_at && new Date(tournament.registration_lock_at) <= now) return true;
    return false;
  });

  // Resolve option labels for selected_option_ids
  const allOptionIds = lockedCatPreds.flatMap(
    (p) => p.selected_option_ids ?? [],
  );
  let optionMap: Record<string, { label: string; label_en?: string; image_url?: string }> = {};
  if (allOptionIds.length > 0) {
    const { data: options } = await supabaseServer
      .from("predictor_options")
      .select("id, label, label_en, image_url")
      .in("id", allOptionIds);
    for (const o of options ?? []) {
      optionMap[o.id] = { label: o.label, label_en: o.label_en, image_url: o.image_url };
    }
  }

  // Match predictions
  const { data: allMatches } = await supabaseServer
    .from("predictor_matches")
    .select("id, kickoff_at, status, force_unlocked, matchday, home_team, home_team_en, away_team, away_team_en, home_team_code, away_team_code, home_score, away_score, stage, stage_label")
    .eq("tournament_id", tournament.id)
    .order("kickoff_at", { ascending: true });

  const { data: matchPredictions } = await supabaseServer
    .from("predictor_match_predictions")
    .select(
      "id, match_id, home_score, away_score, points_awarded, is_scored",
    )
    .eq("tournament_id", tournament.id)
    .eq("user_id", userId);

  const typedMatches = (allMatches ?? []) as Match[];

  const lockedMatchPreds = (matchPredictions ?? []).filter((p) => {
    if (skipLockCheck) return true;
    const match = typedMatches.find((m) => m.id === p.match_id);
    if (!match) return false;
    return isMatchLocked(match, {
      lockMode,
      allMatches: typedMatches,
      matchday: match.matchday,
    });
  });

  // Build match info map for display
  const matchInfoMap: Record<string, any> = {};
  for (const m of typedMatches) {
    matchInfoMap[m.id] = {
      home_team: m.home_team,
      home_team_en: m.home_team_en,
      away_team: m.away_team,
      away_team_en: m.away_team_en,
      home_team_code: m.home_team_code,
      away_team_code: m.away_team_code,
      home_score: m.home_score,
      away_score: m.away_score,
      stage_label: m.stage_label,
      kickoff_at: m.kickoff_at,
    };
  }

  return NextResponse.json({
    categories: (categories ?? []).map((c: any) => {
      const pred = lockedCatPreds.find((p) => p.category_id === c.id);
      const isLocked = skipLockCheck || tournamentLocked ||
        (c.lock_at && new Date(c.lock_at) <= now) ||
        (tournament.registration_lock_at && new Date(tournament.registration_lock_at) <= now);
      return {
        ...c,
        locked: isLocked,
        prediction: pred
          ? {
              ...pred,
              selected_options: (pred.selected_option_ids ?? []).map(
                (id: string) => optionMap[id] ?? { label: id },
              ),
            }
          : null,
      };
    }),
    matchPredictions: lockedMatchPreds.map((p) => ({
      ...p,
      match: matchInfoMap[p.match_id] ?? null,
    })),
  });
}
