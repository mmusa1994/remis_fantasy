import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// GET ?tournament_id=...
// Vraća sve predikcije sa imenom kategorije, tipom i label-ima izabranih opcija.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id je obavezan");

  // Pull predictions in pages of 1000 to dodge Supabase's default row cap —
  // a tournament with many users × ~24 categories blows past 1000 quickly,
  // which would silently hide later users' picks in the admin view.
  const PAGE = 1000;
  const predictions: any[] = [];
  let pErr: { message: string } | null = null;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseServer
      .from("predictor_predictions")
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

  const { data: categories } = await supabaseServer
    .from("predictor_categories")
    .select("id, name, category_type, sort_order, slug")
    .eq("tournament_id", tournamentId);

  if (pErr) return jsonError(pErr.message, 500);

  // Collect every option ID referenced by any prediction so we can fetch only
  // those rows — avoids Supabase's default 1000-row cap when the tournament
  // has many team-list categories (24 categories × ~48 teams blows past it).
  const referencedOptionIds = new Set<string>();
  for (const p of predictions ?? []) {
    if (Array.isArray(p.selected_option_ids)) {
      for (const id of p.selected_option_ids) {
        if (typeof id === "string") referencedOptionIds.add(id);
      }
    }
  }

  let options: any[] = [];
  if (referencedOptionIds.size > 0) {
    const ids = Array.from(referencedOptionIds);
    // Chunk to keep the URL length sane on very wide tournaments.
    const CHUNK = 200;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      // select("*") so missing optional columns (label_en, group_label_en
      // when the i18n migration hasn't been applied) don't break the route.
      const { data: opts, error: optErr } = await supabaseServer
        .from("predictor_options")
        .select("*")
        .in("id", slice);
      if (optErr) {
        console.error("[admin/predictions] options error:", optErr);
      } else if (opts) {
        options = options.concat(opts);
      }
    }
  }

  const catMap = new Map((categories ?? []).map((c: any) => [c.id, c]));
  const optMap = new Map((options ?? []).map((o: any) => [o.id, o]));

  // Diagnostic: surface how many predictions actually carry a non-empty
  // selection — useful when the admin view shows "No pick" everywhere
  // even though users believe they've picked. Helps distinguish between
  // "data not in DB" and "lookup failed".
  const withPicks = (predictions ?? []).filter(
    (p: any) =>
      Array.isArray(p.selected_option_ids) && p.selected_option_ids.length > 0,
  ).length;
  console.log(
    `[admin/predictions] tournament=${tournamentId} predictions=${predictions.length} withPicks=${withPicks} optionsResolved=${options.length}/${referencedOptionIds.size}`,
  );

  const rows = (predictions ?? []).map((p: any) => {
    const cat = catMap.get(p.category_id);
    const selectedIds = Array.isArray(p.selected_option_ids)
      ? p.selected_option_ids
      : [];
    const picked = selectedIds
      .map((id: string) => optMap.get(id) as any)
      .filter(Boolean);
    const option_labels = picked.map((o: any) => o.label);
    const option_picks = picked.map((o: any) => ({
      id: o.id,
      label: o.label,
      label_en: o.label_en ?? null,
      value: o.value ?? null,
      image_url: o.image_url ?? null,
      group_label: o.group_label ?? null,
    }));
    return {
      id: p.id,
      user_id: p.user_id,
      user_email: p.user_email,
      user_display_name: p.user_display_name,
      category_id: p.category_id,
      category_name: (cat as any)?.name ?? "Kategorija",
      category_type: (cat as any)?.category_type ?? "",
      category_slug: (cat as any)?.slug ?? null,
      category_sort_order: (cat as any)?.sort_order ?? 0,
      selected_option_ids: selectedIds,
      text_value: p.text_value,
      numeric_value: p.numeric_value,
      score_home: p.score_home,
      score_away: p.score_away,
      points_awarded: p.points_awarded ?? 0,
      is_scored: !!p.is_scored,
      option_labels,
      option_picks,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });

  return NextResponse.json(rows);
}
