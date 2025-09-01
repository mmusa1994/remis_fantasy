import { NextRequest, NextResponse } from 'next/server';
import { resetAllUsage, getUserId, checkRateLimit } from '@/lib/ai-rate-limit';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    if (action === 'reset') {
      await resetAllUsage();
      return NextResponse.json({ 
        success: true, 
        message: 'All usage data reset' 
      });
    }
    
    if (action === 'status') {
      const userId = getUserId(req);
      const status = await checkRateLimit(userId);
      return NextResponse.json({
        userId,
        ...status,
        resetDate: status.resetDate.toISOString()
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Use "reset" or "status"' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Debug API error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const status = await checkRateLimit(userId);
  
  return NextResponse.json({
    userId,
    ...status,
    resetDate: status.resetDate.toISOString()
  });
}