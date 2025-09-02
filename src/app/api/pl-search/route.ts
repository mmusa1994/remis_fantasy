import { NextRequest, NextResponse } from "next/server";
import { plDataLoader } from "@/lib/pl-dataset-loader";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'player';
    const position = searchParams.get('position') || undefined;
    const club = searchParams.get('club') || undefined;
    const minGoals = searchParams.get('minGoals') ? parseInt(searchParams.get('minGoals')!) : undefined;
    const minAssists = searchParams.get('minAssists') ? parseInt(searchParams.get('minAssists')!) : undefined;
    const minAppearances = searchParams.get('minAppearances') ? parseInt(searchParams.get('minAppearances')!) : undefined;

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    switch (type) {
      case 'player':
        const players = await plDataLoader.searchPlayers(query, {
          position,
          club,
          minGoals,
          minAssists,
          minAppearances
        });
        return NextResponse.json({ players });

      case 'club':
        const historicalData = await plDataLoader.getHistoricalClubPerformance(query);
        return NextResponse.json({ clubHistory: historicalData });

      case 'top':
        const stat = searchParams.get('stat') || 'goals';
        const limit = parseInt(searchParams.get('limit') || '10');
        const topPerformers = await plDataLoader.getTopPerformers(stat as any, limit);
        return NextResponse.json({ topPerformers });

      case 'analysis':
        const analysis = await plDataLoader.getDetailedPlayerAnalysis(query);
        return NextResponse.json({ analysis });

      case 'club-players':
        const clubPlayers = await plDataLoader.getPlayersByClub(query);
        return NextResponse.json({ players: clubPlayers });

      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("PL Search API error:", error);
    return NextResponse.json(
      { error: "Failed to process search request" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, players } = body;

    if (action === 'compare' && Array.isArray(players) && players.length >= 2) {
      const comparisons = [];
      
      for (const playerName of players.slice(0, 3)) { // Limit to 3 players
        const { stats, info } = await plDataLoader.getPlayerByName(playerName);
        if (stats && info) {
          comparisons.push({
            name: info.player_name,
            club: info.player_club,
            position: info.player_position,
            stats: {
              appearances: stats.appearances,
              minutes: stats.minutes_played,
              goals: stats.goals,
              assists: stats.assists,
              xg: stats.xg,
              xa: stats.xa,
              passes: stats.passes,
              pass_accuracy: stats.pass_accuracy,
              tackles: stats.total_tackles,
              interceptions: stats.interceptions,
              duels_won: stats.duels_won,
              yellow_cards: stats.yellow_cards,
              red_cards: stats.red_cards
            }
          });
        }
      }

      return NextResponse.json({ comparison: comparisons });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("PL Search POST API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}