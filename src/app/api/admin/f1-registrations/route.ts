import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data: registrations, error } = await supabaseServer
      .from("f1_registrations_25_26")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching F1 registrations:", error);
      throw error;
    }

    return NextResponse.json({
      registrations: registrations || [],
      count: registrations?.length || 0,
    });
  } catch (error: unknown) {
    console.error("F1 registrations API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch F1 registrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, field, value } = body;

    if (!id || !field) {
      return NextResponse.json(
        { error: "Registration ID and field are required" },
        { status: 400 }
      );
    }

    const { data: updatedRegistration, error } = await supabaseServer
      .from("f1_registrations_25_26")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating F1 registration:", error);
      throw error;
    }

    return NextResponse.json({
      registration: updatedRegistration,
      message: `F1 registration ${field} updated successfully`,
    });
  } catch (error: unknown) {
    console.error("F1 registration update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update F1 registration",
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

    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("f1_registrations_25_26")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting F1 registration:", error);
      throw error;
    }

    return NextResponse.json({
      message: "F1 registration deleted successfully",
    });
  } catch (error: unknown) {
    console.error("F1 registration deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete F1 registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
