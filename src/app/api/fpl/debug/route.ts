import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      element_types_sample: data.element_types?.[0] || null,
      element_types_count: data.element_types?.length || 0,
      teams_sample: data.teams?.[0] || null,
      teams_count: data.teams?.length || 0,
      players_sample: data.elements?.[0] || null,
      players_count: data.elements?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}