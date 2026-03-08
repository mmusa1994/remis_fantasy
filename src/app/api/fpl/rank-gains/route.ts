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

    const [picksData, bootstrap, liveData] = await Promise.all([
      fplFetch(`${FPL_BASE}/entry/${managerId}/event/${gameweek}/picks/`),
      fplFetch(`${FPL_BASE}/bootstrap-static/`),
      fplFetch(`${FPL_BASE}/event/${gameweek}/live/`),
    ]);

    const avgPoints = bootstrap.events.find((e: any) => e.id === gameweek)?.average_entry_score || 0;

    // Build player info map
    const playerMap = new Map<number, any>();
    bootstrap.elements.forEach((el: any) => {
      playerMap.set(el.id, el);
    });

    // Build live points map
    const livePointsMap = new Map<number, any>();
    liveData.elements.forEach((el: any) => {
      livePointsMap.set(el.id, el.stats);
    });

    // Calculate per-player contribution
    const playerGains = picksData.picks.map((pick: any) => {
      const player = playerMap.get(pick.element);
      const stats = livePointsMap.get(pick.element);
      const rawPoints = stats?.total_points || 0;
      const effectivePoints = rawPoints * pick.multiplier;
      const ownership = player ? parseFloat(player.selected_by_percent) : 0;

      // Estimate rank gain: points above average × inverse ownership = more rank gain
      // Higher points with lower ownership = more differential gain
      const diffFactor = Math.max(0.1, 1 - ownership / 100);
      const pointsAboveAvg = rawPoints - (avgPoints / 11);
      const estimatedRankGain = Math.round(pointsAboveAvg * diffFactor * 1000);

      let status: "played" | "playing" | "to_play" | "didnt_play" = "didnt_play";
      if (stats?.minutes > 0) {
        // Check if fixture is finished
        const playerTeam = player?.team;
        const fixture = bootstrap.events.find((e: any) => e.id === gameweek);
        status = "played"; // Simplified - could check fixture.finished
      } else if (stats?.minutes === 0) {
        status = "to_play"; // Could be didn't play if fixture finished
      }

      return {
        player_id: pick.element,
        web_name: player?.web_name || "Unknown",
        team: player?.team || 0,
        element_type: player?.element_type || 3,
        position: pick.position,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier,
        raw_points: rawPoints,
        effective_points: effectivePoints,
        ownership_pct: ownership,
        estimated_rank_gain: estimatedRankGain,
        status,
        minutes: stats?.minutes || 0,
      };
    });

    // Sort starters by contribution (highest first)
    const starters = playerGains
      .filter((p: any) => p.position <= 11)
      .sort((a: any, b: any) => b.effective_points - a.effective_points);
    const bench = playerGains
      .filter((p: any) => p.position > 11)
      .sort((a: any, b: any) => a.position - b.position);

    const totalGWPoints = starters.reduce(
      (sum: number, p: any) => sum + p.effective_points,
      0
    );
    const bestPerformer = starters.length > 0 ? starters[0] : null;
    const worstPerformer = starters.length > 0 ? starters[starters.length - 1] : null;

    return NextResponse.json({
      success: true,
      data: {
        starters,
        bench,
        totalGWPoints,
        bestPerformer,
        worstPerformer,
        avgPoints,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Rank gains API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
