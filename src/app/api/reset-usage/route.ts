import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { resetUserUsage } from "@/lib/user-rate-limit";

export async function POST() {
  try {
    // Only run in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await resetUserUsage(session.user.id);

    return NextResponse.json({
      message: "Usage reset successfully for user: " + session.user.id,
    });
  } catch (error: unknown) {
    console.error("Reset usage API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
