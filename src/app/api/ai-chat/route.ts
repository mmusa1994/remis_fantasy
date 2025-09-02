import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  checkUserRateLimit,
  incrementUserUsage,
  getUserFromRequest,
} from "@/lib/user-rate-limit";
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
- EXAMPLE CORRECTION: If user says "Xhaka and Crystal Palace vs Sunderland" but data shows Xhaka plays FOR Sunderland, immediately correct this
- Never assume player teams - always verify against the provided player database

RESPONSE STYLE GUIDELINES:
- Write in a natural, conversational tone as if talking to a friend who shares your passion for FPL
- Avoid formal numbered lists or bullet points unless specifically requested
- Use flowing, narrative sentences that connect ideas naturally
- Express opinions with confidence but acknowledge uncertainty when data is limited
- Mix analysis with casual observations and personal insights
- Use phrases like "Looking at", "What's interesting is", "I'd say", "Worth noting", "Honestly", "The way I see it"
- Make responses feel like a knowledgeable friend giving advice over coffee, not a formal report
- Vary sentence structure and length to create natural rhythm
- Include relevant context and reasoning naturally within the flow of conversation

PLAYER DATA ACCESS:
- You have access to ALL 700+ players from bootstrap-static with complete stats
- When user mentions any player name (Hugo Ekitike, Ballard, Xhaka etc.), you will receive EXACT player data if found
- CRITICAL: If player data is provided in context, use ONLY that data - never contradict it
- If no specific player data appears in context, say "I need to check current data for [player name]"
- NEVER guess player teams, stats, or positions - only use provided data
- NEVER use pre-trained knowledge about players - ONLY use live context data
- If user corrects you about a player's team, acknowledge the correction immediately

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
  if (!fplVocabCache || now - vocabCacheTime > VOCAB_CACHE_DURATION) {
    fplVocabCache = await loadFplVocab();
    vocabCacheTime = now;
  }
  return fplVocabCache;
}

