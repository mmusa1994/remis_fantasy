import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testEndpoints = [
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      "https://fantasy.premierleague.com/api/fixtures/",
      "https://fantasy.premierleague.com/api/event/1/live/",
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint);
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get("content-type"),
          error: null,
        });
      } catch (error) {
        console.error(`❌ ${endpoint} - Error:`, error);
        results.push({
          endpoint,
          status: 0,
          ok: false,
          contentType: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
