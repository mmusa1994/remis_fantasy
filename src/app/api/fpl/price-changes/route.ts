import { NextRequest, NextResponse } from 'next/server';
import { FPLPriceTrackingService } from '@/services/fpl/price-tracking.service';

const priceService = FPLPriceTrackingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIds = searchParams.get('teamIds'); // Comma-separated player IDs

    const priceChanges = await priceService.getCurrentPriceChanges();
    
    if (!priceChanges.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch price changes',
      }, { status: 500 });
    }

    let teamImpact = null;
    if (teamIds) {
      const playerIds = teamIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (playerIds.length > 0) {
        const impactResponse = await priceService.getTeamPriceImpact(playerIds);
        if (impactResponse.success) {
          teamImpact = impactResponse.data;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...priceChanges.data,
        user_team_impact: teamImpact,
      },
      timestamp: priceChanges.timestamp,
    });
  } catch (error) {
    console.error('Price changes API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}