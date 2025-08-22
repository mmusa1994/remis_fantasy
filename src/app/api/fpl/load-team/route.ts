import { NextRequest, NextResponse } from "next/server";
import { fplApi } from "@/lib/fpl-api";
import { fplDb } from "@/lib/fpl-db";
import { bonusPredictor } from "@/lib/fpl-bonus";

// Cache for bootstrap data to avoid DB calls on every request
let bootstrapCache: { data: any; timestamp: number } | null = null;
const BOOTSTRAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerId, gameweek, skeleton = false } = body;

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
        const managerEntry = await fplApi.getManagerEntry(managerIdNum);
        return NextResponse.json({
          success: true,
          data: {
            manager: managerEntry,
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
          gameweek: gw,
          manager_id: managerIdNum,
          timestamp: new Date().toISOString(),
          skeleton: true,
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
      [managerPicks, liveData] = await Promise.all([
        fplApi.getManagerPicks(managerIdNum, gw),
        fplApi.getLiveData(gw),
      ]);
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

    // Priority 2: Get player data from cache or DB
    const playerIds = managerPicks.picks.map((pick) => pick.element);
    let playersData;

    // Use cached bootstrap data if available and fresh
    if (
      bootstrapCache &&
      Date.now() - bootstrapCache.timestamp < BOOTSTRAP_CACHE_TTL
    ) {
      playersData = bootstrapCache.data.elements.filter((p: any) =>
        playerIds.includes(p.id)
      );
    } else {
      playersData = await fplDb.getPlayersData(playerIds);
    }

    // Priority 3: Get remaining data in background (non-blocking)
    let managerEntry: any = null;
    let fixtures: any[] = [];
    let eventStatus: any = { status: [] };

    try {
      [managerEntry, fixtures, eventStatus] = await Promise.all([
        fplApi.getManagerEntry(managerIdNum),
        fplApi.getFixtures(gw),
        fplApi.getEventStatus(),
      ]);
    } catch (error) {
      // Return partial data if secondary requests fail
      console.warn("Secondary API calls failed:", error);
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

    // Only calculate bonus predictions if needed and data is available
    if (!bonusAdded && fixtures && fixtures.length > 0) {
      try {
        const fixturesWithBPS = liveStats.map((stat) => ({
          player_id: stat.player_id,
          bps: stat.bps,
          minutes: stat.minutes,
          player: playersDataMap.get(stat.player_id) as
            | { web_name: string; team: number }
            | undefined,
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
      } catch (error) {
        console.warn("Bonus prediction failed:", error);
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

    // Background update of bootstrap data (non-blocking)
    const updateBootstrapInBackground = async () => {
      try {
        const bootstrap = await fplApi.getBootstrapStatic();
        bootstrapCache = {
          data: bootstrap,
          timestamp: Date.now(),
        };
        await fplDb.upsertBootstrapData(bootstrap);
      } catch (error) {
        console.warn("Background bootstrap update failed:", error);
      }
    };

    // Only update if cache is stale
    if (
      !bootstrapCache ||
      Date.now() - bootstrapCache.timestamp > BOOTSTRAP_CACHE_TTL
    ) {
      setImmediate(updateBootstrapInBackground);
    }

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
