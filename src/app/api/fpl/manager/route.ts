import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";
import { fplDb } from "@/lib/fpl-db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get("managerId");
    const gwParam = searchParams.get("gw");

    if (!managerIdParam || !gwParam) {
      return NextResponse.json(
        {
          success: false,
          error: "managerId and gw parameters are required",
        },
        { status: 400 }
      );
    }

    const managerId = parseInt(managerIdParam, 10);
    const gw = parseInt(gwParam, 10);

    if (isNaN(managerId) || isNaN(gw)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId or gw parameter",
        },
        { status: 400 }
      );
    }

    // Fetch live data from FPL API - no database storage
    const [managerEntry, managerPicks, liveData] = await Promise.all([
      fplApi.getManagerEntry(managerId),
      fplApi.getManagerPicks(managerId, gw),
      fplApi.getLiveData(gw),
    ]);

    // Get player data from database for names/teams
    const playerIds = managerPicks.picks.map((pick) => pick.element);
    const playersData = await fplDb.getPlayersData(playerIds);

    // Build team with live stats from API data
    const teamWithStats = managerPicks.picks.map((pick) => {
      const livePlayerData = liveData.elements.find(
        (element) => element.id === pick.element
      );
      const dbPlayerData = playersData.find(
        (player) => player.id === pick.element
      );

      return {
        gw,
        manager_id: managerId,
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
              influence: parseFloat(livePlayerData.stats.influence),
              creativity: parseFloat(livePlayerData.stats.creativity),
              threat: parseFloat(livePlayerData.stats.threat),
              ict_index: parseFloat(livePlayerData.stats.ict_index),
              total_points: livePlayerData.stats.total_points,
              in_dreamteam: livePlayerData.stats.in_dreamteam,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        manager: managerEntry,
        picks: managerPicks,
        team_with_stats: teamWithStats,
        entry_history: managerPicks.entry_history,
        automatic_subs: managerPicks.automatic_subs,
        active_chip: managerPicks.active_chip,
      },
      gameweek: gw,
      manager_id: managerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching manager data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
