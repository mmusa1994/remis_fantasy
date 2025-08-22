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

async function fetchFPLData(leagueId: number, type: string, maxRecords: number = 50): Promise<any> {
  const baseUrl = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;
  const h2hUrl = `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`;

  const url = type === "matches" ? h2hUrl : baseUrl;

  try {
    // Fetch first page to get total size
    const firstResponse = await fetch(url + "?page_standings=1", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!firstResponse.ok) {
      throw new Error(`FPL API returned ${firstResponse.status}`);
    }

    const firstPageData = await firstResponse.json();
    let allResults = [...(type === "matches" ? firstPageData.results || [] : firstPageData.standings?.results || [])];
    
    console.log(`[FETCH FPL] League ${leagueId}, MaxRecords: ${maxRecords}, FirstPageResults: ${allResults.length}`);
    
    // If we need more records and there are more pages, fetch additional pages
    if (maxRecords > 50) {
      const totalEntries = type === "matches" ? firstPageData.league?.size || 0 : firstPageData.league?.size || 0;
      const totalPages = Math.ceil(Math.min(totalEntries, maxRecords) / 50);
      
      console.log(`[FETCH FPL] TotalEntries: ${totalEntries}, TotalPages: ${totalPages}`);
      
      if (totalPages > 1) {
        const additionalPages = [];
        
        for (let page = 2; page <= totalPages && allResults.length < maxRecords; page++) {
          additionalPages.push(
            fetch(url + `?page_standings=${page}`, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            }).then(response => {
              if (!response.ok) {
                throw new Error(`FPL API returned ${response.status} for page ${page}`);
              }
              return response.json();
            })
          );
        }
        
        console.log(`[FETCH FPL] Fetching ${additionalPages.length} additional pages...`);
        const additionalPagesData = await Promise.all(additionalPages);
        
        for (const pageData of additionalPagesData) {
          const pageResults = type === "matches" ? pageData.results || [] : pageData.standings?.results || [];
          console.log(`[FETCH FPL] Additional page results: ${pageResults.length}`);
          allResults.push(...pageResults);
        }
      }
    }
    
    // Limit to maxRecords
    allResults = allResults.slice(0, maxRecords);
    
    console.log(`[FETCH FPL] Final results count: ${allResults.length}, MaxRecords: ${maxRecords}`);
    
    // Return data in the same format as original
    if (type === "matches") {
      return {
        ...firstPageData,
        results: allResults,
        totalFetched: allResults.length
      };
    } else {
      return {
        ...firstPageData,
        standings: {
          ...firstPageData.standings,
          results: allResults
        },
        totalFetched: allResults.length
      };
    }
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
  const allFPLPlayers: any[] = [];
  const foundPlayers: any[] = [];

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
    allFPLPlayers.push(...results);

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

        foundPlayers.push({
          fpl: {
            rank: fplPlayer.rank,
            name: fplPlayer.player_name,
            team: fplPlayer.entry_name,
            total: fplPlayer.total,
            h2h_points: fplPlayer.points_for || 0
          },
          db: {
            id: dbPlayer.id,
            name: `${dbPlayer.first_name} ${dbPlayer.last_name}`,
            team: dbPlayer.team_name,
            email: dbPlayer.email,
            current_points: dbPlayer.points,
            current_h2h_points: dbPlayer.h2h_points || 0,
            new_points: fplPlayer.total,
            new_h2h_points: fplPlayer.points_for || 0,
            points_difference: fplPlayer.total - (dbPlayer.points || 0),
            h2h_points_difference: (fplPlayer.points_for || 0) - (dbPlayer.h2h_points || 0)
          }
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
    allFPLPlayers.push(...results);

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

          foundPlayers.push({
            fpl: {
              rank: fplPlayer.rank,
              name: fplPlayer.player_name,
              team: fplPlayer.entry_name,
              total: fplPlayer.total
            },
            db: {
              id: dbPlayer.id,
              name: `${dbPlayer.first_name} ${dbPlayer.last_name}`,
              team: dbPlayer.team_name,
              email: dbPlayer.email,
              current_points: dbPlayer.points, // postojeći poeni u bazi
              new_points: fplPlayer.total, // novi poeni iz FPL-a
              points_difference: fplPlayer.total - (dbPlayer.points || 0)
            }
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

  return { 
    updatedCount, 
    notFoundPlayers, 
    allFPLPlayers,
    foundPlayers,
    totalFPLPlayers: allFPLPlayers.length
  };
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

    // Determine max records based on league type
    const maxRecords = leagueType === 'standard' ? 120 : 50;
    
    console.log(`[FPL UPDATE] League: ${leagueType}, ID: ${config.id}, MaxRecords: ${maxRecords}`);
    
    // Fetch data from FPL API
    const fplData = await fetchFPLData(config.id, config.type, maxRecords);
    
    console.log(`[FPL UPDATE] Fetched records: ${fplData.totalFetched || 'unknown'}`);

    // Update players in database
    const { updatedCount, notFoundPlayers, allFPLPlayers, foundPlayers, totalFPLPlayers } = await updatePlayersFromFPL(
      leagueType as LeagueType,
      fplData
    );

    return NextResponse.json({
      success: true,
      leagueType,
      leagueId: config.id,
      updatedCount,
      totalFPLPlayers,
      notFoundPlayers,
      maxRecords,
      message: `Successfully updated ${updatedCount} players from ${leagueType} league`,
      // Summary overview
      summary: {
        fpl_players_fetched: totalFPLPlayers,
        db_players_matched: updatedCount,
        db_players_not_found: notFoundPlayers.length,
        match_percentage: Math.round((updatedCount / totalFPLPlayers) * 100),
        requested_max: maxRecords
      },
      // Complete list of all FPL players fetched
      allFPLPlayers: allFPLPlayers.map((p: any, index: number) => ({
        rank: p.rank || (index + 1),
        name: p.player_name,
        team: p.entry_name,
        total: p.total,
        entry_id: p.entry,
        ...(leagueType === "h2h" || leagueType === "h2h2" ? {
          h2h_points: p.points_for || 0,
          matches_won: p.matches_won || 0,
          matches_drawn: p.matches_drawn || 0,
          matches_lost: p.matches_lost || 0
        } : {})
      })),
      // Players that were found and updated in database
      foundPlayers,
      fplData: {
        leagueSize: fplData.league?.size || 0,
        fetchedRecords: totalFPLPlayers,
        actualDataLength: allFPLPlayers.length,
        requestedMaxRecords: maxRecords
      }
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
