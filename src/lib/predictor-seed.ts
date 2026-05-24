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
): Promise<{ ok: boolean; error?: string; categories?: number; errors?: string[] }> {
  const tmpl = getTemplate(templateId);
  if (!tmpl) return { ok: false, error: "Template not found" };
  const seedErrors: string[] = [];

  // Categories + options. We seed both the BS and EN columns so the editor
  // and public pages can swap language without re-touching the data.
  // Uses upsert on (tournament_id, slug) to handle re-application gracefully.
  let catInserted = 0;
  for (const cat of tmpl.categories) {
    const catSlug = slugify(cat.slug || cat.name);
    const catPayload: Record<string, unknown> = {
      tournament_id: tournamentId,
      slug: catSlug,
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
    };
    // _en columns added conditionally (skip if migration not applied)
    if (cat.name_en) catPayload.name_en = cat.name_en;
    if (cat.description_en) catPayload.description_en = cat.description_en;
    if (cat.rules_md_en) catPayload.rules_md_en = cat.rules_md_en;

    // Try upsert first (handles duplicate slugs), fall back to insert
    let created: any = null;
    let cErr: any = null;

    const upsertResult = await supabaseServer
      .from("predictor_categories")
      .upsert(catPayload, { onConflict: "tournament_id,slug" })
      .select()
      .single();
    created = upsertResult.data;
    cErr = upsertResult.error;

    // Fallback: if upsert fails (e.g. missing _en columns), retry without _en
    if (cErr) {
      console.warn(
        `[seedTournamentFromTemplate] upsert failed for "${cat.name}", retrying without _en:`,
        cErr.message,
      );
      delete catPayload.name_en;
      delete catPayload.description_en;
      delete catPayload.rules_md_en;
      const fallback = await supabaseServer
        .from("predictor_categories")
        .upsert(catPayload, { onConflict: "tournament_id,slug" })
        .select()
        .single();
      created = fallback.data;
      cErr = fallback.error;
    }

    if (cErr || !created) {
      const errMsg = `category "${cat.name}" (slug: ${catSlug}): ${cErr?.message ?? "no data returned"}`;
      console.error(`[seedTournamentFromTemplate] ${errMsg}`);
      seedErrors.push(errMsg);
      continue;
    }
    catInserted++;

    if (cat.options && cat.options.length > 0) {
      // Delete existing options for this category before re-inserting
      await supabaseServer
        .from("predictor_options")
        .delete()
        .eq("category_id", created.id);

      const buildRows = (includeEn: boolean) =>
        cat.options!.map((o: any, idx: number) => {
          const row: Record<string, unknown> = {
            category_id: created.id,
            label: o.label,
            value: o.value ?? null,
            image_url: o.image_url ?? null,
            group_label: o.group_label ?? null,
            metadata: o.metadata ?? {},
            sort_order: idx,
            is_correct: false,
          };
          if (includeEn) {
            if (o.label_en) row.label_en = o.label_en;
            if (o.group_label_en) row.group_label_en = o.group_label_en;
          }
          return row;
        });

      // Try with _en columns first; fall back without if DB columns don't exist
      let { error: oErr } = await supabaseServer
        .from("predictor_options")
        .insert(buildRows(true));
      if (oErr) {
        console.warn(
          `[seedTournamentFromTemplate] options for "${cat.name}" failed with _en, retrying without:`,
          oErr.message,
        );
        const fallback = await supabaseServer
          .from("predictor_options")
          .insert(buildRows(false));
        if (fallback.error) {
          console.error(
            `[seedTournamentFromTemplate] options for "${cat.name}" fallback also failed:`,
            fallback.error.message,
          );
          seedErrors.push(`options "${cat.name}": ${fallback.error.message}`);
        }
      }
    }
  }
  console.log(
    `[seedTournamentFromTemplate] inserted ${catInserted}/${tmpl.categories.length} categories`,
  );

  // Rules
  if (tmpl.rules?.length) {
    const ruleRows = tmpl.rules.map((r, idx) => {
      const row: Record<string, unknown> = {
        tournament_id: tournamentId,
        kind: r.kind,
        title: r.title,
        body_md: r.body_md ?? null,
        sort_order: r.sort_order ?? idx,
      };
      if (r.title_en) row.title_en = r.title_en;
      if (r.body_md_en) row.body_md_en = r.body_md_en;
      return row;
    });
    const { error: rErr } = await supabaseServer
      .from("predictor_rules")
      .insert(ruleRows);
    if (rErr) {
      console.error("[seedTournamentFromTemplate] rules insert failed:", rErr.message);
      // Retry without _en columns
      const { error: rErr2 } = await supabaseServer
        .from("predictor_rules")
        .insert(
          ruleRows.map((r) => {
            const { title_en, body_md_en, ...rest } = r as any;
            return rest;
          }),
        );
      if (rErr2) {
        console.error("[seedTournamentFromTemplate] rules fallback also failed:", rErr2.message);
      }
    }
  }

  // Rewards
  if (tmpl.rewards?.length) {
    const rewardRows = tmpl.rewards.map((r, idx) => {
      const row: Record<string, unknown> = {
        tournament_id: tournamentId,
        rank_position: r.rank_position ?? null,
        title: r.title,
        description: r.description ?? null,
        prize_type: r.prize_type,
        prize_value: r.prize_value ?? null,
        prize_currency: r.prize_currency ?? "EUR",
        sponsor_name: r.sponsor_name ?? null,
        sort_order: r.sort_order ?? idx,
      };
      if (r.title_en) row.title_en = r.title_en;
      if (r.description_en) row.description_en = r.description_en;
      return row;
    });
    const { error: rwErr } = await supabaseServer
      .from("predictor_rewards")
      .insert(rewardRows);
    if (rwErr) {
      console.error("[seedTournamentFromTemplate] rewards insert failed:", rwErr.message);
      const { error: rwErr2 } = await supabaseServer
        .from("predictor_rewards")
        .insert(
          rewardRows.map((r) => {
            const { title_en, description_en, ...rest } = r as any;
            return rest;
          }),
        );
      if (rwErr2) {
        console.error("[seedTournamentFromTemplate] rewards fallback also failed:", rwErr2.message);
      }
    }
  }

  // Optional: auto-import a full match schedule
  if (tmpl.defaultMatchTemplateId) {
    const matchTmpl = getMatchTemplate(tmpl.defaultMatchTemplateId);
    if (matchTmpl) {
      const defaultScoring = tmpl.defaultMatchScoring;
      const rows = expandMatchTemplate(matchTmpl).map((row) => ({
        ...row,
        tournament_id: tournamentId,
        ...(defaultScoring
          ? {
              points_exact: defaultScoring.points_exact,
              points_diff: defaultScoring.points_diff,
              points_winner: defaultScoring.points_winner,
            }
          : {}),
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

  // Auto-enable theme settings (music + background) for templates that define them
  if (tmpl.theme_music_enabled || tmpl.theme_background_image) {
    await supabaseServer
      .from("predictor_tournaments")
      .update({
        ...(tmpl.theme_music_enabled
          ? { theme_music_enabled: true }
          : {}),
        ...(tmpl.theme_background_image
          ? { theme_background_image: tmpl.theme_background_image }
          : {}),
      })
      .eq("id", tournamentId);
  }

  if (seedErrors.length > 0) {
    return {
      ok: false,
      error: `${catInserted}/${tmpl.categories.length} categories seeded. Errors: ${seedErrors.join("; ")}`,
      categories: catInserted,
      errors: seedErrors,
    };
  }

  return { ok: true, categories: catInserted };
}
