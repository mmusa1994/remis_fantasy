import { NextRequest, NextResponse } from "next/server";
import { plDataLoader } from "@/lib/pl-dataset-loader";

export async function GET() {
  try {
    // Test basic functionality
    const [topScorers, sampleClub] = await Promise.all([
      plDataLoader.getTopPerformers('goals', 3),
      plDataLoader.getHistoricalClubPerformance('Arsenal')
    ]);

    const testPlayer = await plDataLoader.getPlayerByName('Salah');

    return NextResponse.json({
      status: "PL Dataset Integration Working",
      tests: {
        topScorers: {
          count: topScorers.length,
          players: topScorers.map(p => ({ name: p.player_name, goals: p.goals }))
        },
        historicalData: {
          club: "Arsenal",
          seasonsAvailable: sampleClub.length,
          latestSeason: sampleClub[sampleClub.length - 1]?.season || 'N/A'
        },
        playerSearch: {
          found: !!testPlayer.stats,
          player: testPlayer.stats ? testPlayer.stats.player_name : 'Not found',
          club: testPlayer.info ? testPlayer.info.player_club : 'N/A'
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "Error",
      error: error.message
    }, { status: 500 });
  }
}