export async function POST(req: NextRequest) {
  try {
    const { message, userApiKey, chatHistory = [] } = await req.json();

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
          message:
            "Please sign in to use AI analysis features. Create a free account to get 3 weekly questions or sign in with Google.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // Get user ID and check rate limit (only if not using own API key)
    if (!userApiKey) {
      const userId = session?.user?.id || (await getUserFromRequest(req));

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

    const upcomingFixtures = vocab.nextFixtures
      .slice(0, 6)
      .map((f: any) => {
        const homeTeam = teamMap[f.team_h] || "Team " + f.team_h;
        const awayTeam = teamMap[f.team_a] || "Team " + f.team_a;
        return `GW${f.event}: ${homeTeam} vs ${awayTeam}`;
      })
      .join(", ");

    // Create compact FPL context
    const topPlayersByPoints = vocab.topPlayers.byPoints
      .slice(0, 4)
      .map((p: any) => `${p.name} (${p.team}) - ${p.points} pts`)
      .join(", ");

    const topPlayersByOwnership = vocab.topPlayers.byOwnership
      .slice(0, 4)
      .map((p: any) => `${p.name} (${p.team}) - ${p.ownership}%`)
      .join(", ");

    const differentials = vocab.playerData
      .filter((p: any) => p.selected_by_percent < 10 && p.total_points > 20)
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 5)
      .map(
        (p: any) => `${p.name} (${p.team}) - ${p.selected_by_percent}% owned`
      )
      .join(", ");

    const topFormPlayers = vocab.playerData
      .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 5)
      .map((p: any) => `${p.name} (${p.team}) - ${p.form}`)
      .join(", ");

    const fplContext = `
=== FPL ${vocab.seasonLabel} - GW${vocab.currentGameweek} ===

FIXTURES: ${upcomingFixtures}
TOP POINTS: ${topPlayersByPoints}
MOST OWNED: ${topPlayersByOwnership}
DIFFERENTIALS: ${differentials}
FORM: ${topFormPlayers}

ALL PLAYERS DATABASE: ${vocab.playerData.length} active players available with full stats (points, form, price, ownership, team, position).

Use only current season data. Check player database for any mentioned player. Provide concise, actionable advice.`;

    // Simplified context to save tokens
    const plDatasetContext = "";

    // Enhanced player detection with better matching
    let playerNameMatch = null;
    let matchedPlayerName = "";
    let exactPlayerData = null;

    // First, try to find exact matches in player data
    const messageWords = message.toLowerCase().split(/\s+/);

    for (const player of vocab.playerData) {
      const playerNameLower = player.name.toLowerCase();
      const playerWords = playerNameLower.split(" ");

      // Check if any part of player name appears in message
      for (const playerWord of playerWords) {
        if (playerWord.length > 3) {
          for (const messageWord of messageWords) {
            if (
              messageWord.includes(playerWord) ||
              playerWord.includes(messageWord)
            ) {
              playerNameMatch = [playerWord];
              matchedPlayerName = player.name;
              exactPlayerData = player;
              break;
            }
          }
        }
        if (playerNameMatch) break;
      }
      if (playerNameMatch) break;
    }

    // Fallback to less precise matching
    if (!playerNameMatch) {
      for (const player of vocab.players) {
        const playerWords = player.toLowerCase().split(" ");
        for (const word of playerWords) {
          if (word.length > 3 && message.toLowerCase().includes(word)) {
            playerNameMatch = [word];
            matchedPlayerName = player;
            // Try to find this player in playerData
            exactPlayerData = vocab.playerData.find((p: any) =>
              p.name.toLowerCase().includes(matchedPlayerName.toLowerCase())
            );
            break;
          }
        }
        if (playerNameMatch) break;
      }
    }
    let detailedPlayerContext = "";

    if (playerNameMatch && exactPlayerData) {
      console.log(`Detected player name: ${matchedPlayerName}`);
      try {
        const teamName =
          teamMap[exactPlayerData.team] || `Team ${exactPlayerData.team}`;
        const positionName =
          vocab.positions[exactPlayerData.element_type - 1] ||
          exactPlayerData.element_type;

        detailedPlayerContext = `
PLAYER FOUND: ${exactPlayerData.name.toUpperCase()} 
CURRENT TEAM: ${teamName}
POSITION: ${positionName}
TOTAL POINTS: ${exactPlayerData.total_points}
FORM: ${exactPlayerData.form}
PRICE: £${(exactPlayerData.now_cost / 10).toFixed(1)}m
OWNERSHIP: ${exactPlayerData.selected_by_percent}%
MINUTES: ${exactPlayerData.minutes || 0}
GOALS: ${exactPlayerData.goals_scored || 0}
ASSISTS: ${exactPlayerData.assists || 0}

CRITICAL: Use ONLY this exact data. Do NOT use any pre-trained knowledge about this player's team or stats.`;
      } catch (error) {
        console.error("Error processing player data:", error);
        detailedPlayerContext = `\nError processing data for ${matchedPlayerName}.`;
      }
    } else if (playerNameMatch) {
      detailedPlayerContext = `\nPlayer "${matchedPlayerName}" mentioned but not found in current FPL database. Verify player name or check if active this season.`;
    }

    // Check for club-specific analysis requests
    let clubAnalysisContext = "";
    const clubNameMatch = message.match(
      /(?:arsenal|chelsea|liverpool|manchester united|man united|united|manchester city|man city|city|tottenham|spurs|newcastle|west ham|brighton|aston villa|villa|crystal palace|palace|fulham|brentford|wolves|wolverhampton|everton|nottingham forest|forest|bournemouth|luton|burnley|sheffield|sheffield united)/i
    );

    if (clubNameMatch) {
      try {
        const clubName = clubNameMatch[0];
        const historicalData = await plDataLoader.getHistoricalClubPerformance(
          clubName
        );

        if (historicalData.length > 0) {
          const currentSeason = historicalData[historicalData.length - 1];

          clubAnalysisContext = `
${clubName.toUpperCase()}: ${currentSeason.goals} goals, ${
            currentSeason.goals_conceded
          } conceded (xG: ${currentSeason.xg}).`;
        }
      } catch (error) {
        console.error("Error fetching club data:", error);
      }
    }

    // Prepare optimized chat history (last 4 messages max to save tokens)
    const recentHistory = chatHistory.slice(-4).map((msg: any) => ({
      role: msg.role,
      content:
        msg.content.length > 150
          ? msg.content.substring(0, 150) + "..."
          : msg.content,
    }));

    // Make request to GPT-4o
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}

${fplContext}${plDatasetContext}${detailedPlayerContext}${clubAnalysisContext}`,
        },
        ...recentHistory,
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 400,
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
