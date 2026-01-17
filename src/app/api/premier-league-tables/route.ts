import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// SEPARATE TABLES:
// - premier_league_25_26: Premium, Standard, Free (classic scoring)
// - h2h_league_25_26: H2H, H2H2 (head-to-head scoring)

// Interface for classic Premier League player
interface PremierLeaguePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  league_type: string;
  points: number;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Interface for H2H League player
interface H2HLeaguePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  h2h_category: "h2h" | "h2h2";
  h2h_points: number;
  h2h_stats: { w: number; d: number; l: number } | null;
  points_for: number;
  email: string | null;
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

// GET - Public endpoint to fetch premier league tables from SEPARATE tables
export async function GET() {
  try {
    // Fetch classic leagues from premier_league_25_26
    const { data: classicPlayers, error: classicError } = await supabase
      .from("premier_league_25_26")
      .select(
        `
        id,
        first_name,
        last_name,
        team_name,
        league_type,
        points,
        email,
        phone,
        created_at,
        updated_at
      `
      )
      .is("deleted_at", null)
      .order("points", { ascending: false });

    if (classicError) {
      console.error("Supabase error (classic):", classicError);
      return NextResponse.json(
        { error: "Failed to fetch classic league data" },
        { status: 500 }
      );
    }

    // Fetch H2H leagues from h2h_league_25_26
    const { data: h2hPlayers, error: h2hError } = await supabase
      .from("h2h_league_25_26")
      .select(
        `
        id,
        first_name,
        last_name,
        team_name,
        h2h_category,
        h2h_points,
        h2h_stats,
        points_for,
        email,
        phone,
        created_at,
        updated_at
      `
      )
      .is("deleted_at", null)
      .order("h2h_points", { ascending: false });

    if (h2hError) {
      console.error("Supabase error (h2h):", h2hError);
      return NextResponse.json(
        { error: "Failed to fetch H2H league data" },
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

    // Process classic league players (premium, standard, free)
    classicPlayers?.forEach((player: PremierLeaguePlayer) => {
      const leaguePlayer: LeaguePlayer = {
        id: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        teamName: player.team_name,
        points: player.points || 0,
        position: 0,
        league_type: player.league_type,
        h2h_category: null,
        h2h_points: null,
        h2h_stats: null,
      };

      if (player.league_type === "premium") {
        tables.premiumLeague.push(leaguePlayer);
      } else if (player.league_type === "standard") {
        tables.standardLeague.push(leaguePlayer);
      } else if (player.league_type === "free") {
        tables.freeLeague.push(leaguePlayer);
      }
    });

    // Process H2H players (h2h, h2h2)
    h2hPlayers?.forEach((player: H2HLeaguePlayer) => {
      const leaguePlayer: LeaguePlayer = {
        id: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        teamName: player.team_name,
        points: player.points_for || 0,
        position: 0,
        league_type: "h2h",
        h2h_category: player.h2h_category,
        h2h_points: player.h2h_points || 0,
        h2h_stats: player.h2h_stats || null,
      };

      if (player.h2h_category === "h2h") {
        tables.h2hLeague.push(leaguePlayer);
      } else if (player.h2h_category === "h2h2") {
        tables.h2h2League.push(leaguePlayer);
      }
    });

    // Sort each league and assign positions
    // Classic leagues: sort by points DESC
    ["premiumLeague", "standardLeague", "freeLeague"].forEach((leagueKey) => {
      const league = tables[leagueKey as keyof LeagueTables];
      league.sort((a, b) => b.points - a.points);
      league.forEach((player, index) => {
        player.position = index + 1;
      });
    });

    // H2H leagues: sort by h2h_points DESC, then by points_for DESC
    ["h2hLeague", "h2h2League"].forEach((leagueKey) => {
      const league = tables[leagueKey as keyof LeagueTables];
      league.sort((a, b) => {
        const aH2HPoints = a.h2h_points || 0;
        const bH2HPoints = b.h2h_points || 0;

        if (bH2HPoints !== aH2HPoints) {
          return bH2HPoints - aH2HPoints;
        }
        return b.points - a.points;
      });
      league.forEach((player, index) => {
        player.position = index + 1;
      });
    });

    const totalPlayers =
      (classicPlayers?.length || 0) + (h2hPlayers?.length || 0);

    return NextResponse.json({
      tables,
      totalPlayers,
      lastUpdated: new Date().toISOString(),
      source: "separate_tables",
    });
  } catch (error) {
    console.error("Error fetching premier league tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
