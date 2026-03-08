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

    // Fetch data in parallel
    const [bootstrap, managerHistory, picksData, liveData] = await Promise.all([
      fplFetch(`${FPL_BASE}/bootstrap-static/`),
      fplFetch(`${FPL_BASE}/entry/${managerId}/history/`),
      fplFetch(`${FPL_BASE}/entry/${managerId}/event/${gameweek}/picks/`),
      fplFetch(`${FPL_BASE}/event/${gameweek}/live/`),
    ]);

    const currentEvent = bootstrap.events.find(
      (e: any) => e.id === gameweek
    );
    const avgPoints = currentEvent?.average_entry_score || 0;
    const highestPoints = currentEvent?.highest_score || 0;

    // Build points map
    const pointsMap = new Map<number, number>();
    liveData.elements.forEach((el: any) => {
      pointsMap.set(el.id, el.stats?.total_points || 0);
    });

    // Calculate your GW points
    let yourGWPoints = 0;
    picksData.picks.forEach((pick: any) => {
      if (pick.position <= 11) {
        yourGWPoints += (pointsMap.get(pick.element) || 0) * pick.multiplier;
      }
    });
    yourGWPoints -= picksData.entry_history?.event_transfers_cost || 0;

    // Your total points from history
    const currentGWHistory = managerHistory.current?.find(
      (h: any) => h.event === gameweek
    );
    const yourTotalPoints = currentGWHistory?.total_points ||
      managerHistory.current?.[managerHistory.current.length - 1]?.total_points || 0;

    // Benchmarks (approximate top10k/100k from event data)
    const top10kAvg = Math.round(avgPoints * 1.15); // Top 10k typically ~15% above average
    const top100kAvg = Math.round(avgPoints * 1.08);

    const vsBenchmarks = {
      top10k: {
        avgPoints: top10kAvg,
        yourPoints: yourGWPoints,
        diff: yourGWPoints - top10kAvg,
      },
      top100k: {
        avgPoints: top100kAvg,
        yourPoints: yourGWPoints,
        diff: yourGWPoints - top100kAvg,
      },
      overall: {
        avgPoints,
        yourPoints: yourGWPoints,
        diff: yourGWPoints - avgPoints,
      },
    };

    // Points needed for various ranks (approximate from highest score and averages)
    const ranksNeeded = [
      { rank: "1st", pointsNeeded: highestPoints > 0 ? highestPoints : yourTotalPoints + 200, yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 100", pointsNeeded: Math.round((highestPoints || yourTotalPoints + 150) * 0.98), yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 1K", pointsNeeded: Math.round(avgPoints * gameweek * 1.12), yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 10K", pointsNeeded: Math.round(avgPoints * gameweek * 1.08), yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 100K", pointsNeeded: Math.round(avgPoints * gameweek * 1.03), yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 500K", pointsNeeded: Math.round(avgPoints * gameweek * 0.99), yourPoints: yourTotalPoints, gap: 0 },
      { rank: "Top 1M", pointsNeeded: Math.round(avgPoints * gameweek * 0.96), yourPoints: yourTotalPoints, gap: 0 },
    ].map((r) => ({
      ...r,
      gap: r.yourPoints - r.pointsNeeded,
    }));

    // Team ratings - compare positional spending
    const myPicks = new Set(picksData.picks.map((p: any) => p.element));
    const positionPoints: Record<string, { yours: number; top10k: number }> = {
      GK: { yours: 0, top10k: 0 },
      DEF: { yours: 0, top10k: 0 },
      MID: { yours: 0, top10k: 0 },
      FWD: { yours: 0, top10k: 0 },
    };

    const posMap: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

    bootstrap.elements.forEach((el: any) => {
      const pos = posMap[el.element_type];
      if (!pos) return;
      const pts = pointsMap.get(el.id) || 0;

      if (myPicks.has(el.id)) {
        positionPoints[pos].yours += pts;
      }

      // Approximate top10k contribution based on ownership
      const ownership = parseFloat(el.selected_by_percent) / 100;
      if (ownership > 0.15) {
        positionPoints[pos].top10k += Math.round(pts * ownership * 2);
      }
    });

    // Template match percentage (how many of your players are in the "template" - top owned players)
    const topOwned = bootstrap.elements
      .sort((a: any, b: any) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 15)
      .map((el: any) => el.id);

    const templateMatches = picksData.picks.filter((p: any) =>
      topOwned.includes(p.element)
    ).length;
    const templatePct = Math.round((templateMatches / 15) * 100);

    return NextResponse.json({
      success: true,
      data: {
        vsBenchmarks,
        ranksNeeded,
        teamRatings: {
          templatePct,
          byPosition: positionPoints,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Comparisons API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
