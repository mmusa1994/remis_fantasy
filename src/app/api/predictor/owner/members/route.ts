import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireTournamentOwner,
  jsonError,
  resolveDisplayNames,
} from "@/lib/predictor";

async function tournamentForMember(memberId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("predictor_members")
    .select("tournament_id")
    .eq("id", memberId)
    .maybeSingle();
  return (data?.tournament_id as string) || null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const status = searchParams.get("status");
  if (!tournamentId) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  let q = supabaseServer
    .from("predictor_members")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("requested_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return jsonError(error.message, 500);

  // Override the denormalized snapshot with the current profile name so a
  // rename in /profile reflects in the approval list immediately.
  const nameMap = await resolveDisplayNames(
    (data ?? []).map((m: any) => m.user_id),
  );
  const members = (data ?? []).map((m: any) => ({
    ...m,
    user_display_name: nameMap.get(m.user_id) ?? m.user_display_name,
  }));
  return NextResponse.json(members);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body?.id || !body?.status) return jsonError("id and status are required");
  if (!["pending", "approved", "rejected", "banned"].includes(body.status))
    return jsonError("invalid status");
  const tid = await tournamentForMember(body.id);
  if (!tid) return jsonError("Member not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const updates: Record<string, unknown> = { status: body.status };
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
  if (body.status === "approved") {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = own.user.email ?? null;
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

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");
  const tid = await tournamentForMember(id);
  if (!tid) return jsonError("Member not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;
  const { error } = await supabaseServer.from("predictor_members").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
