import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id || !body?.title) {
    return jsonError("tournament_id and title are required");
  }
  const insert = {
    tournament_id: body.tournament_id,
    rank_position: body.rank_position ?? null,
    title: body.title,
    title_en: body.title_en ?? null,
    description: body.description ?? null,
    description_en: body.description_en ?? null,
    prize_type: body.prize_type ?? "cash",
    prize_value: body.prize_value ?? null,
    prize_currency: body.prize_currency ?? "EUR",
    image_url: body.image_url ?? null,
    sponsor_name: body.sponsor_name ?? null,
    sponsor_logo_url: body.sponsor_logo_url ?? null,
    sponsor_url: body.sponsor_url ?? null,
    sort_order: body.sort_order ?? 0,
  };
  const { data, error } = await supabaseServer
    .from("predictor_rewards")
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
    "rank_position",
    "title",
    "title_en",
    "description",
    "description_en",
    "prize_type",
    "prize_value",
    "prize_currency",
    "image_url",
    "sponsor_name",
    "sponsor_logo_url",
    "sponsor_url",
    "sort_order",
  ];
  for (const k of allowed) if (k in body) updates[k] = body[k];

  const { data, error } = await supabaseServer
    .from("predictor_rewards")
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
    .from("predictor_rewards")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
