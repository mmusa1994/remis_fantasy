import { NextRequest, NextResponse } from 'next/server';
import { fplDb } from '@/lib/fpl-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gw = searchParams.get('gw');
    const limit = searchParams.get('limit');

    if (!gw) {
      return NextResponse.json({
        success: false,
        error: 'Gameweek parameter is required'
      }, { status: 400 });
    }

    const gameweek = parseInt(gw, 10);
    const eventLimit = limit ? parseInt(limit, 10) : 50;
    
    if (isNaN(gameweek)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid gameweek parameter'
      }, { status: 400 });
    }

    const events = await fplDb.getRecentEvents(gameweek, eventLimit);

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      gameweek,
      limit: eventLimit,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Return empty array if table doesn't exist
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      gameweek,
      limit: eventLimit,
      warning: 'Database tables not initialized. No events available.'
    });
  }
}