import { NextRequest, NextResponse } from "next/server";
import {
  FPLLiveService,
  FPLTeamService,
  FPLBootstrapService,
  FPLFixtureService,
} from "@/services/fpl";

// Initialize FPL services
const liveService = FPLLiveService.getInstance();
const teamService = FPLTeamService.getInstance();
const bootstrapService = FPLBootstrapService.getInstance();
const fixtureService = FPLFixtureService.getInstance();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let managerId: any, gameweek: any;

  try {
    const body = await request.json();
    ({ managerId, gameweek } = body);
    const skeleton = body.skeleton || false;

    if (!managerId || !gameweek) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId and gameweek are required",
        },
        { status: 400 }
      );
    }

    const managerIdNum = parseInt(managerId, 10);
    const gw = parseInt(gameweek, 10);

    if (isNaN(managerIdNum) || isNaN(gw)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId or gameweek",
        },
        { status: 400 }
      );
    }

    // If skeleton mode requested, return minimal manager data quickly
    if (skeleton) {
      try {
        const managerResponse = await teamService.getManagerInfo(managerIdNum);

        if (!managerResponse.success || !managerResponse.data) {
          throw new Error("Manager not found");
        }

        return NextResponse.json({
          success: true,
          data: {
            manager: {
              ...managerResponse.data,
              player_region_iso_code_short:
                managerResponse.data.player_region_short_iso,
            },
            team_with_stats: [],
            team_totals: null,
            fixtures: [],
            predicted_bonuses: [],
            bonus_added: false,
            entry_history: null,
            automatic_subs: [],
            active_chip: null,
            captain: { player_id: null, multiplier: null, stats: null },
            vice_captain: { player_id: null, multiplier: null, stats: null },
          },
          gameweek: parseInt(gameweek, 10),
          manager_id: parseInt(managerId, 10),
          timestamp: new Date().toISOString(),
          skeleton: true,
          response_time_ms: Date.now() - startTime,
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Manager not found",
          },
          { status: 404 }
        );
      }
    }

    // Priority 1: Get critical data first (manager picks + live data)
    let managerPicks, liveData;

    try {
      const [picksResponse, liveResponse] = await Promise.all([
        teamService.getManagerPicks(managerIdNum, gw),
        liveService.getLiveData(gw),
      ]);

      if (
        !picksResponse.success ||
        !liveResponse.success ||
        !picksResponse.data ||
        !liveResponse.data
      ) {
        throw new Error("Failed to get critical data");
      }

      managerPicks = picksResponse.data;
      liveData = liveResponse.data;
    } catch (apiError) {
      if (apiError instanceof Error && apiError.message.includes("404")) {
        return NextResponse.json(
          {
            success: false,
            error: `Gameweek ${gw} data not available yet`,
          },
          { status: 404 }
        );
      }
      throw apiError;
    }

    // Priority 2: Get player data from services
    const playerIds = managerPicks.picks.map((pick) => pick.element);
    let playersData: any[];

    try {
      const playersResponse = await bootstrapService.getAllPlayers();

      if (!playersResponse.success || !playersResponse.data) {
        throw new Error("Failed to get players data");
      }

      // Filter to only the players we need
      playersData = playersResponse.data.filter((p: any) =>
        playerIds.includes(p.id)
      );
    } catch (error) {
      console.error("❌ Player data fetch failed:", error);
      throw error;
    }

    // Priority 3: Get remaining data in parallel
    let managerEntry: any = null;
    let fixtures: any[] = [];
    let eventStatus: any = { status: [] };

    try {
      const [managerResponse, fixturesResponse, statusResponse] =
        await Promise.all([
          teamService.getManagerInfo(managerIdNum),
          fixtureService.getAllFixtures(),
          liveService.getEventStatus(),
        ]);

      managerEntry =
        managerResponse.success && managerResponse.data
          ? {
              ...managerResponse.data,
              player_region_iso_code_short:
                managerResponse.data.player_region_short_iso,
            }
          : null;

      fixtures = fixturesResponse.success
        ? (fixturesResponse.data || []).filter((f: any) => f.event === gw)
        : [];
      eventStatus = statusResponse.success
        ? statusResponse.data
        : { status: [] };
    } catch (error) {
      console.warn(
        "⚠️ Secondary data fetch failed (continuing with partial data):",
        error
      );
      managerEntry = null;
      fixtures = [];
      eventStatus = { status: [] };
    }

    // Create lookup maps for O(1) access
    const liveDataMap = new Map(liveData.elements.map((el) => [el.id, el]));
    const playersDataMap = new Map(playersData.map((p: any) => [p.id, p]));

    // Build team with live stats - optimized with maps
    const teamWithStats = managerPicks.picks.map((pick) => {
      const livePlayerData = liveDataMap.get(pick.element);
      const dbPlayerData = playersDataMap.get(pick.element);

      return {
        gw,
        manager_id: managerIdNum,
        player_id: pick.element,
        position: pick.position,
        multiplier: pick.multiplier,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        player: dbPlayerData || null,
        live_stats: livePlayerData
          ? {
              gw,
              player_id: livePlayerData.id,
              minutes: livePlayerData.stats.minutes,
              goals_scored: livePlayerData.stats.goals_scored,
              assists: livePlayerData.stats.assists,
              clean_sheets: livePlayerData.stats.clean_sheets,
              goals_conceded: livePlayerData.stats.goals_conceded,
              own_goals: livePlayerData.stats.own_goals,
              penalties_saved: livePlayerData.stats.penalties_saved,
              penalties_missed: livePlayerData.stats.penalties_missed,
              yellow_cards: livePlayerData.stats.yellow_cards,
              red_cards: livePlayerData.stats.red_cards,
              saves: livePlayerData.stats.saves,
              bonus: livePlayerData.stats.bonus,
              bps: livePlayerData.stats.bps,
              influence: parseFloat(livePlayerData.stats.influence || "0"),
              creativity: parseFloat(livePlayerData.stats.creativity || "0"),
              threat: parseFloat(livePlayerData.stats.threat || "0"),
              ict_index: parseFloat(livePlayerData.stats.ict_index || "0"),
              total_points: livePlayerData.stats.total_points,
              in_dreamteam: livePlayerData.stats.in_dreamteam,
            }
          : null,
      };
    });

    const bonusStatus = eventStatus?.status?.find((s: any) => s.event === gw);
    const bonusAdded = bonusStatus?.bonus_added || false;

    // Extract live stats for calculations - optimized filtering
    const liveStats = teamWithStats
      .map((team) => team.live_stats)
      .filter((stats): stats is NonNullable<typeof stats> => stats !== null);

    let predictedBonuses: any[] = [];
    let totalPredictedBonus = 0;

    // Simplified bonus prediction without external library
    if (!bonusAdded && fixtures && fixtures.length > 0) {
      try {
        // Basic bonus prediction based on BPS
        const fixtureGroups = new Map<number, any[]>();

        // Group players by fixture
        liveStats.forEach((stat) => {
          const player = playersDataMap.get(stat.player_id);
          if (player && stat.minutes > 0) {
            const playerFixtures = fixtures.filter(
              (f) => f.team_h === player.team || f.team_a === player.team
            );

            playerFixtures.forEach((fixture) => {
              if (!fixtureGroups.has(fixture.id)) {
                fixtureGroups.set(fixture.id, []);
              }
              fixtureGroups.get(fixture.id)!.push({
                player_id: stat.player_id,
                web_name: player.web_name,
                bps: stat.bps,
                minutes: stat.minutes,
                team: player.team,
              });
            });
          }
        });

        // Calculate bonus for each fixture
        for (const [fixtureId, players] of fixtureGroups.entries()) {
          const sortedPlayers = players
            .filter((p) => p.minutes >= 60) // Only players with 60+ minutes
            .sort((a, b) => b.bps - a.bps);

          if (sortedPlayers.length >= 3) {
            // Award bonus points: 3, 2, 1
            const bonusPoints = [3, 2, 1];
            for (let i = 0; i < Math.min(3, sortedPlayers.length); i++) {
              predictedBonuses.push({
                fixture_id: fixtureId,
                player_id: sortedPlayers[i].player_id,
                web_name: sortedPlayers[i].web_name,
                bonus: bonusPoints[i],
                bps: sortedPlayers[i].bps,
              });
            }
          }
        }

        // Calculate total predicted bonus for this manager's team
        totalPredictedBonus = managerPicks.picks.reduce((total, pick) => {
          const playerBonus = predictedBonuses
            .filter((pb) => pb.player_id === pick.element)
            .reduce((sum, pb) => sum + pb.bonus, 0);
          return total + playerBonus * pick.multiplier;
        }, 0);
      } catch (error) {
        console.warn("⚠️ Bonus prediction failed:", error);
        predictedBonuses = [];
        totalPredictedBonus = 0;
      }
    }

    // Create pick position map for O(1) lookups
    const pickPositionMap = new Map(
      managerPicks.picks.map((p) => [p.element, p])
    );
    const liveStatsMap = new Map(liveStats.map((s: any) => [s.player_id, s]));

    const captain = managerPicks.picks.find((p) => p.is_captain);
    const viceCaptain = managerPicks.picks.find((p) => p.is_vice_captain);

    const captainStats = captain ? liveStatsMap.get(captain.element) : null;
    const viceCaptainStats = viceCaptain
      ? liveStatsMap.get(viceCaptain.element)
      : null;

    // Pre-calculate active and bench stats using position map
    const activeStats = liveStats.filter((stat) => {
      const pick = pickPositionMap.get(stat.player_id);
      return pick && pick.position <= 11;
    });

    const benchStats = liveStats.filter((stat) => {
      const pick = pickPositionMap.get(stat.player_id);
      return pick && pick.position > 11;
    });

    const teamTotals = {
      goals: liveStats.reduce((sum, stat) => sum + stat.goals_scored, 0),
      assists: liveStats.reduce((sum, stat) => sum + stat.assists, 0),
      clean_sheets: liveStats.reduce((sum, stat) => sum + stat.clean_sheets, 0),
      yellow_cards: liveStats.reduce((sum, stat) => sum + stat.yellow_cards, 0),
      red_cards: liveStats.reduce((sum, stat) => sum + stat.red_cards, 0),
      saves: liveStats.reduce((sum, stat) => sum + stat.saves, 0),

      // Active team points (positions 1-11 with multipliers)
      active_points_no_bonus: activeStats.reduce((sum, stat) => {
        const pick = pickPositionMap.get(stat.player_id);
        const points = stat.total_points - stat.bonus;
        return sum + points * (pick?.multiplier || 1);
      }, 0),
      active_points_final: activeStats.reduce((sum, stat) => {
        const pick = pickPositionMap.get(stat.player_id);
        return sum + stat.total_points * (pick?.multiplier || 1);
      }, 0),

      // Bench points (positions 12-15, no multipliers)
      bench_points_no_bonus: benchStats.reduce((sum, stat) => {
        return sum + (stat.total_points - stat.bonus);
      }, 0),
      bench_points_final: benchStats.reduce((sum, stat) => {
        return sum + stat.total_points;
      }, 0),

      // Total points (for compatibility) - optimized with position map
      total_points_no_bonus: liveStats.reduce((sum, stat) => {
        const pick = pickPositionMap.get(stat.player_id);
        const points = stat.total_points - stat.bonus;
        const multiplier =
          pick && pick.position <= 11 ? pick.multiplier || 1 : 0;
        return sum + points * multiplier;
      }, 0),
      total_points_final: liveStats.reduce((sum, stat) => {
        const pick = pickPositionMap.get(stat.player_id);
        const multiplier =
          pick && pick.position <= 11 ? pick.multiplier || 1 : 0;
        return sum + stat.total_points * multiplier;
      }, 0),

      predicted_bonus: totalPredictedBonus,
      final_bonus: bonusAdded
        ? activeStats.reduce((sum, stat) => {
            const pick = pickPositionMap.get(stat.player_id);
            return sum + stat.bonus * (pick?.multiplier || 1);
          }, 0)
        : 0,
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        manager: managerEntry,
        team_with_stats: teamWithStats,
        team_totals: teamTotals,
        fixtures: fixtures || [],
        predicted_bonuses: predictedBonuses,
        bonus_added: bonusAdded,
        entry_history: managerPicks.entry_history,
        automatic_subs: managerPicks.automatic_subs,
        active_chip: managerPicks.active_chip,
        captain: {
          player_id: captain?.element,
          multiplier: captain?.multiplier,
          stats: captainStats,
        },
        vice_captain: {
          player_id: viceCaptain?.element,
          multiplier: viceCaptain?.multiplier,
          stats: viceCaptainStats,
        },
      },
      gameweek: parseInt(gameweek, 10),
      manager_id: parseInt(managerId, 10),
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
    console.error("💥 Load team failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
      managerId: managerId || "unknown",
      gameweek: gameweek || "unknown",
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
