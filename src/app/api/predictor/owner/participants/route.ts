import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireTournamentOwner,
  jsonError,
  resolveDisplayNames,
} from "@/lib/predictor";

// GET ?tournament_id=...  — everyone with a footprint in the tournament:
// anyone who has submitted category/match predictions OR has a member row.
// Aggregated per user so the owner can review and (if needed) purge them.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  const [{ data: cat }, { data: match }, { data: members }] = await Promise.all([
    supabaseServer
      .from("predictor_predictions")
      .select("user_id, user_email, user_display_name, points_awarded")
      .eq("tournament_id", tournamentId),
    supabaseServer
      .from("predictor_match_predictions")
      .select("user_id, user_email, user_display_name, points_awarded")
      .eq("tournament_id", tournamentId),
    supabaseServer
      .from("predictor_members")
      .select("user_id, user_email, user_display_name, status")
      .eq("tournament_id", tournamentId),
  ]);

  type Row = {
    user_id: string;
    user_display_name: string | null;
    user_email: string | null;
    category_count: number;
    category_points: number;
    match_count: number;
    match_points: number;
    total_points: number;
    member_status: string | null;
  };

  const map = new Map<string, Row>();
  const ensure = (uid: string, name: string | null, email: string | null): Row => {
    const cur =
      map.get(uid) ?? {
        user_id: uid,
        user_display_name: name,
        user_email: email,
        category_count: 0,
        category_points: 0,
        match_count: 0,
        match_points: 0,
        total_points: 0,
        member_status: null,
      };
    if (!cur.user_display_name && name) cur.user_display_name = name;
    if (!cur.user_email && email) cur.user_email = email;
    map.set(uid, cur);
    return cur;
  };

  for (const p of cat ?? []) {
    if (!p.user_id) continue;
    const r = ensure(p.user_id, p.user_display_name, p.user_email);
    r.category_count += 1;
    r.category_points += p.points_awarded ?? 0;
  }
  for (const p of match ?? []) {
    if (!p.user_id) continue;
    const r = ensure(p.user_id, p.user_display_name, p.user_email);
    r.match_count += 1;
    r.match_points += p.points_awarded ?? 0;
  }
  for (const m of members ?? []) {
    if (!m.user_id) continue;
    const r = ensure(m.user_id, m.user_display_name, m.user_email);
    r.member_status = m.status ?? null;
  }

  // Override the denormalized snapshot with the current profile name so a
  // rename in /profile reflects in the owner participant list immediately.
  const nameMap = await resolveDisplayNames([...map.keys()]);

  const rows = Array.from(map.values())
    .map((r) => ({
      ...r,
      user_display_name: nameMap.get(r.user_id) ?? r.user_display_name,
      total_points: r.category_points + r.match_points,
    }))
    .sort((a, b) => {
      // most predictions first, then highest points
      const predA = a.category_count + a.match_count;
      const predB = b.category_count + b.match_count;
      if (predB !== predA) return predB - predA;
      return b.total_points - a.total_points;
    });

  return NextResponse.json(rows);
}

// DELETE ?tournament_id=...&user_id=...  — completely purge a player from this
// tournament: every category prediction, every match prediction, and their
// member row. Irreversible. Eternal-table entries are manual (keyed by name,
// not user) and are left untouched.
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const userId = searchParams.get("user_id");
  if (!tournamentId || !userId) {
    return jsonError("tournament_id and user_id are required");
  }
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  const [catRes, matchRes, memberRes] = await Promise.all([
    supabaseServer
      .from("predictor_predictions")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId),
    supabaseServer
      .from("predictor_match_predictions")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId),
    supabaseServer
      .from("predictor_members")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId),
  ]);

  const err = catRes.error || matchRes.error || memberRes.error;
  if (err) return jsonError(err.message, 500);

  return NextResponse.json({ ok: true });
}
