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
    kind: body.kind ?? "rule",
    title: body.title,
    body_md: body.body_md ?? null,
    icon: body.icon ?? null,
    sort_order: body.sort_order ?? 0,
  };
  const { data, error } = await supabaseServer
    .from("predictor_rules")
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
  const allowed = ["kind", "title", "body_md", "icon", "sort_order"];
  for (const k of allowed) if (k in body) updates[k] = body[k];

  const { data, error } = await supabaseServer
    .from("predictor_rules")
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
    .from("predictor_rules")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
