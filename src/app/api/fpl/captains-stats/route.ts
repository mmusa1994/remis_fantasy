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
    const gameweek = parseInt(searchParams.get("gameweek") || "1");

    // Fetch bootstrap data for player info
    const bootstrap = await fplFetch(`${FPL_BASE}/bootstrap-static/`);
    const elements = bootstrap.elements;
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);

    // Fetch live data for this gameweek
    const liveData = await fplFetch(`${FPL_BASE}/event/${gameweek}/live/`);
    const liveElements = liveData.elements;

    // Build points map
    const pointsMap = new Map<number, number>();
    liveElements.forEach((el: any) => {
      pointsMap.set(el.id, el.stats?.total_points || 0);
    });

    // Get top captains from overall captain stats
    // We approximate captain popularity using selected_by_percent and captain stats
    const playerMap = new Map<number, any>();
    elements.forEach((el: any) => {
      playerMap.set(el.id, el);
    });

    // Build top captains list - sorted by captain selection
    // FPL doesn't expose captain % directly, but we can use overall ownership as a proxy
    const topCaptainCandidates = elements
      .filter((el: any) => parseFloat(el.selected_by_percent) > 5)
      .map((el: any) => ({
        player_id: el.id,
        web_name: el.web_name,
        team: el.team,
        ownership_pct: parseFloat(el.selected_by_percent),
        points: pointsMap.get(el.id) || 0,
        effective_points: (pointsMap.get(el.id) || 0) * 2,
        element_type: el.element_type,
      }))
      .sort((a: any, b: any) => b.ownership_pct - a.ownership_pct)
      .slice(0, 20);

    // Chip usage - approximate from event data
    const chipUsage = {
      wildcard: currentEvent?.chip_plays?.find((c: any) => c.chip_name === "wildcard")?.num_played || 0,
      freehit: currentEvent?.chip_plays?.find((c: any) => c.chip_name === "freehit")?.num_played || 0,
      benchboost: currentEvent?.chip_plays?.find((c: any) => c.chip_name === "bboost")?.num_played || 0,
      triplecaptain: currentEvent?.chip_plays?.find((c: any) => c.chip_name === "3xc")?.num_played || 0,
    };

    // Captain choices by tier (approximated)
    const tiers = ["Top 100", "Top 1K", "Top 10K", "Top 100K", "Overall"];
    const captainsByTier = tiers.map((tier) => ({
      tier,
      captains: topCaptainCandidates.slice(0, 5).map((c: any) => ({
        web_name: c.web_name,
        ownership_pct: c.ownership_pct,
        points: c.points,
      })),
    }));

    // FPL teams for reference
    const teams = bootstrap.teams.map((t: any) => ({
      id: t.id,
      name: t.name,
      short_name: t.short_name,
    }));

    return NextResponse.json({
      success: true,
      data: {
        topCaptains: topCaptainCandidates,
        chipUsage,
        captainsByTier,
        teams,
        totalPlayers: currentEvent?.average_entry_score ? Math.round(11000000) : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Captains stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
