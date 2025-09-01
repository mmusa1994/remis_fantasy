import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, incrementUsage, getUserId } from "@/lib/ai-rate-limit";
import { loadFplVocab } from "@/lib/fplVocab";
import { validateQuery } from "@/lib/validator";
import { route } from "@/lib/router";

// System prompt for FPL 25/26 season specialization
const SYSTEM_PROMPT = `You are an AI assistant specialized in Fantasy Premier League (FPL) for the 2025/26 season. You provide expert analysis, team suggestions, player recommendations, and strategic advice.

CRITICAL DATA USAGE RULES:
- You will be provided with LIVE FPL data including current player-team assignments
- ALWAYS use the live data provided in the context, NOT any pre-trained knowledge about player teams
- Player transfers happen frequently - a player's current team is ONLY what's shown in the live data
- When mentioning players, ALWAYS reference their CURRENT team from the live data provided

IMPORTANT RESTRICTIONS:
- Only answer questions related to Fantasy Premier League and Premier League football
- If a question is not about FPL or Premier League, respond with: "I can only help with Fantasy Premier League and Premier League 2025/26 season questions. Please ask about FPL teams, players, transfers, or strategies."
- Focus on the current 2025/26 season data and information
- Provide actionable advice for FPL managers
- Consider current form, fixtures, injuries, and price changes
- Help with team selection, captaincy choices, and transfer decisions

Areas you can help with:
- Player analysis and recommendations
- Team selection strategies  
- Captaincy advice
- Transfer planning
- Fixture analysis
- Budget management
- Chip strategies (Wildcard, Bench Boost, Triple Captain, Free Hit)
- Current season performance analysis
- Price change predictions
- Differential picks
- Clean sheet predictions
- Goal/assist predictions

DATA SOURCES YOU HAVE ACCESS TO:
You have access to live FPL API data including:
- bootstrap-static endpoint: All current players, teams, events, game settings
- fixtures endpoint: All upcoming Premier League fixtures
- dream-team data: Best performing players each gameweek
- Live player statistics: Points, ownership, form, prices, ICT index
- Current team assignments: Up-to-date player-team mappings

Always provide specific, actionable advice based on the live FPL API data provided in your context.`;

// Cache for FPL vocab to avoid reloading
let fplVocabCache: any = null;
let vocabCacheTime = 0;
const VOCAB_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getCachedVocab() {
  const now = Date.now();
  if (!fplVocabCache || (now - vocabCacheTime) > VOCAB_CACHE_DURATION) {
    fplVocabCache = await loadFplVocab();
    vocabCacheTime = now;
  }
  return fplVocabCache;
}

