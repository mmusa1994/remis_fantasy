import { NextRequest, NextResponse } from "next/server";

// What-If is primarily client-side. This route exists for future server-side
// scenario calculations (e.g., estimated rank after hypothetical events).

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPoints, scenarioPoints, totalPoints } = body;

    if (currentPoints === undefined || scenarioPoints === undefined) {
      return NextResponse.json(
        { success: false, error: "currentPoints and scenarioPoints are required" },
        { status: 400 }
      );
    }

    const pointsDiff = scenarioPoints - currentPoints;

    return NextResponse.json({
      success: true,
      data: {
        currentPoints,
        scenarioPoints,
        pointsDiff,
        totalWithScenario: (totalPoints || 0) + pointsDiff,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("What-If API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
