import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireUser,
  isLocked,
  jsonError,
  checkMembership,
} from "@/lib/predictor";
import type { SubmitPredictionsPayload } from "@/types/predictor";

// Submit/upsert predictions for the current user across multiple categories.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { slug } = await context.params;
  const body = (await req.json()) as SubmitPredictionsPayload;
  if (!body?.items?.length) return jsonError("items required");

  const { data: tournament, error: tErr } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (tErr || !tournament) return jsonError("tournament not found", 404);
  if (tournament.status === "draft") return jsonError("not published", 404);

  // approval check
  const membership = await checkMembership(
    tournament.id,
    guard.user.id,
    !!tournament.require_approval,
  );
  if (!membership.allowed) {
    return NextResponse.json(
      {
        error: "not_approved",
        reason: membership.reason,
        message:
          membership.reason === "pending"
            ? "Tvoj zahtjev za učešće još čeka odobrenje admina."
            : membership.reason === "not_member"
              ? "Pridruži se ligi (zatraži učešće) da bi mogao predviđati."
              : "Tvoj zahtjev je odbijen ili je nalog blokiran.",
      },
      { status: 403 },
    );
  }

  const categoryIds = body.items.map((i) => i.category_id);
  const { data: categories, error: cErr } = await supabaseServer
    .from("predictor_categories")
    .select("*")
    .in("id", categoryIds)
    .eq("tournament_id", tournament.id);
  if (cErr) return jsonError(cErr.message, 500);
  const catMap = new Map((categories ?? []).map((c: any) => [c.id, c]));

  const userId = guard.user.id;
  const userEmail = guard.user.email ?? null;
  const userName =
    guard.user.name ?? guard.user.email?.split("@")[0] ?? null;

  const rows: any[] = [];
  const skipped: Array<{ category_id: string; reason: string }> = [];

  for (const item of body.items) {
    const cat = catMap.get(item.category_id);
    if (!cat) {
      skipped.push({ category_id: item.category_id, reason: "not_found" });
      continue;
    }
    if (
      isLocked(
        tournament.registration_lock_at,
        cat.lock_at,
        tournament.status,
      )
    ) {
      skipped.push({ category_id: item.category_id, reason: "locked" });
      continue;
    }

    // shape based on type
    const selected = Array.isArray(item.selected_option_ids)
      ? item.selected_option_ids.slice(0, Math.max(1, cat.max_selections))
      : [];

    rows.push({
      tournament_id: tournament.id,
      category_id: item.category_id,
      user_id: userId,
      user_email: userEmail,
      user_display_name: userName,
      selected_option_ids: selected,
      text_value: item.text_value ?? null,
      numeric_value: item.numeric_value ?? null,
      score_home: item.score_home ?? null,
      score_away: item.score_away ?? null,
    });
  }

  if (!rows.length) {
    return NextResponse.json({ ok: true, saved: 0, skipped });
  }

  const { data, error } = await supabaseServer
    .from("predictor_predictions")
    .upsert(rows, { onConflict: "user_id,category_id" })
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({
    ok: true,
    saved: data?.length ?? 0,
    skipped,
  });
}
