import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, slugify } from "@/lib/predictor";
import { getTemplate } from "@/data/predictor-templates";

// POST { template_id, name_override?, slug_override?, accent_color_override? }
// Kreira novi turnir + sve kategorije + opcije + pravila + nagrade.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.template_id) return jsonError("template_id je obavezan");

  const tmpl = getTemplate(body.template_id);
  if (!tmpl) return jsonError("Šablon nije pronađen", 404);

  const desiredName = String(body.name_override || tmpl.name).trim();
  const desiredSlugRaw = body.slug_override
    ? String(body.slug_override)
    : `${tmpl.id}-${Date.now().toString(36)}`;
  const slug = slugify(desiredSlugRaw);

  // 1) kreiraj turnir
  const { data: tournament, error: tErr } = await supabaseServer
    .from("predictor_tournaments")
    .insert({
      slug,
      name: desiredName,
      short_description: tmpl.short_description,
      long_description: tmpl.long_description ?? null,
      logo_url: tmpl.logo_url ?? null,
      accent_color: body.accent_color_override || tmpl.accent_color,
      status: "draft",
      visibility: "public",
      rules_md: tmpl.rules_md ?? null,
      point_system_md: tmpl.point_system_md ?? null,
      eligibility_md: tmpl.eligibility_md ?? null,
      prize_pool_amount: tmpl.prize_pool_amount ?? null,
      prize_pool_currency: tmpl.prize_pool_currency ?? "EUR",
    })
    .select()
    .single();

  if (tErr || !tournament) {
    return jsonError(tErr?.message || "Greška pri kreiranju turnira", 500);
  }

  // 2) kreiraj kategorije + opcije
  for (const cat of tmpl.categories) {
    const { data: created, error: cErr } = await supabaseServer
      .from("predictor_categories")
      .insert({
        tournament_id: tournament.id,
        slug: slugify(cat.slug || cat.name),
        name: cat.name,
        description: cat.description ?? null,
        rules_md: cat.rules_md ?? null,
        category_type: cat.category_type,
        max_selections: cat.max_selections ?? 1,
        points_correct: cat.points_correct,
        points_partial: cat.points_partial ?? 0,
        points_ranked_bonus: cat.points_ranked_bonus ?? 0,
        visibility: "public",
        sort_order: cat.sort_order,
        is_active: true,
      })
      .select()
      .single();

    if (cErr || !created) continue;

    if (cat.options && cat.options.length > 0) {
      const optionRows = cat.options.map((o, idx) => ({
        category_id: created.id,
        label: o.label,
        value: o.value ?? null,
        image_url: o.image_url ?? null,
        group_label: o.group_label ?? null,
        metadata: o.metadata ?? {},
        sort_order: idx,
        is_correct: false,
      }));
      await supabaseServer.from("predictor_options").insert(optionRows);
    }
  }

  // 3) pravila
  if (tmpl.rules?.length) {
    const ruleRows = tmpl.rules.map((r, idx) => ({
      tournament_id: tournament.id,
      kind: r.kind,
      title: r.title,
      body_md: r.body_md ?? null,
      sort_order: r.sort_order ?? idx,
    }));
    await supabaseServer.from("predictor_rules").insert(ruleRows);
  }

  // 4) nagrade
  if (tmpl.rewards?.length) {
    const rewardRows = tmpl.rewards.map((rw, idx) => ({
      tournament_id: tournament.id,
      rank_position: rw.rank_position ?? null,
      title: rw.title,
      description: rw.description ?? null,
      prize_type: rw.prize_type,
      prize_value: rw.prize_value ?? null,
      prize_currency: rw.prize_currency ?? "EUR",
      sponsor_name: rw.sponsor_name ?? null,
      sort_order: rw.sort_order ?? idx,
    }));
    await supabaseServer.from("predictor_rewards").insert(rewardRows);
  }

  return NextResponse.json({
    ok: true,
    tournament,
    imported: {
      categories: tmpl.categories.length,
      rules: tmpl.rules?.length ?? 0,
      rewards: tmpl.rewards?.length ?? 0,
    },
  });
}
