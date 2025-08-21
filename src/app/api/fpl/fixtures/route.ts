import { NextRequest, NextResponse } from 'next/server';
import { fplApi } from '@/lib/fpl-api';
import { fplDb } from '@/lib/fpl-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gw = searchParams.get('gw');

    const gameweek = gw ? parseInt(gw, 10) : undefined;
    
    if (gameweek && isNaN(gameweek)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid gameweek parameter'
      }, { status: 400 });
    }

    const fixtures = await fplApi.getFixtures(gameweek);
    
    if (gameweek) {
      await Promise.all([
        fplDb.upsertFixtures(fixtures),
        fplDb.upsertFixtureStats(fixtures),
      ]);
    }

    const dbFixtures = gameweek 
      ? await fplDb.getFixturesForGameweek(gameweek)
      : fixtures;

    return NextResponse.json({
      success: true,
      data: dbFixtures,
      count: dbFixtures.length,
      gameweek: gameweek || null,
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}