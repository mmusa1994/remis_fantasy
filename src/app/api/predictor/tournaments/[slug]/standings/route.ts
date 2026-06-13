import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { resolveDisplayNames } from "@/lib/predictor";
import type { StandingsRow } from "@/types/predictor";

// Javna tabela — kombinuje category-level i match-level predikcije.
// Vidljiva svima (čak i ne-učesnicima) — to je glavna lista za prateći turnir.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const { data: tournament, error: tErr } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, visibility")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (tErr || !tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (tournament.visibility === "private" || tournament.status === "draft") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // dovuci paralelno oba tipa predikcija
  const [{ data: catPreds, error: cErr }, { data: matchPreds, error: mErr }] =
    await Promise.all([
      supabaseServer
        .from("predictor_predictions")
        .select(
          "user_id, user_email, user_display_name, points_awarded, is_scored",
        )
        .eq("tournament_id", tournament.id),
      supabaseServer
        .from("predictor_match_predictions")
        .select(
          "user_id, user_email, user_display_name, points_awarded, is_scored",
        )
        .eq("tournament_id", tournament.id),
    ]);

  if (cErr || mErr) {
    return NextResponse.json(
      { error: cErr?.message || mErr?.message },
      { status: 500 },
    );
  }

  type Bucket = {
    user_id: string;
    user_display_name: string | null;
    user_email: string | null;
    category_points: number;
    match_points: number;
    predictions_count: number;
    correct_count: number;
    match_predictions_count: number;
    match_correct_count: number;
  };

  const buckets = new Map<string, Bucket>();
  const ensure = (
    uid: string,
    name: string | null,
    email: string | null,
  ): Bucket => {
    const cur =
      buckets.get(uid) ?? {
        user_id: uid,
        user_display_name: name,
        user_email: email,
        category_points: 0,
        match_points: 0,
        predictions_count: 0,
        correct_count: 0,
        match_predictions_count: 0,
        match_correct_count: 0,
      };
    if (!cur.user_display_name && name) cur.user_display_name = name;
    if (!cur.user_email && email) cur.user_email = email;
    buckets.set(uid, cur);
    return cur;
  };

  for (const p of catPreds ?? []) {
    const b = ensure(p.user_id, p.user_display_name, p.user_email);
    b.category_points += p.points_awarded ?? 0;
    b.predictions_count += 1;
    if ((p.points_awarded ?? 0) > 0) b.correct_count += 1;
  }
  for (const p of matchPreds ?? []) {
    const b = ensure(p.user_id, p.user_display_name, p.user_email);
    b.match_points += p.points_awarded ?? 0;
    b.match_predictions_count += 1;
    if ((p.points_awarded ?? 0) > 0) b.match_correct_count += 1;
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => {
    const totalA = a.category_points + a.match_points;
    const totalB = b.category_points + b.match_points;
    if (totalB !== totalA) return totalB - totalA;
    // tiebreaker: ukupno tačnih
    const correctA = a.correct_count + a.match_correct_count;
    const correctB = b.correct_count + b.match_correct_count;
    return correctB - correctA;
  });

  // Fetch key predictions (winner + top scorer) for inline display
  const { data: winnerCat } = await supabaseServer
    .from("predictor_categories")
    .select("id")
    .eq("tournament_id", tournament.id)
    .eq("slug", "pobjednik")
    .maybeSingle();

  const { data: scorerCat } = await supabaseServer
    .from("predictor_categories")
    .select("id")
    .eq("tournament_id", tournament.id)
    .in("slug", ["zlatna-kopacka", "top-scorer", "najbolji-strijelac"])
    .maybeSingle();

  type KeyPick = { winner_flag?: string; winner_name?: string; top_scorer?: string };
  const keyPicks = new Map<string, KeyPick>();

  if (winnerCat) {
    const { data: winnerPreds } = await supabaseServer
      .from("predictor_predictions")
      .select("user_id, selected_option_ids")
      .eq("category_id", winnerCat.id);
    if (winnerPreds?.length) {
      const optIds = winnerPreds.flatMap((p: any) => p.selected_option_ids ?? []);
      const { data: opts } = await supabaseServer
        .from("predictor_options")
        .select("id, label, image_url")
        .in("id", optIds);
      const optMap = new Map((opts ?? []).map((o: any) => [o.id, o]));
      for (const p of winnerPreds) {
        const firstOpt = optMap.get((p.selected_option_ids ?? [])[0]);
        if (firstOpt) {
          const kp = keyPicks.get(p.user_id) ?? {};
          kp.winner_name = firstOpt.label;
          kp.winner_flag = firstOpt.image_url ?? undefined;
          keyPicks.set(p.user_id, kp);
        }
      }
    }
  }

  if (scorerCat) {
    const { data: scorerPreds } = await supabaseServer
      .from("predictor_predictions")
      .select("user_id, text_value")
      .eq("category_id", scorerCat.id);
    for (const p of scorerPreds ?? []) {
      if (p.text_value) {
        const kp = keyPicks.get(p.user_id) ?? {};
        kp.top_scorer = p.text_value;
        keyPicks.set(p.user_id, kp);
      }
    }
  }

  // Override the denormalized snapshot with the current profile name so a
  // rename in /profile reflects on the leaderboard immediately.
  const nameMap = await resolveDisplayNames(sorted.map((b) => b.user_id));

  const standings: StandingsRow[] = sorted.map((b, idx) => ({
    user_id: b.user_id,
    user_display_name: nameMap.get(b.user_id) ?? b.user_display_name,
    user_email: b.user_email,
    total_points: b.category_points + b.match_points,
    category_points: b.category_points,
    match_points: b.match_points,
    predictions_count: b.predictions_count,
    correct_count: b.correct_count,
    match_predictions_count: b.match_predictions_count,
    match_correct_count: b.match_correct_count,
    rank: idx + 1,
    ...(keyPicks.get(b.user_id) ?? {}),
  }));

  return NextResponse.json(standings);
}
