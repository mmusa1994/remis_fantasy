import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireTournamentOwner, jsonError } from "@/lib/predictor";

async function tournamentForOption(optionId: string): Promise<string | null> {
  const { data: opt } = await supabaseServer
    .from("predictor_options")
    .select("category_id")
    .eq("id", optionId)
    .maybeSingle();
  if (!opt?.category_id) return null;
  const { data: cat } = await supabaseServer
    .from("predictor_categories")
    .select("tournament_id")
    .eq("id", opt.category_id)
    .maybeSingle();
  return (cat?.tournament_id as string) || null;
}

async function tournamentForCategory(categoryId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("predictor_categories")
    .select("tournament_id")
    .eq("id", categoryId)
    .maybeSingle();
  return (data?.tournament_id as string) || null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.category_id) return jsonError("category_id is required");
  const tid = await tournamentForCategory(body.category_id);
  if (!tid) return jsonError("Category not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  if (Array.isArray(body.options)) {
    if (body.replace) {
      await supabaseServer
        .from("predictor_options")
        .delete()
        .eq("category_id", body.category_id);
    }
    const rows = body.options.map((o: any, idx: number) => ({
      category_id: body.category_id,
      label: o.label,
      label_en: o.label_en ?? null,
      value: o.value ?? null,
      image_url: o.image_url ?? null,
      group_label: o.group_label ?? null,
      group_label_en: o.group_label_en ?? null,
      metadata: o.metadata ?? {},
      sort_order: o.sort_order ?? idx,
      is_correct: !!o.is_correct,
      correct_rank: o.correct_rank ?? null,
    }));
    const { data, error } = await supabaseServer
      .from("predictor_options")
      .insert(rows)
      .select();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json(data ?? []);
  }

  if (!body.label) return jsonError("label is required");
  const { data, error } = await supabaseServer
    .from("predictor_options")
    .insert({
      category_id: body.category_id,
      label: body.label,
      label_en: body.label_en ?? null,
      value: body.value ?? null,
      image_url: body.image_url ?? null,
      group_label: body.group_label ?? null,
      group_label_en: body.group_label_en ?? null,
      metadata: body.metadata ?? {},
      sort_order: body.sort_order ?? 0,
      is_correct: !!body.is_correct,
      correct_rank: body.correct_rank ?? null,
    })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body?.id) return jsonError("id is required");
  const tid = await tournamentForOption(body.id);
  if (!tid) return jsonError("Option not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const updates: Record<string, unknown> = {};
  const allowed = [
    "label",
    "label_en",
    "value",
    "image_url",
    "group_label",
    "group_label_en",
    "metadata",
    "sort_order",
    "is_correct",
    "correct_rank",
  ];
  for (const k of allowed) if (k in body) updates[k] = body[k];
  const { data, error } = await supabaseServer
    .from("predictor_options")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");
  const tid = await tournamentForOption(id);
  if (!tid) return jsonError("Option not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const { error } = await supabaseServer
    .from("predictor_options")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
