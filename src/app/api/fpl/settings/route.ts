import { NextRequest, NextResponse } from "next/server";

// Default settings for live data approach
const DEFAULT_SETTINGS = {
  fpl_proxy_url: null,
  cron_secret: null,
  default_gw: 1,
  default_manager_id: 133444,
  live_data_mode: true,
  cache_enabled: true,
  cache_ttl: 300, // 5 minutes
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
      cache_hit: false,
      timestamp: new Date().toISOString(),
      mode: "live_data_only",
      note: "Using default settings in live data mode - no database storage",
    });
  } catch (error) {
    console.error("❌ Error in settings GET:", error);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fpl_proxy_url, cron_secret, default_gw, default_manager_id } = body;

    const updateData: any = { ...DEFAULT_SETTINGS };

    if (fpl_proxy_url !== undefined) updateData.fpl_proxy_url = fpl_proxy_url;
    if (cron_secret !== undefined) updateData.cron_secret = cron_secret;
    if (default_gw !== undefined) {
      const gw = parseInt(default_gw, 10);
      if (isNaN(gw) || gw < 1 || gw > 38) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid gameweek (must be 1-38)",
          },
          { status: 400 }
        );
      }
      updateData.default_gw = gw;
    }
    if (default_manager_id !== undefined) {
      const managerId = parseInt(default_manager_id, 10);
      if (isNaN(managerId) || managerId < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid manager ID",
          },
          { status: 400 }
        );
      }
      updateData.default_manager_id = managerId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid settings provided",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updateData,
      message: "Settings updated successfully (in-memory only)",
      timestamp: new Date().toISOString(),
      mode: "live_data_only",
      note: "Settings stored in memory only - no database persistence",
    });
  } catch (error) {
    console.error("❌ Error in settings POST:", error);

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
