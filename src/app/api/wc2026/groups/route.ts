import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("wc2026_group_standings")
      .select("*")
      .order("group_name", { ascending: true })
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 groups GET API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const standings = body.standings || body.groups;

    if (!standings || !Array.isArray(standings)) {
      return NextResponse.json(
        { success: false, error: "Invalid standings data. Send { standings: [...] } or { groups: [...] }" },
        { status: 400 }
      );
    }

    // Clear existing data
    await supabase.from("wc2026_group_standings").delete().neq("id", 0);

    // Insert new data
    const { data, error } = await supabase
      .from("wc2026_group_standings")
      .insert(
        standings.map((s: {
          group_name: string;
          team_name: string;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          points: number;
        }) => ({
          group_name: s.group_name,
          team_name: s.team_name,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goals_for: s.goals_for,
          goals_against: s.goals_against,
          goal_difference: s.goal_difference,
          points: s.points,
        }))
      )
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `Successfully updated ${standings.length} standings`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 groups POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
