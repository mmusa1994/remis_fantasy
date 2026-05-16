import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Public list of published tournaments (lightweight rows).
export async function GET() {
  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select(
      "id, slug, name, name_en, short_description, short_description_en, banner_image_url, hero_image_url, logo_url, accent_color, status, starts_at, ends_at, registration_lock_at, prize_pool_amount, prize_pool_currency, sponsor_name, sponsor_logo_url, is_featured, sort_order, require_approval, theme_background_image",
    )
    .is("deleted_at", null)
    .eq("visibility", "public")
    .in("status", ["published", "locked", "finished"])
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
