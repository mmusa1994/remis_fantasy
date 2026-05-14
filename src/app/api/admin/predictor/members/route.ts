import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// GET ?tournament_id=...&status=  — list members (filtered by status optionally)
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const status = searchParams.get("status");
  if (!tournamentId) return jsonError("tournament_id je obavezan");

  let q = supabaseServer
    .from("predictor_members")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("requested_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

// PUT { id, status, admin_notes? } — promijeni status (odobri / odbij / banuj)
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.id || !body?.status) {
    return jsonError("id i status su obavezni");
  }
  if (!["pending", "approved", "rejected", "banned"].includes(body.status)) {
    return jsonError("nevažeći status");
  }

  const updates: Record<string, unknown> = {
    status: body.status,
  };
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
  if (body.status === "approved") {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = (guard.session.user as any)?.email ?? null;
  }

  const { data, error } = await supabaseServer
    .from("predictor_members")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

// DELETE ?id=...  — ukloni člana
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id je obavezan");

  const { error } = await supabaseServer
    .from("predictor_members")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
