import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// Bulk-replace options for a category if `replace=true`. Otherwise insert one.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.category_id) return jsonError("category_id is required");

  // Bulk save. Postojeći UUID-ovi opcija se MORAJU sačuvati — korisničke
  // predikcije ih referenciraju preko selected_option_ids (bez FK), pa bi
  // delete-all + insert tiho "osiročio" svaki ranije sačuvani tip.
  if (Array.isArray(body.options)) {
    const { data: existingRows } = await supabaseServer
      .from("predictor_options")
      .select("id")
      .eq("category_id", body.category_id);
    const existingIds = new Set((existingRows ?? []).map((r: any) => r.id));

    const rows = body.options.map((o: any, idx: number) => ({
      id: existingIds.has(o.id) ? (o.id as string) : undefined,
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

    if (body.replace) {
      const keepIds = rows
        .map((r: any) => r.id)
        .filter(Boolean) as string[];
      const removeIds = [...existingIds].filter((id) => !keepIds.includes(id));
      if (removeIds.length > 0) {
        const { error: delErr } = await supabaseServer
          .from("predictor_options")
          .delete()
          .eq("category_id", body.category_id)
          .in("id", removeIds);
        if (delErr) return jsonError(delErr.message, 500);
      }
    }

    const toUpdate = rows.filter((r: any) => r.id);
    const toInsert = rows
      .filter((r: any) => !r.id)
      .map(({ id: _id, ...rest }: any) => rest);
    const saved: any[] = [];
    if (toUpdate.length > 0) {
      const { data, error } = await supabaseServer
        .from("predictor_options")
        .upsert(toUpdate, { onConflict: "id" })
        .select();
      if (error) return jsonError(error.message, 500);
      saved.push(...(data ?? []));
    }
    if (toInsert.length > 0) {
      const { data, error } = await supabaseServer
        .from("predictor_options")
        .insert(toInsert)
        .select();
      if (error) return jsonError(error.message, 500);
      saved.push(...(data ?? []));
    }
    return NextResponse.json(saved);
  }

  // Single insert
  if (!body.label) return jsonError("label is required");
  const insert = {
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
  };
  const { data, error } = await supabaseServer
    .from("predictor_options")
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
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");

  const { error } = await supabaseServer
    .from("predictor_options")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
