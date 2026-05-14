import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Full public detail of one tournament: categories with options, rules, rewards.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const { data: tournament, error: tErr } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }
  if (!tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (
    tournament.visibility === "private" ||
    tournament.status === "draft"
  ) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [
    { data: categories, error: cErr },
    { data: rules, error: rErr },
    { data: rewards, error: rwErr },
  ] = await Promise.all([
    supabaseServer
      .from("predictor_categories")
      .select("*, predictor_options(*)")
      .eq("tournament_id", tournament.id)
      .eq("is_active", true)
      .eq("visibility", "public")
      .order("sort_order", { ascending: true }),
    supabaseServer
      .from("predictor_rules")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("sort_order", { ascending: true }),
    supabaseServer
      .from("predictor_rewards")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("rank_position", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
  ]);

  if (cErr || rErr || rwErr) {
    return NextResponse.json(
      { error: cErr?.message || rErr?.message || rwErr?.message },
      { status: 500 },
    );
  }

  // shape categories -> include options sorted, strip is_correct unless finished
  const isFinished = tournament.status === "finished";
  const shaped = (categories ?? []).map((c: any) => {
    const options = (c.predictor_options ?? [])
      .slice()
      .sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      )
      .map((o: any) => ({
        ...o,
        is_correct: isFinished ? !!o.is_correct : false,
        correct_rank: isFinished ? o.correct_rank : null,
      }));
    delete c.predictor_options;
    return { ...c, options };
  });

  return NextResponse.json({
    ...tournament,
    categories: shaped,
    rules: rules ?? [],
    rewards: rewards ?? [],
  });
}
