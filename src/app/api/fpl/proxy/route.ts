import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint parameter required' },
        { status: 400 }
      );
    }

    const fplUrl = `https://fantasy.premierleague.com/api${endpoint}`;
    
    const response = await fetch(fplUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://fantasy.premierleague.com/',
        'Origin': 'https://fantasy.premierleague.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`FPL API Error: ${response.status} ${response.statusText} for ${endpoint}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `FPL API returned ${response.status}: ${response.statusText}`,
          endpoint 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      source: 'fpl-proxy'
    });

  } catch (error) {
    console.error('FPL Proxy Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown proxy error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}