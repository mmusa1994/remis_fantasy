import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { nextRace, lastRace } = await req.json();

    if (!nextRace || !lastRace) {
      return NextResponse.json(
        { error: "nextRace and lastRace are required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("f1_race_info")
      .update({
        next_race: nextRace,
        last_race: lastRace,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.error("Error updating F1 race info:", error);
      return NextResponse.json(
        { error: "Failed to update race info" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in race-info POST:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
