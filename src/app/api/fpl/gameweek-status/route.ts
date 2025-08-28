import { NextRequest, NextResponse } from "next/server";
import {
  FPLLiveService,
  FPLTeamService,
  FPLBootstrapService,
} from "@/services/fpl";

// Type definitions moved from non-existent lib
interface GameweekStatus {
  arrow_direction: "green" | "red" | "neutral";
  rank_change: number;
  gameweek_points: number;
  safety_score: number;
  differentials: DifferentialPlayer[];
  threats: DifferentialPlayer[];
  captain_analysis: CaptainAnalysis | null;
  clone_count: number;
}

interface DifferentialPlayer {
  player_id: number;
  web_name: string;
  points: number;
  ownership_percentage: number;
  impact_percentage: number;
  is_positive: boolean;
  team: number;
}

interface CaptainAnalysis {
  player_id: number;
  web_name: string;
  points: number;
  average_captain_points: number;
  points_above_average: number;
  is_above_average: boolean;
}

// Initialize FPL services
const liveService = FPLLiveService.getInstance();
const teamService = FPLTeamService.getInstance();
const bootstrapService = FPLBootstrapService.getInstance();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

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

    // Get necessary data using services
    const [picksResponse, historyResponse, playersResponse, liveResponse] =
      await Promise.all([
        teamService.getManagerPicks(managerId, gameweek),
        teamService.getManagerHistory(managerId),
        bootstrapService.getAllPlayers(),
        liveService.getLiveData(gameweek),
      ]);

    // Validate all responses
    if (
      !picksResponse.success ||
      !historyResponse.success ||
      !playersResponse.success ||
      !liveResponse.success ||
      !picksResponse.data ||
      !historyResponse.data ||
      !playersResponse.data ||
      !liveResponse.data
    ) {
      throw new Error("Failed to get required data from services");
    }

    const managerPicks = picksResponse.data;
    const managerHistory = historyResponse.data;
    const playersData = playersResponse.data;
    const liveData = liveResponse.data;

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
    const playersMap = new Map(playersData.map((p) => [p.id, p]));
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

      // Get current gameweek info from bootstrap
      const gameweekResponse = await bootstrapService.getGameweek(gameweek);
      const currentEvent = gameweekResponse.success
        ? gameweekResponse.data
        : null;

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
      } else {
        console.error("⚠️ Captain analysis incomplete - missing data");
      }
    } else {
      console.error("❌ No captain found in picks");
    }

    // Calculate safety score (simplified version)
    const gameweekPoints = managerPicks.entry_history.points;
    const gameweekResponse = await bootstrapService.getGameweek(gameweek);
    const currentEvent = gameweekResponse.success
      ? gameweekResponse.data
      : null;
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

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: gameweekStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      data_sources: {
        using_services: true,
        live_tracking: true,
        database_free: true,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Gameweek status failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      managerId: request.nextUrl.searchParams.get("managerId"),
      gameweek: request.nextUrl.searchParams.get("gameweek"),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
