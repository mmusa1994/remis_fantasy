import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabase } from "@/lib/supabase";

// League configurations
const LEAGUE_CONFIGS = {
  premium: { id: 277005, type: "standings", url_suffix: "standings/c" },
  h2h: { id: 277479, type: "matches", url_suffix: "matches/h" },
  standard: { id: 277449, type: "standings", url_suffix: "standings/c" },
  h2h2: { id: 451227, type: "matches", url_suffix: "matches/h" },
} as const;

type LeagueType = keyof typeof LEAGUE_CONFIGS;

async function fetchFPLData(leagueId: number, type: string): Promise<any> {
  const baseUrl = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;
  const h2hUrl = `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`;

  const url = type === "matches" ? h2hUrl : baseUrl;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching FPL data for league ${leagueId}:`, error);
    throw error;
  }
}

function normalizePlayerName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      // Normalize Bosnian/Croatian/Serbian characters
      .replace(/[ćč]/g, "c")
      .replace(/[žz]/g, "z")
      .replace(/[šs]/g, "s")
      .replace(/[đd]/g, "d")
      // Keep only letters and spaces
      .replace(/[^a-z\s]/g, "")
      .replace(/\s+/g, " ")
  );
}

function normalizeTeamName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      // Normalize Bosnian/Croatian/Serbian characters
      .replace(/[ćč]/g, "c")
      .replace(/[žz]/g, "z")
      .replace(/[šs]/g, "s")
      .replace(/[đd]/g, "d")
      // Keep only letters, numbers and spaces
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
  );
}

async function updatePlayersFromFPL(leagueType: LeagueType, fplData: any) {
  let updatedCount = 0;
  const notFoundPlayers: string[] = [];

  // Get all players from database
  const { data: dbPlayers, error: fetchError } = await supabase
    .from("premier_league_25_26")
    .select("*")
    .is("deleted_at", null);

  if (fetchError) {
    throw new Error(`Database fetch error: ${fetchError.message}`);
  }

  const updates: any[] = [];

  if (leagueType === "h2h" || leagueType === "h2h2") {
    // Process H2H data
    const results = fplData.results || [];

    for (const fplPlayer of results) {
      const normalizedFPLName = normalizePlayerName(fplPlayer.player_name);
      const normalizedFPLTeam = normalizeTeamName(fplPlayer.entry_name);

      // Find matching player in database
      const dbPlayer = dbPlayers?.find((player) => {
        const normalizedDBName = normalizePlayerName(
          `${player.first_name} ${player.last_name}`
        );
        const normalizedDBTeam = normalizeTeamName(player.team_name);

        return (
          normalizedDBName === normalizedFPLName ||
          normalizedDBTeam === normalizedFPLTeam ||
          (normalizedDBName.includes(normalizedFPLName.split(" ")[0]) &&
            normalizedDBTeam === normalizedFPLTeam)
        );
      });

      if (dbPlayer) {
        // Update H2H stats and points
        const updateData: any = {
          points: fplPlayer.total,
          h2h_points: fplPlayer.points_for || 0,
          h2h_stats: {
            w: fplPlayer.matches_won || 0,
            d: fplPlayer.matches_drawn || 0,
            l: fplPlayer.matches_lost || 0,
          },
          last_points_update: new Date().toISOString(),
        };

        // Set H2H category based on league type
        if (leagueType === "h2h") {
          updateData.h2h_category = "h2h";
        } else if (leagueType === "h2h2") {
          updateData.h2h_category = "h2h2";
        }

        updates.push({
          id: dbPlayer.id,
          data: updateData,
        });

        updatedCount++;
      } else {
        notFoundPlayers.push(
          `${fplPlayer.player_name} (${fplPlayer.entry_name})`
        );
      }
    }
  } else {
    // Process standings data (premium/standard leagues)
    const results = fplData.standings?.results || [];

    for (const fplPlayer of results) {
      const normalizedFPLName = normalizePlayerName(fplPlayer.player_name);
      const normalizedFPLTeam = normalizeTeamName(fplPlayer.entry_name);

      // Find matching player in database
      const dbPlayer = dbPlayers?.find((player) => {
        const normalizedDBName = normalizePlayerName(
          `${player.first_name} ${player.last_name}`
        );
        const normalizedDBTeam = normalizeTeamName(player.team_name);

        return (
          normalizedDBName === normalizedFPLName ||
          normalizedDBTeam === normalizedFPLTeam ||
          (normalizedDBName.includes(normalizedFPLName.split(" ")[0]) &&
            normalizedDBTeam === normalizedFPLTeam)
        );
      });

      if (dbPlayer) {
        // Check if player is in the right league type
        const shouldUpdate =
          (leagueType === "premium" && dbPlayer.league_type === "premium") ||
          (leagueType === "standard" && dbPlayer.league_type === "standard");

        if (shouldUpdate) {
          updates.push({
            id: dbPlayer.id,
            data: {
              points: fplPlayer.total,
              last_points_update: new Date().toISOString(),
            },
          });

          updatedCount++;
        }
      } else {
        notFoundPlayers.push(
          `${fplPlayer.player_name} (${fplPlayer.entry_name})`
        );
      }
    }
  }

  // Execute all updates
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("premier_league_25_26")
      .update(update.data)
      .eq("id", update.id);

    if (updateError) {
      console.error(`Error updating player ${update.id}:`, updateError);
    }
  }

  return { updatedCount, notFoundPlayers };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueType } = await request.json();

    if (!leagueType || !LEAGUE_CONFIGS[leagueType as LeagueType]) {
      return NextResponse.json(
        {
          error:
            "Invalid league type. Must be: premium, h2h, standard, or h2h2",
        },
        { status: 400 }
      );
    }

    const config = LEAGUE_CONFIGS[leagueType as LeagueType];

    // Fetch data from FPL API
    const fplData = await fetchFPLData(config.id, config.type);

    // Update players in database
    const { updatedCount, notFoundPlayers } = await updatePlayersFromFPL(
      leagueType as LeagueType,
      fplData
    );

    return NextResponse.json({
      success: true,
      leagueType,
      leagueId: config.id,
      updatedCount,
      notFoundPlayers,
      message: `Successfully updated ${updatedCount} players from ${leagueType} league`,
    });
  } catch (error) {
    console.error("Error updating from FPL:", error);
    return NextResponse.json(
      {
        error: "Failed to update from FPL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
