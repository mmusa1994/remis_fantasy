import { NextRequest, NextResponse } from "next/server";
import {
  fplApi,
  type GameweekStatus,
  type DifferentialPlayer,
  type CaptainAnalysis,
} from "@/lib/fpl-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get("managerId");
    const gameweekParam = searchParams.get("gameweek");

    if (!managerIdParam || !gameweekParam) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId and gameweek parameters are required",
        },
        { status: 400 }
      );
    }

    const managerId = parseInt(managerIdParam, 10);
    const gameweek = parseInt(gameweekParam, 10);

    if (isNaN(managerId) || isNaN(gameweek)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId or gameweek parameter",
        },
        { status: 400 }
      );
    }

    // Get necessary data in parallel
    const [managerPicks, managerHistory, bootstrapData, liveData] =
      await Promise.all([
        fplApi.getManagerPicks(managerId, gameweek),
        fplApi.getManagerHistory(managerId),
        fplApi.getBootstrapStatic(),
        fplApi.getLiveData(gameweek),
      ]);

    // Calculate rank change and arrow direction
    const currentGameweekHistory = managerHistory.current.find(
      (h) => h.event === gameweek
    );
    const previousGameweekHistory = managerHistory.current.find(
      (h) => h.event === gameweek - 1
    );

    let arrowDirection: "green" | "red" | "neutral" = "neutral";
    let rankChange = 0;

    if (currentGameweekHistory && previousGameweekHistory) {
      rankChange =
        previousGameweekHistory.overall_rank -
        currentGameweekHistory.overall_rank;
      arrowDirection =
        rankChange > 0 ? "green" : rankChange < 0 ? "red" : "neutral";
    }

    // Create player lookup maps
    const playersMap = new Map(bootstrapData.elements.map((p) => [p.id, p]));
    const liveDataMap = new Map(liveData.elements.map((l) => [l.id, l]));

    // Calculate differentials and threats
    const playerPicks = managerPicks.picks.filter(
      (pick) => pick.position <= 11
    ); // Only active players
    const differentials: DifferentialPlayer[] = [];
    const threats: DifferentialPlayer[] = [];

    for (const pick of playerPicks) {
      const player = playersMap.get(pick.element);
      const livePlayer = liveDataMap.get(pick.element);

      if (!player || !livePlayer) continue;

      const ownershipPercentage = parseFloat(player.selected_by_percent);
      const playerPoints = livePlayer.stats.total_points * pick.multiplier;

      // Calculate impact percentage (simplified version)
      // This is an approximation - real calculation would be more complex
      let impactPercentage = 0;
      if (playerPoints > 0 && ownershipPercentage > 0) {
        // Higher points with lower ownership = higher differential impact
        impactPercentage = (playerPoints * (100 - ownershipPercentage)) / 100;
      }

      const differentialPlayer: DifferentialPlayer = {
        player_id: pick.element,
        web_name: player.web_name,
        points: playerPoints,
        ownership_percentage: ownershipPercentage,
        impact_percentage: Math.abs(impactPercentage),
        is_positive: playerPoints > 0,
        team: player.team,
      };

      // Classify as differential or threat
      if (ownershipPercentage < 20 && playerPoints > 0) {
        differentials.push(differentialPlayer);
      } else if (ownershipPercentage > 50 && playerPoints < 5) {
        threats.push(differentialPlayer);
      }
    }

    // Sort differentials and threats by impact
    differentials.sort((a, b) => b.impact_percentage - a.impact_percentage);
    threats.sort((a, b) => b.impact_percentage - a.impact_percentage);

    // Calculate captain analysis
    let captainAnalysis: CaptainAnalysis | null = null;
    const captain = managerPicks.picks.find((pick) => pick.is_captain);

    if (captain) {
      const captainPlayer = playersMap.get(captain.element);
      const captainLive = liveDataMap.get(captain.element);
      const currentEvent = bootstrapData.events.find((e) => e.id === gameweek);

      if (captainPlayer && captainLive && currentEvent) {
        const captainPoints = captainLive.stats.total_points * 2; // Captain gets double points
        const averageCaptainPoints = currentEvent.average_entry_score * 0.15; // Rough estimate: ~15% of average score from captain

        captainAnalysis = {
          player_id: captain.element,
          web_name: captainPlayer.web_name,
          points: captainPoints,
          average_captain_points: Math.round(averageCaptainPoints),
          points_above_average: captainPoints - averageCaptainPoints,
          is_above_average: captainPoints > averageCaptainPoints,
        };
      }
    }

    // Calculate safety score (simplified version)
    const gameweekPoints = managerPicks.entry_history.points;
    const currentEvent = bootstrapData.events.find((e) => e.id === gameweek);
    const averageScore = currentEvent?.average_entry_score || 0;
    const safetyScore = Math.max(0, Math.round(averageScore * 0.9)); // 90% of average as "safety"

    // Clone count (simplified - just return 0 for now, would need complex analysis)
    const cloneCount = 0;

    const gameweekStatus: GameweekStatus = {
      arrow_direction: arrowDirection,
      rank_change: rankChange,
      gameweek_points: gameweekPoints,
      safety_score: safetyScore,
      differentials: differentials.slice(0, 5), // Top 5 differentials
      threats: threats.slice(0, 5), // Top 5 threats
      captain_analysis: captainAnalysis,
      clone_count: cloneCount,
    };

    return NextResponse.json({
      success: true,
      data: gameweekStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching gameweek status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
