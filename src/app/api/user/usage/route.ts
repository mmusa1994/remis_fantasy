import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { getRemainingQuestions } from "@/lib/user-rate-limit";

export async function GET() {
  try {
    // Get session to check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's current usage
    const { remaining, total, resetDate } = await getRemainingQuestions(session.user.id);

    return NextResponse.json({
      remaining,
      total,
      used: total - remaining,
      resetDate: resetDate.toISOString(),
      resetDateFormatted: resetDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

  } catch (error: any) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}