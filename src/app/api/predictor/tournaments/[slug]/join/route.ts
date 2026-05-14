import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, jsonError } from "@/lib/predictor";

// POST — pošalji zahtjev za učešće u turniru
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { slug } = await context.params;

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, visibility")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!tournament) return jsonError("turnir nije pronađen", 404);
  if (tournament.status === "draft") return jsonError("nije objavljen", 404);

  // ako postoji već — vrati postojeći zapis (idempotent)
  const { data: existing } = await supabaseServer
    .from("predictor_members")
    .select("*")
    .eq("tournament_id", tournament.id)
    .eq("user_id", guard.user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, member: existing, already: true });
  }

  const { data, error } = await supabaseServer
    .from("predictor_members")
    .insert({
      tournament_id: tournament.id,
      user_id: guard.user.id,
      user_email: guard.user.email ?? null,
      user_display_name:
        guard.user.name ?? guard.user.email?.split("@")[0] ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true, member: data });
}
