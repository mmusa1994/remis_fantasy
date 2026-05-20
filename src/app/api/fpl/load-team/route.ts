import { NextRequest, NextResponse } from "next/server";
import {
  FPLLiveService,
  FPLTeamService,
  FPLBootstrapService,
  FPLFixtureService,
  FPLBonusService,
  FPLScoringService,
} from "@/services/fpl";
import { DEFAULT_SCORING_OPTIONS } from "@/services/fpl/scoring.service";
import type { FPLLiveElement, FPLPlayer } from "@/types/fpl";

// Initialize FPL services
const liveService = FPLLiveService.getInstance();
const teamService = FPLTeamService.getInstance();
const bootstrapService = FPLBootstrapService.getInstance();
const fixtureService = FPLFixtureService.getInstance();
const bonusService = FPLBonusService.getInstance();
const scoringService = FPLScoringService.getInstance();

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
    let gw = parseInt(gameweek, 10);

    if (isNaN(managerIdNum) || isNaN(gw)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid managerId or gameweek",
        },
        { status: 400 }
      );
    }

    // Clamp gameweek to valid FPL range so downstream services never throw a
    // validation error (which would surface as a misleading 500).
    if (gw < 1) gw = 1;
    if (gw > 38) gw = 38;

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

    // Priority 1: Get critical data first (manager picks + live data) with fallback
    let managerPicks, liveData;
    const originalGameweek = gw;
    let fallbackApplied = false;

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
      // Apply fallback logic for any error (404, transient 5xx, network, etc.)
      // — old behaviour only handled 404s, which let upstream FPL hiccups
      // surface as a 500 to the planner.
      const attemptedGameweeks = [gw];
      fallbackApplied = true;
      let currentGw = gw;

      while (currentGw > 1 && attemptedGameweeks.length < 3) {
        currentGw--;
        attemptedGameweeks.push(currentGw);

        try {
          const [fallbackPicksResponse, fallbackLiveResponse] =
            await Promise.all([
              teamService.getManagerPicks(managerIdNum, currentGw),
              liveService.getLiveData(currentGw),
            ]);

          if (
            fallbackPicksResponse.success &&
            fallbackLiveResponse.success &&
            fallbackPicksResponse.data &&
            fallbackLiveResponse.data
          ) {
            managerPicks = fallbackPicksResponse.data;
            liveData = fallbackLiveResponse.data;
            gw = currentGw; // Update the working gameweek
            break;
          }
        } catch (fallbackError) {
          continue;
        }
      }

      // If all fallback attempts failed
      if (!managerPicks || !liveData) {
        return NextResponse.json(
          {
            success: false,
            error: `Gameweek ${originalGameweek} data not available. Tried fallback to gameweeks: ${attemptedGameweeks.join(
              ", "
            )}`,
            attempted_gameweeks: attemptedGameweeks,
            original_gameweek: originalGameweek,
            upstream_error:
              apiError instanceof Error ? apiError.message : "Unknown error",
          },
          { status: 404 }
        );
      }
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

    // Use centralized FPLBonusService with tie-break rules. Wrap in a guard so
    // an unexpected fixture stats shape from FPL can't take down the response.
    let predictedBonusMap = new Map<number, number>();
    let predictedBonuses: Array<{
      player_id: number;
      web_name: string | undefined;
      bonus: number;
    }> = [];
    let totalPredictedBonus = 0;
    try {
      predictedBonusMap = bonusService.predictBonusForGameweek(fixtures);
      predictedBonuses = Array.from(predictedBonusMap.entries()).map(
        ([player_id, bonus]) => {
          const player = playersDataMap.get(player_id);
          return {
            player_id,
            web_name: player?.web_name,
            bonus,
          };
        }
      );
      totalPredictedBonus = managerPicks.picks.reduce((total, pick) => {
        if (pick.position > 11) return total;
        const bonus = predictedBonusMap.get(pick.element) || 0;
        return total + bonus * pick.multiplier;
      }, 0);
    } catch (bonusError) {
      console.warn(
        "⚠️ Bonus prediction failed (continuing without predicted bonus):",
        bonusError
      );
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

    // Build maps for scoring service
    const liveElementMap = new Map<number, FPLLiveElement>(
      (liveData.elements || []).map((el) => [el.id, el as FPLLiveElement])
    );
    const playersByIdMap = new Map<number, FPLPlayer>(
      playersData.map((p: FPLPlayer) => [p.id, p])
    );

    // entry_history can be missing for very fresh picks responses — default to
    // zeros so the scoring service doesn't throw on undefined access.
    const safeEntryHistory = {
      event_transfers_cost: managerPicks.entry_history?.event_transfers_cost || 0,
      total_points: managerPicks.entry_history?.total_points || 0,
      points: managerPicks.entry_history?.points || 0,
    };

    const emptyScore = {
      live_points_gross: 0,
      live_points_net: 0,
      live_total: 0,
      auto_subs_applied: [] as any[],
      captain_promoted: null as any,
      chip_effects: {
        bench_boost_applied: false,
        triple_captain_applied: false,
        free_hit_applied: false,
        wildcard_applied: false,
      },
    };

    let scoreWithAutoSubs: any = emptyScore;
    let scoreWithoutAutoSubs: any = emptyScore;
    try {
      scoreWithAutoSubs = scoringService.calculateLiveTeamScore({
        picks: managerPicks.picks,
        activeChip: managerPicks.active_chip,
        liveElements: liveElementMap,
        playersById: playersByIdMap,
        fixtures,
        predictedBonusByElement: predictedBonusMap,
        bonusAlreadyAdded: bonusAdded,
        entryHistory: safeEntryHistory,
        options: { ...DEFAULT_SCORING_OPTIONS, applyAutoSubs: true },
      });

      scoreWithoutAutoSubs = scoringService.calculateLiveTeamScore({
        picks: managerPicks.picks,
        activeChip: managerPicks.active_chip,
        liveElements: liveElementMap,
        playersById: playersByIdMap,
        fixtures,
        predictedBonusByElement: predictedBonusMap,
        bonusAlreadyAdded: bonusAdded,
        entryHistory: safeEntryHistory,
        options: { ...DEFAULT_SCORING_OPTIONS, applyAutoSubs: false },
      });
    } catch (scoringError) {
      console.warn(
        "⚠️ Scoring service failed (continuing with empty score):",
        scoringError
      );
    }

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

      // New live scoring results from centralized scoring service
      with_autosubs: {
        live_points_gross: scoreWithAutoSubs.live_points_gross,
        live_points_net: scoreWithAutoSubs.live_points_net,
        live_total: scoreWithAutoSubs.live_total,
        auto_subs_applied: scoreWithAutoSubs.auto_subs_applied,
        captain_promoted: scoreWithAutoSubs.captain_promoted,
      },
      without_autosubs: {
        live_points_gross: scoreWithoutAutoSubs.live_points_gross,
        live_points_net: scoreWithoutAutoSubs.live_points_net,
        live_total: scoreWithoutAutoSubs.live_total,
      },
      chip_effects: scoreWithAutoSubs.chip_effects,
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
