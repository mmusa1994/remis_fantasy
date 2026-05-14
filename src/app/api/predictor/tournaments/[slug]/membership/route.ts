import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser } from "@/lib/predictor";

// GET — vraća membership status trenutnog korisnika za turnir
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { slug } = await context.params;

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, require_approval")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!tournament) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: member } = await supabaseServer
    .from("predictor_members")
    .select("*")
    .eq("tournament_id", tournament.id)
    .eq("user_id", guard.user.id)
    .maybeSingle();

  return NextResponse.json({
    require_approval: !!tournament.require_approval,
    member: member ?? null,
    can_predict: !tournament.require_approval || member?.status === "approved",
  });
}
