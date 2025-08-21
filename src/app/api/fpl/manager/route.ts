import { NextRequest, NextResponse } from 'next/server';
import { fplApi } from '@/lib/fpl-api';
import { fplDb } from '@/lib/fpl-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get('managerId');
    const gwParam = searchParams.get('gw');

    if (!managerIdParam || !gwParam) {
      return NextResponse.json({
        success: false,
        error: 'managerId and gw parameters are required'
      }, { status: 400 });
    }

    const managerId = parseInt(managerIdParam, 10);
    const gw = parseInt(gwParam, 10);
    
    if (isNaN(managerId) || isNaN(gw)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid managerId or gw parameter'
      }, { status: 400 });
    }

    const [managerEntry, managerPicks] = await Promise.all([
      fplApi.getManagerEntry(managerId),
      fplApi.getManagerPicks(managerId, gw),
    ]);

    await fplDb.upsertManagerPicks(gw, managerId, managerPicks);

    const teamData = await fplDb.getManagerTeam(gw, managerId);
    const playerIds = teamData.map(pick => pick.player_id);
    const liveStats = await fplDb.getLivePlayerStats(gw, playerIds);

    const teamWithStats = teamData.map(pick => {
      const liveData = liveStats.find(stat => stat.player_id === pick.player_id);
      return {
        ...pick,
        live_stats: liveData || null,
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
    });
  } catch (error) {
    console.error('Error fetching manager data:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}