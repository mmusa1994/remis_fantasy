import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireTournamentOwner,
  jsonError,
} from "@/lib/predictor";
import { getTemplate } from "@/data/predictor-templates";
import { seedTournamentFromTemplate } from "@/lib/predictor-seed";

/**
 * Apply a predictor template to an EXISTING tournament owned by the caller.
 *
 * Behaviour modes (via `mode` param, defaults to "merge"):
 *  - "reset"  → wipes existing categories/options/matches/rules/rewards first,
 *               then seeds. Use when the user clicks "Reset to template default".
 *  - "merge"  → just inserts the template content alongside existing.
 *               Use when the user wants to add a template's content to what
 *               they already built.
 *
 * Tournament metadata (name, slug, status, owner) is NEVER touched — only
 * the children. We also optionally apply template branding (logo, banner,
 * accent_color, prize_pool) when `applyBranding` is true.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const tournament_id = String(body?.tournament_id || "");
  const template_id = String(body?.template_id || "");
  const mode: "reset" | "merge" =
    body?.mode === "reset" ? "reset" : "merge";
  const applyBranding = !!body?.applyBranding;

  if (!tournament_id || !template_id) {
    return jsonError("tournament_id and template_id are required");
  }

  const own = await requireTournamentOwner(tournament_id);
  if (!own.ok) return own.response;

  const tmpl = getTemplate(template_id);
  if (!tmpl) return jsonError("Template not found", 404);

  if (mode === "reset") {
    // Order matters: delete options first (referenced by categories), then
    // categories, then matches/rules/rewards. predictor_predictions cascades
    // via FKs on category_id.
    const { data: cats } = await supabaseServer
      .from("predictor_categories")
      .select("id")
      .eq("tournament_id", tournament_id);
    const catIds = (cats || []).map((c: any) => c.id);
    if (catIds.length > 0) {
      await supabaseServer
        .from("predictor_options")
        .delete()
        .in("category_id", catIds);
    }
    await supabaseServer
      .from("predictor_categories")
      .delete()
      .eq("tournament_id", tournament_id);
    await supabaseServer
      .from("predictor_matches")
      .delete()
      .eq("tournament_id", tournament_id);
    await supabaseServer
      .from("predictor_rules")
      .delete()
      .eq("tournament_id", tournament_id);
    await supabaseServer
      .from("predictor_rewards")
      .delete()
      .eq("tournament_id", tournament_id);
  }

  if (applyBranding) {
    const update: Record<string, unknown> = {};
    if (tmpl.logo_url) update.logo_url = tmpl.logo_url;
    if (tmpl.banner_image_url) update.banner_image_url = tmpl.banner_image_url;
    if (tmpl.hero_image_url) update.hero_image_url = tmpl.hero_image_url;
    if (tmpl.accent_color) update.accent_color = tmpl.accent_color;
    if (tmpl.prize_pool_amount != null)
      update.prize_pool_amount = tmpl.prize_pool_amount;
    if (tmpl.prize_pool_currency)
      update.prize_pool_currency = tmpl.prize_pool_currency;
    if (Object.keys(update).length > 0) {
      await supabaseServer
        .from("predictor_tournaments")
        .update(update)
        .eq("id", tournament_id);
    }
  }

  const result = await seedTournamentFromTemplate(tournament_id, template_id);
  if (!result.ok) return jsonError(result.error || "Seed failed", 500);

  return NextResponse.json({ ok: true, mode, template_id });
}
