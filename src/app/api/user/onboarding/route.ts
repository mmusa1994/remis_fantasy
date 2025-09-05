import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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


    // Try to update, but handle gracefully if column doesn't exist
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Try to add onboarding_shown only if the column exists
    try {
      updateData.onboarding_shown = completed;
      
      const { error } = await supabase
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🧪 Checking onboarding status for user:", session.user.id);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_shown")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        if (error.message?.includes("column") && error.message?.includes("onboarding_shown")) {
          console.log("⚠️ onboarding_shown column doesn't exist, returning false");
          return NextResponse.json({
            onboardingShown: false,
            warning: "Column not found"
          });
        }
        
        console.error("Onboarding status fetch error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      if (!data) {
        console.log("⚠️ No user data found, returning false to show onboarding");
        return NextResponse.json({
          onboardingShown: false,
          warning: "No user data found"
        });
      }

      return NextResponse.json({
        onboardingShown: data?.onboarding_shown ?? false,
      });
    } catch (err) {
      console.error("Onboarding status exception:", err);
      return NextResponse.json({
        onboardingShown: false,
        warning: "Failed to check status"
      });
    }
  } catch (error) {
    console.error("Onboarding status GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}