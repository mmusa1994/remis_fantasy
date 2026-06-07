import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";
import {
  getMatchTemplate,
  expandMatchTemplate,
} from "@/data/predictor-match-templates";

// POST { tournament_id, template_id, date_shift_days?, replace? }
// Uvozi sve utakmice iz šablona u dati turnir. Opciono pomakni datume.
// replace=true prvo OBRIŠE sve postojeće utakmice turnira (i njihove predikcije
// preko ON DELETE CASCADE) pa uveze šablon iznova.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  if (!body?.tournament_id || !body?.template_id) {
    return jsonError("tournament_id i template_id su obavezni");
  }

  const tmpl = getMatchTemplate(body.template_id);
  if (!tmpl) return jsonError("Šablon nije pronađen", 404);

  const dateShiftMs =
    body.date_shift_days != null
      ? Number(body.date_shift_days) * 24 * 60 * 60 * 1000
      : 0;

  const rows = expandMatchTemplate(tmpl).map((r) => {
    const shifted =
      dateShiftMs !== 0 && r.kickoff_at
        ? new Date(
            Date.parse(String(r.kickoff_at)) + dateShiftMs,
          ).toISOString()
        : r.kickoff_at;
    return {
      ...r,
      kickoff_at: shifted,
      tournament_id: body.tournament_id,
    };
  });

  if (rows.length === 0) return jsonError("Šablon je prazan", 400);

  // Replace mode: wipe the current schedule first. predictor_match_predictions
  // cascade-delete with their match, so old fixtures + picks go together.
  let deleted = 0;
  if (body.replace === true) {
    const { data: del, error: delErr } = await supabaseServer
      .from("predictor_matches")
      .delete()
      .eq("tournament_id", body.tournament_id)
      .select("id");
    if (delErr) return jsonError(delErr.message, 500);
    deleted = del?.length ?? 0;
  }

  const { data, error } = await supabaseServer
    .from("predictor_matches")
    .insert(rows)
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({
    ok: true,
    inserted: data?.length ?? 0,
    deleted,
    replaced: body.replace === true,
  });
}
