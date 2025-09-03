import { NextRequest, NextResponse } from 'next/server';
import { FPLChipAnalyticsService } from '@/services/fpl/chip-analytics.service';

const chipService = FPLChipAnalyticsService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const getTiming = searchParams.get('timing') === 'true';
    const getSuccess = searchParams.get('success') === 'true';

    if (getTiming) {
      // Get optimal chip timing
      const timing = await chipService.getOptimalChipTiming();
      
      if (!timing.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch chip timing',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: timing.data,
        timestamp: timing.timestamp,
      });
    }

    if (getSuccess) {
      // Get chip success analysis
      const success = await chipService.getChipSuccessAnalysis();
      
      if (!success.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch chip success analysis',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: success.data,
        timestamp: success.timestamp,
      });
    }

    // Get comprehensive chip analytics
    const analytics = await chipService.getChipAnalytics();
    
    if (!analytics.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch chip analytics',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: analytics.data,
      timestamp: analytics.timestamp,
    });
  } catch (error) {
    console.error('Chip analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}