import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get("league");

    if (!league || !["pl", "cl", "f1"].includes(league)) {
      return NextResponse.json(
        { error: "Invalid league parameter. Must be pl, cl, or f1." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("gallery_photos")
      .select("id, src, alt, caption, sort_order")
      .eq("league", league)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery photos:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in gallery API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
