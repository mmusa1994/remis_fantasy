import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabase } from "@/lib/supabase";

// Interface for clean Premier League player
interface PremierLeaguePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  league_type: string;
  h2h_category: string | null;
  points: number;
  position: number | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  migrated_from_registration_id: string | null;
  last_points_update: string | null;
  admin_notes: string | null;
}

interface LeaguePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  email: string;
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

// GET - Fetch premier league tables from clean table
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all players from clean Premier League table
    const { data: players, error } = await supabase
      .from("premier_league_25_26")
      .select("*")
      .is("deleted_at", null)
      .order("points", { ascending: false }); // Order by points descending instead of position

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
        email: player.email,
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
      source: "clean_table",
    });
  } catch (error) {
    console.error("Error fetching clean premier league tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update player points in clean table
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { playerId, points, h2h_category } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (typeof points === "number") {
      updateData.points = points;
      updateData.last_points_update = new Date().toISOString();
    }

    if (h2h_category !== undefined) {
      updateData.h2h_category = h2h_category;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Update player in clean table
    const { data, error } = await supabase
      .from("premier_league_25_26")
      .update(updateData)
      .eq("id", playerId)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update player" },
        { status: 500 }
      );
    }

    // Update positions if points were changed - temporarily disable until function is created
    if (typeof points === "number") {
      // TODO: Implement position update after database functions are created
      console.log("Position update needed for player:", playerId);
    }

    return NextResponse.json({
      message: "Player updated successfully",
      player: data?.[0],
    });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update multiple players at once
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Validate update structure
    for (const update of updates) {
      if (!update.team || !update.manager || typeof update.total !== "number") {
        return NextResponse.json(
          { error: "Each update must have team, manager, and total fields" },
          { status: 400 }
        );
      }
    }

    let updatedCount = 0;
    const notFoundPlayers: string[] = [];

    // Process each update
    for (const update of updates) {
      // Parse manager name
      const managerParts = update.manager.trim().split(" ");
      const firstName = managerParts[0];
      const lastName = managerParts.slice(1).join(" "); // Handle multiple last names

      // Try to find player by manager name first, then by team name
      let players = null;
      let findError = null;

      // First try: find by first_name and last_name
      const { data: playersByName, error: nameError } = await supabase
        .from("premier_league_25_26")
        .select("id, team_name, first_name, last_name")
        .eq("first_name", firstName)
        .eq("last_name", lastName)
        .is("deleted_at", null)
        .limit(1);

      if (!nameError && playersByName && playersByName.length > 0) {
        players = playersByName;
      } else {
        // Second try: find by team name
        const { data: playersByTeam, error: teamError } = await supabase
          .from("premier_league_25_26")
          .select("id, team_name, first_name, last_name")
          .eq("team_name", update.team)
          .is("deleted_at", null)
          .limit(1);

        if (!teamError && playersByTeam && playersByTeam.length > 0) {
          players = playersByTeam;
        } else {
          findError = teamError || nameError;
        }
      }

      if (findError || !players || players.length === 0) {
        notFoundPlayers.push(`${update.manager} - ${update.team}`);
        continue;
      }

      // Update player points
      const { error: updateError } = await supabase
        .from("premier_league_25_26")
        .update({
          points: update.total,
          last_points_update: new Date().toISOString(),
        })
        .eq("id", players[0].id);

      if (updateError) {
        console.error(`Error updating ${update.team}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Bulk update completed`,
      updatedCount,
      totalUpdates: updates.length,
      notFound: notFoundPlayers.length > 0 ? notFoundPlayers : undefined,
    });
  } catch (error) {
    console.error("Error during bulk update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Migrate data from registration table to clean table
export async function PUT() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Manual migration since stored function might not exist
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from("premier_league_25_26")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (deleteError) {
      console.error("Delete error:", deleteError);
    }

    // Fetch data from registration table
    const { data: registrations, error: fetchError } = await supabase
      .from("registration_25_26")
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
      .in("league_type", ["premium", "standard"])
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .not("team_name", "is", null)
      .not("email", "is", null);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch registration data" },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        message: "No data to migrate",
        migratedRecords: 0,
      });
    }

    // Insert data into premier league table
    const { data: insertedData, error: insertError } = await supabase
      .from("premier_league_25_26")
      .insert(
        registrations.map((reg) => ({
          first_name: reg.first_name,
          last_name: reg.last_name,
          team_name: reg.team_name,
          league_type: reg.league_type,
          h2h_category: reg.h2h_category,
          points: reg.points || 0,
          email: reg.email,
          phone: reg.phone,
          migrated_from_registration_id: reg.id,
          created_at: reg.created_at,
          updated_at: reg.updated_at || new Date().toISOString(),
        }))
      );

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to insert data into premier league table" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      migratedRecords: registrations.length,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
