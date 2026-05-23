import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireTournamentOwner, jsonError } from "@/lib/predictor";

async function tournamentForRule(ruleId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("predictor_rules")
    .select("tournament_id")
    .eq("id", ruleId)
    .maybeSingle();
  return (data?.tournament_id as string) || null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;
  const { data, error } = await supabaseServer
    .from("predictor_rules")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("sort_order", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.tournament_id || !body?.title)
    return jsonError("tournament_id and title are required");
  const own = await requireTournamentOwner(body.tournament_id);
  if (!own.ok) return own.response;

  const { data, error } = await supabaseServer
    .from("predictor_rules")
    .insert({
      tournament_id: body.tournament_id,
      kind: body.kind ?? "rule",
      title: body.title,
      title_en: body.title_en ?? null,
      body_md: body.body_md ?? null,
      body_md_en: body.body_md_en ?? null,
      icon: body.icon ?? null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body?.id) return jsonError("id is required");
  const tid = await tournamentForRule(body.id);
  if (!tid) return jsonError("Rule not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const updates: Record<string, unknown> = {};
  const allowed = ["kind", "title", "title_en", "body_md", "body_md_en", "icon", "sort_order"];
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");
  const tid = await tournamentForRule(id);
  if (!tid) return jsonError("Rule not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;
  const { error } = await supabaseServer.from("predictor_rules").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
