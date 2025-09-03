import { NextRequest, NextResponse } from 'next/server';
import { getRemainingQuestions, getUserId } from '@/lib/ai-rate-limit';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { remaining, resetDate } = await getRemainingQuestions(userId);
    
    return NextResponse.json({
      remaining,
      total: 5,
      resetDate: resetDate.toISOString(),
      resetDateFormatted: resetDate.toLocaleDateString()
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage information' },
      { status: 500 }
    );
  }
}