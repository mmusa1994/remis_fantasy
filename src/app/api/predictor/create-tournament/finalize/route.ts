import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, jsonError } from "@/lib/predictor";

// Polled by the frontend after Stripe confirms — returns the tournament once the
// webhook has created it. Owner-scoped to prevent leaking other users' rows.
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const pi = searchParams.get("payment_intent_id");
  if (!pi) return jsonError("payment_intent_id required");

  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, slug, name, owner_user_id, created_via")
    .eq("stripe_payment_intent_id", pi)
    .maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!data) return NextResponse.json({ ok: true, ready: false });
  if (data.owner_user_id !== guard.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    ok: true,
    ready: true,
    tournament_id: data.id,
    slug: data.slug,
    name: data.name,
    redirect_to: `/predictor/owner/${data.id}`,
  });
}
