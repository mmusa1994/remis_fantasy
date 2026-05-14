import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError, slugify } from "@/lib/predictor";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id is required");

  const { data, error } = await supabaseServer
    .from("predictor_categories")
    .select("*, predictor_options(*)")
    .eq("tournament_id", tournamentId)
    .order("sort_order", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id || !body?.name) {
    return jsonError("tournament_id and name are required");
  }
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  const insert = {
    tournament_id: body.tournament_id,
    slug,
    name: body.name,
    description: body.description ?? null,
    rules_md: body.rules_md ?? null,
    icon: body.icon ?? null,
    category_type: body.category_type ?? "single_choice",
    max_selections: body.max_selections ?? 1,
    points_correct: body.points_correct ?? 10,
    points_partial: body.points_partial ?? 0,
    points_ranked_bonus: body.points_ranked_bonus ?? 0,
    visibility: body.visibility ?? "public",
    lock_at: body.lock_at ?? null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabaseServer
    .from("predictor_categories")
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
    "description",
    "rules_md",
    "icon",
    "category_type",
    "max_selections",
    "points_correct",
    "points_partial",
    "points_ranked_bonus",
    "visibility",
    "lock_at",
    "sort_order",
    "is_active",
  ];
  for (const k of allowed) if (k in body) updates[k] = body[k];
  if (updates.slug && typeof updates.slug === "string") {
    updates.slug = slugify(updates.slug);
  }

  const { data, error } = await supabaseServer
    .from("predictor_categories")
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
    .from("predictor_categories")
    .delete()
    .eq("id", id);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
