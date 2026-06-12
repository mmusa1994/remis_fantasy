import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireUser,
  requireTournamentOwner,
  jsonError,
  slugify,
} from "@/lib/predictor";

// GET — list tournaments owned by current user (or fetch a single one if ?id=…)
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const own = await requireTournamentOwner(id);
    if (!own.ok) return own.response;
    const { data, error } = await supabaseServer
      .from("predictor_tournaments")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json(data);
  }

  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .eq("owner_user_id", guard.user.id)
    // Personal collection = self-service only. /admin-created tournaments
    // (created_via "admin" / "admin_for_user") are managed in /admin.
    .in("created_via", ["user_credit", "user_paid"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

// PUT — update tournament (only owner-editable fields)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body?.id) return jsonError("id is required");

  const own = await requireTournamentOwner(body.id);
  if (!own.ok) return own.response;

  const allowed = [
    "name",
    "name_en",
    "short_description",
    "short_description_en",
    "long_description",
    "long_description_en",
    "logo_url",
    "accent_color",
    "status",
    "visibility",
    "starts_at",
    "ends_at",
    "registration_lock_at",
    "rules_md",
    "rules_md_en",
    "point_system_md",
    "point_system_md_en",
    "eligibility_md",
    "eligibility_md_en",
    "prize_pool_amount",
    "prize_pool_currency",
    "sponsor_name",
    "sponsor_logo_url",
    "sponsor_url",
    "require_approval",
    "banner_image_url",
    "theme_background_image",
    "theme_music_enabled",
    "prediction_lock_mode",
    "predictions_locked",
    "predictions_force_unlocked",
    "matches_locked",
  ];

  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];

  // Slug change is allowed but must remain unique
  if (typeof body.slug === "string" && body.slug.trim()) {
    const newSlug = slugify(body.slug);
    const { data: clash } = await supabaseServer
      .from("predictor_tournaments")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", body.id)
      .maybeSingle();
    if (clash) return jsonError("Slug je već zauzet", 409);
    updates.slug = newSlug;
  }

  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

// DELETE — soft delete (owner can delete their own)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");
  const own = await requireTournamentOwner(id);
  if (!own.ok) return own.response;
  const { error } = await supabaseServer
    .from("predictor_tournaments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
