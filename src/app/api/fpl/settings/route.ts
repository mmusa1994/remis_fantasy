import { NextRequest, NextResponse } from "next/server";
import { fplDb } from "@/lib/fpl-db";

// In-memory cache for settings
let settingsCache: any = null;
let settingsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Return cached settings if still fresh
    if (settingsCache && now - settingsCacheTime < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: settingsCache,
      });
    }

    const settings = await fplDb.getSettings();
    const result = settings || {
      fpl_proxy_url: null,
      cron_secret: null,
      default_gw: 1,
      default_manager_id: 1,
    };

    // Cache the result
    settingsCache = result;
    settingsCacheTime = now;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);

    // Return default settings if table doesn't exist
    const defaultSettings = {
      fpl_proxy_url: null,
      cron_secret: null,
      default_gw: 1,
      default_manager_id: 133444,
    };

    // Cache defaults too
    settingsCache = defaultSettings;
    settingsCacheTime = Date.now();

    return NextResponse.json({
      success: true,
      data: defaultSettings,
      warning: "Database tables not initialized. Using default settings.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fpl_proxy_url, cron_secret, default_gw, default_manager_id } = body;

    const updateData: any = {};

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

    await fplDb.updateSettings(updateData);

    const updatedSettings = await fplDb.getSettings();

    // Clear cache so next GET will fetch fresh data
    settingsCache = null;
    settingsCacheTime = 0;

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
