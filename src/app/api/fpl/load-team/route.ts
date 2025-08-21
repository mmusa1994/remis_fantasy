import { NextRequest, NextResponse } from 'next/server';
import { fplApi } from '@/lib/fpl-api';
import { fplDb } from '@/lib/fpl-db';
import { bonusPredictor } from '@/lib/fpl-bonus';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerId, gameweek } = body;

    if (!managerId || !gameweek) {
      return NextResponse.json({
        success: false,
        error: 'managerId and gameweek are required'
      }, { status: 400 });
    }

    const managerIdNum = parseInt(managerId, 10);
    const gw = parseInt(gameweek, 10);
    
    if (isNaN(managerIdNum) || isNaN(gw)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid managerId or gameweek'
      }, { status: 400 });
    }

    await fplDb.upsertBootstrapData(await fplApi.getBootstrapStatic());

    // Check if gameweek data exists first
    let managerEntry, managerPicks, liveData, fixtures, eventStatus;
    
    try {
      [managerEntry, managerPicks, liveData, fixtures, eventStatus] = await Promise.all([
        fplApi.getManagerEntry(managerIdNum),
        fplApi.getManagerPicks(managerIdNum, gw),
        fplApi.getLiveData(gw),
        fplApi.getFixtures(gw),
        fplApi.getEventStatus(),
      ]);
    } catch (apiError) {
      // If FPL API returns 404, gameweek data doesn't exist
      if (apiError instanceof Error && apiError.message.includes('404')) {
        return NextResponse.json({
          success: false,
          error: `Gameweek ${gw} data not available yet`
        }, { status: 404 });
      }
      throw apiError; // Re-throw other errors
    }

    await Promise.all([
      fplDb.upsertManagerPicks(gw, managerIdNum, managerPicks),
      fplDb.upsertLivePlayers(gw, liveData.elements),
      fplDb.upsertFixtures(fixtures),
      fplDb.upsertFixtureStats(fixtures),
    ]);

    const playerIds = managerPicks.picks.map(pick => pick.element);
    const [teamData, liveStats, dbFixtures] = await Promise.all([
      fplDb.getManagerTeam(gw, managerIdNum),
      fplDb.getLivePlayerStats(gw, playerIds),
      fplDb.getFixturesForGameweek(gw),
    ]);

    const teamWithStats = teamData.map(pick => {
      const liveData = liveStats.find(stat => stat.player_id === pick.player_id);
      return {
        ...pick,
        live_stats: liveData || null,
      };
    });

    const bonusStatus = eventStatus.status.find(s => s.event === gw);
    const bonusAdded = bonusStatus?.bonus_added || false;

    let predictedBonuses: any[] = [];
    let totalPredictedBonus = 0;

    if (!bonusAdded) {
      const fixturesWithBPS = liveStats.map(stat => ({
        player_id: stat.player_id,
        bps: stat.bps,
        minutes: stat.minutes,
        player: teamData.find(p => p.player_id === stat.player_id)?.player,
      }));

      predictedBonuses = bonusPredictor.calculateAllFixturesBonuses(
        dbFixtures,
        fixturesWithBPS
      );

      totalPredictedBonus = bonusPredictor.getTotalPredictedBonus(
        managerPicks.picks.map(pick => ({
          player_id: pick.element,
          multiplier: pick.multiplier,
          is_captain: pick.is_captain,
        })),
        predictedBonuses
      );
    }

    const captain = managerPicks.picks.find(p => p.is_captain);
    const viceCaptain = managerPicks.picks.find(p => p.is_vice_captain);
    
    const captainStats = captain ? liveStats.find(s => s.player_id === captain.element) : null;
    const viceCaptainStats = viceCaptain ? liveStats.find(s => s.player_id === viceCaptain.element) : null;

    // Calculate active (starters 1-11) and bench (12-15) points separately
    const activeStats = liveStats.filter(stat => {
      const pick = managerPicks.picks.find(p => p.element === stat.player_id);
      return pick && pick.position <= 11;
    });
    
    const benchStats = liveStats.filter(stat => {
      const pick = managerPicks.picks.find(p => p.element === stat.player_id);
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
        const pick = managerPicks.picks.find(p => p.element === stat.player_id);
        const points = stat.total_points - stat.bonus;
        return sum + (points * (pick?.multiplier || 1));
      }, 0),
      active_points_final: activeStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(p => p.element === stat.player_id);
        return sum + (stat.total_points * (pick?.multiplier || 1));
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
        const pick = managerPicks.picks.find(p => p.element === stat.player_id);
        const points = stat.total_points - stat.bonus;
        const multiplier = pick && pick.position <= 11 ? (pick.multiplier || 1) : 0;
        return sum + (points * multiplier);
      }, 0),
      total_points_final: liveStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(p => p.element === stat.player_id);
        const multiplier = pick && pick.position <= 11 ? (pick.multiplier || 1) : 0;
        return sum + (stat.total_points * multiplier);
      }, 0),
      
      predicted_bonus: totalPredictedBonus,
      final_bonus: bonusAdded ? activeStats.reduce((sum, stat) => {
        const pick = managerPicks.picks.find(p => p.element === stat.player_id);
        return sum + (stat.bonus * (pick?.multiplier || 1));
      }, 0) : 0,
    };

    const managerMetrics = {
      gw,
      manager_id: managerIdNum,
      team_points_no_bonus: teamTotals.total_points_no_bonus,
      team_points_final: teamTotals.total_points_final,
      active_points_no_bonus: teamTotals.active_points_no_bonus,
      active_points_final: teamTotals.active_points_final,
      bench_points_no_bonus: teamTotals.bench_points_no_bonus,
      bench_points_final: teamTotals.bench_points_final,
      captain_id: captain?.element,
      captain_points: captainStats?.total_points || 0,
      vice_captain_id: viceCaptain?.element,
      goals: teamTotals.goals,
      assists: teamTotals.assists,
      clean_sheets: teamTotals.clean_sheets,
      cards_yellow: teamTotals.yellow_cards,
      cards_red: teamTotals.red_cards,
      saves: teamTotals.saves,
      predicted_bonus: teamTotals.predicted_bonus,
      final_bonus: teamTotals.final_bonus,
    };

    await fplDb.upsertManagerMetrics(managerMetrics);

    return NextResponse.json({
      success: true,
      data: {
        manager: managerEntry,
        team_with_stats: teamWithStats,
        team_totals: teamTotals,
        fixtures: dbFixtures,
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
    console.error('Error loading team:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}