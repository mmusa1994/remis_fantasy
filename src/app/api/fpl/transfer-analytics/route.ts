import { NextRequest, NextResponse } from 'next/server';
import { FPLTransferAnalyticsService } from '@/services/fpl/transfer-analytics.service';

const transferService = FPLTransferAnalyticsService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentGameweek = parseInt(searchParams.get('gameweek') || '4');
    const playerIds = searchParams.get('playerIds'); // Comma-separated player IDs
    const getSwaps = searchParams.get('swaps') === 'true';
    const getMomentum = searchParams.get('momentum') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (getSwaps) {
      // Get popular transfer swaps
      const swaps = await transferService.getPopularTransferSwaps(limit);
      
      if (!swaps.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch transfer swaps',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: swaps.data,
        timestamp: swaps.timestamp,
      });
    }

    if (getMomentum && playerIds) {
      // Get transfer momentum for specific players
      const ids = playerIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid player IDs provided',
        }, { status: 400 });
      }

      const momentum = await transferService.getPlayerTransferMomentum(ids);
      
      if (!momentum.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch transfer momentum',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: momentum.data,
        timestamp: momentum.timestamp,
      });
    }

    // Get comprehensive transfer analytics
    const analytics = await transferService.getTransferAnalytics(currentGameweek);
    
    if (!analytics.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transfer analytics',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: analytics.data,
      timestamp: analytics.timestamp,
    });
  } catch (error) {
    console.error('Transfer analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}