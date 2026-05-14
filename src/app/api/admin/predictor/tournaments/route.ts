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

  const insert = {
    slug,
    name: body.name,
    short_description: body.short_description ?? null,
    long_description: body.long_description ?? null,
    banner_image_url: body.banner_image_url ?? null,
    hero_image_url: body.hero_image_url ?? null,
    logo_url: body.logo_url ?? null,
    accent_color: body.accent_color ?? "amber",
    status: body.status ?? "draft",
    visibility: body.visibility ?? "public",
    starts_at: body.starts_at ?? null,
    ends_at: body.ends_at ?? null,
    registration_lock_at: body.registration_lock_at ?? null,
    rules_md: body.rules_md ?? null,
    point_system_md: body.point_system_md ?? null,
    eligibility_md: body.eligibility_md ?? null,
    prize_pool_amount: body.prize_pool_amount ?? null,
    prize_pool_currency: body.prize_pool_currency ?? "EUR",
    sponsor_name: body.sponsor_name ?? null,
    sponsor_logo_url: body.sponsor_logo_url ?? null,
    sponsor_url: body.sponsor_url ?? null,
    is_featured: !!body.is_featured,
    sort_order: body.sort_order ?? 0,
    require_approval: !!body.require_approval,
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
    "short_description",
    "long_description",
    "banner_image_url",
    "hero_image_url",
    "logo_url",
    "accent_color",
    "status",
    "visibility",
    "starts_at",
    "ends_at",
    "registration_lock_at",
    "rules_md",
    "point_system_md",
    "eligibility_md",
    "prize_pool_amount",
    "prize_pool_currency",
    "sponsor_name",
    "sponsor_logo_url",
    "sponsor_url",
    "is_featured",
    "sort_order",
    "require_approval",
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
