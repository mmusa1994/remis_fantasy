import { NextResponse } from 'next/server';
import { fplApi } from '@/lib/fpl-api';
import { fplDb } from '@/lib/fpl-db';

export async function GET() {
  try {
    const bootstrap = await fplApi.getBootstrapStatic();
    
    await fplDb.upsertBootstrapData(bootstrap);

    return NextResponse.json({
      success: true,
      data: {
        players_count: bootstrap.elements.length,
        teams_count: bootstrap.teams.length,
        element_types_count: bootstrap.element_types.length,
        current_gw: bootstrap.events.find(e => e.is_current)?.id || 1,
      }
    });
  } catch (error) {
    console.error('Error fetching bootstrap:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}