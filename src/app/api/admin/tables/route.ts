import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

// SEPARATE TABLES:
// - premier_league_25_26 / premier_league_26_27: Premium, Standard, Free (classic scoring)
// - h2h_league_25_26 / h2h_league_26_27: H2H, H2H2 (head-to-head scoring)

type Season = "25_26" | "26_27";

const TABLE_MAP: Record<Season, { classic: string; h2h: string }> = {
  "25_26": { classic: "premier_league_25_26", h2h: "h2h_league_25_26" },
  "26_27": { classic: "premier_league_26_27", h2h: "h2h_league_26_27" },
};

// Interface for classic Premier League player
interface PremierLeaguePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  league_type: string;
  points: number;
  position: number | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_points_update: string | null;
  admin_notes: string | null;
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
  deleted_at: string | null;
  last_points_update: string | null;
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

// GET - Fetch premier league tables from SEPARATE tables
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const season = (searchParams.get("season") || "25_26") as Season;
    const tables_map = TABLE_MAP[season] || TABLE_MAP["25_26"];

    // Fetch classic leagues
    const { data: classicPlayers, error: classicError } = await supabaseServer
      .from(tables_map.classic)
      .select("*")
      .is("deleted_at", null)
      .order("points", { ascending: false });

    if (classicError) {
      console.error("Supabase error (classic):", classicError);
      return NextResponse.json(
        { error: "Failed to fetch classic league data" },
        { status: 500 }
      );
    }

    // Fetch H2H leagues
    const { data: h2hPlayers, error: h2hError } = await supabaseServer
      .from(tables_map.h2h)
      .select("*")
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
        email: player.email,
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
        email: player.email || "",
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
    console.error("Error fetching league tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update player points (determines table based on h2h_category)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      playerId,
      points,
      h2h_category,
      h2h_points,
      h2h_stats,
      firstName,
      lastName,
      teamName,
      league_type,
      isH2HTable = false, // Flag to indicate which table to update
      season = "25_26",
    } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Determine which table to update
    const tables_map = TABLE_MAP[season as Season] || TABLE_MAP["25_26"];
    const tableName = isH2HTable ? tables_map.h2h : tables_map.classic;

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (isH2HTable) {
      // H2H table updates
      if (typeof h2h_points === "number") {
        updateData.h2h_points = h2h_points;
        updateData.last_points_update = new Date().toISOString();
      }
      if (typeof points === "number") {
        updateData.points_for = points;
      }
      if (h2h_stats) {
        updateData.h2h_stats = h2h_stats;
      }
      if (h2h_category) {
        updateData.h2h_category = h2h_category;
      }
    } else {
      // Classic table updates
      if (typeof points === "number") {
        updateData.points = points;
        updateData.last_points_update = new Date().toISOString();
      }
      if (league_type) {
        updateData.league_type = league_type;
      }
    }

    // Common fields
    if (firstName !== undefined) {
      updateData.first_name = firstName;
    }
    if (lastName !== undefined) {
      updateData.last_name = lastName;
    }
    if (teamName !== undefined) {
      updateData.team_name = teamName;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Update player
    const { data, error } = await supabaseServer
      .from(tableName)
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
      table: tableName,
    });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Create a new player (Free League)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, teamName, points, league_type, season = "25_26" } = await request.json();

    if (!firstName || !lastName || !teamName) {
      return NextResponse.json(
        { error: "firstName, lastName, and teamName are required" },
        { status: 400 }
      );
    }

    const tables_map = TABLE_MAP[season as Season] || TABLE_MAP["25_26"];

    const { data, error } = await supabaseServer
      .from(tables_map.classic)
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        team_name: teamName.trim(),
        points: points || 0,
        league_type: league_type || "free",
        email: "",
        position: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating player:", error);
      return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
    }

    return NextResponse.json({ message: "Player created", player: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Bulk update multiple players at once
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates, isH2HTable = false, season = "25_26" } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    const tables_map = TABLE_MAP[season as Season] || TABLE_MAP["25_26"];
    const tableName = isH2HTable ? tables_map.h2h : tables_map.classic;

    let updatedCount = 0;
    const notFoundPlayers: string[] = [];

    for (const update of updates) {
      if (!update.team || !update.manager) {
        continue;
      }

      // Parse manager name
      const managerParts = update.manager.trim().split(" ");
      const firstName = managerParts[0];
      const lastName = managerParts.slice(1).join(" ");

      // Find player by team name first
      let players = null;

      const { data: playersByTeam } = await supabaseServer
        .from(tableName)
        .select("id, team_name, first_name, last_name")
        .eq("team_name", update.team)
        .is("deleted_at", null)
        .limit(1);

      if (playersByTeam && playersByTeam.length > 0) {
        players = playersByTeam;
      } else {
        // Try by name
        const { data: playersByName } = await supabaseServer
          .from(tableName)
          .select("id, team_name, first_name, last_name")
          .eq("first_name", firstName)
          .eq("last_name", lastName)
          .is("deleted_at", null)
          .limit(1);

        players = playersByName;
      }

      if (!players || players.length === 0) {
        notFoundPlayers.push(`${update.manager} - ${update.team}`);
        continue;
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};

      if (isH2HTable) {
        if (typeof update.h2h_pts === "number") {
          updateData.h2h_points = update.h2h_pts;
        }
        if (typeof update.total === "number") {
          updateData.points_for = update.total;
        }
        if (update.w !== undefined && update.d !== undefined && update.l !== undefined) {
          updateData.h2h_stats = { w: update.w, d: update.d, l: update.l };
        }
        if (update.h2h_category) {
          updateData.h2h_category = update.h2h_category;
        }
      } else {
        if (typeof update.total === "number") {
          updateData.points = update.total;
        }
      }

      updateData.last_points_update = new Date().toISOString();

      const { error: updateError } = await supabaseServer
        .from(tableName)
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
      table: tableName,
    });
  } catch (error) {
    console.error("Error during bulk update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
