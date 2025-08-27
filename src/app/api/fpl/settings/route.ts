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

// In-memory cache for settings (since we're not using database)
let settingsCache: any = DEFAULT_SETTINGS;
let settingsCacheTime = Date.now();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  console.log("⚙️ FPL Settings API - GET request");

  try {
    const now = Date.now();

    // Return cached settings if still fresh
    if (settingsCache && now - settingsCacheTime < CACHE_TTL) {
      console.log("✅ Returning cached settings");
      return NextResponse.json({
        success: true,
        data: settingsCache,
        cache_hit: true,
        timestamp: new Date().toISOString(),
      });
    }

    console.log("✅ Returning default settings (live data mode)");

    // Cache the default settings
    settingsCache = DEFAULT_SETTINGS;
    settingsCacheTime = now;

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
  console.log("⚙️ FPL Settings API - POST request");

  try {
    const body = await request.json();
    const { fpl_proxy_url, cron_secret, default_gw, default_manager_id } = body;

    console.log("📥 Request body:", {
      fpl_proxy_url,
      cron_secret,
      default_gw,
      default_manager_id,
    });

    const updateData: any = { ...DEFAULT_SETTINGS };

    if (fpl_proxy_url !== undefined) updateData.fpl_proxy_url = fpl_proxy_url;
    if (cron_secret !== undefined) updateData.cron_secret = cron_secret;
    if (default_gw !== undefined) {
      const gw = parseInt(default_gw, 10);
      if (isNaN(gw) || gw < 1 || gw > 38) {
        console.log("❌ Validation failed: Invalid gameweek");
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
        console.log("❌ Validation failed: Invalid manager ID");
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
      console.log("❌ Validation failed: No valid settings provided");
      return NextResponse.json(
        {
          success: false,
          error: "No valid settings provided",
        },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed, updating settings");

    // Update in-memory cache (no database storage)
    settingsCache = updateData;
    settingsCacheTime = Date.now();

    console.log("✅ Settings updated successfully");

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
