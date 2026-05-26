import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const group = searchParams.get("group");

    let query = supabase
      .from("wc2026_matches")
      .select("*")
      .order("match_date", { ascending: true });

    if (phase) {
      query = query.eq("phase", phase);
    }

    if (group) {
      query = query.eq("group_name", group);
    }

    const { data, error } = await query;

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
    console.error("WC2026 matches GET API error:", error);
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
    const { match } = body;

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Invalid match data" },
        { status: 400 }
      );
    }

    const {
      home_team,
      away_team,
      match_date,
      phase,
      group_name,
      venue,
      home_score,
      away_score,
      status,
    } = match;

    if (!home_team || !away_team || !match_date || !phase || !venue || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required match fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("wc2026_matches")
      .insert({
        home_team,
        away_team,
        match_date,
        phase,
        group_name: group_name || null,
        venue,
        home_score: home_score ?? null,
        away_score: away_score ?? null,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 matches POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, home_score, away_score, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Match ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("wc2026_matches")
      .update({
        home_score: home_score ?? null,
        away_score: away_score ?? null,
        status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 matches PATCH API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Match ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wc2026_matches")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Match ${id} deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 matches DELETE API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
