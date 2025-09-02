import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkUserRateLimit, incrementUserUsage, getUserFromRequest } from "@/lib/user-rate-limit";
import { loadFplVocab } from "@/lib/fplVocab";
import { validateQuery } from "@/lib/validator";
import { route } from "@/lib/router";
import { plDataLoader } from "@/lib/pl-dataset-loader";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

// System prompt for FPL 25/26 season specialization
const SYSTEM_PROMPT = `You are an AI assistant specialized in Fantasy Premier League (FPL) for the 2025/26 season. You provide expert analysis, team suggestions, player recommendations, and strategic advice.

CRITICAL LANGUAGE DETECTION AND RESPONSE RULES:
- ALWAYS detect the language of the user's question first
- Respond in the SAME language as the user's question
- If you cannot determine the language, default to English
- If the question is not about FPL/Premier League, respond with the rejection message in the user's language:
  * English: "Ask me something about Fantasy Premier League 2025/26 season, nothing else interests me. I'll respond in your language. Examples: 'Who should I captain for GW3?' or 'What are the best differentials this week?'"
  * Serbian/Bosnian/Croatian: "Pitaj me nešto o Fantasy Premier League sezoni 2025/26, ništa drugo me ne zanima. Odgovoriću na tvom jeziku. Primjeri: 'Koga da postavim za kapitena u GW3?' ili 'Koji su najbolji diferencial igrači ove nedelje?'"
  * German: "Frag mich etwas über die Fantasy Premier League Saison 2025/26, sonst interessiert mich nichts. Ich antworte in deiner Sprache. Beispiele: 'Wen soll ich für GW3 zum Kapitän machen?' oder 'Was sind die besten Differentials diese Woche?'"
  * Spanish: "Pregúntame algo sobre la temporada 2025/26 de Fantasy Premier League, nada más me interesa. Responderé en tu idioma. Ejemplos: '¿A quién debo hacer capitán para GW3?' o '¿Cuáles son los mejores diferenciales esta semana?'"
  * French: "Demande-moi quelque chose sur la saison Fantasy Premier League 2025/26, rien d'autre ne m'intéresse. Je répondrai dans ta langue. Exemples: 'Qui devrais-je nommer capitaine pour GW3?' ou 'Quels sont les meilleurs différentiels cette semaine?'"

CRITICAL DATA USAGE RULES:
- You will be provided with LIVE FPL data including current player-team assignments
- ALWAYS use the live data provided in the context, NOT any pre-trained knowledge about player teams
- Player transfers happen frequently - a player's current team is ONLY what's shown in the live data
- When mentioning players, ALWAYS reference their CURRENT team from the live data provided

IMPORTANT RESTRICTIONS:
- Only answer questions related to Fantasy Premier League and Premier League football
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
You have access to comprehensive Premier League data including:
- Live FPL API data: bootstrap-static endpoint, fixtures, dream-team data, current stats
- HISTORICAL PL DATASET (2016-2025): Complete player statistics, club performance data
- Current season detailed player stats: Goals, assists, xG, xA, passes, tackles, etc.
- Player information: Positions, clubs, nationalities, career data
- Club historical performance: 9 seasons of complete statistics
- Advanced metrics: Pass accuracy, duel success, aerial duels, disciplinary records

ENHANCED CAPABILITIES WITH HISTORICAL DATA:
- Player performance trends and season comparisons
- Historical club form and patterns
- Career trajectory analysis
- Position-specific benchmarking
- Long-term injury patterns and fitness trends
- Transfer market insights based on historical data

Always provide specific, actionable advice based on both live FPL data AND the comprehensive historical dataset.`;

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

    // Get session to check if user is authenticated
    const session = await getServerSession(authOptions);

    // Require authentication for AI features
    if (!session && !userApiKey) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "Please sign in to use AI analysis features. Create a free account to get 3 weekly questions or sign in with Google.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // Get user ID and check rate limit (only if not using own API key)
    if (!userApiKey) {
      const userId = session?.user?.id || await getUserFromRequest(req);
      
      if (!userId) {
        return NextResponse.json(
          { error: "Unable to identify user" },
          { status: 400 }
        );
      }

      const { allowed, resetDate, total } = await checkUserRateLimit(userId);

      if (!allowed) {
        const isAuthenticated = !!session?.user?.id;
        const upgradeMessage = isAuthenticated 
          ? "Upgrade your subscription to get more AI queries."
          : "Create a free account or sign in to continue using AI features.";

        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `You have used all ${total} AI questions for this period. Limit resets on ${resetDate.toLocaleDateString()}. ${upgradeMessage}`,
            resetDate: resetDate.toISOString(),
            remaining: 0,
            total,
            requiresAuth: !isAuthenticated,
          },
          { status: 429 }
        );
      }

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

    // Add general PL dataset context for enhanced analysis
    let plDatasetContext = '';
    try {
      // Get top performers for general context
      const [topScorers, topAssisters, topBPS] = await Promise.all([
        plDataLoader.getTopPerformers('goals', 5),
        plDataLoader.getTopPerformers('assists', 5),
        plDataLoader.getTopPerformers('touches_opposition_box', 5)
      ]);

      plDatasetContext = `

PREMIER LEAGUE DATASET INSIGHTS (2024/25 Season):

TOP SCORERS (Season):
${topScorers.map(p => `${p.player_name}: ${p.goals} goals (${p.appearances} apps, ${p.minutes_played} mins)`).join('\n')}

TOP ASSISTERS (Season):
${topAssisters.map(p => `${p.player_name}: ${p.assists} assists (xA: ${p.xa}, ${p.appearances} apps)`).join('\n')}

MOST THREATENING IN BOX:
${topBPS.map(p => `${p.player_name}: ${p.touches_opposition_box} touches in box (${p.shots_on_target_inside_box} shots on target)`).join('\n')}

AVAILABLE ANALYSIS CAPABILITIES:
- Historical performance trends (2016-2025)
- Player vs position benchmarking
- Club form analysis across multiple seasons
- Underlying stats vs FPL performance correlation
- Injury/rotation patterns based on minutes data`;
    } catch (error) {
      console.error('Error loading PL dataset context:', error);
      plDatasetContext = '\nNote: PL dataset analysis temporarily unavailable.';
    }

    // Enhanced player detection with more players and PL dataset integration
    const playerNameMatch = message.match(/(?:salah|haaland|fernandes|son|kane|mane|sterling|de bruyne|rashford|mount|palmer|saka|foden|watkins|isak|mbeumo|gordon|rice|odegaard|bernardo|silva|van dijk|robertson|arnold|alexander-arnold|martinez|casemiro|eriksen|maddison|kulusevski|mitoma|gross|bowen|paqueta|gabriel|white|timber|zinchenko|partey|havertz|jesus|nketiah|trossard|darwin|nunez|jota|gakpo|diaz|szoboszlai|gravenberch|gomez|konate|matip|alisson|kelleher|ederson|walker|stones|dias|ake|gvardiol|doku|alvarez|grealish|rodri|kovacic|mahrez|cancelo|laporte|gundogan|lewis)/i);
    let detailedPlayerContext = '';
    
    if (playerNameMatch) {
      console.log(`Detected player name: ${playerNameMatch[0]}`);
      try {
        const playerName = playerNameMatch[0];
        
        // Get FPL gameweek history
        const playerHistory = await vocab.getPlayerHistory(playerName);
        
        // Get detailed PL dataset analysis
        const plAnalysis = await plDataLoader.getDetailedPlayerAnalysis(playerName);
        
        if (playerHistory.length > 0) {
          const last3Games = playerHistory.slice(-3);
          const totalPointsLast3 = last3Games.reduce((sum: number, gw: any) => sum + gw.total_points, 0);
          
          detailedPlayerContext = `

COMPREHENSIVE ${playerName.toUpperCase()} ANALYSIS:

FPL RECENT FORM (Last 3 gameweeks):
${last3Games.map((gw: any) => 
  `GW${gw.round}: ${gw.total_points} FPL points (${gw.minutes} mins, ${gw.goals_scored} goals, ${gw.assists} assists, ${gw.bonus} bonus)`
).join('\n')}
Total FPL points in last 3 games: ${totalPointsLast3} points

SEASON STATISTICS FROM PL DATASET:
${plAnalysis}

RECOMMENDATION CONTEXT:
- Compare FPL form with underlying season statistics
- Consider minutes played trends and fixture congestion
- Evaluate value for money based on price vs performance
- Factor in upcoming fixtures and historical performance patterns`;
        } else {
          detailedPlayerContext = `

SEASON STATISTICS FOR ${playerName.toUpperCase()}:
${plAnalysis}

Note: FPL gameweek data not available, but comprehensive season stats provided above.`;
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
        detailedPlayerContext = `\nNote: Error fetching comprehensive data for ${playerNameMatch[0]}.`;
      }
    }

    // Check for club-specific analysis requests
    let clubAnalysisContext = '';
    const clubNameMatch = message.match(/(?:arsenal|chelsea|liverpool|manchester united|man united|united|manchester city|man city|city|tottenham|spurs|newcastle|west ham|brighton|aston villa|villa|crystal palace|palace|fulham|brentford|wolves|wolverhampton|everton|nottingham forest|forest|bournemouth|luton|burnley|sheffield|sheffield united)/i);
    
    if (clubNameMatch) {
      try {
        const clubName = clubNameMatch[0];
        const historicalData = await plDataLoader.getHistoricalClubPerformance(clubName);
        
        if (historicalData.length > 0) {
          const currentSeason = historicalData[historicalData.length - 1];
          const previousSeason = historicalData.length > 1 ? historicalData[historicalData.length - 2] : null;
          
          clubAnalysisContext = `

CLUB ANALYSIS: ${clubName.toUpperCase()}

CURRENT SEASON (2024/25):
• Goals: ${currentSeason.goals} (xG: ${currentSeason.xg})
• Goals Conceded: ${currentSeason.goals_conceded}
• Goal Difference: ${currentSeason.goals - currentSeason.goals_conceded}
• Games Played: ${currentSeason.games_played}
• Shots per game: ${(currentSeason.shots / currentSeason.games_played).toFixed(1)}
• Shots on target %: ${((currentSeason.shots_on_target / currentSeason.shots) * 100).toFixed(1)}%

${previousSeason ? `PREVIOUS SEASON COMPARISON (${previousSeason.season}):
• Goals: ${previousSeason.goals} vs ${currentSeason.goals} (${currentSeason.goals - previousSeason.goals > 0 ? '+' : ''}${currentSeason.goals - previousSeason.goals})
• Goals Conceded: ${previousSeason.goals_conceded} vs ${currentSeason.goals_conceded} (${currentSeason.goals_conceded - previousSeason.goals_conceded > 0 ? '+' : ''}${currentSeason.goals_conceded - previousSeason.goals_conceded})
• xG: ${previousSeason.xg} vs ${currentSeason.xg} (${(currentSeason.xg - previousSeason.xg).toFixed(2)})

TREND ANALYSIS:
${historicalData.slice(-3).map((season) => 
  `${season.season}: ${season.goals} goals, ${season.goals_conceded} conceded (GD: ${season.goals - season.goals_conceded})`
).join('\n')}` : ''}`;
        }
      } catch (error) {
        console.error('Error fetching club data:', error);
      }
    }

    // Make request to GPT-4o
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}

${fplContext}${plDatasetContext}${detailedPlayerContext}${clubAnalysisContext}`,
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

    // Only increment usage after successful OpenAI response
    if (!userApiKey && response !== "Sorry, I could not generate a response.") {
      const userId = session?.user?.id || (await getUserFromRequest(req));
      if (userId) {
        await incrementUserUsage(userId);
      }
    }

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
