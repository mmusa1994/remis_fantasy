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
  h2h_points: number | null;
  h2h_stats: { w: number; d: number; l: number } | null;
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
      freeLeague: [],
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
      if (leagueKey === "h2hLeague" || leagueKey === "h2h2League") {
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

    const {
      playerId,
      points,
      h2h_category,
      firstName,
      lastName,
      teamName,
      league_type,
    } = await request.json();

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

    // For Free Liga players, allow updating name and team
    if (firstName !== undefined) {
      updateData.first_name = firstName;
    }

    if (lastName !== undefined) {
      updateData.last_name = lastName;
    }

    if (teamName !== undefined) {
      updateData.team_name = teamName;
    }

    if (league_type !== undefined) {
      updateData.league_type = league_type;
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
      if (!update.team || !update.manager) {
        return NextResponse.json(
          { error: "Each update must have team and manager fields" },
          { status: 400 }
        );
      }

      // Check if it's a points update, H2H category update, or H2H stats update
      if (
        typeof update.total !== "number" &&
        !update.h2h_category &&
        typeof update.h2h_pts !== "number"
      ) {
        return NextResponse.json(
          {
            error:
              "Each update must have either total (number), h2h_category, or h2h_pts field",
          },
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

      // Try to find player - prioritize team name search for better accuracy
      let players = null;
      let findError = null;

      // First try: find by team name (more reliable)
      const { data: playersByTeam, error: teamError } = await supabase
        .from("premier_league_25_26")
        .select("id, team_name, first_name, last_name")
        .eq("team_name", update.team)
        .is("deleted_at", null)
        .limit(1);

      if (!teamError && playersByTeam && playersByTeam.length > 0) {
        players = playersByTeam;
      } else {
        // Second try: find by manager name (first_name and last_name)
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
          // Third try: find by partial name matching (case insensitive)
          const { data: playersByPartialName, error: partialError } =
            await supabase
              .from("premier_league_25_26")
              .select("id, team_name, first_name, last_name")
              .ilike("first_name", `%${firstName}%`)
              .ilike("last_name", `%${lastName}%`)
              .is("deleted_at", null)
              .limit(1);

          if (
            !partialError &&
            playersByPartialName &&
            playersByPartialName.length > 0
          ) {
            players = playersByPartialName;
          } else {
            findError = partialError || nameError || teamError;
          }
        }
      }

      if (findError || !players || players.length === 0) {
        notFoundPlayers.push(`${update.manager} - ${update.team}`);
        continue;
      }

      // Prepare update data
      const updateData: any = {};

      if (typeof update.total === "number") {
        updateData.points = update.total;
        updateData.last_points_update = new Date().toISOString();
      }

      if (update.h2h_category !== undefined) {
        updateData.h2h_category = update.h2h_category;
      }

      if (typeof update.h2h_pts === "number") {
        updateData.h2h_points = update.h2h_pts;
      }

      if (
        update.w !== undefined &&
        update.d !== undefined &&
        update.l !== undefined
      ) {
        updateData.h2h_stats = {
          w: update.w || 0,
          d: update.d || 0,
          l: update.l || 0,
        };
      }

      // Update player
      const { error: updateError } = await supabase
        .from("premier_league_25_26")
        .update(updateData)
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
