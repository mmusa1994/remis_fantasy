import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    const data = await request.json();

    // Get IP address
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    // Check if this IP already exists in database
    const { data: existingVisitor, error: checkError } = await supabase
      .from("page_visitors")
      .select("id")
      .eq("ip_address", ipAddress)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing visitor:", checkError);
      return NextResponse.json(
        { error: "Failed to check visitor" },
        { status: 500 }
      );
    }

    // If IP already exists, return success without inserting
    if (existingVisitor && existingVisitor.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Visitor already tracked" 
      }, { status: 200 });
    }

    // If IP doesn't exist, insert new visitor data
    const visitorData = {
      ip_address: ipAddress,
      user_agent: request.headers.get("user-agent") || "unknown",
      referrer: data.referrer || "direct",
      page_url: data.pageUrl || "/",
      country: data.country || null,
      city: data.city || null,
      device_type: data.deviceType || "unknown",
      browser: data.browser || "unknown",
      os: data.os || "unknown",
      language: data.language || "unknown",
      screen_resolution: data.screenResolution || null,
      timestamp: new Date().toISOString(),
      session_id: data.sessionId || null,
      is_returning_visitor: data.isReturningVisitor || false,
    };

    // Insert visitor data
    const { error } = await supabase
      .from("page_visitors")
      .insert([visitorData]);

    if (error) {
      console.error("Error inserting visitor data:", error);
      return NextResponse.json(
        { error: "Failed to track visitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in visitor tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get visitor data with pagination
    const {
      data: visitors,
      error,
      count,
    } = await supabase
      .from("page_visitors")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching visitor data:", error);
      return NextResponse.json(
        { error: "Failed to fetch visitors" },
        { status: 500 }
      );
    }

    // Get visitor statistics
    const { data: todayVisitors } = await supabase
      .from("page_visitors")
      .select("id")
      .gte("timestamp", new Date().toISOString().split("T")[0]);

    const { data: weekVisitors } = await supabase
      .from("page_visitors")
      .select("id")
      .gte(
        "timestamp",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: monthVisitors } = await supabase
      .from("page_visitors")
      .select("id")
      .gte(
        "timestamp",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    // Get top countries
    const { data: topCountries } = await supabase
      .from("page_visitors")
      .select("country")
      .not("country", "is", null);

    // Get top pages
    const { data: topPages } = await supabase
      .from("page_visitors")
      .select("page_url");

    // Process statistics
    const countryStats = topCountries?.reduce((acc: any, visitor) => {
      acc[visitor.country] = (acc[visitor.country] || 0) + 1;
      return acc;
    }, {});

    const pageStats = topPages?.reduce((acc: any, visitor) => {
      acc[visitor.page_url] = (acc[visitor.page_url] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      total: count || 0,
      today: todayVisitors?.length || 0,
      week: weekVisitors?.length || 0,
      month: monthVisitors?.length || 0,
      topCountries: Object.entries(countryStats || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10),
      topPages: Object.entries(pageStats || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10),
    };

    return NextResponse.json({
      visitors,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visitor data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
