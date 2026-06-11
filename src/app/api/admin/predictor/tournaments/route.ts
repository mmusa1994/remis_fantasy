import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, slugify } from "@/lib/predictor";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.name) return jsonError("name is required");

  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  const ownerUserId = typeof body.owner_user_id === "string" && body.owner_user_id.trim()
    ? body.owner_user_id.trim()
    : null;

  const insert = {
    slug,
    name: body.name,
    name_en: body.name_en ?? null,
    short_description: body.short_description ?? null,
    short_description_en: body.short_description_en ?? null,
    long_description: body.long_description ?? null,
    long_description_en: body.long_description_en ?? null,
    logo_url: body.logo_url ?? null,
    accent_color: body.accent_color ?? "amber",
    status: body.status ?? "draft",
    visibility: body.visibility ?? "public",
    starts_at: body.starts_at ?? null,
    ends_at: body.ends_at ?? null,
    registration_lock_at: body.registration_lock_at ?? null,
    rules_md: body.rules_md ?? null,
    rules_md_en: body.rules_md_en ?? null,
    point_system_md: body.point_system_md ?? null,
    point_system_md_en: body.point_system_md_en ?? null,
    eligibility_md: body.eligibility_md ?? null,
    eligibility_md_en: body.eligibility_md_en ?? null,
    prize_pool_amount: body.prize_pool_amount ?? null,
    prize_pool_currency: body.prize_pool_currency ?? "EUR",
    sponsor_name: body.sponsor_name ?? null,
    sponsor_logo_url: body.sponsor_logo_url ?? null,
    sponsor_url: body.sponsor_url ?? null,
    is_featured: !!body.is_featured,
    sort_order: body.sort_order ?? 0,
    require_approval: !!body.require_approval,
    owner_user_id: ownerUserId,
    created_via: ownerUserId ? "admin_for_user" : "admin",
  };

  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .insert(insert)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.id) return jsonError("id is required");

  const updates: Record<string, unknown> = {};
  const allowed = [
    "slug",
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
    "is_featured",
    "sort_order",
    "require_approval",
    "theme_background_image",
    "theme_music_enabled",
    "predictions_locked",
    "matches_locked",
  ];
  for (const k of allowed) {
    if (k in body) updates[k] = body[k];
  }
  if (updates.slug && typeof updates.slug === "string") {
    updates.slug = slugify(updates.slug);
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

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");

  const { error } = await supabaseServer
    .from("predictor_tournaments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
