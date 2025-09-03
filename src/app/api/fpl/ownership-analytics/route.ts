import { NextRequest, NextResponse } from 'next/server';
import { FPLOwnershipService } from '@/services/fpl/ownership.service';

const ownershipService = FPLOwnershipService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as '1h' | '24h' | 'week' || '1h';
    const playerIds = searchParams.get('playerIds'); // Comma-separated player IDs
    const maxOwnership = parseInt(searchParams.get('maxOwnership') || '5');
    const minPoints = parseInt(searchParams.get('minPoints') || '30');
    const getDifferentials = searchParams.get('differentials') === 'true';

    if (getDifferentials) {
      // Get differential players
      const differentials = await ownershipService.getDifferentialPlayers(maxOwnership, minPoints);
      
      if (!differentials.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch differential players',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: differentials.data,
        timestamp: differentials.timestamp,
      });
    }

    if (playerIds) {
      // Get ownership trends for specific players
      const ids = playerIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid player IDs provided',
        }, { status: 400 });
      }

      const trends = await ownershipService.getPlayerOwnershipTrends(ids);
      
      if (!trends.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch player ownership trends',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: trends.data,
        timestamp: trends.timestamp,
      });
    }

    // Get general ownership analytics
    const analytics = await ownershipService.getOwnershipAnalytics(timeframe);
    
    if (!analytics.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch ownership analytics',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: analytics.data,
      timestamp: analytics.timestamp,
    });
  } catch (error) {
    console.error('Ownership analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}