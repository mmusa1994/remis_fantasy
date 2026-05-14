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

  const [{ data: predictions, error: pErr }, { data: categories }, { data: options }] =
    await Promise.all([
      supabaseServer
        .from("predictor_predictions")
        .select("*")
        .eq("tournament_id", tournamentId),
      supabaseServer
        .from("predictor_categories")
        .select("id, name, category_type")
        .eq("tournament_id", tournamentId),
      supabaseServer
        .from("predictor_options")
        .select("id, label, category_id"),
    ]);

  if (pErr) return jsonError(pErr.message, 500);

  const catMap = new Map((categories ?? []).map((c: any) => [c.id, c]));
  const optMap = new Map((options ?? []).map((o: any) => [o.id, o]));

  const rows = (predictions ?? []).map((p: any) => {
    const cat = catMap.get(p.category_id);
    const selectedIds = Array.isArray(p.selected_option_ids)
      ? p.selected_option_ids
      : [];
    const option_labels = selectedIds
      .map((id: string) => (optMap.get(id) as any)?.label)
      .filter(Boolean);
    return {
      id: p.id,
      user_id: p.user_id,
      user_email: p.user_email,
      user_display_name: p.user_display_name,
      category_id: p.category_id,
      category_name: (cat as any)?.name ?? "Kategorija",
      category_type: (cat as any)?.category_type ?? "",
      selected_option_ids: selectedIds,
      text_value: p.text_value,
      numeric_value: p.numeric_value,
      score_home: p.score_home,
      score_away: p.score_away,
      points_awarded: p.points_awarded ?? 0,
      is_scored: !!p.is_scored,
      option_labels,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });

  return NextResponse.json(rows);
}
