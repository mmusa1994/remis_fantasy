import { NextRequest, NextResponse } from "next/server";

// Alternative CORS proxy using public services
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
    
    // Try multiple CORS proxy services as fallback
    const corsProxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(fplUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(fplUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(fplUrl)}`,
    ];

    let lastError: Error | null = null;

    for (const proxyUrl of corsProxies) {
      try {
        console.log(`Trying CORS proxy: ${proxyUrl.split('?')[0]}`);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Handle different proxy response formats
        let data;
        if (result.contents) {
          // allorigins format
          data = JSON.parse(result.contents);
        } else if (typeof result === 'string') {
          // Some proxies return stringified JSON
          data = JSON.parse(result);
        } else {
          // Direct JSON response
          data = result;
        }

        return NextResponse.json({
          success: true,
          data,
          timestamp: new Date().toISOString(),
          source: 'cors-proxy',
          proxy_used: proxyUrl.split('?')[0]
        });

      } catch (error) {
        console.warn(`CORS proxy failed: ${proxyUrl.split('?')[0]}`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue; // Try next proxy
      }
    }

    // All proxies failed
    throw lastError || new Error('All CORS proxies failed');

  } catch (error) {
    console.error('CORS Proxy Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CORS proxy error',
        timestamp: new Date().toISOString(),
        suggestion: 'Try setting FPL_USE_PROXY=true in your environment variables'
      },
      { status: 500 }
    );
  }
}