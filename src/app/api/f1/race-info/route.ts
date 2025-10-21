import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("f1_race_info")
      .select("next_race, last_race, updated_at")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching F1 race info:", error);
      return NextResponse.json(
        { error: "Failed to fetch race info" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Race info not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        nextRace: data.next_race,
        lastRace: data.last_race,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("Error in race-info GET:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
