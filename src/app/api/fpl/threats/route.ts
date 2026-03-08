import { NextRequest, NextResponse } from "next/server";

const FPL_BASE = "https://fantasy.premierleague.com/api";

async function fplFetch(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`FPL API error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");
    const gameweek = parseInt(searchParams.get("gameweek") || "1");

    if (!managerId) {
      return NextResponse.json(
        { success: false, error: "managerId is required" },
        { status: 400 }
      );
    }

    // Fetch manager's picks, bootstrap data, and live data in parallel
    const [picksData, bootstrap, liveData] = await Promise.all([
      fplFetch(`${FPL_BASE}/entry/${managerId}/event/${gameweek}/picks/`),
      fplFetch(`${FPL_BASE}/bootstrap-static/`),
      fplFetch(`${FPL_BASE}/event/${gameweek}/live/`),
    ]);

    const myPicks = new Set(picksData.picks.map((p: any) => p.element));
    const myBenchPicks = new Set(
      picksData.picks
        .filter((p: any) => p.position > 11)
        .map((p: any) => p.element)
    );

    // Build points map from live data
    const pointsMap = new Map<number, number>();
    liveData.elements.forEach((el: any) => {
      pointsMap.set(el.id, el.stats?.total_points || 0);
    });

    // Find threat players: high ownership, not in your team, scoring points
    const threats = bootstrap.elements
      .filter((el: any) => {
        const ownership = parseFloat(el.selected_by_percent);
        const points = pointsMap.get(el.id) || 0;
        // Threats are players you don't own (or on bench) with significant ownership and points
        const isNotOwned = !myPicks.has(el.id);
        const isOnBench = myBenchPicks.has(el.id);
        return (isNotOwned || isOnBench) && ownership > 3 && points > 0;
      })
      .map((el: any) => {
        const points = pointsMap.get(el.id) || 0;
        const ownership = parseFloat(el.selected_by_percent);
        let threatLevel: "high" | "medium" | "low" = "low";
        if (points >= 8 && ownership > 20) threatLevel = "high";
        else if (points >= 5 && ownership > 10) threatLevel = "medium";

        return {
          player_id: el.id,
          web_name: el.web_name,
          team: el.team,
          element_type: el.element_type,
          points,
          ownership_pct: ownership,
          effective_ownership: ownership,
          threat_level: threatLevel,
          is_on_bench: myBenchPicks.has(el.id),
        };
      })
      .sort((a: any, b: any) => {
        // Sort by threat level then points
        const levelOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const levelDiff = (levelOrder[b.threat_level] || 0) - (levelOrder[a.threat_level] || 0);
        if (levelDiff !== 0) return levelDiff;
        return b.points - a.points;
      })
      .slice(0, 30);

    const totalThreatPoints = threats.reduce(
      (sum: number, t: any) => sum + t.points,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        threats,
        totalThreatPoints,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Threats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