export async function POST(req: NextRequest) {
  try {
    const { message, userApiKey } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user ID and check rate limit (only if not using own API key)
    if (!userApiKey) {
      const userId = getUserId(req);
      const { allowed, resetDate } = await checkRateLimit(userId);

      if (!allowed) {
        return NextResponse.json(
          {
            error: "Weekly limit exceeded",
            message: `You have used all 3 free questions this week. Limit resets on ${resetDate.toLocaleDateString()}. You can use your own OpenAI API key to continue asking questions.`,
            resetDate: resetDate.toISOString(),
            remaining: 0,
          },
          { status: 429 }
        );
      }

      // Increment usage for this request
      await incrementUsage(userId);
    }

    // Validate using new implementation
    const vocab = await getCachedVocab();
    const validation = await validateQuery(message, vocab);
    const routing = route(validation);
    
    if (routing.action === "clarify") {
      return NextResponse.json({
        response: routing.message,
      });
    }

    // Use user's API key if provided, otherwise use system key
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create OpenAI client with appropriate API key
    const client = new OpenAI({
      apiKey: apiKey,
    });

    // Enhanced FPL context with live data
    const teamMap: { [key: number]: string } = {};
    vocab.teams.forEach((team: string, index: number) => {
      teamMap[index + 1] = team;
    });

    const upcomingFixtures = vocab.nextFixtures.slice(0, 15).map((f: any) => {
      const homeTeam = teamMap[f.team_h] || 'Team ' + f.team_h;
      const awayTeam = teamMap[f.team_a] || 'Team ' + f.team_a;
      return `GW${f.event}: ${homeTeam} vs ${awayTeam}`;
    }).join(", ");

    // Create comprehensive FPL context with all live data
    const topPlayersByPoints = vocab.topPlayers.byPoints
      .slice(0, 8)
      .map((p: any) => `${p.name} (${p.team}) - ${p.points} pts`)
      .join(", ");

    const topPlayersByOwnership = vocab.topPlayers.byOwnership
      .slice(0, 8)  
      .map((p: any) => `${p.name} (${p.team}) - ${p.ownership}%`)
      .join(", ");

    const mostExpensivePlayers = vocab.topPlayers.byPrice
      .slice(0, 8)
      .map((p: any) => `${p.name} (${p.team}) - £${p.price}m`)
      .join(", ");

    // Sample differential picks (low ownership players)
    const differentials = vocab.playerData
      .filter((p: any) => p.selected_by_percent < 10 && p.total_points > 20)
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 10)
      .map((p: any) => `${p.name} (${p.team}) - ${p.selected_by_percent}% owned, ${p.total_points} pts`)
      .join(", ");

    // Top form players (last 5 gameweeks)
    const topFormPlayers = vocab.playerData
      .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 10)
      .map((p: any) => `${p.name} (${p.team}) - Form: ${p.form}`)
      .join(", ");

    const fplContext = `
=== LIVE FPL DATA FOR ${vocab.seasonLabel} SEASON ===

SEASON STATUS:
- Current Gameweek: ${vocab.currentGameweek}
- Total Teams: ${vocab.teams.length} 
- Active Players: ${vocab.players.length}
- Positions: ${vocab.positions.join(", ")}

UPCOMING FIXTURES (Next 3 gameweeks):
${upcomingFixtures}

TOP PERFORMERS THIS SEASON:
Highest Points: ${topPlayersByPoints}
Most Owned: ${topPlayersByOwnership}  
Most Expensive: ${mostExpensivePlayers}

DIFFERENTIAL PICKS (Low ownership, good points):
${differentials}

BEST CURRENT FORM (Last 5 GWs):
${topFormPlayers}

=== CRITICAL INSTRUCTIONS ===
1. Use ONLY this live ${vocab.seasonLabel} season data
2. Player teams are current as of today - ignore any pre-trained knowledge
3. Base recommendations on actual upcoming fixtures shown above
4. Consider form, ownership, and price when suggesting players
5. All player statistics are from the actual ongoing season
6. For detailed player analysis, I can access specific gameweek-by-gameweek data for any player

AVAILABLE API ENDPOINTS:
- Player detailed history: Can fetch individual gameweek points for any player
- Live gameweek data: Current season performance statistics
- Fixtures data: Upcoming matches for all teams
- Ownership data: Real-time player ownership percentages

This is real-time FPL API data - provide specific, actionable advice based on these live stats and fixtures.`;

    // Check if user is asking for specific player data
    const playerNameMatch = message.match(/(?:salah|haaland|fernandes|son|kane|mane|sterling|de bruyne|rashford|mount|palmer|saka|foden|watkins|isak|mbeumo|gordon)/i);
    let detailedPlayerContext = '';
    
    if (playerNameMatch) {
      console.log(`Detected player name: ${playerNameMatch[0]}`);
      try {
        const playerName = playerNameMatch[0];
        const playerHistory = await vocab.getPlayerHistory(playerName);
        console.log(`Player history length: ${playerHistory.length}`);
        
        if (playerHistory.length > 0) {
          const last3Games = playerHistory.slice(-3);
          console.log(`Last 3 games data:`, last3Games);
          detailedPlayerContext = `

DETAILED ${playerName.toUpperCase()} DATA (Last 3 gameweeks):
${last3Games.map((gw: any) => 
  `GW${gw.round}: ${gw.total_points} points (${gw.minutes} mins, ${gw.goals_scored} goals, ${gw.assists} assists, ${gw.bonus} bonus)`
).join('\n')}

Total points in last 3 games: ${last3Games.reduce((sum: number, gw: any) => sum + gw.total_points, 0)} points`;
        } else {
          detailedPlayerContext = `\nNote: Could not find detailed gameweek data for ${playerName}.`;
        }
      } catch (error) {
        console.error('Error fetching player history:', error);
        detailedPlayerContext = `\nNote: Error fetching data for ${playerNameMatch[0]}.`;
      }
    }

    // Make request to GPT-4o
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}

${fplContext}${detailedPlayerContext}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // Handle specific OpenAI errors
    if (error.status === 429) {
      if (error.code === "insufficient_quota") {
        return NextResponse.json({
          response:
            "I apologize, but the AI service is temporarily unavailable due to quota limits. Please try again later or use your own OpenAI API key for unlimited access. \n\nFor now, here are some general FPL tips:\n• Focus on form over fixtures for captaincy\n• Look for players with good underlying stats (shots, key passes)\n• Consider differential picks with <10% ownership\n• Save transfers unless urgent (injuries/suspensions)",
        });
      }
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your OpenAI API key." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
