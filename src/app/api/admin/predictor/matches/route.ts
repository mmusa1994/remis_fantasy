import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// GET ?tournament_id=...  — sve utakmice turnira
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id je obavezan");

  const { data, error } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("kickoff_at", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}

// POST — kreiraj jednu utakmicu ili bulk niz (array)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id) return jsonError("tournament_id je obavezan");

  const baseFields = (m: any) => ({
    tournament_id: body.tournament_id,
    stage: m.stage ?? "group",
    stage_label: m.stage_label ?? null,
    stage_label_en: m.stage_label_en ?? null,
    match_label: m.match_label ?? null,
    match_label_en: m.match_label_en ?? null,
    home_team: m.home_team,
    home_team_en: m.home_team_en ?? null,
    away_team: m.away_team,
    away_team_en: m.away_team_en ?? null,
    home_logo_url: m.home_logo_url ?? null,
    away_logo_url: m.away_logo_url ?? null,
    home_team_code: m.home_team_code ?? null,
    away_team_code: m.away_team_code ?? null,
    venue: m.venue ?? null,
    venue_en: m.venue_en ?? null,
    kickoff_at: m.kickoff_at ?? null,
    status: m.status ?? "scheduled",
    // Default scoring: exact 3 / correct outcome 1 / miss 0.
    points_exact: m.points_exact ?? 3,
    points_diff: m.points_diff ?? 1,
    points_winner: m.points_winner ?? 1,
    sort_order: m.sort_order ?? 0,
  });

  // bulk mode
  if (Array.isArray(body.matches)) {
    const rows = body.matches
      .filter((m: any) => m.home_team && m.away_team)
      .map((m: any, idx: number) => ({
        ...baseFields(m),
        sort_order: m.sort_order ?? idx,
      }));
    if (rows.length === 0) return jsonError("Lista je prazna");
    const { data, error } = await supabaseServer
      .from("predictor_matches")
      .insert(rows)
      .select();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
  }

  // single insert
  if (!body.home_team || !body.away_team) {
    return jsonError("home_team i away_team su obavezni");
  }
  const { data, error } = await supabaseServer
    .from("predictor_matches")
    .insert(baseFields(body))
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.id) return jsonError("id je obavezan");

  const updates: Record<string, unknown> = {};
  const allowed = [
    "stage",
    "stage_label",
    "stage_label_en",
    "match_label",
    "match_label_en",
    "home_team",
    "home_team_en",
    "away_team",
    "away_team_en",
    "home_logo_url",
    "away_logo_url",
    "home_team_code",
    "away_team_code",
    "venue",
    "venue_en",
    "kickoff_at",
    "status",
    "home_score",
    "away_score",
    "points_exact",
    "points_diff",
    "points_winner",
    "sort_order",
    "force_unlocked",
  ];
  for (const k of allowed) if (k in body) updates[k] = body[k];

  const { data, error } = await supabaseServer
    .from("predictor_matches")
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
  if (!id) return jsonError("id je obavezan");
  const { error } = await supabaseServer
    .from("predictor_matches")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
