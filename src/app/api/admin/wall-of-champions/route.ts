import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const league = searchParams.get("league");

    if (!league || !["pl", "cl", "f1"].includes(league)) {
      return NextResponse.json({ error: "Invalid league" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("wall_of_champions")
      .select("*")
      .eq("league", league)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching champions:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in admin wall-of-champions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { league, season, name, team_name, image, achievement, sort_order } =
      body;

    if (!league || !["pl", "cl", "f1"].includes(league)) {
      return NextResponse.json({ error: "Invalid league" }, { status: 400 });
    }

    if (!season || !name || !image) {
      return NextResponse.json(
        { error: "season, name, and image are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("wall_of_champions")
      .insert({
        league,
        season,
        name,
        team_name: team_name || null,
        image,
        achievement: achievement || null,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting champion:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in admin wall-of-champions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "season",
      "name",
      "team_name",
      "image",
      "achievement",
      "sort_order",
    ];
    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from("wall_of_champions")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating champion:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in admin wall-of-champions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Get the champion first to delete image from storage
    const { data: champion } = await supabaseServer
      .from("wall_of_champions")
      .select("image")
      .eq("id", id)
      .single();

    if (champion?.image) {
      const storagePath = extractStoragePath(champion.image);
      if (storagePath) {
        await supabaseServer.storage
          .from("wall-of-champions")
          .remove([storagePath]);
      }
    }

    const { error } = await supabaseServer
      .from("wall_of_champions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting champion:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin wall-of-champions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(
      /\/storage\/v1\/object\/public\/wall-of-champions\/(.+)/
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
