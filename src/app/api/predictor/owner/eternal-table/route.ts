import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireTournamentOwner, jsonError } from "@/lib/predictor";

// ─────────────────────────────────────────────────────────────────────────────
// Owner-only CRUD for the per-tournament Eternal Table.
// Single route handles both `columns` and `entries` resources via ?resource=
// to keep the API surface tight.
// ─────────────────────────────────────────────────────────────────────────────

type Resource = "columns" | "entries";

function parseResource(value: string | null): Resource | null {
  if (value === "columns" || value === "entries") return value;
  return null;
}

async function tournamentForRow(
  resource: Resource,
  id: string
): Promise<string | null> {
  const table =
    resource === "columns"
      ? "predictor_eternal_columns"
      : "predictor_eternal_entries";
  const { data } = await supabaseServer
    .from(table)
    .select("tournament_id")
    .eq("id", id)
    .maybeSingle();
  return (data?.tournament_id as string) || null;
}

// GET /api/predictor/owner/eternal-table?tournament_id=...
// Returns both columns and entries for the tournament in one shot.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  const [colsRes, entriesRes] = await Promise.all([
    supabaseServer
      .from("predictor_eternal_columns")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true }),
    supabaseServer
      .from("predictor_eternal_entries")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true }),
  ]);

  if (colsRes.error) return jsonError(colsRes.error.message, 500);
  if (entriesRes.error) return jsonError(entriesRes.error.message, 500);

  return NextResponse.json({
    columns: colsRes.data ?? [],
    entries: entriesRes.data ?? [],
  });
}

// POST /api/predictor/owner/eternal-table?resource=columns|entries
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = parseResource(searchParams.get("resource"));
  if (!resource)
    return jsonError("resource must be 'columns' or 'entries'");
  const body = await req.json();
  if (!body?.tournament_id) return jsonError("tournament_id is required");
  const own = await requireTournamentOwner(body.tournament_id);
  if (!own.ok) return own.response;

  if (resource === "columns") {
    if (!body.label?.toString().trim())
      return jsonError("label is required");
    const { data, error } = await supabaseServer
      .from("predictor_eternal_columns")
      .insert({
        tournament_id: body.tournament_id,
        label: body.label.toString().trim(),
        logo_url: body.logo_url ?? null,
        sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      })
      .select()
      .single();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json(data);
  }

  // resource === "entries"
  if (!body.player_name?.toString().trim())
    return jsonError("player_name is required");
  const { data, error } = await supabaseServer
    .from("predictor_eternal_entries")
    .insert({
      tournament_id: body.tournament_id,
      player_name: body.player_name.toString().trim(),
      values: body.values ?? {},
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

// PATCH /api/predictor/owner/eternal-table?resource=columns|entries
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = parseResource(searchParams.get("resource"));
  if (!resource)
    return jsonError("resource must be 'columns' or 'entries'");
  const body = await req.json();
  if (!body?.id) return jsonError("id is required");
  const tid = await tournamentForRow(resource, body.id);
  if (!tid) return jsonError("Row not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const allowed =
    resource === "columns"
      ? ["label", "logo_url", "sort_order"]
      : ["player_name", "values", "sort_order"];

  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];
  if (Object.keys(updates).length === 0)
    return jsonError("No fields to update");

  const table =
    resource === "columns"
      ? "predictor_eternal_columns"
      : "predictor_eternal_entries";
  const { data, error } = await supabaseServer
    .from(table)
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

// DELETE /api/predictor/owner/eternal-table?resource=columns|entries&id=...
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = parseResource(searchParams.get("resource"));
  if (!resource)
    return jsonError("resource must be 'columns' or 'entries'");
  const id = searchParams.get("id");
  if (!id) return jsonError("id is required");
  const tid = await tournamentForRow(resource, id);
  if (!tid) return jsonError("Row not found", 404);
  const own = await requireTournamentOwner(tid);
  if (!own.ok) return own.response;

  const table =
    resource === "columns"
      ? "predictor_eternal_columns"
      : "predictor_eternal_entries";
  const { error } = await supabaseServer.from(table).delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
