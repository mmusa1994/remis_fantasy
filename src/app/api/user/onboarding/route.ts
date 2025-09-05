import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completed } = body;

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Try to update, but handle gracefully if column doesn't exist
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Try to add onboarding_shown only if the column exists
    try {
      updateData.onboarding_shown = completed;
      
      const { error } = await supabaseServer
        .from("users")
        .update(updateData)
        .eq("id", session.user.id);

      console.log("🧪 Onboarding update:", { userId: session.user.id, completed, error });

      if (error) {
        // If column doesn't exist, ignore the error and continue
        if (error.message?.includes("column") && error.message?.includes("onboarding_shown")) {
          console.log("⚠️ onboarding_shown column doesn't exist yet, skipping update");
          return NextResponse.json({ success: true, warning: "Column not found, but continuing" });
        }
        
        console.error("Onboarding update error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    } catch (err) {
      console.error("Onboarding update exception:", err);
      // Continue anyway - don't block onboarding completion
      return NextResponse.json({ success: true, warning: "Update failed but continuing" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}