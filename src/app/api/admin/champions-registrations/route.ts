import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Season-to-table mapping for Champions League
const CL_TABLE_MAP: Record<string, string> = {
  "25_26": "cl_registrations_25_26",
  "26_27": "registration_champions_league_26_27",
};

function getCLTable(season: string | null): string {
  return CL_TABLE_MAP[season || "26_27"] || CL_TABLE_MAP["26_27"];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getCLTable(season);

    const { data: registrations, error } = await supabaseServer
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching Champions League registrations:", error);
      throw error;
    }

    return NextResponse.json({
      registrations: registrations || [],
      count: registrations?.length || 0,
    });
  } catch (error: unknown) {
    console.error("Champions League registrations API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Champions League registrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getCLTable(season);

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const { data: updatedRegistration, error } = await supabaseServer
      .from(tableName)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating Champions League registration:", error);
      throw error;
    }

    return NextResponse.json({
      registration: updatedRegistration,
      message: "Champions League registration updated successfully",
    });
  } catch (error: unknown) {
    console.error("Champions League registration update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update Champions League registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getCLTable(season);

    const body = await request.json();
    const { id, field, value } = body;

    if (!id || !field) {
      return NextResponse.json(
        { error: "Registration ID and field are required" },
        { status: 400 }
      );
    }

    const updates = { [field]: value };

    const { data: updatedRegistration, error } = await supabaseServer
      .from(tableName)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating Champions League registration field:", error);
      throw error;
    }

    return NextResponse.json({
      registration: updatedRegistration,
      message: `Champions League registration ${field} updated successfully`,
    });
  } catch (error: unknown) {
    console.error("Champions League registration field update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update Champions League registration field",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const season = searchParams.get("season");
    const tableName = getCLTable(season);

    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from(tableName)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting Champions League registration:", error);
      throw error;
    }

    return NextResponse.json({
      message: "Champions League registration deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Champions League registration deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete Champions League registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}