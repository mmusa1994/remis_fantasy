import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🧪 Checking onboarding status for user:", session.user.id);

    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({
      cookies: () => cookieStore,
    });

    try {
      const { data, error } = await supabaseServer
        .from("users")
        .select("onboarding_shown")
        .eq("id", session.user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error) {
        // If column doesn't exist, return false (show onboarding)
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

      // If no user data found, show onboarding
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
      // Default to showing onboarding if anything fails
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