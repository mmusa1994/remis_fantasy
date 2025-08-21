import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";
import { fplDb } from "@/lib/fpl-db";
import { bonusPredictor } from "@/lib/fpl-bonus";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerId, gameweek } = body;

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

    // Update players and teams data from bootstrap (only essential data)
    await fplDb.upsertBootstrapData(await fplApi.getBootstrapStatic());

    // Fetch all live data from FPL API - no database storage
    let managerEntry,
      managerPicks,
      liveData,
      fixtures,
      eventStatus;

    try {
      [
        managerEntry,
        managerPicks,
        liveData,
        fixtures,
        eventStatus,
      ] = await Promise.all([
        fplApi.getManagerEntry(managerIdNum),
        fplApi.getManagerPicks(managerIdNum, gw),
        fplApi.getLiveData(gw),
        fplApi.getFixtures(gw),
        fplApi.getEventStatus(),
      ]);
    } catch (apiError) {
      // If FPL API returns 404, gameweek data doesn't exist
      if (apiError instanceof Error && apiError.message.includes("404")) {
        return NextResponse.json(
          {
            success: false,
            error: `Gameweek ${gw} data not available yet`,
          },
          { status: 404 }
        );
      }
      throw apiError; // Re-throw other errors
    }

    // Get player data from database for names/teams (static data)
    const playerIds = managerPicks.picks.map((pick) => pick.element);
    const playersData = await fplDb.getPlayersData(playerIds);

    // Build team with live stats - all from live API data
    const teamWithStats = managerPicks.picks.map((pick) => {
      const livePlayerData = liveData.elements.find(
        (element) => element.id === pick.element
      );
      const dbPlayerData = playersData.find(
        (player) => player.id === pick.element
      );

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

    const bonusStatus = eventStatus.status.find((s) => s.event === gw);
    const bonusAdded = bonusStatus?.bonus_added || false;

    // Extract live stats for calculations
    const liveStats = teamWithStats
      .map((team) => team.live_stats)
      .filter((stats) => stats !== null);

    let predictedBonuses: any[] = [];
    let totalPredictedBonus = 0;

    if (!bonusAdded) {
      const fixturesWithBPS = liveStats.map((stat) => ({
        player_id: stat.player_id,
        bps: stat.bps,
        minutes: stat.minutes,
        player: teamWithStats.find((p) => p.player_id === stat.player_id)
          ?.player,
      }));

      predictedBonuses = bonusPredictor.calculateAllFixturesBonuses(
        fixtures,
        fixturesWithBPS
      );

      totalPredictedBonus = bonusPredictor.getTotalPredictedBonus(
        managerPicks.picks.map((pick) => ({
          player_id: pick.element,
          multiplier: pick.multiplier,
          is_captain: pick.is_captain,
        })),
        predictedBonuses
      );
    }

    const captain = managerPicks.picks.find((p) => p.is_captain);
    const viceCaptain = managerPicks.picks.find((p) => p.is_vice_captain);

    const captainStats = captain
      ? liveStats.find((s) => s.player_id === captain.element)
      : null;
    const viceCaptainStats = viceCaptain
      ? liveStats.find((s) => s.player_id === viceCaptain.element)
      : null;

    // Calculate active (starters 1-11) and bench (12-15) points separately
    const activeStats = liveStats.filter((stat) => {
      const pick = managerPicks.picks.find((p) => p.element === stat.player_id);
      return pick && pick.position <= 11;
    });

    const benchStats = liveStats.filter((stat) => {
      const pick = managerPicks.picks.find((p) => p.element === stat.player_id);
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
        const pick = managerPicks.picks.find(
          (p) => p.element === stat.player_id
        );
        const points = stat.total_points - stat.bonus;
        return sum + points * (pick?.multiplier || 1);
      }, 0),
      active_points_final: activeStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(
          (p) => p.element === stat.player_id
        );
        return sum + stat.total_points * (pick?.multiplier || 1);
      }, 0),

      // Bench points (positions 12-15, no multipliers)
      bench_points_no_bonus: benchStats.reduce((sum, stat) => {
        return sum + (stat.total_points - stat.bonus);
      }, 0),
      bench_points_final: benchStats.reduce((sum, stat) => {
        return sum + stat.total_points;
      }, 0),

      // Total points (for compatibility)
      total_points_no_bonus: liveStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(
          (p) => p.element === stat.player_id
        );
        const points = stat.total_points - stat.bonus;
        const multiplier =
          pick && pick.position <= 11 ? pick.multiplier || 1 : 0;
        return sum + points * multiplier;
      }, 0),
      total_points_final: liveStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(
          (p) => p.element === stat.player_id
        );
        const multiplier =
          pick && pick.position <= 11 ? pick.multiplier || 1 : 0;
        return sum + stat.total_points * multiplier;
      }, 0),

      predicted_bonus: totalPredictedBonus,
      final_bonus: bonusAdded
        ? activeStats.reduce((sum, stat) => {
            const pick = managerPicks.picks.find(
              (p) => p.element === stat.player_id
            );
            return sum + stat.bonus * (pick?.multiplier || 1);
          }, 0)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        manager: managerEntry,
        team_with_stats: teamWithStats,
        team_totals: teamTotals,
        fixtures: fixtures,
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
      gameweek: gw,
      manager_id: managerIdNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error loading team:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
