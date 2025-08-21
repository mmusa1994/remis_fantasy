import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get("managerId");

    if (!managerIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId parameter is required",
        },
        { status: 400 }
      );
    }

    const managerId = parseInt(managerIdParam, 10);

    if (isNaN(managerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId parameter",
        },
        { status: 400 }
      );
    }

    // Get just manager entry info (fast)
    const managerEntry = await fplApi.getManagerEntry(managerId);

    return NextResponse.json({
      success: true,
      data: managerEntry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching manager info:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}