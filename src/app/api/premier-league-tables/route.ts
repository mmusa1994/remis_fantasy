import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Interface for Premier League player
interface PremierLeaguePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  league_type: string;
  h2h_category: string | null;
  points: number;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaguePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  points: number;
  position: number;
  league_type: string;
  h2h_category: "h2h" | "h2h2" | null;
}

interface LeagueTables {
  premiumLeague: LeaguePlayer[];
  standardLeague: LeaguePlayer[];
  h2hLeague: LeaguePlayer[];
  h2h2League: LeaguePlayer[];
}

// GET - Public endpoint to fetch premier league tables
export async function GET() {
  try {
    // Fetch all players from Premier League table
    const { data: players, error } = await supabase
      .from("premier_league_25_26")
      .select(
        `
        id,
        first_name,
        last_name,
        team_name,
        league_type,
        h2h_category,
        points,
        email,
        phone,
        created_at,
        updated_at
      `
      )
      .is("deleted_at", null)
      .order("points", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch premier league data" },
        { status: 500 }
      );
    }

    // Process players into league tables
    const tables: LeagueTables = {
      premiumLeague: [],
      standardLeague: [],
      h2hLeague: [],
      h2h2League: [],
    };

    players?.forEach((player: PremierLeaguePlayer) => {
      const leaguePlayer: LeaguePlayer = {
        id: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        teamName: player.team_name,
        points: player.points || 0,
        position: 0, // Will be calculated after sorting
        league_type: player.league_type,
        h2h_category: player.h2h_category as "h2h" | "h2h2" | null,
      };

      // Categorize players based on league type and H2H category
      if (player.league_type === "premium" && !player.h2h_category) {
        tables.premiumLeague.push(leaguePlayer);
      } else if (player.league_type === "standard" && !player.h2h_category) {
        tables.standardLeague.push(leaguePlayer);
      } else if (player.h2h_category === "h2h") {
        tables.h2hLeague.push(leaguePlayer);
      } else if (player.h2h_category === "h2h2") {
        tables.h2h2League.push(leaguePlayer);
      }
    });

    // Sort each league by points and assign positions
    Object.keys(tables).forEach((leagueKey) => {
      const league = tables[leagueKey as keyof LeagueTables];
      league.sort((a, b) => b.points - a.points);
      league.forEach((player, index) => {
        player.position = index + 1;
      });
    });

    return NextResponse.json({
      tables,
      totalPlayers: players?.length || 0,
      lastUpdated: new Date().toISOString(),
      source: "premier_league_25_26",
    });
  } catch (error) {
    console.error("Error fetching premier league tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
