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
      .from("gallery_photos")
      .select("*")
      .eq("league", league)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in admin gallery API:", error);
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
    const { league, src, alt, caption, sort_order } = body;

    if (!league || !["pl", "cl", "f1"].includes(league)) {
      return NextResponse.json({ error: "Invalid league" }, { status: 400 });
    }

    if (!src) {
      return NextResponse.json({ error: "src is required" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("gallery_photos")
      .insert({
        league,
        src,
        alt: alt || "",
        caption: caption || null,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting gallery photo:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in admin gallery API:", error);
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

    // Get the photo first to delete from storage
    const { data: photo } = await supabaseServer
      .from("gallery_photos")
      .select("src")
      .eq("id", id)
      .single();

    if (photo?.src) {
      // Extract storage path from URL if it's a Supabase storage URL
      const storagePath = extractStoragePath(photo.src);
      if (storagePath) {
        await supabaseServer.storage
          .from("gallery-images")
          .remove([storagePath]);
      }
    }

    const { error } = await supabaseServer
      .from("gallery_photos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting gallery photo:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin gallery API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/gallery-images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
