import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/lib/supabase-server";

const LEAGUE_CONFIGS = {
  premium: { id: 277005, type: "standings", dbLeagueType: "premium" },
  standard: { id: 277449, type: "standings", dbLeagueType: "standard" },
  h2h: { id: 277479, type: "h2h", dbLeagueType: "standard", h2hCategory: "h2h" },
  h2h2: { id: 451227, type: "h2h", dbLeagueType: "standard", h2hCategory: "h2h2" },
} as const;

type LeagueType = keyof typeof LEAGUE_CONFIGS;

interface FPLPlayer {
  rank: number;
  entry: number;
  player_name: string;
  entry_name: string;
  total: number;
  points_for?: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
}

// Fetch ALL players from FPL league (no limit)
async function fetchAllFPLPlayers(leagueId: number, type: string): Promise<FPLPlayer[]> {
  const isH2H = type === "h2h";
  const baseUrl = isH2H
    ? `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`
    : `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

  const players: FPLPlayer[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}?page_standings=${currentPage}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data = await response.json();
    const pageResults: FPLPlayer[] = data.standings?.results || [];

    players.push(...pageResults);

    // Check if there are more pages
    hasMore = pageResults.length === 50;
    currentPage++;
  }

  return players;
}

// Split name into first and last name
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leagueType, fullSync = false } = body;

    if (!leagueType || !LEAGUE_CONFIGS[leagueType as LeagueType]) {
      return NextResponse.json(
        { error: "Invalid leagueType", validTypes: Object.keys(LEAGUE_CONFIGS) },
        { status: 400 }
      );
    }

    const config = LEAGUE_CONFIGS[leagueType as LeagueType];

    // Fetch ALL players from FPL
    console.log(`[FPL-SYNC] Fetching ${leagueType} league (ID: ${config.id})...`);
    const fplPlayers = await fetchAllFPLPlayers(config.id, config.type);

    if (!fplPlayers.length) {
      return NextResponse.json({ error: "No players found in FPL league" }, { status: 500 });
    }

    console.log(`[FPL-SYNC] Fetched ${fplPlayers.length} players from FPL`);

    const isH2H = config.type === "h2h";
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    if (fullSync) {
      // FULL SYNC MODE: Delete existing and insert fresh
      console.log(`[FPL-SYNC] Full sync mode - clearing existing ${leagueType} data...`);

      // For standard/premium leagues, delete by league_type
      // For H2H, we update h2h fields on existing players (don't delete)
      if (!isH2H) {
        const { error: deleteError } = await supabaseServer
          .from("premier_league_25_26")
          .delete()
          .eq("league_type", config.dbLeagueType);

        if (deleteError) {
          console.error("[FPL-SYNC] Delete error:", deleteError);
          return NextResponse.json({ error: "Failed to clear existing data" }, { status: 500 });
        }
      }

      // Insert all players from FPL
      for (const fplPlayer of fplPlayers) {
        const { firstName, lastName } = splitName(fplPlayer.player_name);

        if (isH2H) {
          // For H2H: Update existing players with H2H data
          const { error } = await supabaseServer
            .from("premier_league_25_26")
            .update({
              h2h_category: config.h2hCategory,
              h2h_points: fplPlayer.total,
              h2h_stats: {
                w: fplPlayer.matches_won || 0,
                d: fplPlayer.matches_drawn || 0,
                l: fplPlayer.matches_lost || 0,
              },
              points: fplPlayer.points_for || 0, // Overall points from H2H API
              last_points_update: new Date().toISOString(),
            })
            .eq("team_name", fplPlayer.entry_name);

          if (error) {
            errors++;
          } else {
            updated++;
          }
        } else {
          // For standard/premium: Insert new records
          const { error } = await supabaseServer
            .from("premier_league_25_26")
            .insert({
              first_name: firstName,
              last_name: lastName,
              team_name: fplPlayer.entry_name,
              league_type: config.dbLeagueType,
              points: fplPlayer.total,
              email: `fpl_${fplPlayer.entry}@imported.com`, // Placeholder email
              last_points_update: new Date().toISOString(),
            });

          if (error) {
            console.error(`[FPL-SYNC] Insert error for ${fplPlayer.player_name}:`, error);
            errors++;
          } else {
            inserted++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        mode: "full_sync",
        leagueType,
        leagueId: config.id,
        totalFPLPlayers: fplPlayers.length,
        inserted,
        updated,
        errors,
        message: `Full sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`,
        players: fplPlayers.map((p) => ({
          rank: p.rank,
          name: p.player_name,
          team: p.entry_name,
          points: isH2H ? p.points_for : p.total,
          h2hPoints: isH2H ? p.total : undefined,
        })),
      });
    } else {
      // UPDATE MODE: Match by team name and update points
      console.log(`[FPL-SYNC] Update mode - matching players by team name...`);

      const notFound: string[] = [];
      const matched: Array<{ fpl: string; db: string; oldPts: number; newPts: number }> = [];

      for (const fplPlayer of fplPlayers) {
        const newPoints = isH2H ? (fplPlayer.points_for || 0) : fplPlayer.total;

        // Try to find by team name
        const { data: existing } = await supabaseServer
          .from("premier_league_25_26")
          .select("id, first_name, last_name, team_name, points")
          .eq("team_name", fplPlayer.entry_name)
          .is("deleted_at", null)
          .limit(1)
          .single();

        if (existing) {
          const updateData: any = {
            points: newPoints,
            last_points_update: new Date().toISOString(),
          };

          if (isH2H) {
            updateData.h2h_category = config.h2hCategory;
            updateData.h2h_points = fplPlayer.total;
            updateData.h2h_stats = {
              w: fplPlayer.matches_won || 0,
              d: fplPlayer.matches_drawn || 0,
              l: fplPlayer.matches_lost || 0,
            };
          }

          const { error } = await supabaseServer
            .from("premier_league_25_26")
            .update(updateData)
            .eq("id", existing.id);

          if (error) {
            errors++;
          } else {
            updated++;
            matched.push({
              fpl: `${fplPlayer.player_name} (${fplPlayer.entry_name})`,
              db: `${existing.first_name} ${existing.last_name} (${existing.team_name})`,
              oldPts: existing.points,
              newPts: newPoints,
            });
          }
        } else {
          notFound.push(`${fplPlayer.player_name} (${fplPlayer.entry_name}) - ${newPoints} pts`);
        }
      }

      return NextResponse.json({
        success: true,
        mode: "update",
        leagueType,
        leagueId: config.id,
        totalFPLPlayers: fplPlayers.length,
        updated,
        errors,
        notFoundCount: notFound.length,
        notFound,
        matched,
        message: `Update complete: ${updated} updated, ${notFound.length} not found`,
      });
    }
  } catch (error) {
    console.error("[FPL-SYNC] Fatal error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
