import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/lib/supabase-server";

// SEPARATE TABLES FOR CLASSIC AND H2H LEAGUES
// - premier_league_25_26: Premium, Standard, Free (classic scoring)
// - h2h_league_25_26: H2H, H2H2 (head-to-head scoring)

const LEAGUE_CONFIGS = {
  // Classic leagues -> premier_league_25_26
  premium: { id: 277005, type: "classic", table: "premier_league_25_26", dbLeagueType: "premium" },
  standard: { id: 277449, type: "classic", table: "premier_league_25_26", dbLeagueType: "standard" },
  // H2H leagues -> h2h_league_25_26
  h2h: { id: 277479, type: "h2h", table: "h2h_league_25_26", h2hCategory: "h2h" },
  h2h2: { id: 451227, type: "h2h", table: "h2h_league_25_26", h2hCategory: "h2h2" },
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
    const isH2H = config.type === "h2h";

    // Fetch ALL players from FPL
    console.log(`[FPL-SYNC] Fetching ${leagueType} league (ID: ${config.id})...`);
    const fplPlayers = await fetchAllFPLPlayers(config.id, config.type);

    if (!fplPlayers.length) {
      return NextResponse.json({ error: "No players found in FPL league" }, { status: 500 });
    }

    console.log(`[FPL-SYNC] Fetched ${fplPlayers.length} players from FPL`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    if (fullSync) {
      // FULL SYNC MODE: Delete existing and insert fresh
      console.log(`[FPL-SYNC] Full sync mode - clearing existing ${leagueType} data from ${config.table}...`);

      if (isH2H) {
        // For H2H: Delete from h2h_league_25_26 where h2h_category matches
        const { error: deleteError } = await supabaseServer
          .from("h2h_league_25_26")
          .delete()
          .eq("h2h_category", (config as any).h2hCategory);

        if (deleteError) {
          console.error("[FPL-SYNC] Delete error:", deleteError);
          return NextResponse.json({ error: "Failed to clear existing H2H data" }, { status: 500 });
        }

        // Insert all H2H players
        for (const fplPlayer of fplPlayers) {
          const { firstName, lastName } = splitName(fplPlayer.player_name);

          const { error } = await supabaseServer
            .from("h2h_league_25_26")
            .insert({
              first_name: firstName,
              last_name: lastName,
              team_name: fplPlayer.entry_name,
              h2h_category: (config as any).h2hCategory,
              h2h_points: fplPlayer.total,
              h2h_stats: {
                w: fplPlayer.matches_won || 0,
                d: fplPlayer.matches_drawn || 0,
                l: fplPlayer.matches_lost || 0,
              },
              points_for: fplPlayer.points_for || 0,
              fpl_entry_id: fplPlayer.entry,
              email: `fpl_${fplPlayer.entry}@imported.com`,
              last_points_update: new Date().toISOString(),
            });

          if (error) {
            console.error(`[FPL-SYNC] Insert error for ${fplPlayer.player_name}:`, error);
            errors++;
          } else {
            inserted++;
          }
        }
      } else {
        // For Classic leagues: Delete from premier_league_25_26 where league_type matches
        const { error: deleteError } = await supabaseServer
          .from("premier_league_25_26")
          .delete()
          .eq("league_type", (config as any).dbLeagueType);

        if (deleteError) {
          console.error("[FPL-SYNC] Delete error:", deleteError);
          return NextResponse.json({ error: "Failed to clear existing classic league data" }, { status: 500 });
        }

        // Insert all classic league players
        for (const fplPlayer of fplPlayers) {
          const { firstName, lastName } = splitName(fplPlayer.player_name);

          const { error } = await supabaseServer
            .from("premier_league_25_26")
            .insert({
              first_name: firstName,
              last_name: lastName,
              team_name: fplPlayer.entry_name,
              league_type: (config as any).dbLeagueType,
              points: fplPlayer.total,
              email: `fpl_${fplPlayer.entry}@imported.com`,
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
        table: config.table,
        totalFPLPlayers: fplPlayers.length,
        inserted,
        updated,
        errors,
        message: `Full sync complete: ${inserted} inserted, ${errors} errors`,
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
      console.log(`[FPL-SYNC] Update mode - matching players by team name in ${config.table}...`);

      const notFound: string[] = [];
      const matched: Array<{ fpl: string; db: string; oldPts: number; newPts: number }> = [];

      for (const fplPlayer of fplPlayers) {
        if (isH2H) {
          // H2H: Update in h2h_league_25_26
          const { data: existing } = await supabaseServer
            .from("h2h_league_25_26")
            .select("id, first_name, last_name, team_name, h2h_points")
            .eq("team_name", fplPlayer.entry_name)
            .eq("h2h_category", (config as any).h2hCategory)
            .is("deleted_at", null)
            .limit(1)
            .single();

          if (existing) {
            const { error } = await supabaseServer
              .from("h2h_league_25_26")
              .update({
                h2h_points: fplPlayer.total,
                h2h_stats: {
                  w: fplPlayer.matches_won || 0,
                  d: fplPlayer.matches_drawn || 0,
                  l: fplPlayer.matches_lost || 0,
                },
                points_for: fplPlayer.points_for || 0,
                last_points_update: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (error) {
              errors++;
            } else {
              updated++;
              matched.push({
                fpl: `${fplPlayer.player_name} (${fplPlayer.entry_name})`,
                db: `${existing.first_name} ${existing.last_name} (${existing.team_name})`,
                oldPts: existing.h2h_points || 0,
                newPts: fplPlayer.total,
              });
            }
          } else {
            notFound.push(`${fplPlayer.player_name} (${fplPlayer.entry_name}) - ${fplPlayer.total} H2H pts`);
          }
        } else {
          // Classic: Update in premier_league_25_26
          const newPoints = fplPlayer.total;

          const { data: existing } = await supabaseServer
            .from("premier_league_25_26")
            .select("id, first_name, last_name, team_name, points")
            .eq("team_name", fplPlayer.entry_name)
            .is("deleted_at", null)
            .limit(1)
            .single();

          if (existing) {
            const { error } = await supabaseServer
              .from("premier_league_25_26")
              .update({
                points: newPoints,
                last_points_update: new Date().toISOString(),
              })
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
      }

      return NextResponse.json({
        success: true,
        mode: "update",
        leagueType,
        leagueId: config.id,
        table: config.table,
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
