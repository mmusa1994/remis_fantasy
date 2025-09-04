import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's AI usage data
    const { data: userData, error } = await supabaseServer
      .from("users")
      .select("ai_team_analyzing")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lastAITeamAnalysis: userData?.ai_team_analyzing || null,
    });
  } catch (error) {
    console.error("AI usage check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { type } = await req.json();

    if (type !== 'team_analysis') {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    // Update user's AI usage timestamp
    const { error } = await supabaseServer
      .from("users")
      .update({
        ai_team_analyzing: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI usage update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}