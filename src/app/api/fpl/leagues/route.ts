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

    // Fetch manager entry to get league information
    const managerEntry = await fplApi.getManagerEntry(managerId);

    if (!managerEntry.leagues) {
      return NextResponse.json({
        success: true,
        data: {
          classic: [],
          h2h: [],
          manager: managerEntry,
        },
        manager_id: managerId,
        timestamp: new Date().toISOString(),
      });
    }

    // Return all leagues without fetching standings (lazy loading)
    const classicLeagues = managerEntry.leagues.classic || [];
    const h2hLeagues = managerEntry.leagues.h2h || [];

    return NextResponse.json({
      success: true,
      data: {
        classic: classicLeagues,
        h2h: h2hLeagues,
        manager: managerEntry,
      },
      manager_id: managerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching league data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
