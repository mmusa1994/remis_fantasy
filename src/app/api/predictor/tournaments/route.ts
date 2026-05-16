import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public list of published tournaments (lightweight rows).
export async function GET() {
  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .is("deleted_at", null)
    .in("status", ["published", "locked", "finished"])
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
