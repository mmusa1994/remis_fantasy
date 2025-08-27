import { NextRequest, NextResponse } from "next/server";
import { FPLService } from "@/services/fpl";

const fplService = FPLService.getInstance();

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

    // Get manager info using new service architecture
    const response = await fplService.team.getManagerInfo(managerId);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching manager info:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}