import "server-only";
import { supabaseServer } from "@/lib/supabase-server";
import { getTemplate } from "@/data/predictor-templates";
import {
  getMatchTemplate,
  expandMatchTemplate,
} from "@/data/predictor-match-templates";
import { slugify } from "@/lib/predictor";

/**
 * Apply a predictor template to an existing tournament: seeds categories,
 * options, rules, rewards. Tournament metadata (name, slug, accent) is set
 * at creation time — this function only fills the children.
 *
 * Safe to call multiple times: each insert is per-row; rerunning would create
 * duplicates, so the callers (checkout API + webhook) only call once per
 * tournament creation.
 */
export async function seedTournamentFromTemplate(
  tournamentId: string,
  templateId: string,
): Promise<{ ok: boolean; error?: string }> {
  const tmpl = getTemplate(templateId);
  if (!tmpl) return { ok: false, error: "Template not found" };

  // Categories + options. We seed both the BS and EN columns so the editor
  // and public pages can swap language without re-touching the data.
  for (const cat of tmpl.categories) {
    const { data: created, error: cErr } = await supabaseServer
      .from("predictor_categories")
      .insert({
        tournament_id: tournamentId,
        slug: slugify(cat.slug || cat.name),
        name: cat.name,
        name_en: cat.name_en ?? null,
        description: cat.description ?? null,
        description_en: cat.description_en ?? null,
        rules_md: cat.rules_md ?? null,
        rules_md_en: cat.rules_md_en ?? null,
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
      const optionRows = cat.options.map((o: any, idx: number) => ({
        category_id: created.id,
        label: o.label,
        label_en: o.label_en ?? null,
        value: o.value ?? null,
        image_url: o.image_url ?? null,
        group_label: o.group_label ?? null,
        group_label_en: o.group_label_en ?? null,
        metadata: o.metadata ?? {},
        sort_order: idx,
        is_correct: false,
      }));
      await supabaseServer.from("predictor_options").insert(optionRows);
    }
  }

  // Rules
  if (tmpl.rules?.length) {
    await supabaseServer.from("predictor_rules").insert(
      tmpl.rules.map((r, idx) => ({
        tournament_id: tournamentId,
        kind: r.kind,
        title: r.title,
        title_en: r.title_en ?? null,
        body_md: r.body_md ?? null,
        body_md_en: r.body_md_en ?? null,
        sort_order: r.sort_order ?? idx,
      })),
    );
  }

  // Rewards
  if (tmpl.rewards?.length) {
    await supabaseServer.from("predictor_rewards").insert(
      tmpl.rewards.map((r, idx) => ({
        tournament_id: tournamentId,
        rank_position: r.rank_position ?? null,
        title: r.title,
        title_en: r.title_en ?? null,
        description: r.description ?? null,
        description_en: r.description_en ?? null,
        prize_type: r.prize_type,
        prize_value: r.prize_value ?? null,
        prize_currency: r.prize_currency ?? "EUR",
        sponsor_name: r.sponsor_name ?? null,
        sort_order: r.sort_order ?? idx,
      })),
    );
  }

  // Optional: auto-import a full match schedule
  if (tmpl.defaultMatchTemplateId) {
    const matchTmpl = getMatchTemplate(tmpl.defaultMatchTemplateId);
    if (matchTmpl) {
      const rows = expandMatchTemplate(matchTmpl).map((row) => ({
        ...row,
        tournament_id: tournamentId,
      }));
      if (rows.length > 0) {
        const { error: mErr } = await supabaseServer
          .from("predictor_matches")
          .insert(rows);
        if (mErr) {
          console.error(
            "[seedTournamentFromTemplate] match insert failed:",
            mErr.message,
          );
        }
      }
    }
  }

  return { ok: true };
}
