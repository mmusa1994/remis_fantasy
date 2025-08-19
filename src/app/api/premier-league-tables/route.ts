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
  h2h_points: number | null;
  h2h_stats: { w: number; d: number; l: number } | null;
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
  h2h_points: number | null;
  h2h_stats: { w: number; d: number; l: number } | null;
}

interface LeagueTables {
  premiumLeague: LeaguePlayer[];
  standardLeague: LeaguePlayer[];
  h2hLeague: LeaguePlayer[];
  h2h2League: LeaguePlayer[];
  freeLeague: LeaguePlayer[];
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
        updated_at,
        h2h_points,
        h2h_stats
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
      freeLeague: [],
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
        h2h_points: player.h2h_points || null,
        h2h_stats: player.h2h_stats || null,
      };

      // Categorize players based on league type and H2H category
      // Premium and Standard players show in their main leagues regardless of H2H
      if (player.league_type === "premium") {
        tables.premiumLeague.push(leaguePlayer);
      }
      if (player.league_type === "standard") {
        tables.standardLeague.push(leaguePlayer);
      }
      
      // H2H players show in H2H leagues (they can also be premium/standard)
      if (player.h2h_category === "h2h") {
        tables.h2hLeague.push(leaguePlayer);
      }
      if (player.h2h_category === "h2h2") {
        tables.h2h2League.push(leaguePlayer);
      }
      
      // Free league - just one player updated weekly
      if (player.league_type === "free") {
        tables.freeLeague.push(leaguePlayer);
      }
    });

    // Sort each league by points and assign positions
    Object.keys(tables).forEach((leagueKey) => {
      const league = tables[leagueKey as keyof LeagueTables];
      
      // H2H leagues sort by H2H points first, then by overall points
      if (leagueKey === 'h2hLeague' || leagueKey === 'h2h2League') {
        league.sort((a, b) => {
          const aH2HPoints = a.h2h_points || 0;
          const bH2HPoints = b.h2h_points || 0;
          
          // First sort by H2H points
          if (bH2HPoints !== aH2HPoints) {
            return bH2HPoints - aH2HPoints;
          }
          
          // If H2H points are equal, sort by overall points
          return b.points - a.points;
        });
      } else {
        // Regular leagues sort by overall points only
        league.sort((a, b) => b.points - a.points);
      }
      
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
